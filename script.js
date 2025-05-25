// Elements
const videoEkleBtn    = document.getElementById('video-ekle-btn');
const videoContainer  = document.getElementById('video-container');
const prevLinesBtn    = document.getElementById('prev-lines');
const nextLinesBtn    = document.getElementById('next-lines');
const textViewer      = document.getElementById('text-viewer');
const addTextBtn      = document.getElementById('add-text-btn');
const deleteTextBtn   = document.getElementById('delete-text-btn');
const modalSaveBtn    = document.getElementById('modal-save-btn');
const addTextModal    = document.getElementById('addTextModal');
const apiWordInput    = document.getElementById('api-word-input');
const apiStartBtn     = document.getElementById('api-start-btn');
const apiSpinner      = document.getElementById('api-spinner');
const quizContainer   = document.getElementById('quiz-container');

// --- PEXELS API Ayarları ---
const PEXELS_API_KEY = 'YOUR_REAL_PEXELS_API_KEY_HERE';
const PEXELS_URL     = 'https://api.pexels.com/v1/search';

/**
 * Kelimeye göre Pexels’ten fotoğraf çeker
 * @param {string} word 
 * @param {number} count 
 * @returns {Promise<Array<{ id: number, src: { medium: string }, alt: string }>>}
 */
async function fetchPexelsImages(word, count = 4) {
  const res = await fetch(`${PEXELS_URL}?query=${encodeURIComponent(word)}&per_page=${count}`, {
    headers: { Authorization: PEXELS_API_KEY }
  });
  if (!res.ok) throw new Error(`Pexels status ${res.status}`);
  const json = await res.json();
  return json.photos; // her biri: { id, src: { medium, ... }, alt, ... }
}

// Constants
const LINES_PER_PAGE = 4;
const STORAGE_KEY    = 'allLines';

// State
let allLines    = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentPage = 0;

// Helpers
function saveAllLines() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allLines));
}

function renderTextPage() {
  const start = currentPage * LINES_PER_PAGE;
  const end   = start + LINES_PER_PAGE;
  const page  = allLines.slice(start, end);
  textViewer.innerHTML = page.join('<br>') || '<em>No text available.</em>';
  prevLinesBtn.disabled = currentPage === 0;
  nextLinesBtn.disabled = end >= allLines.length;
}

function getYouTubeVideoId(url) {
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
  const m = url.match(regExp);
  return m ? m[1] : null;
}

function loadVideo(videoId) {
  const iframe = document.createElement('iframe');
  iframe.width           = '100%';
  iframe.height          = '100%';
  iframe.src             = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  iframe.frameBorder     = '0';
  iframe.allow           = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  videoContainer.innerHTML = '';
  videoContainer.appendChild(iframe);
}

// Video Ekleme
videoEkleBtn.addEventListener('click', () => {
  const url = prompt('Enter YouTube video URL:');
  if (!url) return;
  const id = getYouTubeVideoId(url);
  if (!id) {
    alert('Invalid YouTube URL!');
    return;
  }
  localStorage.setItem('videoUrl', url);
  loadVideo(id);
});

// Pagination
prevLinesBtn.addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage--;
    renderTextPage();
  }
});
nextLinesBtn.addEventListener('click', () => {
  if ((currentPage + 1) * LINES_PER_PAGE < allLines.length) {
    currentPage++;
    renderTextPage();
  }
});

// Add Text Modal
addTextBtn.addEventListener('click', () => {
  const modal = new bootstrap.Modal(addTextModal);
  document.getElementById('modal-textarea').value = '';
  modal.show();
});

modalSaveBtn.addEventListener('click', () => {
  const text = document.getElementById('modal-textarea').value.trim();
  if (text) {
    allLines.push(...text.split(/\r?\n/));
    saveAllLines();
    renderTextPage();
  }
  bootstrap.Modal.getInstance(addTextModal).hide();
});

// Delete All Text
deleteTextBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all text?')) {
    allLines = [];
    saveAllLines();
    currentPage = 0;
    renderTextPage();
  }
});

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('i');
const savedTheme  = localStorage.getItem('theme') || 'dark';

document.body.classList.add(`${savedTheme}-theme`);
themeIcon.className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-theme');
  const theme  = isDark ? 'light' : 'dark';
  document.body.classList.remove('dark-theme', 'light-theme');
  document.body.classList.add(`${theme}-theme`);
  localStorage.setItem('theme', theme);
  themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  // Yüklü video varsa göster
  const savedUrl = localStorage.getItem('videoUrl');
  if (savedUrl) {
    const vid = getYouTubeVideoId(savedUrl);
    if (vid) loadVideo(vid);
  }
  renderTextPage();
});

// --- API Quiz Functionality using Pexels ---
apiStartBtn.addEventListener('click', async () => {
  const word = apiWordInput.value.trim();
  if (!word) return alert('Lütfen bir kelime girin.');

  apiSpinner.style.display = 'inline-block';
  quizContainer.innerHTML  = '';

  try {
    // Pexels’ten en fazla 5 fotoğraf çek
    const photos  = await fetchPexelsImages(word, 5);
    const results = photos.map(p => ({
      id: p.id,
      urls: { small: p.src.medium },
      alt_description: p.alt
    }));

    if (results.length < 2) {
      quizContainer.innerHTML = `<div class="text-warning">Yeterli resim bulunamadı (en az 2 gerekli).</div>`;
      return;
    }

    // Doğru + distractor’lar
    const correct = results[0];
    const others  = results.slice(1, results.length >= 3 ? 3 : 2);
    const options = [correct, ...others].sort(() => Math.random() - 0.5);

    // Kart oluştur
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';
    col.innerHTML = `
      <div class="quiz-card">
        <h4>“${word}” kelimesine ait doğru fotoğrafı seçin</h4>
        <div class="quiz-images">
          ${options.map(img =>
            `<img src="${img.urls.small}" data-correct="${img.id === correct.id}" alt="${img.alt_description || word}">`
          ).join('')}
        </div>
        <div class="quiz-feedback"></div>
      </div>
    `;
    quizContainer.appendChild(col);

    // Geri bildirim
    col.querySelectorAll('img').forEach(imgEl => {
      imgEl.addEventListener('click', () => {
        const fb = col.querySelector('.quiz-feedback');
        if (fb.textContent) return; // Yalnızca bir seçim
        if (imgEl.dataset.correct === 'true') {
          fb.textContent = '✔ Doğru!';
          fb.className   = 'quiz-feedback text-success';
        } else {
          fb.textContent = '✖ Yanlış!';
          fb.className   = 'quiz-feedback text-danger';
        }
      });
    });

  } catch (err) {
    console.error('Pexels fetch error:', err);
    quizContainer.innerHTML = `
      <div class="text-danger">
        Hata: ${err.message || err}
      </div>
    `;
  } finally {
    apiSpinner.style.display = 'none';
  }
});


document.addEventListener('DOMContentLoaded', () => {
    const input   = document.getElementById('pexels-query');
    const button  = document.getElementById('pexels-search');
    const iframe  = document.getElementById('pexels-iframe');
  
    function doSearch() {
      const q = input.value.trim();
      if (!q) return;
      // Pexels arama URL’si: /search/<kelime>/
      iframe.src = `https://www.pexels.com/search/${encodeURIComponent(q)}/`;
    }
  
    // Butona tıklayınca
    button.addEventListener('click', doSearch);
  
    // Enter ile de çalışsın
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  });

  
  