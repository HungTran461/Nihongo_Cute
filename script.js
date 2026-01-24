/**
 * NIHONGO CUTE - MAIN SCRIPT
 * Updated: Final Clean Version
 */

/* =========================================
   1. KHO DỮ LIỆU (DATABASE)
   ========================================= */



const basicRows = [['a','i','u','e','o'],['ka','ki','ku','ke','ko'],['sa','shi','su','se','so'],['ta','chi','tsu','te','to'],['na','ni','nu','ne','no'],['ha','hi','fu','he','ho'],['ma','mi','mu','me','mo'],['ya','','yu','','yo'],['ra','ri','ru','re','ro'],['wa','','','','wo'],['n','','','','']];
const dakutenRows = [['ga','gi','gu','ge','go'],['za','ji','zu','ze','zo'],['da','ji_d','zu_d','de','do'],['ba','bi','bu','be','bo'],['pa','pi','pu','pe','po']];
const yoonRows = [['kya','kyu','kyo'],['sha','shu','sho'],['cha','chu','cho'],['nya','nyu','nyo'],['hya','hyu','hyo'],['mya','myu','myo'],['rya','ryu','ryo'],['gya','gyu','gyo'],['ja','ju','jo'],['bya','byu','byo'],['pya','pyu','pyo']];
// --- Dữ liệu Bảng chữ cái (Hiragana/Katakana) -kana.json
let charMaps = {};
// Ví dụ Hiragana - vocab_hiragana.json
let hiraganaVocab = {};
// Ví dụ Katakan - vocab_katakana.json
let katakanaVocab = {};
// ---  Dữ liệu Minna no Nihongo (Bài 1 & 2) - vocab_minna.json
let minnaData = {};
//KanjiN5 - kanjin5.json
let n5KanjiData = [];
//Dữ liệu Grammar - grammar.json
let grammarData = {};
// ---  Dữ liệu Bài tập (Exercises) - exercises.json ---
let exercisesData = {};
// --- Dữ liệu Sắp xếp câu  - exercise_scramble.json ---
let exerciseScrambleData = {};
// --- DỮ LIỆU BÀI TẬP NGHE HIỂU - exercises_listening.json ---
let exerciseListeningData = {};
//Từ vựng Sabai - vocab_sabai.json
let extraData = {};
// --- Dữ liệu Hội thoại - kaiwa.json ---
let kaiwaData = {};
// ---  Dữ liệu Bộ Thủ - radicals.json ---
let radicalsData = [];


/* =========================================
   HÀM TẢI DỮ LIỆU (DATA LOADER)
   ========================================= */

async function loadAllData() {
    try {
        console.log("Đang tải dữ liệu...");

        // Sử dụng Promise.all để tải tất cả các file cùng lúc cho nhanh
        const [resKana, resVocabHira, resVocabKata, resVocabMinna, resKanjiN5, resGrammar, resExer, resExerScram, resExerListen, resVocabSabai, resKaiwa,resRadical] = await Promise.all([
            fetch('data/kana.json'),
            fetch('data/vocab_hiragana.json'),
            fetch('data/vocab_katakana.json'),
            fetch('data/vocab_minna.json'),
            fetch('data/kanjin5.json'),
            fetch('data/grammar.json'),
            fetch('data/exercises.json'),
            fetch('data/exercises_scramble.json'),
            fetch('data/exercises_listening.json'),
            fetch('data/vocab_sabai.json'),
            fetch('data/kaiwa.json'),
            fetch('data/radicals.json'),
        ]);

        if (!resKana.ok) throw new Error("Không tìm thấy file kana.json");
        if (!resKanjiN5.ok) throw new Error("Không tìm thấy file kanji.json (hoặc kanjin5.json)");
        // Chuyển đổi kết quả về dạng JSON và gán vào biến
        charMaps = await resKana.json();
        hiraganaVocab = await resVocabHira.json();
        katakanaVocab = await resVocabKata.json();
        minnaData = await resVocabMinna.json();
        n5KanjiData = await resKanjiN5.json();
        grammarData = await resGrammar.json();
        exercisesData = await resExer.json();
        exerciseScrambleData = await resExerScram.json();
        exerciseListeningData = await resExerListen.json();
        extraData = await resVocabSabai.json();
        kaiwaData = await resKaiwa.json();
        radicalsData = await resRadical.json();

        console.log("Tải dữ liệu thành công!");
        initSearchFeature();
        initTheme();

    } catch (error) {
        console.error("❌ LỖI TẢI DỮ LIỆU:", error);
        alert("Lỗi tải dữ liệu! Hãy nhấn F12 -> Console để xem chi tiết file nào bị thiếu.");
    }
}

/* =========================================
    KHỞI TẠO ỨNG DỤNG
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});


/* =========================================
   2. TRẠNG THÁI & LOGIC ĐIỀU HƯỚNG
   ========================================= */

let currentSystem = 'hiragana';
let currentKanjiTab = 'radicals';

