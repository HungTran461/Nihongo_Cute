// Dữ liệu database nội bộ 1 ô = 1 Kanji
const localDatabase = {
  "lessons_config": [
    { "key": "bai_8", "title": "Bài Học 8", "subtitle": "Trường Học & Con Người", "icon": "🏫", "color_theme": "card-pink" },
    { "key": "bai_9", "title": "Bài Học 9", "subtitle": "Đồ Ăn & Mua Sắm", "icon": "🍡", "color_theme": "card-blue" },
    { "key": "bai_10", "title": "Bài Học 10", "subtitle": "Vị Trí & Tồn Tại", "icon": "⛩️", "color_theme": "card-purple" }
  ],
  "lessons_data": {
    "bai_8": [
      { "id": "m8_1", "prompt_text": "学 ＿", "accepted_answers": { "生": { "full_word": "学生", "han_viet": "HỌC SINH", "kana": "がくせい", "meaning": "Học sinh, sinh viên" }, "校": { "full_word": "学校", "han_viet": "HỌC HIỆU", "kana": "がっこう", "meaning": "Trường học" } } },
      { "id": "m8_2", "prompt_text": "＿ 人", "accepted_answers": { "大": { "full_word": "大人", "han_viet": "ĐẠI NHÂN", "kana": "おとな", "meaning": "Người lớn" }, "日": { "full_word": "日本人", "han_viet": "NHẬT BẢN NHÂN", "kana": "にほんじん", "meaning": "Người Nhật" } } },
      { "id": "m8_3", "prompt_text": "先 ＿", "accepted_answers": { "生": { "full_word": "先生", "han_viet": "TIÊN SINH", "kana": "せんせい", "meaning": "Thầy cô giáo, bác sĩ" } } }
    ],
    "bai_9": [
      { "id": "m9_1", "prompt_text": "＿ べ物", "accepted_answers": { "食": { "full_word": "食べ物", "han_viet": "THỰC VẬT", "kana": "たべもの", "meaning": "Đồ ăn, thức ăn" } } },
      { "id": "m9_2", "prompt_text": "＿ み物", "accepted_answers": { "飲": { "full_word": "飲み物", "han_viet": "ẨM VẬT", "kana": "のみもの", "meaning": "Đồ uống, thức uống" } } },
      { "id": "m9_3", "prompt_text": "＿ い物", "accepted_answers": { "買": { "full_word": "買い物", "han_viet": "MÃI VẬT", "kana": "かいもの", "meaning": "Mua sắm" } } }
    ],
    "bai_10": [
      { "id": "m10_1", "prompt_text": "＿ 所", "accepted_answers": { "事": { "full_word": "事務所", "han_viet": "SỰ VỤ SỞ", "kana": "じむしょ", "meaning": "Văn phòng làm việc" }, "台": { "full_word": "台所", "han_viet": "THAI SỞ", "kana": "だいどころ", "meaning": "Nhà bếp" } } }
    ]
  }
};

// TỪ ĐIỂN HÁN VIỆT HỖ TRỢ HIỂN THỊ TRONG MA TRẬN KANJI
const kanjiHanVietDict = {
    // Các chữ bài học
    "生": "Sinh", "校": "Hiệu", "大": "Đại", "日": "Nhật", "先": "Tiên", "本": "Bản", "常": "Thường", "進": "Tiến",
    "事": "Sự", "台": "Thai", "近": "Cận", "棚": "Bằng", "当": "Đương", "子": "Tử", "人": "Nhân", "前": "Tiền",
    "作": "Tác", "食": "Thực", "飲": "Ẩm", "買": "Mãi", "学": "Học", "所": "Sở", "物": "Vật",
    
    // Các chữ mồi nhử (Filler) bổ sung đầy đủ
    "車": "Xa", "行": "Hành", "来": "Lai", "休": "Hưu", "何": "Hà", "中": "Trung", "国": "Quốc", 
    "見": "Kiến", "出": "Xuất", "入": "Nhập", "友": "Hữu", "男": "Nam", "女": "Nữ", "父": "Phụ", 
    "母": "Mẫu", "年": "Niên", "月": "Nguyệt", "火": "Hỏa", "水": "Thủy", "木": "Mộc", "金": "Kim", "土": "Thổ"
};

