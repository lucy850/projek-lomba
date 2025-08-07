// =======================
// INITIAL DATA SETUP
// =======================
// Check and initialize session data if it doesn't exist.
if (!sessionStorage.getItem("coins")) {
    sessionStorage.setItem("coins", "6000");
}
if (!sessionStorage.getItem("koleksiItem")) {
    sessionStorage.setItem("koleksiItem", JSON.stringify({}));
}
if (!sessionStorage.getItem("koleksiPet")) {
    sessionStorage.setItem("koleksiPet", JSON.stringify([]));
}
if (!sessionStorage.getItem("itemTerpasang")) {
    sessionStorage.setItem("itemTerpasang", JSON.stringify({}));
}

// Get the current coin balance from session storage.
let coins = parseInt(sessionStorage.getItem("coins")) || 0;

// ============================
// PLUG WALLET AND ICP LEDGER
// ============================
// ICP Ledger Interface
const ledgerIDL = ({ IDL }) => {
    return IDL.Service({
        account_balance_dfx: IDL.Func(
            [{
                account: IDL.Record({
                    owner: IDL.Principal,
                    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
                }),
            },],
            [IDL.Record({ e8s: IDL.Nat64 })],
            ["query"]
        ),
    });
};

// CPHW Token Canister Interface
const cphwIDL = ({ IDL }) => {
    return IDL.Service({
        topUp: IDL.Func([IDL.Nat], [], []),
        transfer: IDL.Func([IDL.Principal, IDL.Nat], [IDL.Bool], []),
        balanceOf: IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    });
};

/**
 * Checks the user's ICP balance via the Plug wallet.
 * @returns {Promise<number>} The ICP balance.
 */
async function getICPSaldo() {
    try {
        const principal = await window.ic.plug.getPrincipal();
        const ledger = await window.ic.plug.createActor({
            canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
            interfaceFactory: ledgerIDL(window.ic.plug.IDL),
        });
        const result = await ledger.account_balance_dfx({
            account: {
                owner: principal,
                subaccount: [],
            },
        });
        return Number(result.e8s) / 100_000_000;
    } catch (err) {
        console.error("Failed to check ICP balance:", err);
        return 0;
    }
}

// ============================
// UI & MODAL MANAGEMENT
// ============================
/**
 * Shows a loading overlay with a specific message.
 * @param {string} message The message to display.
 */
function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex', 'flex-col');
    }
}

/**
 * Hides the loading overlay.
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex', 'flex-col');
    }
}

/**
 * Updates the coin display element on the page.
 */
function updateCoinDisplay() {
    const coinSpan = document.getElementById("coinDisplay");
    if (coinSpan) {
        coinSpan.textContent = coins.toLocaleString("id-ID");
    }
}

/**
 * Shows the top-up modal.
 */
function showTopUpModal() {
    const modal = document.getElementById("topUpModal");
    if (modal) modal.classList.remove('hidden');
}

/**
 * Hides the top-up modal.
 */
function closeTopUpModal() {
    const modal = document.getElementById("topUpModal");
    if (modal) modal.classList.add('hidden');
}

// ============================
// CORE WALLET AND COIN LOGIC
// ============================
/**
 * Handles the connection process to the Plug wallet.
 */
async function handleConnection() {
    const btn = document.getElementById("walletBtn"); // Changed to walletBtn
    if (!window.ic || !window.ic.plug) {
        alert("Plug Wallet not found. Please install it.");
        window.open('https://plugwallet.ooo/', '_blank');
        return;
    }
    btn.disabled = true;
    showLoading("Connecting to Wallet...");

    try {
        await window.ic.plug.requestConnect({
            whitelist: [], // Specify your canister IDs if needed
            host: "https://icp0.io",
        });

        if (await window.ic.plug.isConnected()) {
            const principalId = await window.ic.plug.getPrincipal();
            sessionStorage.setItem('plugConnected', 'true');
            sessionStorage.setItem('principalId', principalId.toText());
            window.location.href = 'shop.html';
        } else {
            throw new Error("Connection could not be verified.");
        }
    } catch (error) {
        alert("Connection failed: " + error.message);
    } finally {
        hideLoading();
        btn.disabled = false;
    }
}

/**
 * Handles the top-up process, including ICP transfer and coin update.
 * @param {number} amount The amount of coins to top up.
 */
async function topUp(amount) {
    const ALAMAT_PENERIMA = 'etxmz-m6pfj-ols34-3oatd-obisr-ywiok-6dssr-gf5jo-5ln6f-rak52-iae';
    const CPHW_CANISTER_ID = 'ulvla-h7777-77774-qaacq-cai';
    closeTopUpModal();
    showLoading("Verifying wallet connection...");

    try {
        if (!(await window.ic.plug.isConnected())) {
            await window.ic.plug.requestConnect({ whitelist: [CPHW_CANISTER_ID] });
        }

        const saldo = await getICPSaldo();
        const priceInICP = amount * 0.001;

        if (saldo < priceInICP) {
            hideLoading();
            alert("❌ Insufficient ICP balance for top-up.");
            return;
        }

        const priceInE8s = BigInt(Math.floor(priceInICP * 100_000_000)).toString();

        showLoading("Awaiting approval in Plug Wallet...");
        const result = await window.ic.plug.requestTransfer({
            to: ALAMAT_PENERIMA,
            amount: priceInE8s,
        });

        if (result && result.height) {
            coins += amount;
            sessionStorage.setItem("coins", String(coins));
            updateCoinDisplay();

            showLoading("Synchronizing with canister...");
            const actor = await window.ic.plug.createActor({
                canisterId: CPHW_CANISTER_ID,
                interfaceFactory: cphwIDL(window.ic.plug.IDL),
            });
            await actor.topUp(BigInt(amount));

            hideLoading();
            alert(`🎉 Success! You've received ${amount} coins.`);
        } else {
            throw new Error("Transaction cancelled or failed.");
        }
    } catch (err) {
        console.error("Top up failed:", err);
        hideLoading();
        alert(`❌ Top up failed: ${err.message}`);
    }
}

/**
 * Initializes the wallet button based on connection status.
 */
function initializeWalletButton() {
    const walletBtn = document.getElementById('walletBtn');
    const isConnected = sessionStorage.getItem('plugConnected') === 'true';
    if (!walletBtn) return;

    if (isConnected) {
        walletBtn.textContent = "Top Up";
        walletBtn.onclick = showTopUpModal;
    } else {
        walletBtn.textContent = "Connect Wallet";
        walletBtn.onclick = handleConnection;
    }
}

// ============================
// PAGE LOAD
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;
    if (sessionStorage.getItem('plugConnected') !== 'true' && !currentPage.includes('index.html')) {
        window.location.href = 'index.html';
        return;
    }
    updateCoinDisplay();
    initializeWalletButton();
});

// ============================
// COLLECTION FUNCTIONS
// ============================
/**
 * Equips an item to the pet.
 * @param {string} itemName The name of the item.
 * @param {string} itemType The type of the item (e.g., 'hair', 'accessories').
 */
function pakaiItem(itemName, itemType) {
    let itemTerpasang = JSON.parse(sessionStorage.getItem("itemTerpasang")) || {};
    itemTerpasang[itemType] = itemName;
    sessionStorage.setItem("itemTerpasang", JSON.stringify(itemTerpasang));
}