function openSection(id) {
    const mainMenu = document.getElementById('mainMenu');
    const heroSection = document.getElementById('heroSection');
    if (mainMenu) mainMenu.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => {
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 10);
    }
    if (id === 'kanaSection') {
        currentSystem = 'hiragana';
        const container = document.getElementById('gridContainer');
        if (container) container.innerHTML = ''; 
        renderGrid('hiragana');
        resetTabs('#kanaSection', 0);
    }
    else if (id === 'vocabSection') {
        const sel = document.getElementById('lessonSelect');
        if(sel) sel.value = "1";
        renderVocabList("1");
    }
    else if (id === 'kanjiSection') {
        renderKanjiGrid(currentKanjiTab || 'radicals');
        const tabs = document.querySelectorAll('#kanjiSection .tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        const activeBtn = Array.from(tabs).find(btn => btn.getAttribute('onclick').includes(currentKanjiTab));
        if (activeBtn) activeBtn.classList.add('active');
    }
    else if (id === 'gameSection') {
        switchGameTab('flashcard', { target: document.querySelector('#gameSection .tab-btn') });
    }
    else if (id === 'grammarSection') {
        renderGrammar('1');
        const tabs = document.querySelectorAll('#grammarSection .tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        if(tabs[0]) tabs[0].classList.add('active');
    }
    else if (id === 'exerciseSection') {
        switchExerciseTab('1');
    }
    if (id === 'kaiwaSection') {
        switchKaiwaTab('1'); 
    }
}

function closeSection() {
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    document.getElementById('mainMenu').style.display = 'grid';
    document.getElementById('heroSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetTabs(selector, index) {
    const tabs = document.querySelectorAll(selector + ' .tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    if(tabs[index]) tabs[index].classList.add('active');
}

/* =========================================
   3. LOGIC KANA (BẢNG CHỮ CÁI)
   ========================================= */
function switchTabs(system, event) {
    console.log("Đang chuyển sang:", system);
    currentSystem = system;
    document.querySelectorAll('#kanaSection .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderGrid(system);
}

function renderGrid(system) {
    const container = document.getElementById('gridContainer');
    container.innerHTML = ''; 
    createSection(container, 'Âm Cơ Bản', basicRows, 'grid-5', system);
    createSection(container, 'Biến Âm', dakutenRows, 'grid-5', system);
    createSection(container, 'Ảo Âm', yoonRows, 'grid-3', system);
}

function createSection(container, titleText, dataRows, gridClass, system) {
    const title = document.createElement('div');
    title.className = 'kana-section-title';
    title.innerText = titleText;
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = gridClass;

    dataRows.forEach(row => {
        row.forEach(romaji => {
            const box = document.createElement('div');
            box.className = 'kana-box';
            if (!romaji) {
                box.classList.add('empty');
            } else {
                const char = charMaps[system][romaji];
                const display = romaji.replace('_d', '');
                box.innerHTML = `<div class="kana-char">${char}</div><div class="kana-romaji">${display}</div>`;
                box.onclick = () => openModal(char, romaji);
            }
            grid.appendChild(box);
        });
    });
    container.appendChild(grid);
}

/* =========================================
   4. LOGIC TỪ VỰNG (VOCAB)
   ========================================= */
function changeLesson() {
    const id = document.getElementById('lessonSelect').value;
    renderVocabList(id);
}

function renderVocabList(id) {
    const container = document.getElementById('vocabListContainer');
    container.innerHTML = '';
    const list = minnaData[id] || extraData[id];
    if (list && list.length > 0) {
        list.forEach(word => {
            // Xử lý hiển thị Kanji (nếu giống Hiragana thì hiện gạch ngang)
            const kanjiDisplay = word.k === word.r ? '<span class="no-kanji">-</span>' : word.k;
            
            const row = document.createElement('div');
            row.className = 'vocab-row';
            
            row.innerHTML = `
                <div class="cell-kanji">${kanjiDisplay}</div>
                <div class="cell-reading">${word.r}</div>
                <div class="cell-mean">${word.m}</div>
                <div class="cell-audio">
                    <button class="btn-vocab-speak" onclick="speak('${word.r}')" title="Nghe phát âm">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });
    } else {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#999">Chưa có dữ liệu cho mục này.</div>';
    }
}

/* =========================================
   5. LOGIC HÁN TỰ (KANJI)
   ========================================= */
function switchKanjiTab(tab, event) {
    currentKanjiTab = tab;
    document.querySelectorAll('#kanjiSection .tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderKanjiGrid(tab);
}

function renderKanjiGrid(type) {
    const container = document.getElementById('kanjiListContainer');
    container.innerHTML = '';
    const data = (type === 'n5') ? n5KanjiData : radicalsData;

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'kanji-card';
        card.innerHTML = `<div class="k-hanviet">${item.h}</div><div class="k-char">${item.c}</div><div class="k-mean">${item.m}</div>`;
        card.onclick = () => openKanjiModal(item, type);
        container.appendChild(card);
    });
}

function openKanjiModal(item, type) {
    const modal = document.getElementById('charModal');
    const audioBtn = document.querySelector('.btn-audio-large');
    const readingsBox = document.getElementById('kanjiReadings');

    document.getElementById('modalChar').innerText = item.c;
    document.getElementById('modalRomaji').innerText = item.h;

    if (type === 'n5') {
        readingsBox.style.display = 'block';
        document.getElementById('modalOnyomi').innerText = item.on || '-';
        document.getElementById('modalKunyomi').innerText = item.kun || '-';
        if(audioBtn) {
            audioBtn.style.display = 'inline-block';
            audioBtn.onclick = function() {
                speak(item.c); 
            };
        }
        speak(item.c);
    } else {
        readingsBox.style.display = 'none';
        if(audioBtn) audioBtn.style.display = 'none';
    }

    // Ảnh Stroke Order
    const hex = ('00000' + item.c.charCodeAt(0).toString(16)).slice(-5);
    document.getElementById('strokeImage').src = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`;
    document.querySelector('.stroke-order-container').style.display = 'block';

    document.getElementById('modalExamples').innerHTML = `<li style="padding:15px">Nghĩa: <strong>${item.m}</strong></li>`;
    modal.classList.add('show');
}

/* =========================================
   6. MODAL & HELPER (CHUNG)
   ========================================= */
function openModal(char, romaji) {
    const modal = document.getElementById('charModal');
    const audioBtn = document.querySelector('.btn-audio-large');
    if(audioBtn) {
        audioBtn.style.display = 'inline-block';
        audioBtn.onclick = function() {
            speak(char);
        };
    }
    document.getElementById('modalChar').innerText = char;
    document.getElementById('modalRomaji').innerText = romaji.replace('_d', '');
    document.querySelector('.stroke-order-container').style.display = 'none';
    const readingsBox = document.getElementById('kanjiReadings');
    if(readingsBox) readingsBox.style.display = 'none';

    // Data từ vựng gợi ý
    const listEl = document.getElementById('modalExamples');
    listEl.innerHTML = '';
    let wordInfo = (currentSystem === 'hiragana') ? hiraganaVocab[romaji] : katakanaVocab[romaji];

    if(wordInfo) {
        const color = currentSystem === 'hiragana' ? '#ff9a9e' : '#a18cd1';
        listEl.innerHTML = `<li style="padding:15px; border-left:5px solid ${color}"><div style="font-size:1.4rem;color:${color};font-weight:bold">${wordInfo.j}</div><div>${wordInfo.v}</div></li>`;
    } else {
        listEl.innerHTML = '<li style="padding:15px;text-align:center;color:#999">Chưa có từ vựng gợi ý.</li>';
    }

    modal.classList.add('show');
    speak(char);
}

function closeModal() {
    document.getElementById('charModal').classList.remove('show');
    window.speechSynthesis.cancel();
}
window.onclick = function(e) {
    if(e.target === document.getElementById('charModal')) closeModal();
}


let voices = [];
// Load danh sách giọng khi trình duyệt sẵn sàng
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
    };
}

function speak(text, gender = 'female') {
    if (!('speechSynthesis' in window)) return;

    const cleanText = text.replace(/\(.*?\)/g, '').trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = 'ja-JP';
    
    if (voices.length === 0) {
        voices = window.speechSynthesis.getVoices();
    }

    const jaVoices = voices.filter(v => v.lang.includes('ja'));

    if (jaVoices.length > 0) {
        let selectedVoice = jaVoices[0];

        if (gender === 'male') {
            const maleVoice = jaVoices.find(v => 
                v.name.includes('Ichiro') || 
                v.name.includes('Kenji') || 
                v.name.includes('Male') ||
                v.name.includes('Otoya')
            );
            if (maleVoice) selectedVoice = maleVoice;
            
            u.pitch = 0.8; 
            u.rate = 0.9; 
        } else {
            const femaleVoice = jaVoices.find(v => 
                v.name.includes('Ayumi') || 
                v.name.includes('Haruka') || 
                v.name.includes('Kyoko') ||
                v.name.includes('Female')
            );
            if (femaleVoice) selectedVoice = femaleVoice;

            u.pitch = 1.1; 
            u.rate = 1.0;
        }

        u.voice = selectedVoice;
    }

    window.speechSynthesis.speak(u);
}

/* =========================================
   7. GAME ENGINE
   ========================================= */
function getGameData(key) {
    let rawData = [];
    
    // 1. Minna & Saiba
    if (key.startsWith('minna_') || key.startsWith('extra_')) {
        let list = [];
        if (key.startsWith('minna_')) list = minnaData[key.split('_')[1]];
        if (key.startsWith('extra_')) list = extraData[key.split('_')[1]];
        
        if (list) {
            return list.map(i => ({ 
                front: (i.k===i.r?i.r:`${i.r}\n(${i.k})`), // Ưu tiên Kana to
                back: i.m, read: i.r, type:'vocab' 
            }));
        }
    }
    
    // 2. Kanji N5
    if (key === 'n5_kanji') {
        return n5KanjiData.map(i => ({ front: i.c, back: `${i.h} - ${i.m}`, read: i.kun!=='-'?i.kun:i.on, type:'kanji' }));
    }

    // 3. KANA & MIX (Logic mới)
    // Kiểm tra các từ khóa
    const isHira = key.includes('hira');
    const isKata = key.includes('kata');
    const isMix  = key.includes('mix'); // Mới

    if (isHira || isKata || isMix) {
        let rows = [];
        
        // Logic chọn hàng dữ liệu
        if (key.includes('basic')) rows = basicRows;
        else if (key.includes('daku')) rows = dakutenRows;
        else if (key.includes('yoon')) rows = yoonRows;
        else if (key.includes('full')) rows = [...basicRows, ...dakutenRows, ...yoonRows];
        
        // Hàm Helper để push dữ liệu
        const addData = (system, rowList) => {
            const map = charMaps[system];
            rowList.forEach(r => {
                r.forEach(romaji => {
                    if(romaji) {
                        rawData.push({ 
                            front: map[romaji], 
                            back: romaji.replace('_d',''), 
                            read: map[romaji], 
                            type: 'kana' 
                        });
                    }
                });
            });
        };

        // Thực thi dựa trên loại bảng
        if (isHira) addData('hiragana', rows);
        if (isKata) addData('katakana', rows);
        if (isMix) {
            // Nếu là Mix thì mặc định lấy Full (hoặc tùy biến nếu muốn)
            // Ở đây ta giả định Mix là lấy Full cả 2 bảng
            const fullRows = [...basicRows, ...dakutenRows, ...yoonRows];
            addData('hiragana', fullRows);
            addData('katakana', fullRows);
        }

        return rawData;
    }
    return [];
}

// --- Flashcard Logic ---
let fcList = [], fcIndex = 0, isFlipped = false;
/*function switchGameTab(tab, event) {
    document.getElementById('gameFlashcardArea').style.display = (tab === 'flashcard') ? 'block' : 'none';
    document.getElementById('gameQuizArea').style.display = (tab === 'quiz') ? 'block' : 'none';
    document.querySelectorAll('#gameSection .tab-btn').forEach(b => b.classList.remove('active'));
    if(event) event.target.classList.add('active');
    if(tab === 'flashcard') initFlashcards();
}*/

function initFlashcards() {
    const key = document.getElementById('flashcardDeck').value;
    let raw = getGameData(key);
    fcList = raw.sort(() => 0.5 - Math.random()); // Shuffle
    fcIndex = 0;
    renderCard();
}

function renderCard() {
    if(fcList.length === 0) return;
    const item = fcList[fcIndex];
    const card = document.querySelector('.flashcard');
    card.classList.remove('flipped');
    isFlipped = false;

    setTimeout(() => {
        const parts = item.front.split('\n');
        document.getElementById('fcFrontMain').innerText = parts[0];
        document.getElementById('fcFrontSub').innerText = parts[1] || '';
        document.getElementById('fcBackMean').innerText = item.back;
        document.getElementById('fcCounter').innerText = `${fcIndex+1} / ${fcList.length}`;
    }, 200);
}

function flipCard() {
    const card = document.querySelector('.flashcard');
    card.classList.toggle('flipped');
    isFlipped = !isFlipped;
}
function nextCard() { if(fcIndex < fcList.length-1) { fcIndex++; renderCard(); } }
function prevCard() { if(fcIndex > 0) { fcIndex--; renderCard(); } }
function playFlashcardAudio(e) { e.stopPropagation(); speak(fcList[fcIndex].read); }


// --- Quiz Logic ---
let quizList = [], quizIdx = 0, quizScore = 0, quizTimer;
let quizConfig = {time:10, count:10, opts:4};
let quizHistory = [];

function startQuiz() {
    const topic = document.getElementById('quizTopic').value;
    quizConfig.count = parseInt(document.getElementById('quizCount').value);
    quizConfig.time = parseInt(document.getElementById('quizTime').value);
    quizConfig.opts = parseInt(document.getElementById('quizOptionsCount').value);

    const full = getGameData(topic);
    if(full.length < 4) { alert('Không đủ dữ liệu!'); return; }
    quizList = full.sort(() => 0.5 - Math.random()).slice(0, quizConfig.count);
    
    quizIdx = 0; quizScore = 0; quizHistory = [];
    document.getElementById('quizScoreLive').innerText = 0;
    document.getElementById('quizTotal').innerText = quizList.length;
    
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizPlay').style.display = 'block';
    document.getElementById('quizResult').style.display = 'none';
    loadQuestion();
}

function loadQuestion() {
    if(quizIdx >= quizList.length) { finishQuiz(); return; }
    const q = quizList[quizIdx];
    document.getElementById('quizCurrent').innerText = quizIdx+1;
    
    // Hiển thị Kanji/Kana tách dòng
    const qEl = document.getElementById('quizQuestion');
    if(q.front.includes('\n')) {
        const p = q.front.split('\n');
        qEl.innerHTML = `<div style="font-size:3rem;line-height:1.1">${p[0]}</div><div style="font-size:1.5rem;color:var(--primary);margin-top:5px">${p[1]}</div>`;
    } else {
        qEl.innerText = q.front;
    }

    // Tạo đáp án
    const grid = document.getElementById('quizOptions');
    grid.innerHTML = '';
    let opts = [q];
    const full = getGameData(document.getElementById('quizTopic').value);
    while(opts.length < quizConfig.opts) {
        const rand = full[Math.floor(Math.random()*full.length)];
        if(!opts.includes(rand) && rand.front !== q.front) opts.push(rand);
    }
    opts.sort(() => 0.5 - Math.random());

    opts.forEach(o => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option';
        btn.innerText = o.back;
        btn.onclick = () => checkAnswer(o, q, btn);
        grid.appendChild(btn);
    });

    runTimer();
}

function runTimer() {
    const bar = document.getElementById('timerBar');
    bar.style.transition = 'none'; bar.style.width = '100%';
    void bar.offsetWidth; // Force reflow
    bar.style.transition = `width ${quizConfig.time}s linear`;
    bar.style.width = '0%';
    
    clearInterval(quizTimer);
    quizTimer = setTimeout(() => recordResult(null, false), quizConfig.time * 1000);
}

function checkAnswer(sel, cor, btn) {
    clearInterval(quizTimer);
    const isRight = (sel.front === cor.front);
    if(isRight) {
        btn.classList.add('correct'); quizScore += 10; speak('ピンポン');
    } else {
        btn.classList.add('wrong'); speak('ブブー');
        document.querySelectorAll('.quiz-option').forEach(b => {
            if(b.innerText === cor.back) b.classList.add('correct');
        });
    }
    document.querySelectorAll('.quiz-option').forEach(b => b.onclick = null);
    document.getElementById('quizScoreLive').innerText = quizScore;
    setTimeout(() => recordResult(sel, isRight), 1500);
}

function recordResult(sel, isRight) {
    const q = quizList[quizIdx];
    quizHistory.push({
        q: q.front.split('\n')[0],
        correct: q.back,
        user: sel ? sel.back : (sel === null ? 'Hết giờ' : 'Chưa làm'),
        isRight: isRight
    });
    quizIdx++;
    loadQuestion();
}

function endQuizEarly() {
    if(!confirm('Nộp bài ngay?')) return;
    clearInterval(quizTimer);
    for(let i=quizIdx; i<quizList.length; i++) {
        const q = quizList[i];
        quizHistory.push({q:q.front.split('\n')[0], correct:q.back, user:'Chưa làm', isRight:false});
    }
    finishQuiz();
}

function finishQuiz() {
    document.getElementById('quizPlay').style.display = 'none';
    document.getElementById('quizResult').style.display = 'block';
    document.getElementById('finalScore').innerText = `${quizScore}đ`;
    
    const list = document.getElementById('resultDetailsList');
    list.innerHTML = '';
    quizHistory.forEach((h,i) => {
        let cls = 'r-wrong';
        if(h.isRight) cls = 'r-correct';
        if(h.user === 'Chưa làm') cls = 'r-skipped';
        
        const item = document.createElement('div');
        item.className = `result-item ${cls}`;
        item.innerHTML = `<div class="r-q-text">Câu ${i+1}: ${h.q}</div>
                          <div class="r-info"><span class="r-user-ans">Bạn: ${h.user}</span>
                          ${!h.isRight ? `<span class="r-right-ans">Đúng: ${h.correct}</span>` : ''}</div>`;
        list.appendChild(item);
    });
}
function resetQuizInfo() {
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizSetup').style.display = 'block';
}

// KHỞI TẠO MẶC ĐỊNH
window.onload = function() {
    // Không làm gì cả, chờ người dùng bấm menu
};

/* =========================================
   8. LOGIC NGỮ PHÁP (GRAMMAR)
   ========================================= */


function switchGrammarTab(lessonId, event) {
    // Đổi màu nút
    const btns = document.querySelectorAll('#grammarSection .tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    renderGrammar(lessonId);
}

function renderGrammar(lessonId) {
    const container = document.getElementById('grammarListContainer');
    container.innerHTML = ''; // Xóa cũ

    const list = grammarData[lessonId];
    if (!list) return;

    list.forEach(item => {
        // Tạo HTML cho từng ví dụ
        let examplesHTML = '';
        item.ex.forEach(e => {
            examplesHTML += `
                <div class="gp-ex-item">
                    <div class="ex-jp"><i class="fas fa-caret-right" style="color:var(--primary)"></i> ${e.j}</div>
                    <div class="ex-vn">${e.v}</div>
                </div>
            `;
        });

        // Tạo thẻ Card
        const card = document.createElement('div');
        card.className = 'grammar-card';
        card.innerHTML = `
            <div class="gp-title">${item.title}</div>
            <div class="gp-mean">${item.mean}</div>
            <div class="gp-note">${item.note}</div>
            <div class="gp-examples">
                ${examplesHTML}
            </div>
        `;
        container.appendChild(card);
    });
}

/* =========================================
   9. LOGIC BÀI TẬP (EXERCISES)
   ========================================= */

let currentExerciseList = [];


// Hàm di chuyển từ giữa 2 hộp
function moveWord(btn) {
    const parent = btn.parentElement;
    const itemContainer = btn.closest('.scramble-item');
    const answerBox = itemContainer.querySelector('.scramble-answer-box');
    const sourceBox = itemContainer.querySelector('.scramble-source-box');

    // Nếu đang ở source -> chuyển sang answer
    if (parent === sourceBox) {
        answerBox.appendChild(btn);
    } 
    // Nếu đang ở answer -> chuyển về source
    else {
        sourceBox.appendChild(btn);
    }
    
    // Xóa trạng thái đúng/sai nếu sửa lại
    answerBox.classList.remove('correct', 'wrong');
    const feedback = itemContainer.querySelector('.scramble-feedback');
    if(feedback) feedback.innerText = "";
}

function formatText(text) {
    // Tìm đoạn văn bản dạng "abc(xyz)" và bọc "xyz" vào thẻ span màu xám
    return text.replace(/\(([^)]+)\)/g, '<span style="color:var(--format-text); font-size:0.9em; font-weight:normal">($1)</span>');
}

function renderExercises(lessonId) {
    const container = document.getElementById('exerciseContainer');
    container.innerHTML = ""; 
    document.getElementById('exerciseScore').innerHTML = ""; 

    // --- PHẦN : NGHE HIỂU (CHOUKAI) - HỖ TRỢ NHIỀU BÀI NGHE ---
    const listenDataList = (typeof exerciseListeningData !== 'undefined') ? exerciseListeningData[lessonId] : null;
    
    if (listenDataList && Array.isArray(listenDataList)) {
        let html = `<h3 class="part-title" style="margin-top:40px; border-top:2px dashed #ddd; padding-top:20px;">I. Nghe hiểu (mỗi câu đúng được 10 PTS)</h3>`;
        
        // Lặp qua từng bài nghe con (Mondai 1, Mondai 2...)
        listenDataList.forEach((listenItem, subIndex) => {
            // Tiêu đề nhỏ cho từng bài nghe
            html += `<h4 style="margin: 20px 0 10px 0; color: #a18cd1;">${listenItem.title}</h4>`;

            // Player riêng cho bài nghe này
            html += `
                <div class="audio-exercise-box">
                    <audio controls src="${listenItem.audio}" style="width:100%"></audio>
                    <p style="margin-top:10px; color:#666; font-size:0.9rem;">
                        <i class="fas fa-headphones"></i> Bấm nghe và trả lời
                    </p>
                </div>
            `;

            // Danh sách câu hỏi của bài nghe này
            listenItem.questions.forEach((qItem, qIndex) => {
                let opts = "";
                qItem.opts.forEach((opt, i) => {
                    // Tạo ID duy nhất để không bị trùng nút khi chọn
                    // Ví dụ: ex-listen-0-0-1 (Bài nghe 0, Câu 0, Đáp án 1)
                    opts += `<button class="exercise-opt-btn" onclick="selectOption(this, ${i})">${opt}</button>`;
                });

                html += `
                <div class="exercise-item">
                    <p><strong>Câu ${subIndex + 1}.${qIndex + 1}:</strong> ${qItem.q}</p>
                    <div class="exercise-options" data-correct="${qItem.ans}">
                        ${opts}
                    </div>
                </div>`;
            });
        });
        
        container.innerHTML += html;
    }
    // --- PHẦN : TRẮC NGHIỆM ĐIỀN TỪ ---
    const fillData = exercisesData[lessonId]; 
    if (fillData) {
        let html = `<h3 class="part-title">II. Chọn đáp án đúng (mỗi câu đúng được 10 PTS)</h3>`;
        fillData.forEach((item, index) => {
            let optionsHtml = '';
            item.opts.forEach((opt, i) => {
                optionsHtml += `<button class="exercise-opt-btn" onclick="selectOption(this, ${i})">${formatText(opt)}</button>`;
            });

            html += `
                <div class="exercise-item">
                    <p class="exercise-question-text" ><strong>${index + 1}.</strong> ${formatText(item.q)}</p>
                    <div class="exercise-options" id="opts-${index}" data-correct="${item.ans}">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        });
        container.innerHTML += html;
        currentExerciseList = fillData; 
    }

    // --- PHẦN : SẮP XẾP CÂU  ---
    const scrambleData = exerciseScrambleData[lessonId];
    if (scrambleData) {
        let html = `<h3 class="part-title" style="margin-top:30px; border-top:1px dashed #ccc; padding-top:20px;">III. Sắp xếp thành câu hoàn chỉnh (mỗi câu đúng được 20 PTS)</h3>`;
        scrambleData.forEach((item, index) => {
            const qID = `scramble-${lessonId}-${index}`;
            let shuffled = [...item.parts].sort(() => Math.random() - 0.5);
            let buttonsHtml = shuffled.map(word => 
                `<button class="word-btn" onclick="moveWord(this)">${word}</button>`
            ).join('');

            const correctAnswerStr = JSON.stringify(item.correct).replace(/"/g, '&quot;');

            html += `
                <div class="scramble-item" id="${qID}">
                    <p class="scramble-question"><strong>${index + 1}.</strong> ${formatText(item.question)}</p>
                    <div class="scramble-answer-box" id="${qID}-ans" data-correct="${correctAnswerStr}"></div>
                    <div class="scramble-source-box" id="${qID}-src">${buttonsHtml}</div>
                    <div class="scramble-feedback" style="margin-top:5px; font-weight:bold;"></div>
                </div>
            `;
        });
        container.innerHTML += html;
    }
    
    
}

function selectOption(btn, optionIndex) {
    const parent = btn.parentElement;
    
    const allBtns = parent.querySelectorAll('.exercise-opt-btn');
    allBtns.forEach(b => {
        b.classList.remove('selected');
        b.style.background = 'var(--white)'; 
        b.style.color = 'var(--text)';         
        b.style.borderColor = '#e0e0e0'; 
    });

    btn.classList.add('selected');
    
    btn.style.background = '#f3e5f5'; 
    btn.style.color = '#8e44ad';
    btn.style.borderColor = '#8e44ad';


    parent.setAttribute('data-selected', optionIndex);
}

function switchExerciseTab(lessonId, event) {
    const btn1 = document.getElementById('btn-bai-1');
    const btn2 = document.getElementById('btn-bai-2');
    
    if(btn1) btn1.className = 'tab-btn'; 
    if(btn2) btn2.className = 'tab-btn';

    if (lessonId === '1' && btn1) {
        btn1.className = 'tab-btn active';
    } else if (lessonId === '2' && btn2) {
        btn2.className = 'tab-btn active';
    }
    renderExercises(lessonId);
}

//* --- HÀM CHẤM ĐIỂM (CẬP NHẬT TÊN CLASS & FIX ĐẾM SỐ CÂU) --- */
function checkExerciseResult() {
    let score = 0;
    let total = 0;

    // 1. Chấm Trắc nghiệm (Tìm class mới: exercise-options)
    const allMultipleChoice = document.querySelectorAll('.exercise-options');
    
    // Debug để xem tìm thấy bao nhiêu câu
    console.log("Số câu trắc nghiệm tìm thấy:", allMultipleChoice.length);

    allMultipleChoice.forEach(div => {
        total++;
        const correctAns = parseInt(div.getAttribute('data-correct'));
        const selectedBtn = div.querySelector('.selected');
        
        // Tìm nút con với class mới: exercise-opt-btn
        const allBtns = div.querySelectorAll('.exercise-opt-btn');

        // Reset màu
        allBtns.forEach(b => b.classList.remove('correct', 'wrong'));
        
        // Hiện đáp án đúng
        if(allBtns[correctAns]) allBtns[correctAns].classList.add('correct');

        if (selectedBtn) {
            const userIndex = Array.from(allBtns).indexOf(selectedBtn);
            if (userIndex === correctAns) {
                score++;
            } else {
                selectedBtn.classList.add('wrong');
            }
        }
    });

    // 2. Chấm Sắp xếp câu (Giữ nguyên)
    const scrambleBoxes = document.querySelectorAll('.scramble-answer-box');
    console.log("Số câu sắp xếp tìm thấy:", scrambleBoxes.length);

    scrambleBoxes.forEach(box => {
        total++;
        const userWords = Array.from(box.querySelectorAll('.word-btn')).map(btn => btn.innerText);
        const correctWords = JSON.parse(box.getAttribute('data-correct'));
        const feedbackDiv = box.parentElement.querySelector('.scramble-feedback');

        if (JSON.stringify(userWords) === JSON.stringify(correctWords)) {
            score++;
            box.classList.add('correct');
            box.classList.remove('wrong');
            feedbackDiv.innerHTML = '<span style="color:#2ecc71"><i class="fas fa-check"></i> Chính xác!</span>';
        } else {
            box.classList.add('wrong');
            box.classList.remove('correct');
            feedbackDiv.innerHTML = '<span style="color:#e74c3c"><i class="fas fa-times"></i> Sai rồi</span>';
        }
    });

    // Hiển thị kết quả
    const resultDiv = document.getElementById('exerciseScore');
    resultDiv.innerHTML = `Kết quả: <strong>${score}/${total}</strong> câu đúng`;
    
    if (typeof addScore === 'function' && score > 0) {
        addScore(score * 10); 
    }
    if(score === total && total > 0) {
        resultDiv.innerHTML += " <br>🎉 Tuyệt vời! Bạn đã hoàn thành xuất sắc!";
    }
}


/* =========================================
   10. LOGIC HỘI THOẠI (KAIWA)
   ========================================= */

let currentKaiwaLesson = '1';

// 1. Hàm chuyển Tab bài học (Bài 1, Bài 2)
function switchKaiwaTab(lessonId, event) {
    // Đổi màu nút Tab bài học
    const btns = document.querySelectorAll('#kaiwaSection > .kana-tabs .tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    // Nếu có sự kiện click thì dùng target, nếu không (gọi tự động) thì tìm nút tương ứng
    if(event) {
        event.target.classList.add('active');
    } else {
        const index = parseInt(lessonId) - 1; 
        if(btns[index]) btns[index].classList.add('active');
    }
    
    currentKaiwaLesson = lessonId;
    
    renderKaiwaSubNav(lessonId);
}

// 2. Hàm tạo Menu con (Kaiwa Chính, Renshuu C...)
function renderKaiwaSubNav(lessonId) {
    const dataList = kaiwaData[lessonId];
    const navContainer = document.getElementById('kaiwaSubNav');
    navContainer.innerHTML = ''; // Xóa nút cũ

    if (!dataList || dataList.length === 0) {
        document.getElementById('kaiwaContainer').innerHTML = 'Chưa có dữ liệu.';
        return;
    }

    // Tạo các nút con
    dataList.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-sub-kaiwa';
        btn.innerText = item.name; 
        btn.onclick = () => renderKaiwaContent(lessonId, index);
        navContainer.appendChild(btn);
    });

    // === QUAN TRỌNG: TỰ ĐỘNG LOAD CÁI ĐẦU TIÊN ===
    // Ngay sau khi tạo nút xong, gọi luôn hàm hiển thị nội dung số 0
    renderKaiwaContent(lessonId, 0);
}

// 3. Hàm hiển thị nội dung chat
function renderKaiwaContent(lessonId, index) {
    // Highlight nút sub-nav đang chọn
    const btns = document.querySelectorAll('.btn-sub-kaiwa');
    btns.forEach(b => b.classList.remove('active'));
    if(btns[index]) btns[index].classList.add('active');

    // Lấy dữ liệu
    const data = kaiwaData[lessonId][index];
    const container = document.getElementById('kaiwaContainer');
    const imgEl = document.getElementById('kaiwaImage');

    // Cập nhật ảnh
    if(data.img) imgEl.src = data.img;
    
    const audioWrapper = document.getElementById('kaiwaAudioPlayer');
    const audioEl = document.getElementById('kaiwaAudio');
    const btnIcon = document.getElementById('kaiwaAudioIcon');
    const btnText = document.getElementById('kaiwaAudioText');
    const btnMain = document.getElementById('btnKaiwaAudio');

    // Reset trạng thái
    if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
    }
    if (btnIcon) btnIcon.className = 'fas fa-play';
    if (btnText) btnText.innerText = 'Nghe CD';
    if (btnMain) btnMain.classList.remove('playing');

    // Nạp file nhạc mới (Lấy từ data con)
    if (audioWrapper && audioEl) {
        if (data.audio && data.audio !== "") {
            audioEl.src = data.audio;
            audioWrapper.style.display = 'flex'; // Hiện nút
        } else {
            audioWrapper.style.display = 'none'; // Ẩn nút nếu bài này (vd: Renshuu C) không có tiếng
        }
    }

    container.innerHTML = ''; // Xóa chat cũ

    // Render từng dòng chat
    data.dialogue.forEach(line => {
        const row = document.createElement('div');
        
        const isRight = (line.side === 'right');
        // ==============================
        
        row.className = `chat-row ${isRight ? 'right' : 'left'}`;
        
        row.innerHTML = `
            <img src="${line.icon}" class="chat-avatar" alt="${line.name}">
            <div class="chat-bubble">
                <div class="chat-name">${line.name}</div>
                <div class="chat-jp">
                    ${formatText(line.text.replace(/\n/g, '<br>'))} 
                    
                    <i class="fas fa-volume-up btn-chat-audio" 
                    onclick="speak('${line.text.replace(/\n/g, ' ')}', '${line.gender || 'female'}')">
                    </i>

                </div>
                <div class="chat-vn">${line.mean}</div>
            </div>
        `;
        container.appendChild(row);
    });
}

/* --- LOGIC AUDIO KAIWA --- */
function toggleKaiwaAudio() {
    const audio = document.getElementById('kaiwaAudio');
    const btn = document.getElementById('btnKaiwaAudio');
    const icon = document.getElementById('kaiwaAudioIcon');
    const text = document.getElementById('kaiwaAudioText');

    if (audio.paused) {
        // Đang dừng -> Bấm để phát
        audio.play();
        btn.classList.add('playing');
        icon.className = 'fas fa-pause';
        text.innerText = "Đang phát...";
    } else {
        // Đang phát -> Bấm để dừng
        audio.pause();
        btn.classList.remove('playing');
        icon.className = 'fas fa-play';
        text.innerText = "Nghe CD";
    }
}

// Khi nhạc chạy hết thì tự động reset nút về ban đầu
document.getElementById('kaiwaAudio').addEventListener('ended', function() {
    const btn = document.getElementById('btnKaiwaAudio');
    const icon = document.getElementById('kaiwaAudioIcon');
    const text = document.getElementById('kaiwaAudioText');
    
    btn.classList.remove('playing');
    icon.className = 'fas fa-play';
    text.innerText = "Nghe lại";
});


/* =========================================
   11. GAME PHẢN XẠ (REFLEX)
   ========================================= */

let reflexTimer = null;
let reflexDataList = [];

function switchGameTab(tab, event) {
    // 1. Ẩn tất cả các khu vực game
    document.getElementById('gameFlashcardArea').style.display = 'none';
    document.getElementById('gameQuizArea').style.display = 'none';
    document.getElementById('gameReflexArea').style.display = 'none';
    document.getElementById('gameWritingArea').style.display = 'none';
    
    // 2. Hiển thị khu vực được chọn
    if (tab === 'flashcard') document.getElementById('gameFlashcardArea').style.display = 'block';
    if (tab === 'quiz') document.getElementById('gameQuizArea').style.display = 'block';
    if (tab === 'reflex') document.getElementById('gameReflexArea').style.display = 'block';
    if (tab === 'writing') {
        document.getElementById('gameWritingArea').style.display = 'block';
        initWritingGame();
    }

    // 3. Đổi màu nút Tab
    document.querySelectorAll('#gameSection .tab-btn').forEach(b => b.classList.remove('active'));
    if(event) event.target.classList.add('active');
    
    // Dừng game phản xạ nếu đang chạy mà chuyển tab
    if (tab !== 'reflex') stopReflexGame();
    if (tab === 'flashcard') initFlashcards();
}

function startReflexGame() {
    const topic = document.getElementById('reflexTopic').value;
    const speed = parseInt(document.getElementById('reflexSpeed').value);
    
    // Lấy dữ liệu
    reflexDataList = getGameData(topic);
    
    if (reflexDataList.length === 0) {
        alert("Chưa có dữ liệu!");
        return;
    }

    // Chuyển giao diện
    document.getElementById('reflexSetup').style.display = 'none';
    document.getElementById('reflexPlay').style.display = 'block';

    // Bắt đầu vòng lặp
    runReflexLoop(speed);
}

function runReflexLoop(speed) {
    // Hiển thị chữ đầu tiên ngay lập tức
    showRandomReflexChar();

    // Cài đặt lặp lại
    reflexTimer = setInterval(() => {
        showRandomReflexChar();
    }, speed);
}

function showRandomReflexChar() {
    const charEl = document.getElementById('reflexChar');
    const romajiEl = document.getElementById('reflexRomaji');
    
    // Lấy ngẫu nhiên
    const randomItem = reflexDataList[Math.floor(Math.random() * reflexDataList.length)];
    
    // Gán nội dung
    charEl.innerText = randomItem.front;
    romajiEl.innerText = randomItem.back; // Romaji
    
    // Thêm hiệu ứng animation
    charEl.classList.remove('animate-pop');
    void charEl.offsetWidth; // Trigger reflow để chạy lại animation
    charEl.classList.add('animate-pop');
    
    // Đổi màu ngẫu nhiên cho sinh động (Optional)
    const colors = ['#ff9a9e', '#a18cd1', '#3ddb3dff', '#fbc2eb', '#4facfe'];
    charEl.style.color = colors[Math.floor(Math.random() * colors.length)];
}

function stopReflexGame() {
    clearInterval(reflexTimer);
    document.getElementById('reflexSetup').style.display = 'flex'; // Flex để căn giữa do CSS cũ
    document.getElementById('reflexPlay').style.display = 'none';
}

/* =========================================
   LOGIC BẢNG XẾP HẠNG (LEADERBOARD)
   ========================================= */

// 1. Danh sách Bot Anime (Điểm số giả lập)
const botsData = [
    { name: "Conan", score: 500, avatar: "🕵️‍♂️" },
    { name: "Doraemon", score: 420, avatar: "🐱" },
    { name: "Naruto", score: 350, avatar: "🍥" },
    { name: "Luffy", score: 280, avatar: "👒" },
    { name: "Suneo", score: 150, avatar: "🦊" },
    { name: "Nobita", score: 10, avatar: "👓" }
];

// 2. Hàm mở Bảng xếp hạng
function openLeaderboard() {
    // Gọi hàm mở giao diện chung (để ẩn các cái khác)
    openSection('leaderboardSection');

    // Lấy điểm hiện tại của người dùng từ bộ nhớ
    // Nếu chưa có thì mặc định là 0
    let myScore = parseInt(localStorage.getItem('nihongoScore')) || 0;
    let myName = "Bạn (Me)";

    // Cập nhật thẻ hiển thị điểm cá nhân
    document.getElementById('myTotalScore').innerText = myScore;
    document.getElementById('myRankName').innerText = getRankTitle(myScore);

    // Gộp danh sách Bot và Người chơi
    let allPlayers = [
        ...botsData,
        { name: myName, score: myScore, avatar: "🐰", isMe: true }
    ];

    // Sắp xếp điểm từ cao xuống thấp
    allPlayers.sort((a, b) => b.score - a.score);

    // Render ra HTML
    const listContainer = document.getElementById('rankingList');
    listContainer.innerHTML = "";

    allPlayers.forEach((player, index) => {
        const rank = index + 1;
        const isMeClass = player.isMe ? "is-me" : "";
        
        const html = `
            <div class="ranking-item ${isMeClass}">
                <div class="rank-number">#${rank}</div>
                <div class="rank-user-info">
                    <span style="font-size:1.2rem">${player.avatar}</span>
                    <span>${player.name}</span>
                </div>
                <div class="rank-points">${player.score} pts</div>
            </div>
        `;
        listContainer.innerHTML += html;
    });
}

// 3. Hàm lấy danh hiệu dựa trên điểm số
function getRankTitle(score) {
    if (score < 100) return "Thỏ Tập Sự 🌱";
    if (score < 300) return "Thỏ Chăm Chỉ 📚";
    if (score < 500) return "Thỏ Tài Giỏi 🎖";
    if (score < 700) return "Thỏ Thông Thái 🎓";
    if (score < 1000) return "Thỏ Thiên Tài 🧩";
    return "Thỏ Thần Thánh 🌟";
}

// 4. Hàm CỘNG ĐIỂM (Dùng để gọi khi làm bài tập xong)
function addScore(points) {
    let current = parseInt(localStorage.getItem('nihongoScore')) || 0;
    let newScore = current + points;
    localStorage.setItem('nihongoScore', newScore);
    
    // Hiệu ứng thông báo nhỏ (Console hoặc Alert tùy bạn)
    console.log(`Đã cộng ${points} điểm! Tổng: ${newScore}`);
}
/* --- HÀM RESET ĐIỂM --- */
function resetMyScore() {
    // 1. Hỏi xác nhận để tránh bấm nhầm
    const confirmAction = confirm("Bạn có chắc muốn xóa toàn bộ điểm về 0 không?");
    
    if (confirmAction) {
        // 2. Đặt điểm về 0 trong bộ nhớ
        localStorage.setItem('nihongoScore', 0);
        
        // 3. Thông báo
        alert("Đã xóa điểm thành công! Cày lại từ đầu nhé! 🐰");
        
        // 4. Tải lại bảng xếp hạng để cập nhật giao diện ngay lập tức
        openLeaderboard();
    }
}

/* =========================================
   3. LOGIC TÌM KIẾM THÔNG MINH
   ========================================= */

// Hàm xóa dấu Tiếng Việt (Để tìm kiếm không dấu)
function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.toString().toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str;
}

// Hàm tính điểm độ khớp (Scoring)
function calculateScore(sourceText, keyword) {
    if (!sourceText) return 0;
    
    const text = sourceText.toString().toLowerCase();
    const textNoTone = removeVietnameseTones(text);
    const key = keyword.toLowerCase();
    const keyNoTone = removeVietnameseTones(key);

    // 1. Khớp tuyệt đối (100đ) - VD: "mèo" == "mèo"
    if (text === key) return 100;
    
    // 2. Bắt đầu bằng (80đ) - VD: "mèo" startsWith "mè"
    if (text.startsWith(key)) return 80;
    
    // 3. Chứa từ khóa (60đ) - VD: "con mèo" includes "mèo"
    if (text.includes(key)) return 60;
    
    // 4. Khớp không dấu (50đ) - VD: "cái bàn" == "cai ban"
    if (textNoTone === keyNoTone) return 50;
    
    // 5. Chứa không dấu (40đ) - VD: "cái bàn" includes "ban"
    if (textNoTone.includes(keyNoTone)) return 40;

    return 0;
}

// Hàm khởi tạo sự kiện tìm kiếm
function initSearchFeature() {
    const searchInput = document.getElementById('globalSearch');
    const resultBox = document.getElementById('searchResults');
    const clearBtn = document.querySelector('.clear-icon');

    if(!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const keyword = e.target.value.trim();

        // Ẩn/Hiện nút X
        if(clearBtn) clearBtn.style.display = keyword.length > 0 ? 'block' : 'none';

        if (keyword.length < 1) {
            resultBox.style.display = 'none';
            return;
        }

        let results = [];

        // --- A. TÌM TRONG MINNA ---
        if (minnaData) {
            Object.keys(minnaData).forEach(lesson => {
                minnaData[lesson].forEach(w => {
                    // Tìm trong: Romaji, Nghĩa Việt, Kanji
                    let score = Math.max(
                        calculateScore(w.r, keyword), 
                        calculateScore(w.m, keyword), 
                        calculateScore(w.k, keyword)
                    );
                    if (score > 0) {
                        results.push({ 
                            type: 'vocab', score, 
                            jp: w.k ? `${w.k} (${w.r})` : w.r, 
                            vn: w.m, 
                            src: `Minna Bài ${lesson}`, 
                            speak: w.r 
                        });
                    }
                });
            });
        }

        // --- B. TÌM TRONG KANJI ---
        if (Array.isArray(n5KanjiData)) {
            n5KanjiData.forEach(k => {
                // Tìm trong: Chữ Hán, Hán Việt, Nghĩa, On, Kun
                let score = Math.max(
                    calculateScore(k.c, keyword), 
                    calculateScore(k.h, keyword), 
                    calculateScore(k.m, keyword),
                    calculateScore(k.on, keyword), 
                    calculateScore(k.kun, keyword)
                );
                if (score > 0) {
                    results.push({ 
                        type: 'kanji', score, 
                        jp: k.c, 
                        vn: `${k.h} - ${k.m}`, 
                        src: `On: ${k.on} | Kun: ${k.kun}`, 
                        speak: k.kun !== '-' ? k.kun : k.on 
                    });
                }
            });
        }

        // --- C. TÌM TRONG CHỦ ĐỀ (SABAI) ---
        if (extraData) {
            Object.keys(extraData).forEach(topic => {
                extraData[topic].forEach(w => {
                    let score = Math.max(
                        calculateScore(w.r, keyword), 
                        calculateScore(w.m, keyword), 
                        calculateScore(w.k, keyword)
                    );
                    if (score > 0) {
                        results.push({ 
                            type: 'vocab', score, 
                            jp: w.k ? `${w.k} (${w.r})` : w.r, 
                            vn: w.m, 
                            src: `Chủ đề: ${topic}`, 
                            speak: w.r 
                        });
                    }
                });
            });
        }

        // --- D. TÌM TRONG NGỮ PHÁP ---
        if (grammarData) {
            Object.keys(grammarData).forEach(lesson => {
                grammarData[lesson].forEach(g => {
                    let score = Math.max(
                        calculateScore(g.title, keyword), 
                        calculateScore(g.mean, keyword)
                    );
                    if (score > 0) {
                        results.push({ 
                            type: 'grammar', score, 
                            jp: g.title, 
                            vn: g.mean, 
                            src: `Ngữ pháp Bài ${lesson}`, 
                            speak: '' 
                        });
                    }
                });
            });
        }

        // Sắp xếp: Điểm cao lên đầu -> Từ ngắn lên đầu
        results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.jp.length - b.jp.length;
        });

        renderSearchResults(results, resultBox);
    });
}

// Hàm hiển thị kết quả ra màn hình
function renderSearchResults(results, container) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.style.display = 'block';
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999">Không tìm thấy kết quả 😢</div>';
        return;
    }

    // Lấy 10 kết quả đầu
    results.slice(0, 10).forEach(item => {
        let tagClass = 'tag-vocab';
        let tagName = 'Từ vựng';
        if (item.type === 'kanji') { tagClass = 'tag-kanji'; tagName = 'Kanji'; }
        if (item.type === 'grammar') { tagClass = 'tag-grammar'; tagName = 'Ngữ pháp'; }

        const div = document.createElement('div');
        div.className = 'result-item';
        div.onclick = () => { if(item.speak && typeof speak === 'function') speak(item.speak); };
        
        div.innerHTML = `
            <div class="result-tag ${tagClass}">${tagName}</div>
            <div style="flex:1">
                <div style="font-weight:bold; color:var(--text); font-size:1rem;">${item.jp}</div>
                <div style="font-size:0.9rem; color:var(--text); margin-top:2px;">
                    ${item.vn} 
                    <span style="font-size:0.75rem; color:var(--text); margin-left:5px;">(${item.src})</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    container.style.display = 'block';
}

// Hàm xóa tìm kiếm
function clearSearch() {
    const input = document.getElementById('globalSearch');
    const box = document.getElementById('searchResults');
    const btn = document.querySelector('.clear-icon');
    if(input) input.value = '';
    if(box) box.style.display = 'none';
    if(btn) btn.style.display = 'none';
}

// Ẩn kết quả khi click ra ngoài
window.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        const box = document.getElementById('searchResults');
        if(box) box.style.display = 'none';
    }
});

/* =========================================
   CHỨC NĂNG DARK MODE (TỐI ƯU & CHÍNH XÁC)
   ========================================= */

// 1. Hàm Bật/Tắt chế độ tối (Gán vào nút bấm)
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggle');
    
    // Nếu không tìm thấy nút thì dừng (tránh lỗi)
    if (!btn) return;

    const icon = btn.querySelector('i');

    // Thêm hoặc xóa class 'dark-mode'
    body.classList.toggle('dark-mode');

    // Kiểm tra trạng thái hiện tại để lưu và đổi icon
    if (body.classList.contains('dark-mode')) {
        // Đang ở chế độ Tối
        localStorage.setItem('theme', 'dark'); // Lưu vào bộ nhớ
        if(icon) icon.className = 'fas fa-sun'; // Đổi thành mặt trời
    } else {
        // Đang ở chế độ Sáng
        localStorage.setItem('theme', 'light'); // Lưu vào bộ nhớ
        if(icon) icon.className = 'fas fa-moon'; // Đổi về mặt trăng
    }
}

// 2. Hàm Khởi tạo (Chạy 1 lần khi load web)
function initTheme() {
    const savedTheme = localStorage.getItem('theme'); // Lấy chế độ đã lưu
    const btn = document.getElementById('themeToggle');
    
    // Nếu người dùng trước đó chọn Dark Mode
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode'); // Bật chế độ tối lên
        
        // Cập nhật icon thành mặt trời
        if (btn) {
            const icon = btn.querySelector('i');
            if(icon) icon.className = 'fas fa-sun';
        }
    }
}

/* =========================================
   CHỨC NĂNG: PHÒNG LUYỆN VIẾT (CHUẨN NHẬT - DMAK.JS)
   ========================================= */

// 1. Mở màn hình luyện viết (Giữ nguyên logic của bạn)
function openWritingSection() {
    const mainMenu = document.getElementById('mainMenu');
    const heroSection = document.getElementById('heroSection');
    if (mainMenu) mainMenu.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const section = document.getElementById('writingSection');
    if(section) {
        section.style.display = 'block';
        // Animation hiện ra
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        setTimeout(() => {
            section.style.transition = 'all 0.5s ease';
            section.style.opacity = 1;
            section.style.transform = 'translateY(0)';
        }, 10);
        
        // Focus ô nhập
        setTimeout(() => document.getElementById('inputChar').focus(), 100);
    }
}

/* =========================================
   CHỨC NĂNG: LUYỆN VIẾT (VIVUS + VẼ TAY CANVAS)
   ========================================= */

let vivusInstance = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Hàm chuyển đổi ký tự
function charToHex(char) {
    let code = char.charCodeAt(0).toString(16).toLowerCase();
    while (code.length < 5) code = "0" + code;
    return code;
}

// Hàm khởi tạo sự kiện vẽ cho Canvas
function setupCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    
    // Cấu hình nét vẽ của người dùng
    ctx.strokeStyle = "#ff9a9e"; // Màu vẽ (Hồng)
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 8; // Độ dày nét vẽ

    // Xử lý vẽ chuột (PC)
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    canvas.addEventListener('mousemove', (e) => draw(e, ctx, canvas));
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Xử lý vẽ cảm ứng (Mobile)
    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
        e.preventDefault(); // Chặn cuộn trang
    });
    canvas.addEventListener('touchmove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        drawTouch(touchX, touchY, ctx);
        e.preventDefault();
    });
    canvas.addEventListener('touchend', () => isDrawing = false);
}