// --- QUẢN LÝ TÀI KHOẢN (VÍ XU LOCAL STORAGE) ---
// Đọc tiền từ hệ thống Nihongo Cute lưu trữ chung (Nếu chưa có thì gán = 0)
let globalCoins = parseInt(localStorage.getItem('nihongo_cute_coins')) || 0;

function saveAndSyncCoins() {
    localStorage.setItem('nihongo_cute_coins', globalCoins);
    
    // Cập nhật cả Màn hình ngoài trang chủ lẫn Trong trận
    const homeTotalCoins = document.getElementById("homeTotalCoins");
    if(homeTotalCoins) homeTotalCoins.textContent = globalCoins;

    const gameScoreText = document.getElementById("scoreText");
    if(gameScoreText) gameScoreText.textContent = globalCoins;
}


// --- CORE TRÒ CHƠI ---
let gameData = localDatabase;
let currentLesson = "bai_8"; 
let questionsQueue = [];
let currentQuestionIndex = 0;
let streak = 0;
let lives = 3;
let isAnswered = false;

let isDeleteWrongUsed = false;
let isShowMeaningUsed = false;

window.onload = function() {
    saveAndSyncCoins(); // Đồng bộ tiền ngay khi trang tải xong

    fetch('data/kanji_data_matrix.json')
        .then(res => res.json())
        .then(data => { 
            gameData = data; 
            renderLessonDashboard();
        })
        .catch(() => { 
            gameData = localDatabase;
            renderLessonDashboard();
        });
};

function renderLessonDashboard() {
    const gridContainer = document.getElementById("lessonGridHome");
    if (!gridContainer) return;
    gridContainer.innerHTML = ""; 

    const configArray = gameData.lessons_config || [];
    if(configArray.length > 0) currentLesson = configArray[0].key;

    configArray.forEach((lesson) => {
        const isActiveClass = (lesson.key === currentLesson) ? "active" : "";
        const cardElement = document.createElement("div");
        cardElement.className = `lesson-card ${lesson.color_theme} ${isActiveClass}`;
        cardElement.id = `card_${lesson.key}`;
        cardElement.innerHTML = `
            <div class="lesson-icon">${lesson.icon}</div>
            <div class="lesson-info">
                <h4>${lesson.title}</h4>
                <p>${lesson.subtitle}</p>
            </div>
            <div class="select-indicator"><i class="fas fa-check-circle"></i></div>
        `;
        cardElement.onclick = function() { selectLessonHome(lesson.key); };
        gridContainer.appendChild(cardElement);
    });
}

function selectLessonHome(lessonKey) {
    currentLesson = lessonKey;
    document.querySelectorAll('.lesson-card').forEach(card => card.classList.remove('active'));
    const selectedCard = document.getElementById(`card_${lessonKey}`);
    if (selectedCard) selectedCard.classList.add('active');
}

function showView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function launchGame() {
    showView('gameView');
    const currentConfig = gameData.lessons_config.find(l => l.key === currentLesson);
    document.getElementById("gameLessonTitle").textContent = currentConfig ? currentConfig.title.toUpperCase() : "GAMEPLAY";
    initGame();
}

function initGame() {
    streak = 0;
    lives = 3;
    saveAndSyncCoins(); // Đồng bộ hiển thị lại Xu
    document.getElementById("streakText").textContent = streak;
    updateHeartsUI();
    document.getElementById("gameModal").classList.remove("active");

    const originalQuestions = gameData.lessons_data[currentLesson] || [];
    if(originalQuestions.length === 0) {
        alert("Dữ liệu trống!");
        backToHome();
        return;
    }
    
    questionsQueue = shuffleArray([...originalQuestions]);
    currentQuestionIndex = 0;
    loadQuestion();
}

function loadQuestion() {
    isAnswered = false;
    
    // Reset bùa
    isDeleteWrongUsed = false;
    isShowMeaningUsed = false;
    document.getElementById("btnDeleteWrong").disabled = false;
    document.getElementById("btnShowMeaning").disabled = false;
    document.getElementById("boosterHintDisplay").style.display = "none";

    document.getElementById("detailsBox").style.display = "none";
    document.getElementById("promptCard").className = "prompt-card";
    document.getElementById("matrixGrid").className = "matrix-grid";

    if (currentQuestionIndex >= questionsQueue.length) {
        showEndGameModal(true);
        return;
    }

    document.getElementById("questionIndexBadge").textContent = `Câu hỏi ${currentQuestionIndex + 1} / ${questionsQueue.length}`;
    const currentQuestion = questionsQueue[currentQuestionIndex];
    document.getElementById("promptText").textContent = currentQuestion.prompt_text;

    generateMatrixGrid(currentQuestion);
}

