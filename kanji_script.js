/**
 * NIHONGO CUTE - ENGINE TRÒ CHƠI NẤC THANG KANJI THÔNG MINH
 * CHẾ ĐỘ: CHỌN SAI HOẶC HẾT GIỜ BỊ LOẠI NGAY LẬP TỨC (SUDDEN DEATH)
 * TÍNH NĂNG MỚI: XÓA STORAGE CACHE & GIẢ LẬP TIẾN TRÌNH ĐỂ TEST CHỨNG CHỈ
 */

let kanjiDb = {};
let gamePool = [];
let currentQuestion = null;

// Quản lý trạng thái GameState toàn cục
let state = {
    playerName: "Player",
    difficulty: "easy",
    totalSteps: 20,
    currentStep: 1,
    correctCount: 0,
    timeLimit: 15,
    timeLeft: 15,
    timerInterval: null,
    history: []
};

// Cấu hình tỷ lệ đạt danh hiệu xếp hạng tương ứng độ khó khi THẮNG GAME
const RANKS = {
    EASY: { threshold: 0.85, high: "R", low: "N" },
    MEDIUM: { threshold: 0.88, high: "SSR", low: "SR" },
    HARD: { threshold: 0.94, high: "UR", low: "SSR" }
};

document.addEventListener("DOMContentLoaded", () => {
    loadKanjiData();
});

// Tải dữ liệu từ file JSON cục bộ
async function loadKanjiData() {
    try {
        const response = await fetch('data/kanji_data.json');
        kanjiDb = await response.json();
        setupLessonDropdowns();
        loadFromStorage();
    } catch (error) {
        console.error("Không thể tải cơ sở dữ liệu Kanji JSON:", error);
    }
}

// Đổ dữ liệu vào các ô chọn bài học từ bài nào đến bài nào
function setupLessonDropdowns() {
    const startSelect = document.getElementById("startLesson");
    const endSelect = document.getElementById("endLesson");
    
    startSelect.innerHTML = "";
    endSelect.innerHTML = "";
    
    const lessons = Object.keys(kanjiDb).sort((a, b) => parseInt(a) - parseInt(b));
    
    lessons.forEach(l => {
        let opt1 = document.createElement("option");
        opt1.value = l; opt1.textContent = `Bài ${l}`;
        startSelect.appendChild(opt1);
        
        let opt2 = document.createElement("option");
        opt2.value = l; opt2.textContent = `Bài ${l}`;
        endSelect.appendChild(opt2);
    });
    
    if(lessons.length > 0) {
        endSelect.value = lessons[lessons.length - 1];
    }
}