// Hàm vẽ chính
function draw(e, ctx, canvas) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function drawTouch(x, y, ctx) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
}

// Hàm xóa bảng vẽ tay
function clearCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- LOGIC CHÍNH ---

function loadCharToPractice() {
    // Gọi setup canvas ngay lần đầu
    setupCanvas();
    clearCanvas(); // Xóa nét vẽ cũ
    const canvas = document.getElementById('drawing-canvas').style.display = 'none'; // Ẩn canvas lúc mới tải
    const input = document.getElementById('inputChar').value.trim();
    const target = document.getElementById('practice-target');
    const status = document.getElementById('practiceStatus');
    
    if (!input) return;

    let char = input.charAt(0);

    // Sửa lỗi số Latin -> Kanji
    const numToKanji = {'0':'零', '1':'一', '2':'二', '3':'三', '4':'四', '5':'五', '6':'六', '7':'七', '8':'八', '9':'九', '10':'十'};
    if (numToKanji[char]) {
        char = numToKanji[char];
        document.getElementById('inputChar').value = char;
    }

    if (/[a-zA-Z]/.test(char)) {
        status.innerText = "Vui lòng nhập Kanji/Kana (Ví dụ: あ, 愛)";
        return;
    }

    const hexCode = charToHex(char);
    target.innerHTML = ''; 
    vivusInstance = null;
    status.innerText = "Đang tải...";

    const svgUrl = `https://kanjivg.tagaini.net/kanjivg/kanji/${hexCode}.svg`;

    fetch(svgUrl)
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(svgData => {
            // Xử lý SVG
            const div = document.createElement('div');
            div.innerHTML = svgData;
            const svg = div.querySelector('svg');
            
            svg.setAttribute('id', 'kanji-svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            
            // Làm mờ nét gốc để làm mẫu tô
            const paths = svg.querySelectorAll('path');
            paths.forEach(p => {
                p.style.fill = 'none';
                p.style.stroke = 'var(--write1)'; // Màu xám nhạt làm nền
                p.style.strokeWidth = '3px'; 
                p.style.strokeLinecap = 'round';
                p.style.strokeLinejoin = 'round';
            });

            // Ẩn số thứ tự cho đỡ rối khi vẽ
            const texts = svg.querySelectorAll('text');
            texts.forEach(t => t.style.display = 'none');

            target.appendChild(svg);
            status.innerText = "Sẵn sàng!";
            status.style.color = "var(--green, green)";

            // Animation ban đầu
            runVivusAnimation();
        })
        .catch(err => {
            status.innerText = "Không tìm thấy dữ liệu.";
            console.error(err);
        });
}

function runVivusAnimation() {
    vivusInstance = new Vivus('kanji-svg', {
        type: 'oneByOne',
        duration: 150,
        start: 'autostart',
        animTimingFunction: Vivus.EASE,
        selfDestroy: false 
    }, function() {
        // Sau khi chạy xong mẫu, làm mờ đi để người dùng tô đè lên
        const svg = document.getElementById('kanji-svg');
        const paths = svg.querySelectorAll('path');
        paths.forEach(p => {
            p.style.stroke = 'var(--write2)'; // Màu rất nhạt
            p.style.transition = 'stroke 0.5s';
        });
    });
}

// 3. Nút chức năng
function practiceAnimate() {
    clearCanvas(); // Xóa nét vẽ tay của người dùng để xem mẫu
    const canvas = document.getElementById('drawing-canvas').style.display = 'none'; // Ẩn canvas khi xem mẫu
    const status = document.getElementById('practiceStatus');
    if (vivusInstance) {
        // Reset màu về đậm để nhìn rõ
        const svg = document.getElementById('kanji-svg');
        const paths = svg.querySelectorAll('path');
        paths.forEach(p => p.style.stroke = 'var(--write1)'); // Màu đậm lại
        
        vivusInstance.reset().play();
        status.innerText = "Cùng xem mẫu nhé!";
    }
}

function practiceQuiz() {
    // Chế độ tự viết: Xóa canvas, reset màu nền SVG về mờ
    clearCanvas();
    document.getElementById('drawing-canvas').style.display = 'block'; // Hiện canvas để vẽ
    const svg = document.getElementById('kanji-svg');
    if (svg) {
        const paths = svg.querySelectorAll('path');
        paths.forEach(p => p.style.stroke = 'var(--write2)'); // Nét mờ
        vivusInstance.finish(); // Dừng chạy
    }
    document.getElementById('practiceStatus').innerText = "Bắt đầu viết thôi!";
}

// Gắn hàm xóa vào nút Xóa luôn
// (Bạn gán onclick="loadCharToPractice()" ở nút xóa trong HTML cũng được, nó sẽ reset lại từ đầu)

function getFormattedData(category) {
    let list = [];

    if (category === 'hiragana') {
        // Lấy values từ Object hiragana
        list = Object.values(charMaps.hiragana).map(char => ({ char: char, mean: '' }));
    } 
    else if (category === 'katakana') {
        // Lấy values từ Object katakana
        list = Object.values(charMaps.katakana).map(char => ({ char: char, mean: '' }));
    } 
    else if (category === 'kanji') {
        // Map mảng Kanji: lấy thuộc tính 'c' và 'm'
        list = n5KanjiData.map(item => ({ char: item.c, mean: item.m }));
    } 
    else if (category === 'vocab') {
        // Gộp tất cả các bài học (Key 1, 2...) thành 1 mảng duy nhất
        Object.values(minnaData).forEach(lesson => {
            lesson.forEach(word => {
                list.push({ char: word.k, mean: word.m });
            });
        });
    }

    return list;
}

// Hàm chuyển Tab và Render
function switchTab(category) {
    // 1. Highlight nút Tab active
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick').includes(category)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Lấy dữ liệu và Render
    const container = document.getElementById('suggestion-content');
    container.innerHTML = ''; // Xóa cũ

    const dataList = getFormattedData(category);

    if (dataList.length === 0) {
        container.innerHTML = '<p style="color:#999; width:100%; text-align:center;">Chưa có dữ liệu</p>';
        return;
    }

    dataList.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'chip-btn';
        
        // Hiển thị chữ
        btn.innerText = item.char;
        
        // Nếu có nghĩa (Kanji/Vocab), hiện tooltip khi di chuột
        if (item.mean) {
            btn.setAttribute('title', item.mean);
        }

        // Sự kiện Click
        btn.onclick = () => {
            // Đưa vào ô input
            document.getElementById('inputChar').value = item.char;
            
            // Gọi hàm vẽ (Hàm loadCharToPractice ở bước trước)
            loadCharToPractice();

            // Hiển thị nghĩa lên dòng trạng thái (UX tốt hơn)
            if (item.mean) {
                const status = document.getElementById('practiceStatus');
                status.innerText = `Đang tập: ${item.char} (${item.mean})`;
                status.style.color = "var(--primary, #6c5ce7)";
            }
        };

        container.appendChild(btn);
    });
}


