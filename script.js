const kelimeInput = document.getElementById('kelime-input');
const anlamInput = document.getElementById('anlam-input');
const ekleBtn = document.getElementById('ekle-btn');
const videoEkleBtn = document.getElementById('video-ekle-btn');
const videoContainer = document.getElementById('video-container');
const textArea = document.getElementById('text-area');
const addTextBtn = document.getElementById('add-text-btn');
const deleteTextBtn = document.getElementById('delete-text-btn');
const prevLinesBtn = document.getElementById('prev-lines');
const nextLinesBtn = document.getElementById('next-lines');
const textViewer = document.getElementById('text-viewer');
const anlamGosterDiv = document.getElementById('anlam-goster');

const API_BASE = 'http://localhost:3000/api/transcript';

// Kelimeler dizisi (localStorage'dan yükle)
let kelimeler = [];
if (localStorage.getItem('kelimeler')) {
    try {
        kelimeler = JSON.parse(localStorage.getItem('kelimeler')) || [];
    } catch (e) {
        kelimeler = [];
    }
}

// Video URL'sini localStorage'dan yükle
let videoUrl = localStorage.getItem('videoUrl') || '';
if (videoUrl) {
    const videoId = getYouTubeVideoId(videoUrl);
    if (videoId) {
        loadVideo(videoId);
    }
}

// Tüm metni localStorage'da sakla
let allLines = [];
if (localStorage.getItem('allLines')) {
    try {
        allLines = JSON.parse(localStorage.getItem('allLines')) || [];
    } catch (e) {
        allLines = [];
    }
}

let currentPage = 0;
const LINES_PER_PAGE = 4;

function kaydetKelimeler() {
    localStorage.setItem('kelimeler', JSON.stringify(kelimeler));
}

function kelimeleriVurgula() {
    // Sadece ilgili 2 satırı göster
    const start = currentPage * LINES_PER_PAGE;
    const end = start + LINES_PER_PAGE;
    let lines = allLines.slice(start, end);
    // Uzunluktan kısaya sırala (çakışma önle)
    const kelimeList = kelimeler.map(obj => obj.kelime).sort((a, b) => b.length - a.length);
    let html = lines.map(line => {
        let l = line;
        for (const kelime of kelimeList) {
            // Büyük/küçük harf duyarsız vurgulama
            const regex = new RegExp(`\\b${kelime}\\b`, 'gi');
            l = l.replace(regex, `<span class=\"lgt_kelime\">$&</span>`);
        }
        return l;
    }).join('<br>');
    textViewer.innerHTML = html;
    anlamGosterHazirla();
}

function anlamGosterHazirla() {
    document.querySelectorAll('.lgt_kelime').forEach(el => {
        el.onmouseenter = function(e) {
            const kelime = el.textContent.trim().toLowerCase();
            const kayit = kelimeler.find(obj => obj.kelime.toLowerCase() === kelime);
            anlamGosterDiv.textContent = kayit ? kayit.anlam : '';
        };
        el.onmouseleave = function() {
            anlamGosterDiv.textContent = '';
        };
    });
}

function sozlukListesiniGuncelle() {
    const kelimeListesiDiv = document.getElementById('kelime-listesi');
    kelimeListesiDiv.innerHTML = '';
    // Alfabetik sırala
    const sirali = [...kelimeler].sort((a, b) => a.kelime.localeCompare(b.kelime, 'tr'));
    sirali.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'kelime-item';
        div.innerHTML = `<span class="kelime-adi">${item.kelime}</span><span class="kelime-anlam">${item.anlam}</span>`;
        const silBtn = document.createElement('button');
        silBtn.className = 'sil-btn';
        silBtn.textContent = 'Delete';
        // Orijinal dizideki indexi bul
        const realIdx = kelimeler.findIndex(obj => obj.kelime === item.kelime);
        silBtn.onclick = function() {
            kelimeler.splice(realIdx, 1);
            kaydetKelimeler();
            kelimeleriVurgula();
            sozlukListesiniGuncelle();
        };
        div.appendChild(silBtn);
        kelimeListesiDiv.appendChild(div);
    });
}