function validateLessons() {
    const start = parseInt(document.getElementById("startLesson").value);
    const end = parseInt(document.getElementById("endLesson").value);
    if (start > end) {
        document.getElementById("endLesson").value = start.toString();
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.game-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    // Đổi trạng thái active ở thanh Nav Header để đồng bộ giao diện
    if (sectionId === 'setupScreen') {
        document.getElementById('nav-play').classList.add('active');
        document.getElementById('nav-dash').classList.remove('active');
    } else if (sectionId === 'dashboardScreen') {
        document.getElementById('nav-play').classList.remove('active');
        document.getElementById('nav-dash').classList.add('active');
    }
}

/**
 * KHỞI TẠO BẮT ĐẦU GAME VÀ THIẾT LẬP NẤC THANG
 */
function startGame() {
    const nameInput = document.getElementById("playerName").value.trim();
    state.playerName = nameInput || "Ninja Vô Danh";
    
    localStorage.setItem("nihongo_cute_saved_name", state.playerName);

    const diffEl = document.querySelector('input[name="difficulty"]:checked');
    state.difficulty = diffEl ? diffEl.value : "easy";
    
    if (state.difficulty === "easy") {
        state.totalSteps = 20; state.timeLimit = 15;
    } else if (state.difficulty === "medium") {
        state.totalSteps = 35; state.timeLimit = 12;
    } else {
        state.totalSteps = 50; state.timeLimit = 9;
    }
    
    state.currentStep = 1;
    state.correctCount = 0;
    
    const startL = parseInt(document.getElementById("startLesson").value);
    const endL = parseInt(document.getElementById("endLesson").value);
    
    gamePool = [];
    for (let l = startL; l <= endL; l++) {
        if (kanjiDb[l]) gamePool = gamePool.concat(kanjiDb[l]);
    }
    
    if (gamePool.length < 4) {
        alert("Kho từ vựng của dải bài học này quá ít! Hãy mở rộng dải bài.");
        return;
    }
    
    document.getElementById("displayPlayerName").textContent = state.playerName;
    document.getElementById("totalStepsDisplay").textContent = state.totalSteps;
    document.getElementById("correctCounter").textContent = "0";
    
    buildLadderUI();
    showSection("gameScreen");
    nextQuestion();
}

function buildLadderUI() {
    const wrapper = document.getElementById("ladderWrapper");
    wrapper.innerHTML = "";
    
    for (let i = 1; i <= state.totalSteps; i++) {
        let stepDiv = document.createElement("div");
        stepDiv.className = "ladder-step";
        stepDiv.id = `step-node-${i}`;
        stepDiv.innerHTML = `<span>Nấc ${i}</span> <i class="fas fa-lock"></i>`;
        wrapper.appendChild(stepDiv);
    }
}

function updateLadderHighlight() {
    for (let i = 1; i <= state.totalSteps; i++) {
        let node = document.getElementById(`step-node-${i}`);
        if (!node) continue;
        
        if (i < state.currentStep) {
            node.className = "ladder-step completed";
            node.innerHTML = `<span>Nấc ${i}</span> <i class="fas fa-check-circle"></i>`;
        } else if (i === state.currentStep) {
            node.className = "ladder-step active";
            node.innerHTML = `<span>Nấc ${i} (Hiện tại)</span> <i class="fas fa-street-view animate-pulse"></i>`;
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            node.className = "ladder-step";
            node.innerHTML = `<span>Nấc ${i}</span> <i class="fas fa-lock"></i>`;
        }
    }
}

/**
 * THUẬT TOÁN SINH CÂU HỎI THÔNG MINH
 */
function nextQuestion() {
    if (state.currentStep > state.totalSteps) {
        endGamePlay(false); 
        return;
    }
    
    updateLadderHighlight();
    document.getElementById("currentStepDisplay").textContent = state.currentStep;
    
    const targetItem = gamePool[Math.floor(Math.random() * gamePool.length)];
    const qType = Math.floor(Math.random() * 5) + 1;
    
    let questionText = "";
    let questionSub = "";
    let typeLabel = "";
    let correctAnswer = "";
    let options = [];
    
    switch (qType) {
        case 1:
            typeLabel = "Tìm Âm Hán Việt";
            questionText = targetItem.kanji;
            questionSub = "Chọn âm Hán Việt chính xác của chữ Hán trên:";
            correctAnswer = targetItem.hanviet;
            options = gatherDistractors(correctAnswer, 'hanviet');
            break;
        case 2:
            typeLabel = "Tìm Nghĩa Kanji";
            questionText = targetItem.kanji;
            questionSub = "Chữ Kanji này mang ý nghĩa tiếng Việt nào?";
            correctAnswer = targetItem.meaning;
            options = gatherDistractors(correctAnswer, 'meaning');
            break;
        case 3:
            typeLabel = "Nhận Diện Chữ Hán";
            questionText = targetItem.hanviet;
            questionSub = `Chữ Kanji tương ứng với âm Hán Việt [${targetItem.hanviet}] là:`;
            correctAnswer = targetItem.kanji;
            options = gatherDistractors(correctAnswer, 'kanji');
            break;
        case 4:
            typeLabel = "Ý Nghĩa Từ Ghép";
            const compound = (targetItem.compounds && targetItem.compounds.length > 0) 
                ? targetItem.compounds[0] 
                : { word: targetItem.kanji + "人", meaning: "Người liên quan đến " + targetItem.meaning };
            
            questionText = compound.word;
            questionSub = `Giải nghĩa chuẩn xác cho từ vựng ghép [${compound.word}]:`;
            correctAnswer = compound.meaning;
            options = [correctAnswer];
            while(options.length < 4) {
                let randItem = gamePool[Math.floor(Math.random() * gamePool.length)];
                let randMean = (randItem.compounds && randItem.compounds.length > 0) ? randItem.compounds[0].meaning : "Hành vi " + randItem.meaning;
                if(!options.includes(randMean)) options.push(randMean);
            }
            break;
        case 5:
            typeLabel = "Cách Đọc Hiragana";
            questionText = targetItem.kanji;
            questionSub = "Cách đọc Hiragana (Kunyomi/Onyomi) của chữ trên là gì?";
            correctAnswer = targetItem.reading;
            options = gatherDistractors(correctAnswer, 'reading');
            break;
    }
    
    options = shuffleArray(options);
    currentQuestion = { correct: correctAnswer, answered: false };
    
    document.getElementById("qTypeBadge").textContent = typeLabel;
    document.getElementById("qText").textContent = questionText;
    document.getElementById("qSubtext").textContent = questionSub;
    
    const grid = document.getElementById("optionsGrid");
    grid.innerHTML = "";
    
    const labels = ["A", "B", "C", "D"];
    options.forEach((opt, idx) => {
        let btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `<span class="opt-index">${labels[idx]}</span> <span class="opt-val">${opt}</span>`;
        btn.onclick = () => selectOption(btn, opt);
        grid.appendChild(btn);
    });
    
    startTimer();
}

function gatherDistractors(correctVal, fieldName) {
    let arr = [correctVal];
    while (arr.length < 4) {
        let randItem = gamePool[Math.floor(Math.random() * gamePool.length)];
        let val = randItem[fieldName];
        if (val && !arr.includes(val)) arr.push(val);
    }
    return arr;
}

function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = state.timeLimit;
    
    const bar = document.getElementById("timerBar");
    bar.style.width = "100%";
    
    state.timerInterval = setInterval(() => {
        state.timeLeft -= 0.1;
        let pct = (state.timeLeft / state.timeLimit) * 100;
        bar.style.width = `${pct}%`;
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            handleTimeout();
        }
    }, 100);
}