// Xử lý khi nhấn Enter trong ô input
const inputEl = document.getElementById('inputChar');
if (inputEl) {
    inputEl.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            loadCharToPractice();
        }
    });
}

/* =========================================
   LOGIC GAME GÕ TỪ VỰNG (WRITING MODE) - MIXED
   ========================================= */

let wList = [];
let wIndex = 0;
let wScore = 0;

// 1. Khởi tạo Game (Gọi khi chuyển Tab hoặc đổi Dropdown)
function initWritingGame() {
    const deckSelect = document.getElementById('writingDeck');
    // Nếu chưa có html dropdown thì return để tránh lỗi
    if (!deckSelect) return; 

    const deckValue = deckSelect.value; // Ví dụ: "minna_1"
    let selectedData = [];

    // Lấy dữ liệu từ biến minnaData (hoặc minnaData tùy cách bạn đặt tên biến)
    // Giả sử biến toàn cục chứa dữ liệu là minnaData
    if (typeof minnaData !== 'undefined') {
        if (deckValue.startsWith('minna_')) {
            const lessonId = deckValue.split('_')[1];
            if (minnaData[lessonId]) selectedData = minnaData[lessonId];
        } 
        else if (deckValue.startsWith('extra_') && minnaData[deckValue]) {
             selectedData = minnaData[deckValue];
        }
    }

    if (!selectedData || selectedData.length === 0) {
        // Fallback nếu chưa load được data
        const displayEl = document.getElementById('w-meaning') || document.getElementById('w-question-text');
        if(displayEl) displayEl.innerText = "Vui lòng chọn bài khác hoặc kiểm tra dữ liệu.";
        return;
    }

    // --- LOGIC MỚI: Random dạng câu hỏi ---
    wList = selectedData.map(item => {
        // Random 50/50
        // qType 0: Nhìn Việt -> Gõ Nhật (Logic cũ)
        // qType 1: Nhìn Nhật -> Gõ Việt (Logic mới)
        const type = Math.random() > 0.5 ? 1 : 0;
        return { ...item, qType: type };
    });

    // Xáo trộn danh sách
    wList.sort(() => Math.random() - 0.5);
    
    // Reset chỉ số
    wIndex = 0;
    wScore = 0;

    // Update UI điểm
    const totalEl = document.getElementById('w-total');
    const scoreEl = document.getElementById('w-score');
    if(totalEl) totalEl.innerText = wList.length;
    if(scoreEl) scoreEl.innerText = "0";

    renderWritingQuestion();
}