function generateMatrixGrid(question) {
    const gridContainer = document.getElementById("matrixGrid");
    gridContainer.innerHTML = "";

    const correctAnswers = Object.keys(question.accepted_answers);
    let poolOfWords = new Set();
    
    // Lấy các chữ từ bài học hiện tại để làm mồi nhử trước
    const allQuestionsInLesson = gameData.lessons_data[currentLesson] || [];
    allQuestionsInLesson.forEach(q => {
        Object.keys(q.accepted_answers).forEach(ans => poolOfWords.add(ans));
        const cleanChar = q.prompt_text.replace("＿", "").replace("べ物","").replace("み物","").replace("い物","").trim();
        if(cleanChar) poolOfWords.add(cleanChar);
    });

    // Cập nhật danh sách mồi nhử dài hơn để đủ lấp 15 ô
    const fillerKanjis = ["車", "行", "来", "休", "何", "中", "国", "見", "出", "入", "友", "本", "男", "女", "父", "母", "年", "月", "火", "水", "木", "金", "土"];
    let fillerIdx = 0;
    
    // TĂNG LÊN 15 Ô (thay vì 9)
    while(poolOfWords.size < 15 && fillerIdx < fillerKanjis.length) {
        poolOfWords.add(fillerKanjis[fillerIdx]);
        fillerIdx++;
    }

    // Tách đáp án đúng ra khỏi pool
    correctAnswers.forEach(ans => poolOfWords.delete(ans));
    let distractorArray = shuffleArray(Array.from(poolOfWords));
    
    // Lấy đủ số lượng mồi nhử để tổng cộng là 15 ô
    const finalDistractors = distractorArray.slice(0, 15 - correctAnswers.length);

    let finalMatrixItems = shuffleArray([...correctAnswers, ...finalDistractors]);

    // Đổ dữ liệu ra thẻ HTML
    finalMatrixItems.forEach(char => {
        const hanVietValue = kanjiHanVietDict[char] || "Hán";
        const cardElement = document.createElement("div");
        cardElement.className = "matrix-card";
        cardElement.innerHTML = `<span class="card-kanji">${char}</span><span class="card-meaning">(${hanVietValue})</span>`;
        
        cardElement.onclick = function() {
            handleCardSelection(char, cardElement, question);
        };
        gridContainer.appendChild(cardElement);
    });
}

function handleCardSelection(selectedChar, cardElement, question) {
    if (isAnswered) return;

    if (question.accepted_answers[selectedChar]) {
        isAnswered = true;
        streak++;
        
        // Cộng trực tiếp Xu kiếm được vào Ví hệ thống
        let coinsEarned = (streak >= 3) ? 150 : 100;
        globalCoins += coinsEarned;
        saveAndSyncCoins();
        
        document.getElementById("streakText").textContent = streak;
        document.getElementById("promptCard").className = "prompt-card correct-animation";
        cardElement.classList.add("card-correct");
        document.getElementById("matrixGrid").className = "matrix-grid disabled-grid";
        document.getElementById("promptText").textContent = question.prompt_text.replace("＿", selectedChar);

        const detailsData = question.accepted_answers[selectedChar];
        document.getElementById("detailWord").textContent = detailsData.full_word;
        document.getElementById("detailHanViet").textContent = `(${detailsData.han_viet})`;
        document.getElementById("detailKana").textContent = detailsData.kana;
        document.getElementById("detailMeaning").textContent = detailsData.meaning;
        document.getElementById("detailsBox").style.display = "block";

    } else {
        streak = 0;
        document.getElementById("streakText").textContent = streak;
        lives--;
        updateHeartsUI();

        cardElement.classList.add("card-wrong");
        setTimeout(() => { cardElement.classList.remove("card-wrong"); }, 400);

        if (lives <= 0) {
            isAnswered = true;
            showEndGameModal(false);
        }
    }
}

// ==========================================
// QUẢN LÝ BÙA TRỢ GIÚP (TRỪ XU TRỰC TIẾP TỪ VÍ)
// ==========================================