function handleTimeout() {
    if (currentQuestion.answered) return;
    currentQuestion.answered = true;
    revealCorrectAnswer();
    
    let node = document.getElementById(`step-node-${state.currentStep}`);
    if (node) {
        node.className = "ladder-step wrong";
        node.innerHTML = `<span>Nấc ${state.currentStep}</span> <i class="fas fa-times-circle" style="color:#e74c3c"></i>`;
    }
    setTimeout(() => { endGamePlay(true); }, 1500);
}

function selectOption(selectedBtn, chosenValue) {
    if (currentQuestion.answered) return;
    currentQuestion.answered = true;
    clearInterval(state.timerInterval);
    
    if (chosenValue === currentQuestion.correct) {
        selectedBtn.classList.add("correct");
        state.correctCount++;
        document.getElementById("correctCounter").textContent = state.correctCount;
        
        setTimeout(() => {
            state.currentStep++;
            nextQuestion();
        }, 1400);
    } else {
        selectedBtn.classList.add("wrong");
        revealCorrectAnswer();
        
        let node = document.getElementById(`step-node-${state.currentStep}`);
        if (node) {
            node.className = "ladder-step wrong";
            node.innerHTML = `<span>Nấc ${state.currentStep}</span> <i class="fas fa-times-circle" style="color:#e74c3c"></i>`;
        }
        setTimeout(() => { endGamePlay(true); }, 1400);
    }
}

function revealCorrectAnswer() {
    document.querySelectorAll(".option-btn").forEach(btn => {
        let val = btn.querySelector(".opt-val").textContent;
        if (val === currentQuestion.correct) btn.classList.add("correct");
    });
}

/**
 * ĐÁNH GIÁ ĐIỂM SỐ & PHÂN XỬ DANH HIỆU
 */