/**
 * YouTube linkinden video ID'sini çeken yardımcı fonksiyon
 */
function getYouTubeVideoId(url) {
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

/**
 * Express API'den altyazıyı çek
 */
async function fetchTranscript(videoId) {
    try {
        const res = await fetch(`${API_BASE}/${videoId}`);
        const json = await res.json();
        if (json.success && json.text) {
            return json.text;
        }
        throw new Error(json.error || 'No captions found');
    } catch (err) {
        console.error('Transcript fetch error:', err);
        return null;
    }
}

/**
 * Video yükleme fonksiyonu
 */
function loadVideo(videoId) {
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&showinfo=0&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);
}

// Video Ekleme
videoEkleBtn.onclick = function() {
    const url = prompt('Enter YouTube video URL:');
    if (!url) return;
    
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        alert('Invalid YouTube URL!');
        return;
    }

    videoUrl = url;
    localStorage.setItem('videoUrl', url);
    
    // Videoyu yükle
    loadVideo(videoId);
};

function saveAllLines() {
    localStorage.setItem('allLines', JSON.stringify(allLines));
}

function renderTextPage() {
    kelimeleriVurgula();
    prevLinesBtn.disabled = currentPage === 0;
    nextLinesBtn.disabled = (currentPage + 1) * LINES_PER_PAGE >= allLines.length;
}

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

// Add Text butonu
addTextBtn.onclick = function() {
    // Modalı aç
    const modal = new bootstrap.Modal(document.getElementById('addTextModal'));
    document.getElementById('modal-textarea').value = '';
    modal.show();
};

// Modal Kaydet butonu
const modalSaveBtn = document.getElementById('modal-save-btn');
modalSaveBtn.onclick = function() {
    const textarea = document.getElementById('modal-textarea');
    const text = textarea.value.trim();
    if (text) {
        allLines.push(...text.split(/\r?\n/));
        saveAllLines();
        renderTextPage();
    }
    // Modalı kapat
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTextModal'));
    modal.hide();
};

// Modal kapatıldığında textarea temizle
const addTextModal = document.getElementById('addTextModal');
addTextModal.addEventListener('hidden.bs.modal', function () {
    document.getElementById('modal-textarea').value = '';
});

// Delete Text butonu
deleteTextBtn.onclick = function() {
    if (confirm('Are you sure you want to delete all text?')) {
        allLines = [];
        saveAllLines();
        currentPage = 0;
        renderTextPage();
    }
};

// Kelime Ekleme
ekleBtn.onclick = function() {
    const kelime = kelimeInput.value.trim();
    const anlam = anlamInput.value.trim();
    if (!kelime || !anlam) return;
    const idx = kelimeler.findIndex(obj => obj.kelime === kelime);
    if (idx !== -1) {
        kelimeler[idx].anlam = anlam;
    } else {
        kelimeler.push({kelime, anlam});
    }
    kaydetKelimeler();
    kelimeleriVurgula();
    sozlukListesiniGuncelle();
    kelimeInput.value = '';
    anlamInput.value = '';
    kelimeInput.focus();
};

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
    renderTextPage();
    kelimeleriVurgula();
    sozlukListesiniGuncelle();
});

// Test kodu - JavaScript'in çalışıp çalışmadığını kontrol et
const ta = document.getElementById('text-area');
if (!ta) {
    console.error('Textarea bulunamadı!');
} else {
    ta.value = 'JavaScript çalışıyor!';
    console.log('Textarea bulundu ve JavaScript çalışıyor!');
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.add(`${savedTheme}-theme`);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const newTheme = isDarkTheme ? 'light' : 'dark';
    
    // Remove both theme classes first
    document.body.classList.remove('dark-theme', 'light-theme');
    // Add the new theme class
    document.body.classList.add(`${newTheme}-theme`);
    
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}
