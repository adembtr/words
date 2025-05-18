const kelimeInput = document.getElementById('kelime-input');
const anlamInput = document.getElementById('anlam-input');
const ekleBtn = document.getElementById('ekle-btn');
const metinDiv = document.getElementById('metin');
const prevLinesBtn = document.getElementById('prev-lines-btn');
const nextLinesBtn = document.getElementById('next-lines-btn');
const LINES_PER_PAGE = 8;

// Sözlük objesi (localStorage'dan yükle)
let sozluk = {};
if (localStorage.getItem('sozluk')) {
    try {
        sozluk = JSON.parse(localStorage.getItem('sozluk')) || {};
    } catch (e) {
        sozluk = {};
    }
}

function kaydetSozluk() {
    localStorage.setItem('sozluk', JSON.stringify(sozluk));
}

function kelimeleriVurgula() {
    let html = metinDiv.innerText;
    const kelimeler = Object.keys(sozluk).sort((a, b) => b.length - a.length);
    for (const kelime of kelimeler) {
        const regex = new RegExp(`(?<![\wğüşıöçĞÜŞİÖÇ])(${kelime})(?![\wğüşıöçĞÜŞİÖÇ])`, 'g');
        html = html.replace(regex, `<span class="lgt_kelime" data-anlam="$${kelime}">$1</span>`);
    }
    metinDiv.innerHTML = html;
    tooltipHazirla();
}

function tooltipHazirla() {
    document.querySelectorAll('.lgt_kelime').forEach(el => {
        const kelime = el.textContent.trim();
        const kayit = kelimeler.find(obj => obj.kelime === kelime);
        el.onmouseenter = function(e) {
            if (!kayit) return;
            let tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.innerText = kayit.anlam;
            el.appendChild(tooltip);
            // Tooltip taşmasını engelle
            setTimeout(() => {
                const rect = tooltip.getBoundingClientRect();
                const parentRect = el.getBoundingClientRect();
                if (rect.left < 0) {
                    tooltip.style.left = '0';
                    tooltip.style.transform = 'none';
                } else if (rect.right > window.innerWidth) {
                    tooltip.style.left = 'auto';
                    tooltip.style.right = '0';
                    tooltip.style.transform = 'none';
                }
            }, 10);
        };
        el.onmouseleave = function() {
            const tooltip = el.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        };
    });
}

ekleBtn.onclick = function() {
    const kelime = kelimeInput.value.trim();
    const anlam = anlamInput.value.trim();
    if (!kelime || !anlam) return;
    sozluk[kelime] = anlam;
    kaydetSozluk();
    kelimeleriVurgula();
    kelimeInput.value = '';
    anlamInput.value = '';
    kelimeInput.focus();
};

// Sayfa yüklenince otomatik vurgula
window.addEventListener('DOMContentLoaded', kelimeleriVurgula);

// Ok fonksiyonlarını düzelt
prevLinesBtn.onclick = function() {
    if (currentPage > 0) {
        currentPage--;
        renderTextPage();
    }
};

nextLinesBtn.onclick = function() {
    if ((currentPage + 1) * LINES_PER_PAGE < allLines.length) {
        currentPage++;
        renderTextPage();
    }
}; 