function endGamePlay(isFailed = false) {
    clearInterval(state.timerInterval);
    
    const resultTitle = document.getElementById("resultTitle");
    const resultSubtitle = document.getElementById("resultSubtitle");
    const badgeContainer = document.getElementById("rankBadgeContainer");
    const certTrigger = document.getElementById("certificateTriggerZone");
    
    let earnedRank = "Không có";
    
    if (isFailed) {
        resultTitle.innerHTML = `<span style="color:#e74c3c;"><i class="fas fa-skull-crossbones"></i> Bị Ngã Khỏi Tháp!</span>`;
        resultSubtitle.innerHTML = `Rất tiếc, bạn đã đưa ra lựa chọn sai lầm tại <strong>Nấc thang thứ ${state.currentStep}</strong> và phải dừng cuộc chơi.`;
        
        document.getElementById("resCorrect").textContent = `${state.correctCount}/${state.totalSteps}`;
        document.getElementById("resPercent").textContent = `${Math.round((state.correctCount / state.totalSteps) * 100)}%`;
        document.getElementById("resRank").textContent = "Không xếp hạng";
        
        badgeContainer.innerHTML = `
            <div class="badge-circle" style="background: #e74c3c; font-size: 1.8rem; flex-direction: column;">
                <i class="fas fa-heart-broken" style="margin-bottom:5px;"></i>
                <span style="font-size:0.8rem; font-weight:700;">FAILED</span>
            </div>`;
        certTrigger.style.display = "none";
        earnedRank = "Thất bại";
    } else {
        resultTitle.innerHTML = `<span style="color:#2ecc71;"><i class="fas fa-crown"></i> Chinh Phục Đỉnh Tháp!</span>`;
        resultSubtitle.textContent = "Xuất sắc! Bạn đã vượt qua toàn bộ các nấc thang cổ kính mà không phạm sai lầm!";
        
        const ratio = state.correctCount / state.totalSteps;
        earnedRank = "N";
        
        if (state.difficulty === "easy") {
            earnedRank = (ratio >= RANKS.EASY.threshold) ? RANKS.EASY.high : RANKS.EASY.low;
        } else if (state.difficulty === "medium") {
            earnedRank = (ratio >= RANKS.MEDIUM.threshold) ? RANKS.MEDIUM.high : RANKS.MEDIUM.low;
        } else if (state.difficulty === "hard") {
            if (ratio >= 0.94) earnedRank = "UR"; 
            else if (ratio >= 0.75) earnedRank = "SSR";
            else earnedRank = "SR";
        }
        
        document.getElementById("resCorrect").textContent = `${state.correctCount}/${state.totalSteps}`;
        document.getElementById("resPercent").textContent = `${Math.round(ratio * 100)}%`;
        document.getElementById("resRank").textContent = earnedRank;
        
        badgeContainer.innerHTML = `<div class="badge-circle ${earnedRank.toLowerCase()}">${earnedRank}</div>`;
        
        if (earnedRank === "UR") {
            certTrigger.style.display = "block";
        } else {
            certTrigger.style.display = "none";
        }
    }
    
    const runLog = {
        player: state.playerName,
        difficulty: state.difficulty,
        correct: state.correctCount,
        total: state.totalSteps,
        percentage: Math.round((state.correctCount / state.totalSteps) * 100),
        rank: earnedRank,
        date: new Date().toLocaleDateString("vi-VN")
    };
    
    state.history.push(runLog);
    saveToStorage();
    showSection("resultScreen");
}

function saveToStorage() { localStorage.setItem("nihongo_cute_kanji_tower", JSON.stringify(state.history)); }
function loadFromStorage() {
    const raw = localStorage.getItem("nihongo_cute_kanji_tower");
    if (raw) {
        try {
            state.history = JSON.parse(raw);
        } catch(e) {
            state.history = [];
        }
    }
    
    const savedName = localStorage.getItem("nihongo_cute_saved_name");
    if (savedName) {
        state.playerName = savedName;
        const nameInputEl = document.getElementById("playerName");
        if (nameInputEl) {
            nameInputEl.value = savedName;
        }
    }
}

/**
 * GIAO DIỆN XEM TIẾN TRÌNH & IN CHỨNG CHỈ (DASHBOARD)
 */
function renderDashboard() {
    const diffContainer = document.getElementById("difficultyProgressList");
    diffContainer.innerHTML = "";
    
    const modes = [
        { id: "easy", name: "Chế độ Dễ (20 Nấc Thang)" },
        { id: "medium", name: "Chế độ Trung Bình (35 Nấc Thang)" },
        { id: "hard", name: "Chế độ Siêu Khó (50 Nấc Thang)" }
    ];
    
    modes.forEach(m => {
        const filtered = state.history.filter(h => h.difficulty === m.id);
        let bestScore = 0;
        let highestRank = "Chưa đạt";
        
        if (filtered.length > 0) {
            const winRuns = filtered.filter(f => f.rank !== "Thất bại");
            if(winRuns.length > 0) {
                bestScore = Math.max(...winRuns.map(f => f.percentage));
            } else {
                bestScore = Math.max(...filtered.map(f => f.percentage));
            }
            
            const rankOrder = ["Chưa đạt", "Thất bại", "N", "R", "SR", "SSR", "UR"];
            filtered.forEach(item => {
                if (rankOrder.indexOf(item.rank) > rankOrder.indexOf(highestRank)) highestRank = item.rank;
            });
        }
        
        let itemDiv = document.createElement("div");
        itemDiv.className = "dash-progress-item";
        itemDiv.innerHTML = `
            <div>
                <div class="dash-diff-name" style="font-weight:700;">${m.name}</div>
                <small style="color:#777">Chính xác cao nhất: ${bestScore}%</small>
            </div>
            <span class="dash-badge-sm" style="background:${getRankColor(highestRank)}">${highestRank}</span>
        `;
        diffContainer.appendChild(itemDiv);
    });
    
    const certGrid = document.getElementById("certificatesGrid");
    certGrid.innerHTML = "";
    const urRecords = state.history.filter(h => h.rank === "UR");
    
    if (urRecords.length === 0) {
        certGrid.innerHTML = `<p style="color:#999; font-style:italic;">Bạn chưa sở hữu chứng chỉ UR nào. Hãy vượt qua chế độ Siêu Khó mà không sai câu nào để nhận nhé!</p>`;
    } else {
        urRecords.forEach((rec, i) => {
            let certBox = document.createElement("div");
            certBox.className = "cert-mini-card";
            certBox.innerHTML = `
                <div>
                    <h4 style="color:#b78a00;"><i class="fas fa-scroll"></i> Bằng Danh Dự UR #${100 + i}</h4>
                    <p style="font-size:0.8rem; color:#666;">Học viên: <strong>${rec.player}</strong> • Ngày: ${rec.date}</p>
                </div>
                <button class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="viewSpecificCertificate('${rec.player}', '${rec.date}')">Xem</button>
            `;
            certGrid.appendChild(certBox);
        });
    }
}