function useDeleteWrongBooster() {
    if (isAnswered || isDeleteWrongUsed) return;
    
    if (globalCoins < 50) {
        alert("Ví của bạn không đủ! Cần có 50 Xu để dùng phép xóa ô sai.");
        return;
    }

    globalCoins -= 50;
    saveAndSyncCoins();
    
    isDeleteWrongUsed = true;
    document.getElementById("btnDeleteWrong").disabled = true;

    const currentQuestion = questionsQueue[currentQuestionIndex];
    const cards = document.querySelectorAll('.matrix-card');
    let wrongCards = [];

    cards.forEach(card => {
        const kanjiChar = card.querySelector('.card-kanji').textContent;
        if (!currentQuestion.accepted_answers[kanjiChar] && card.style.opacity !== '0.2') {
            wrongCards.push(card);
        }
    });

    wrongCards = shuffleArray(wrongCards);
    const countToRemove = Math.min(3, wrongCards.length);
    for (let i = 0; i < countToRemove; i++) {
        wrongCards[i].style.opacity = '0.2';
        wrongCards[i].style.pointerEvents = 'none';
    }
}

function useShowMeaningBooster() {
    if (isAnswered || isShowMeaningUsed) return;

    if (globalCoins < 80) {
        alert("Ví của bạn không đủ! Cần có 80 Xu để dùng Gợi ý nghĩa.");
        return;
    }

    globalCoins -= 80;
    saveAndSyncCoins();
    
    isShowMeaningUsed = true;
    document.getElementById("btnShowMeaning").disabled = true;

    const currentQuestion = questionsQueue[currentQuestionIndex];
    const firstKey = Object.keys(currentQuestion.accepted_answers)[0];
    const meaningHint = currentQuestion.accepted_answers[firstKey].meaning;

    const hintDisplay = document.getElementById("boosterHintDisplay");
    hintDisplay.querySelector('span').textContent = `Nghĩa của từ cần tìm: ${meaningHint}`;
    hintDisplay.style.display = "block";
}

function useReviveBooster() {
    if (globalCoins < 200) {
        alert("Bạn không đủ Xu để mua lại mạng!");
        return;
    }

    globalCoins -= 200;
    saveAndSyncCoins();
    
    lives = 1; 
    updateHeartsUI();

    document.getElementById("gameModal").classList.remove("active");
    isAnswered = false;
    document.getElementById("matrixGrid").classList.remove("disabled-grid");
}

// ==========================================

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function updateHeartsUI() {
    const container = document.getElementById("heartsContainer");
    let heartsHtml = "";
    for (let i = 0; i < 3; i++) {
        heartsHtml += (i < lives) ? '<i class="fas fa-heart" style="color:var(--cute-red)"></i> ' : '<i class="far fa-heart" style="color:#dcdcdc"></i> ';
    }
    container.innerHTML = heartsHtml;
}

function showEndGameModal(isWin) {
    const modal = document.getElementById("gameModal");
    const modalIcon = document.getElementById("modalIcon");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const btnRevive = document.getElementById("btnModalRevive");
    
    // In ra tổng Xu vào Modal
    document.getElementById("modalFinalScore").textContent = globalCoins;
    modal.classList.add("active");

    if (isWin) {
        modalIcon.innerHTML = '<i class="fas fa-trophy" style="color: var(--cute-yellow);"></i>';
        modalTitle.textContent = "THÀNH CÔNG!";
        modalMessage.textContent = "Tuyệt cú mèo! Bạn đã dọn sạch ma trận chữ Hán!";
        if(btnRevive) btnRevive.style.display = "none";
    } else {
        modalIcon.innerHTML = '<i class="fas fa-heart-broken" style="color: var(--cute-red);"></i>';
        modalTitle.textContent = "HẾT MẠNG RỒI!";
        modalMessage.textContent = "Đừng lo lắng, bạn có muốn dùng Xu để hồi sinh cứu cánh không?";
        if (btnRevive) {
            btnRevive.style.display = (globalCoins >= 200) ? "block" : "none";
        }
    }
}

function restartLesson() {
    initGame();
}

function backToHome() {
    document.getElementById("gameModal").classList.remove("active");
    saveAndSyncCoins(); // Chắc chắn đồng bộ tiền trước khi thoát về Home
    showView('homeView');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}