// 2. Hiển thị câu hỏi
function renderWritingQuestion() {
    // Kiểm tra hoàn thành
    if (wIndex >= wList.length) {
        alert(`Chúc mừng! Bạn hoàn thành bài luyện tập.\nĐiểm số: ${wScore}`);
        initWritingGame(); // Reset lại từ đầu
        return;
    }

    const item = wList[wIndex];

    // Lấy các element giao diện
    const mainTextEl = document.getElementById('w-meaning'); // Dùng làm text chính
    const subHintEl = document.getElementById('w-kanji');    // Dùng làm gợi ý
    const inputEl = document.getElementById('w-input');
    
    // Tìm label (nếu có trong HTML) để đổi chữ "Ý NGHĨA" <-> "TỪ VỰNG"
    const labelEl = document.querySelector('.w-label') || document.getElementById('w-label-text');

    // Reset Input
    document.getElementById('w-current').innerText = wIndex + 1;
    inputEl.value = '';
    inputEl.className = 'w-input'; // Hoặc class CSS input của bạn
    inputEl.disabled = false;
    inputEl.focus();

    // Reset Nút & Feedback
    const feedbackEl = document.getElementById('w-feedback');
    if(feedbackEl) feedbackEl.innerHTML = '';
    
    document.getElementById('w-btn-check').style.display = 'inline-block';
    document.getElementById('w-btn-next').style.display = 'none';

    // --- XỬ LÝ HIỂN THỊ THEO DẠNG BÀI ---
    if (item.qType === 0) {
        // === DẠNG 0: VIỆT -> NHẬT (Logic cũ) ===
        if(labelEl) labelEl.innerText = "Ý NGHĨA";
        mainTextEl.innerText = item.m; // Hiện nghĩa Tiếng Việt
        inputEl.placeholder = "Nhập Hiragana...";

        // Hiện Kanji làm gợi ý (nếu có)
        if (item.k && item.k !== item.r) {
            subHintEl.innerText = item.k;
            subHintEl.style.display = 'block';
        } else {
            subHintEl.style.display = 'none';
        }

    } else {
        // === DẠNG 1: NHẬT -> VIỆT (Logic mới) ===
        if(labelEl) labelEl.innerText = "TỪ VỰNG";
        
        // Ưu tiên hiện Kanji to, không có thì hiện Hiragana
        if (item.k && item.k !== "") {
            mainTextEl.innerText = item.k;
            // Gợi ý cách đọc Hiragana để người dùng dễ đoán nghĩa
            subHintEl.innerText = item.r;
            subHintEl.style.display = 'block';
        } else {
            mainTextEl.innerText = item.r;
            subHintEl.style.display = 'none';
        }

        inputEl.placeholder = "Nhập nghĩa Tiếng Việt...";
    }

    // Xử lý phím Enter
    inputEl.onkeydown = function(e) {
        if (e.key === 'Enter') {
            if (document.getElementById('w-btn-check').style.display !== 'none') {
                checkWritingAnswer();
            } else {
                nextWritingQuestion();
            }
        }
    };
}