function getRankColor(rank) {
    switch(rank) {
        case "N": return "#8e9eab"; case "R": return "#3a7bd5";
        case "SR": return "#f39c12"; case "SSR": return "#e74c3c";
        case "UR": return "linear-gradient(45deg, #f1c40f, #e74c3c)";
        case "Thất bại": return "#e74c3c";
        default: return "#ccc";
    }
}

/**
 * CHỨC NĂNG MỚI: XỬ LÝ QUẢN TRỊ - XÓA SẠCH CACHE STORAGE
 */
function clearGameCache() {
    if (confirm("Hành động này sẽ xóa toàn bộ lịch sử chơi game, thành tích cũ và chứng chỉ đã lưu trong trình duyệt của bạn. Bạn chắc chắn muốn xóa chứ?")) {
        localStorage.removeItem("nihongo_cute_kanji_tower");
        state.history = [];
        renderDashboard();
        alert("Đã xóa sạch toàn bộ dữ liệu bộ nhớ đệm (Cache) thành công!");
    }
}

/**
 * CHỨC NĂNG MỚI: YÊU CẦU MÃ XÁC NHẬN ĐỂ KÍCH HOẠT CHẾ ĐỘ KIỂM THỬ GIẢ LẬP
 */
function promptTestMode() {
    const inputCode = prompt("Vui lòng nhập mã bảo mật dành cho nhà phát triển để thay đổi tiến trình:");
    
    // Kiểm tra mã xác thực bảo mật
    if (inputCode === "ADMINCUTE") {
        injectTestData();
    } else if (inputCode !== null) {
        alert("Mã xác nhận không đúng! Bạn không có quyền can thiệp vào tiến trình trò chơi.");
    }
}

// Hàm thực thi bơm dữ liệu kiểm thử giả lập phong phú cấu trúc
function injectTestData() {
    const nameInput = document.getElementById("playerName").value.trim();
    const currentTestName = nameInput || "Ninja Vô Danh";

    const mockHistory = [
        { player: currentTestName, difficulty: "easy", correct: 18, total: 20, percentage: 90, rank: "R", date: "12/03/2026" },
        { player: currentTestName, difficulty: "medium", correct: 32, total: 35, percentage: 91, rank: "SSR", date: "18/04/2026" },
        { player: currentTestName, difficulty: "easy", correct: 8, total: 20, percentage: 40, rank: "Thất bại", date: "22/04/2026" },
        { player: currentTestName, difficulty: "hard", correct: 49, total: 50, percentage: 98, rank: "UR", date: "05/05/2026" },
        { player: currentTestName, difficulty: "hard", correct: 50, total: 50, percentage: 100, rank: "UR", date: "20/05/2026" }
    ];
    
    state.history = mockHistory;
    saveToStorage();
    renderDashboard();
    alert("Kích hoạt Chế độ Thử nghiệm thành công! Đã tự động nạp 5 trận đấu giả lập (Bao gồm 2 chứng chỉ danh hiệu hạng UR tối cao để bạn test tính năng in ấn).");
}

function viewCertificateModal() {
    document.getElementById("certPlayerName").textContent = state.playerName;
    document.getElementById("certDate").textContent = new Date().toLocaleDateString("vi-VN");
    document.getElementById("certModal").classList.add("active");
}

function viewSpecificCertificate(name, date) {
    const finalName = state.playerName || localStorage.getItem("nihongo_cute_saved_name") || "Ninja Vô Danh";
    document.getElementById("certPlayerName").textContent = finalName.toUpperCase();
    document.getElementById("certDate").textContent = date;
    document.getElementById("certModal").classList.add("active");
}

function closeCertificateModal() { document.getElementById("certModal").classList.remove("active"); }
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}