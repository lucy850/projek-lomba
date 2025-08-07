// gacha.js

// Data item yang bisa didapat dari gacha
const gachaItems = [
    { id: "syal_gajah", name: "Syal Gajah", image: "syal gajah.png", type: "accessories" },
    { id: "topi_gajah", name: "Topi Gajah", image: "hat gajah.png", type: "accessories" },
    { id: "kalung_gajah", name: "Kalung Gajah", image: "kalung gajah.png", type: "accessories" },
    { id: "syal_kucing", name: "Syal Kucing", image: "syal kucing.png", type: "accessories" },
    { id: "topi_kucing", name: "Topi Kucing", image: "topi kucing.png", type: "accessories" },
    { id: "kalung_kucing", name: "Kalung Kucing", image: "kalung kucing.png", type: "accessories" },
    { id: "syal_kelinci", name: "Syal Kelinci", image: "syal kelinci.png", type: "accessories" },
    { id: "topi_kelinci", name: "Topi Kelinci", image: "hat kelinci.png", type: "accessories" },
    { id: "kalung_kelinci", name: "Kalung Kelinci", image: "kalung kelinci.png", type: "accessories" },
    { id: "syal_beruang", name: "Syal Beruang", image: "syal beruang.png", type: "accessories" },
    { id: "topi_beruang", name: "Topi Beruang", image: "hat beruang.png", type: "accessories" },
    { id: "kalung_beruang", name: "Kalung Beruang", image: "kalung beruang.png", type: "accessories" },
    { id: "syal_ayam", name: "Syal Ayam", image: "syal ayam.png", type: "accessories" },
    { id: "topi_ayam", name: "Topi Ayam", image: "hat ayam.png", type: "accessories" },
    { id: "kalung_ayam", name: "Kalung Ayam", image: "kalung ayam.png", type: "accessories" },
    { id: "racket", name: "Racket", image: "racket.png", type: "playTools" },
    { id: "basket", name: "Basket", image: "basket.png", type: "playTools" },
    { id: "fishing_gear", name: "Fishing Gear", image: "pancingan.png", type: "playTools" },
    { id: "rambut_panjang_gajah", name: "Rambut Panjang Gajah", image: "long gajah.png", type: "hair" },
    { id: "rambut_curly_gajah", name: "Rambut Curly Gajah", image: "curly gajah.png", type: "hair" },
    { id: "rambut_short_gajah", name: "Rambut Short Gajah", image: "short gajah.png", type: "hair" },
    { id: "rambut_panjang_kucing", name: "Rambut Panjang Kucing", image: "panjang kucing.png", type: "hair" },
    { id: "rambut_curly_kucing", name: "Rambut Curly Kucing", image: "curly kucing.png", type: "hair" },
    { id: "rambut_short_kucing", name: "Rambut Short Kucing", image: "pendek kucing.png", type: "hair" },
    { id: "rambut_panjang_kelinci", name: "Rambut Panjang Kelinci", image: "long kelinci.png", type: "hair" },
    { id: "rambut_curly_kelinci", name: "Rambut Curly Kelinci", image: "curly kelinci.png", type: "hair" },
    { id: "rambut_short_kelinci", name: "Rambut Short Kelinci", image: "short kelinci.png", type: "hair" },
    { id: "rambut_panjang_beruang", name: "Rambut Panjang Beruang", image: "long beruang.png", type: "hair" },
    { id: "rambut_curly_beruang", name: "Rambut Curly Beruang", image: "curly beruang.png", type: "hair" },
    { id: "rambut_short_beruang", name: "Rambut Short Beruang", image: "short beruang.png", type: "hair" },
    { id: "rambut_panjang_ayam", name: "Rambut Panjang Ayam", image: "long ayam.png", type: "hair" },
    { id: "rambut_curly_ayam", name: "Rambut Curly Ayam", image: "curly ayam.png", type: "hair" },
    { id: "rambut_short_ayam", name: "Rambut Short Ayam", image: "short ayam.png", type: "hair" },
];

const GACHA_COST = 200;

function showGachaResultModal(item) {
    const modal = document.getElementById("gachaResultModal");
    document.getElementById("gachaResultImage").src = item.image;
    document.getElementById("gachaResultName").textContent = item.name;
    modal.classList.remove("hidden");
}

function closeGachaResultModal() {
    const modal = document.getElementById("gachaResultModal");
    modal.classList.add("hidden");
    window.location.reload(); 
}

async function performGacha() {
    let coins = parseInt(sessionStorage.getItem("coins")) || 0;
    if (coins < GACHA_COST) {
        alert("❌ Koinmu tidak cukup untuk melakukan Gacha!");
        return;
    }

    coins -= GACHA_COST;
    sessionStorage.setItem("coins", String(coins));
    updateCoinDisplay();

    const randomIndex = Math.floor(Math.random() * gachaItems.length);
    const wonItem = gachaItems[randomIndex];
    
    let koleksiItem = JSON.parse(sessionStorage.getItem("koleksiItem")) || {};
    
    if (!koleksiItem[wonItem.type]) {
        koleksiItem[wonItem.type] = [];
    }
    if (!koleksiItem[wonItem.type].includes(wonItem.name)) {
        koleksiItem[wonItem.type].push(wonItem.name);
    }
    
    sessionStorage.setItem("koleksiItem", JSON.stringify(koleksiItem));

    showGachaResultModal(wonItem);
}