/* =========================================
   HÀM XỬ LÝ SO SÁNH TIẾNG VIỆT (SIÊU CẤP)
   ========================================= */

function cleanString(str) {
    if (!str) return "";
    return str.toString()
        .toLowerCase()              // 1. Chuyển thành chữ thường
        .normalize('NFC')           // 2. Chuẩn hóa Unicode (sửa lỗi font)
        .replace(/\(.*?\)/g, "")    // 3. Xóa nội dung trong ngoặc đơn (giải thích)
        .replace(/\[.*?\]/g, "")    // 4. Xóa nội dung trong ngoặc vuông
        .replace(/[.,!?:;"]/g, "")  // 5. Xóa dấu câu thừa (chấm, phẩy, chấm than...)
        .replace(/\s+/g, " ")       // 6. Gộp nhiều dấu cách thành 1
        .trim();                    // 7. Cắt khoảng trắng 2 đầu
}

function isVietnameseCorrect(userVal, dbVal) {
    // Bước 1: Chuẩn hóa Input của người chơi
    const userClean = cleanString(userVal);

    // Bước 2: Tách đáp án trong Database ra thành nhiều câu (nếu có)
    // Ví dụ data: "Bạn / Anh / Chị" -> Tách thành ["Bạn", "Anh", "Chị"]
    // Tách dựa trên: dấu gạch chéo (/), dấu phẩy (,), dấu chấm phẩy (;)
    const rawAnswers = dbVal.split(/[\/;,、]+/);
    
    // Bước 3: Chuẩn hóa từng đáp án trong Database
    const possibleAnswers = rawAnswers.map(ans => cleanString(ans)).filter(a => a.length > 0);

    // --- DEBUG: In ra Console để kiểm tra ---
    console.log(`%c[CHECK]`, "color: blue; font-weight: bold;");
    console.log(`- Bạn nhập (đã xử lý): "${userClean}"`);
    console.log(`- Đáp án gốc: "${dbVal}"`);
    console.log(`- Các đáp án chấp nhận:`, possibleAnswers);

    // Bước 4: So sánh
    // Chỉ cần input của bạn TRÙNG KHỚP với 1 trong các đáp án
    const isMatch = possibleAnswers.includes(userClean);
    
    if (!isMatch) {
        console.log(`%c=> KẾT QUẢ: SAI`, "color: red");
    } else {
        console.log(`%c=> KẾT QUẢ: ĐÚNG`, "color: green");
    }

    return isMatch;
}

/* =========================================
   HÀM CHECK ANSWER CHÍNH
   ========================================= */

function checkWritingAnswer() {
    const inputEl = document.getElementById('w-input');
    const feedbackEl = document.getElementById('w-feedback');
    const item = wList[wIndex];
    const userVal = inputEl.value; // Lấy nguyên gốc
    
    let isCorrect = false;
    let correctTextDisplay = "";

    if (item.qType === 0) {
        // --- DẠNG 0: VIỆT -> NHẬT (Hiragana) ---
        // Hiragana chỉ cần trim và xóa khoảng trắng là đủ
        if (userVal.trim().replace(/\s/g, '') === item.r.replace(/\s/g, '')) {
            isCorrect = true;
        }
        correctTextDisplay = item.r; 
    } else {
        // --- DẠNG 1: NHẬT -> VIỆT ---
        // Sử dụng hàm so sánh xịn ở trên
        if (userVal.trim() !== "" && isVietnameseCorrect(userVal, item.m)) {
            isCorrect = true;
        }
        
        // Hiển thị đáp án đẹp (lấy từ đầu tiên, bỏ phần ngoặc)
        // Ví dụ: "Vị kia (lịch sự)" -> Hiển thị "Vị kia"
        correctTextDisplay = item.m.split(/[\/;,]/)[0].replace(/\(.*?\)/g, "").trim();
    }

    // --- HIỂN THỊ KẾT QUẢ ---
    if (isCorrect) {
        inputEl.classList.add('correct');
        inputEl.classList.remove('wrong');
        feedbackEl.innerHTML = `<span style="color:#27ae60; font-weight:bold"><i class="fas fa-check"></i> Chính xác!</span>`;
        
        wScore += 10;
        document.getElementById('w-score').innerText = wScore;
    } else {
        inputEl.classList.add('wrong');
        inputEl.classList.remove('correct');
        // Khi sai hiển thị đáp án
        feedbackEl.innerHTML = `<span style="color:#e74c3c; font-weight:bold">Sai rồi! Đáp án: ${correctTextDisplay}</span>`;
    }

    // Khóa ô nhập và hiện nút Next
    inputEl.disabled = true;
    document.getElementById('w-btn-check').style.display = 'none';
    
    const nextBtn = document.getElementById('w-btn-next');
    nextBtn.style.display = 'inline-block';
    nextBtn.focus(); 
}

// 4. Qua câu tiếp theo
function nextWritingQuestion() {
    wIndex++;
    renderWritingQuestion();
}

// Hàm mở Section Tools
function openTools() {
    // Ẩn các section khác (nếu đang mở)
    const mainMenu = document.getElementById('mainMenu');
    const heroSection = document.getElementById('heroSection');
    if (mainMenu) mainMenu.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    // Hiện section Tools
    document.getElementById('toolsSection').style.display = 'block';
}

// Hàm đóng Tools (quay về trang chủ hoặc ẩn đi)
function closeTools() {
    document.getElementById('toolsSection').style.display = 'none';
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    document.getElementById('mainMenu').style.display = 'grid';
    document.getElementById('heroSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}