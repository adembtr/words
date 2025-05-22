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

// Test Creation Functions
function createMultipleChoiceTest() {
    const words = getWordsFromDictionary();
    if (words.length < 4) {
        alert('You need at least 4 words in your dictionary to create a test!');
        return;
    }

    const questionsContainer = document.getElementById('multiple-choice-questions');
    questionsContainer.innerHTML = '';

    // Her kelime için 1 soru (sırasıyla)
    words.forEach((questionWord, i) => {
        const options = [questionWord.meaning];
        // Diğer anlamlardan rastgele 3 tane seç (kendi anlamı hariç)
        const otherMeanings = words
            .filter((w, idx) => idx !== i)
            .map(w => w.meaning);

        shuffleArray(otherMeanings);
        options.push(...otherMeanings.slice(0, 3));

        shuffleArray(options);

        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <div class="question-text">What is the meaning of "<b>${questionWord.word}</b>"?</div>
            <ul class="options-list">
                ${options.map(option => `
                    <li class="option-item" data-correct="${option === questionWord.meaning}">
                        ${option}
                    </li>
                `).join('')}
            </ul>
        `;

        questionsContainer.appendChild(questionCard);
    });

    // Cevap kontrolü
    document.querySelectorAll('.option-item').forEach(option => {
        option.addEventListener('click', function() {
            const questionCard = this.closest('.question-card');
            const options = questionCard.querySelectorAll('.option-item');

            if (questionCard.querySelector('.correct, .incorrect')) return;

            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            if (this.dataset.correct === 'true') {
                this.classList.add('correct');
            } else {
                this.classList.add('incorrect');
                questionCard.querySelector('[data-correct="true"]').classList.add('correct');
            }
        });
    });
}


function createMatchingTest() {
    const words = getWordsFromDictionary();
    if (words.length < 2) {
        alert('You need at least 2 words in your dictionary to create a matching test!');
        return;
    }

    const wordsColumn = document.getElementById('words-column');
    const meaningsColumn = document.getElementById('meanings-column');

    wordsColumn.innerHTML = '';
    meaningsColumn.innerHTML = '';

    // Tüm kelimeleri ve anlamları ayrı ayrı karıştırıp doldur
    const shuffledWords = [...words];
    const shuffledMeanings = words.map(w => w.meaning);
    shuffleArray(shuffledWords);
    shuffleArray(shuffledMeanings);

    shuffledWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'matching-item';
        wordItem.textContent = word.word;
        wordItem.dataset.meaning = word.meaning;
        wordsColumn.appendChild(wordItem);
    });

    shuffledMeanings.forEach(meaning => {
        const meaningItem = document.createElement('div');
        meaningItem.className = 'matching-item';
        meaningItem.textContent = meaning;
        meaningsColumn.appendChild(meaningItem);
    });

    let selectedWord = null;
    let selectedMeaning = null;

    document.querySelectorAll('#words-column .matching-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            if (selectedWord) selectedWord.classList.remove('selected');
            this.classList.add('selected');
            selectedWord = this;
            checkMatch();
        });
    });

    document.querySelectorAll('#meanings-column .matching-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('matched')) return;
            if (selectedMeaning) selectedMeaning.classList.remove('selected');
            this.classList.add('selected');
            selectedMeaning = this;
            checkMatch();
        });
    });

    function checkMatch() {
        if (selectedWord && selectedMeaning) {
            if (selectedWord.dataset.meaning === selectedMeaning.textContent) {
                selectedWord.classList.add('matched');
                selectedMeaning.classList.add('matched');
                selectedWord.classList.remove('selected');
                selectedMeaning.classList.remove('selected');
                selectedWord = null;
                selectedMeaning = null;
            } else {
                // Yanlış eşleşmede kırmızı yak, 1 saniye sonra kaldır
                selectedWord.classList.add('incorrect');
                selectedMeaning.classList.add('incorrect');
                setTimeout(() => {
                    if (selectedWord) selectedWord.classList.remove('incorrect', 'selected');
                    if (selectedMeaning) selectedMeaning.classList.remove('incorrect', 'selected');
                    selectedWord = null;
                    selectedMeaning = null;
                }, 1000);
            }
        }
    }
}


function getWordsFromDictionary() {
    const words = [];
    document.querySelectorAll('#kelime-listesi .kelime-item').forEach(item => {
        words.push({
            word: item.querySelector('.kelime-adi').textContent,
            meaning: item.querySelector('.kelime-anlam').textContent
        });
    });
    return words;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Add event listeners for test buttons
document.getElementById('create-mc-test').addEventListener('click', createMultipleChoiceTest);
document.getElementById('delete-mc-test').addEventListener('click', () => {
    document.getElementById('multiple-choice-questions').innerHTML = '';
});

document.getElementById('create-matching-test').addEventListener('click', createMatchingTest);
document.getElementById('delete-matching-test').addEventListener('click', () => {
    document.getElementById('words-column').innerHTML = '';
    document.getElementById('meanings-column').innerHTML = '';
});


// Rastgele Kelime Testi - Her kelime yalnızca bir kere, bitince Finish!
(function() {
    const startBtn = document.getElementById('random-word-start');
    const area = document.getElementById('random-word-area');
    const meaningDiv = document.getElementById('random-word-meaning');
    const answerInput = document.getElementById('random-word-answer');
    const submitBtn = document.getElementById('random-word-submit');
    const feedbackDiv = document.getElementById('random-word-feedback');

    let remainingWords = [];
    let current = null;

    // Rastgele kelime seç (ve kalanlardan çıkar)
    function pickRandomWord() {
        if (remainingWords.length === 0) {
            meaningDiv.textContent = "";
            answerInput.style.display = "none";
            submitBtn.style.display = "none";
            feedbackDiv.textContent = "Finish!";
            feedbackDiv.style.color = "#0f0";
            return;
        }
        // Random seç ve diziden çıkar
        const idx = Math.floor(Math.random() * remainingWords.length);
        current = remainingWords[idx];
        remainingWords.splice(idx, 1);

        meaningDiv.innerHTML = `"<b>${current.meaning}</b>" what is the meaning of this word in English?`;
        answerInput.value = "";
        feedbackDiv.textContent = "";
        answerInput.style.display = "";
        submitBtn.style.display = "";
        answerInput.focus();
    }

    // Başlat
    startBtn.onclick = function() {
        // Sözlükten kelimeleri çek ve yeni bir dizi oluştur
        const words = getWordsFromDictionary();
        if (words.length === 0) {
            area.style.display = 'block';
            feedbackDiv.textContent = "there are no words in the dictionary!";
            feedbackDiv.style.color = "#dc3545";
            meaningDiv.textContent = "";
            answerInput.style.display = "none";
            submitBtn.style.display = "none";
            return;
        }
        // Tüm kelimeleri kopyala, yeniden başlatmak için
        remainingWords = words.slice();
        area.style.display = 'block';
        pickRandomWord();
    };

    // Cevap kontrolü
    submitBtn.onclick = function() {
        if (!current) return;
        const user = answerInput.value.trim().toLowerCase();
        const correct = current.word.trim().toLowerCase();
        if (user === correct) {
            feedbackDiv.textContent = "Correct!";
            feedbackDiv.style.color = "#0f0";
            setTimeout(pickRandomWord, 600);
        } else {
            feedbackDiv.textContent = "False :( try again.";
            feedbackDiv.style.color = "#dc3545";
            answerInput.focus();
        }
    };

    // Enter ile submit
    answerInput && answerInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') submitBtn.click();
    });
})();

// Globals and existing functionality above...

// --- START: Sliding‐Window Sentence Quiz with 10-Attempt Failsafe ---

// 1) Metni tek string hâline getir ve kelimelere böl
function getAllWords() {
    const text = allLines.join(' ');
    return text.split(/\s+/).filter(w => w.length > 0);
}
  
// 2) Her kelime için etrafından pencereyi al
function makeWindowQuiz(wordsList, dictWords) {
    const items = [];
    dictWords.forEach(target => {
      const lower = target.toLowerCase();
      let found = false;
      wordsList.forEach((w, i) => {
        if (w.toLowerCase().replace(/[^\w]/g, '') === lower) {
          found = true;
          const start = Math.max(0, i - 10);
          const end   = Math.min(wordsList.length, i + 21);
          const windowWords = wordsList.slice(start, end);
          const snippet = windowWords.map(ww => 
            ww.toLowerCase().replace(/[^\w]/g,'') === lower ? '____' : ww
          ).join(' ');
          items.push({ word: target, snippet });
        }
      });
      if (!found) {
        items.push({ word: target, snippet: `Cümle bulunamadı: ${target}` });
      }
    });
    return items;
}
  
// 3) Kartları ve deneme sayısını tut
let quizItems = [];
let currentCard = 0;
let attempts = [];  // her kart için yanlış sayısı
  
function renderCard() {
    const container = document.getElementById('sentence-quiz-container');
    const prevBtn   = document.getElementById('prev-card');
    const nextBtn   = document.getElementById('next-card');
    container.innerHTML = '';
  
    // Bitti mi?
    if (currentCard >= quizItems.length) {
      container.innerHTML = `<div class="alert alert-success">Quiz tamamlandı!</div>`;
    } else {
      const { word, snippet } = quizItems[currentCard];
      container.insertAdjacentHTML('beforeend', `
        <div class="card bg-dark text-light mb-3">
          <div class="card-body">
            <p class="card-text">${snippet}</p>
            <div class="d-flex align-items-center gap-2">
              <input id="sw-answer" 
                     class="form-control w-auto" 
                     placeholder="Cevabınız">
              <button id="sw-check" class="btn btn-primary btn-sm">Check</button>
              <span id="sw-feedback" class="ms-2"></span>
            </div>
          </div>
        </div>
      `);
    }
  
    // Buton durumu
    prevBtn.disabled = currentCard <= 0;
    nextBtn.disabled = currentCard >= quizItems.length;
  
    // Check butonuna event
    const checkBtn = document.getElementById('sw-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', checkAnswer);
    }
  }
  
  
  function checkAnswer() {
    const input   = document.getElementById('sw-answer');
    const fb      = document.getElementById('sw-feedback');
    const correct = quizItems[currentCard].word;
    const given   = input.value.trim();
  
    if (!given) {
      fb.textContent = 'Lütfen bir cevap girin!';
      fb.className   = 'text-warning';
      return;
    }
  
    if (given.toLowerCase() === correct.toLowerCase()) {
      fb.textContent = '✔';
      fb.className   = 'text-success';
    } else {
      fb.textContent = `✖: ${correct}`;
      fb.className   = 'text-danger';
    }
  }
  
// 4) Butonlara event ata
// Create quiz
document.getElementById('create-sentence-quiz').addEventListener('click', () => {
    const allWords  = getAllWords();
    const dictWords = kelimeler.map(o => o.kelime);
    quizItems       = makeWindowQuiz(allWords, dictWords);
    currentCard     = 0;
    attempts        = Array(quizItems.length).fill(0);
    renderCard();
});

// Delete quiz
document.getElementById('delete-sentence-quiz').addEventListener('click', () => {
    document.getElementById('sentence-quiz-container').innerHTML = '';
    quizItems = [];
    currentCard = 0;
    attempts = [];
    document.getElementById('prev-card').disabled = true;
    document.getElementById('next-card').disabled = true;
});

// Prev/Next navigation
document.getElementById('prev-card').addEventListener('click', () => {
  if (currentCard > 0) {
    currentCard--;
    renderCard();
  }
});
document.getElementById('next-card').addEventListener('click', () => {
  if (currentCard < quizItems.length) {
    currentCard++;
    renderCard();
  }
});

// --- END: Sliding‐Window Sentence Quiz with Navigation and 10-Attempt Failsafe ---