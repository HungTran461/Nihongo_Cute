/**
 * =================================================================
 * NIHONGO CUTE - ENGINE GAME SHOW CHUNG SỨC
 * TÍNH NĂNG MỚI: TÍCH LŨY 500 ĐIỂM ĐỔI VÉ CHUNG KẾT & TÁCH BẢNG LỊCH SỬ
 * =================================================================
 */

let surveyDatabase = {};      
let fastMoneyDatabase = [];   
let availableRounds = [];     
let currentRoundIndex = 0;    

let gameSession = {
    playerName: "Người chơi",
    currentRoundScore: 0,
    totalGameScore: 0,
    wrongCount: 0,
    revealedAnswers: []
};

// Hệ thống lưu trữ hồ sơ người chơi (Cập nhật mới)
let userProfile = {
    totalPoints: 0,       // Điểm tích lũy (dư) chưa đủ đổi vé
    tickets: 0,           // Số vé Chung Kết đang sở hữu
    normalHistory: [],    // Lịch sử vòng thường
    fmHistory: []         // Lịch sử vòng chung kết
};

let fastMoneyState = {
    questions: [],            
    currentQIdx: 0,           
    currentTurn: 1,           
    p1Answers: [],            
    p2Answers: [],            
    timer: 20,                
    timerInterval: null,
    revealStep: 0,            
    accumulatedFmScore: 0     
};

// KHỞI TẠO ỨNG DỤNG
document.addEventListener("DOMContentLoaded", async () => {
    await loadSurveyData();       
    await loadFastMoneyData();    
    loadFromLocalStorage(); 
    
    // 1. Ràng buộc phím Enter cho ô nhập Vòng Chung Kết
    const fmInput = document.getElementById("fmPlayerAnswerInput");
    if(fmInput) {
        fmInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitFastMoneyGuess();
        });
    }

    // 2. THÊM MỚI: Ràng buộc phím Enter cho ô nhập Vòng Thường
    const normalInput = document.getElementById("playerAnswerInput");
    if(normalInput) {
        normalInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // Ngăn chặn hành vi mặc định của form nếu có
                submitPlayerGuess();
            }
        });
    }
});

async function loadSurveyData() {
    try {
        const response = await fetch('data/chungsuc_data.json');
        if (!response.ok) throw new Error("File not found");
        surveyDatabase = await response.json();
        setupLessonDropdowns();
    } catch (e) { console.error("Lỗi tải chungsuc_data.json:", e); }
}

async function loadFastMoneyData() {
    try {
        const response = await fetch('data/fastmatch_data.json');
        if (!response.ok) throw new Error("File not found");
        fastMoneyDatabase = await response.json();
    } catch (e) { console.error("Lỗi tải fastmatch_data.json:", e); }
}

function setupLessonDropdowns() {
    const startSelect = document.getElementById("startLesson");
    const endSelect = document.getElementById("endLesson");
    if (!startSelect || !endSelect) return;
    
    startSelect.innerHTML = ""; endSelect.innerHTML = "";
    const lessons = Object.keys(surveyDatabase).sort((a, b) => parseInt(a) - parseInt(b));
    if (lessons.length === 0) return;

    lessons.forEach(l => {
        startSelect.innerHTML += `<option value="${l}">Bài ${l}</option>`;
        endSelect.innerHTML += `<option value="${l}">Bài ${l}</option>`;
    });
    endSelect.value = lessons[lessons.length - 1];
}

function validateLessons() {
    const startSelect = document.getElementById("startLesson");
    const endSelect = document.getElementById("endLesson");
    if(!startSelect || !endSelect) return;
    if (parseInt(startSelect.value) > parseInt(endSelect.value)) endSelect.value = startSelect.value;
}

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showSection(sectionId) {
    document.querySelectorAll(".game-section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active");
    
    document.getElementById("nav-play").classList.remove("active");
    document.getElementById("nav-history").classList.remove("active");
    
    if(["setupScreen", "gameScreen", "fastMoneyScreen", "fastMoneyRevealScreen"].includes(sectionId)) {
        document.getElementById("nav-play").classList.add("active");
    } else if(sectionId === "historyScreen") {
        document.getElementById("nav-history").classList.add("active");
    }
}

/**
 * =================================================================
 * VÒNG CHƠI THƯỜNG
 * =================================================================
 */
function startChungSucGame() {
    const nameInput = document.getElementById("playerNameInput");
    gameSession.playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Đội Ninja";
    
    const startL = parseInt(document.getElementById("startLesson").value);
    const endL = parseInt(document.getElementById("endLesson").value);
    
    availableRounds = [];
    for (let l = startL; l <= endL; l++) {
        if (surveyDatabase[l]) availableRounds = availableRounds.concat(surveyDatabase[l]);
    }
    
    if (availableRounds.length === 0) {
        alert("Kho khảo sát bài học trống! Vui lòng chọn lại.");
        return;
    }
    
    availableRounds = shuffleArray(availableRounds);
    currentRoundIndex = 0;
    gameSession.totalGameScore = 0;
    if(document.getElementById("globalTotalScore")) document.getElementById("globalTotalScore").textContent = "000";
    
    setupRound();
}

function setupRound() {
    // THAY ĐỔI: Hết vòng thường thì chạy hàm tổng kết điểm và tính vé, KHÔNG nhảy thẳng vào Chung Kết
    if (currentRoundIndex >= availableRounds.length) {
        finishNormalGame();
        return;
    }
    
    const roundData = availableRounds[currentRoundIndex];
    gameSession.currentRoundScore = 0;
    gameSession.wrongCount = 0;
    gameSession.revealedAnswers = new Array(roundData.answers.length).fill(false);
    
    if(document.getElementById("currentRoundNum")) document.getElementById("currentRoundNum").textContent = currentRoundIndex + 1;
    if(document.getElementById("currentRoundScore")) document.getElementById("currentRoundScore").textContent = "0";
    if(document.getElementById("questionTopic")) document.getElementById("questionTopic").textContent = roundData.topic;
    
    const inputEl = document.getElementById("playerAnswerInput");
    if(inputEl) { inputEl.value = ""; inputEl.disabled = false; }
    const btnSubmit = document.getElementById("btnSubmitAnswer");
    if(btnSubmit) btnSubmit.disabled = false;
    
    renderFeudBoard(roundData);
    renderStrikes();
    showSection("gameScreen");
}

function renderStrikes() {
    const container = document.getElementById("strikesContainer");
    if(!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
        let span = document.createElement("span");
        span.className = i <= gameSession.wrongCount ? "strike-x" : "strike-dot";
        span.innerHTML = i <= gameSession.wrongCount ? '<i class="fas fa-times"></i>' : '<i class="fas fa-circle"></i>';
        container.appendChild(span);
    }
}

function renderFeudBoard(roundData) {
    const grid = document.getElementById("feudBoardGrid");
    if(!grid) return;
    grid.innerHTML = "";
    
    roundData.answers.forEach((ans, idx) => {
        let cardDiv = document.createElement("div");
        cardDiv.className = "feud-card";
        cardDiv.id = `feud-card-${idx}`;
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front"><div class="number-badge">${idx + 1}</div></div>
                <div class="card-back"><span class="ans-text">${ans.text}</span><span class="ans-pts">${ans.points}</span></div>
            </div>
        `;
        grid.appendChild(cardDiv);
    });
}

function submitPlayerGuess() {
    const inputEl = document.getElementById("playerAnswerInput");
    if(!inputEl) return;
    const guess = inputEl.value.trim().toLowerCase();
    if (!guess) return;
    
    inputEl.value = ""; inputEl.focus();
    
    const roundData = availableRounds[currentRoundIndex];
    let matchedIdx = -1;
    
    for (let i = 0; i < roundData.answers.length; i++) {
        if (!gameSession.revealedAnswers[i] && roundData.answers[i].match.some(m => m.toLowerCase() === guess)) {
            matchedIdx = i; break;
        }
    }
    
    if (matchedIdx !== -1) {
        // ĐÚNG
        gameSession.revealedAnswers[matchedIdx] = true;
        gameSession.currentRoundScore += roundData.answers[matchedIdx].points;
        gameSession.totalGameScore += roundData.answers[matchedIdx].points;
        
        const card = document.getElementById(`feud-card-${matchedIdx}`);
        if(card) card.classList.add("revealed");
        
        if(document.getElementById("currentRoundScore")) document.getElementById("currentRoundScore").textContent = gameSession.currentRoundScore;
        if(document.getElementById("globalTotalScore")) document.getElementById("globalTotalScore").textContent = String(gameSession.totalGameScore).padStart(3, '0');
        
        if (gameSession.revealedAnswers.every(r => r === true)) {
            if(document.getElementById("playerAnswerInput")) document.getElementById("playerAnswerInput").disabled = true;
            if(document.getElementById("btnSubmitAnswer")) document.getElementById("btnSubmitAnswer").disabled = true;
            setTimeout(() => { currentRoundIndex++; setupRound(); }, 1500);
        }
    } else {
        // SAI
        gameSession.wrongCount++;
        renderStrikes();
        
        const overlay = document.getElementById("strikeOverlay");
        if(overlay) { overlay.classList.add("active"); setTimeout(() => { overlay.classList.remove("active"); }, 800); }
        
        if (gameSession.wrongCount >= 3) {
            if(document.getElementById("playerAnswerInput")) document.getElementById("playerAnswerInput").disabled = true;
            if(document.getElementById("btnSubmitAnswer")) document.getElementById("btnSubmitAnswer").disabled = true;
            
            setTimeout(() => {
                roundData.answers.forEach((ans, idx) => {
                    const c = document.getElementById(`feud-card-${idx}`);
                    if(c) c.classList.add("revealed");
                });
                setTimeout(() => { 
                    currentRoundIndex++;
                    finishNormalGame(); 
                }, 2000);
            }, 1000);
        }
    }
}

// LOGIC MỚI: KẾT THÚC VÒNG THƯỜNG -> TÍNH ĐIỂM ĐỔI VÉ
function finishNormalGame() {
    let points = gameSession.totalGameScore;
    userProfile.totalPoints += points;
    
    // Thuật toán đổi vé: Cứ 500 điểm được 1 vé, giữ lại phần dư
    let earnedTickets = Math.floor(userProfile.totalPoints / 500);
    
    let msg = `🌟 KẾT THÚC VÒNG THƯỜNG 🌟\nĐiểm trận này: ${points} Pts\n\n`;
    
    if (earnedTickets > 0) {
        userProfile.tickets += earnedTickets;
        userProfile.totalPoints = userProfile.totalPoints % 500;
        msg += `🎉 XUẤT SẮC! Bạn đã tích đủ điểm và nhận được ${earnedTickets} vé tham gia Vòng Chung Kết!`;
    } else {
        msg += `Tiếp tục cố gắng nhé! Bạn cần tích thêm ${500 - userProfile.totalPoints} điểm nữa để đổi 1 vé Chung Kết.`;
    }

    alert(msg);

    // Lưu vào lịch sử Vòng Thường
    userProfile.normalHistory.push({
        date: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}),
        player: gameSession.playerName,
        score: points,
        roundsCleared: currentRoundIndex
    });

    saveToLocalStorage();
    updateTicketsUI();
    showSection("setupScreen"); // Quay về màn hình Setup để người chơi chọn chơi tiếp hay vào Chung Kết
}

/**
 * =================================================================
 * VÒNG CHUNG KẾT (FAST MONEY) TỰ CHỌN
 * =================================================================
 */

// Hàm bấm từ Nút Giao Diện
function startFastMoneyFromSetup() {
    if (userProfile.tickets <= 0) {
        alert("Bạn không có vé Chung Kết! Hãy chơi Vòng Thường để tích đủ 500 điểm đổi vé nhé.");
        return;
    }
    
    const nameInput = document.getElementById("playerNameInput");
    gameSession.playerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Đội Ninja";
    
    // Trừ 1 vé
    userProfile.tickets--;
    saveToLocalStorage();
    updateTicketsUI();
    
    initFastMoneyMode();
}

function initFastMoneyMode() {
    if (!fastMoneyDatabase || fastMoneyDatabase.length < 5) {
        alert("Lỗi: Dữ liệu vòng chung kết chưa sẵn sàng!");
        return;
    }
    
    fastMoneyState.questions = shuffleArray(fastMoneyDatabase).slice(0, 5);
    fastMoneyState.currentQIdx = 0;
    fastMoneyState.currentTurn = 1;
    fastMoneyState.p1Answers = [];
    fastMoneyState.p2Answers = [];
    fastMoneyState.revealStep = 0;
    fastMoneyState.accumulatedFmScore = 0;
    
    startFastMoneyTurn(1);
}

function startFastMoneyTurn(turnNum) {
    fastMoneyState.currentTurn = turnNum;
    fastMoneyState.currentQIdx = 0;
    fastMoneyState.timer = turnNum === 1 ? 20 : 25; 
    
    if(document.getElementById("fmRoundNum")) document.getElementById("fmRoundNum").textContent = turnNum;
    if(document.getElementById("fmDuplicateWarning")) document.getElementById("fmDuplicateWarning").style.display = "none";
    
    displayFmQuestion();
    showSection("fastMoneyScreen");
    
    clearInterval(fastMoneyState.timerInterval);
    fastMoneyState.timerInterval = setInterval(() => {
        fastMoneyState.timer--;
        if(document.getElementById("fmTimer")) document.getElementById("fmTimer").textContent = fastMoneyState.timer;
        
        if (fastMoneyState.timer <= 0) {
            clearInterval(fastMoneyState.timerInterval);
            handleFmTurnTimeout();
        }
    }, 1000);
    
    const inputEl = document.getElementById("fmPlayerAnswerInput");
    if(inputEl) { inputEl.value = ""; inputEl.focus(); }
}

function displayFmQuestion() {
    const idx = fastMoneyState.currentQIdx;
    if(document.getElementById("fmQuestionSetLabel")) document.getElementById("fmQuestionSetLabel").textContent = `CÂU HỎI ${idx + 1}/5`;
    if(document.getElementById("fmQuestionTopic")) document.getElementById("fmQuestionTopic").textContent = fastMoneyState.questions[idx].topic;
}

function submitFastMoneyGuess() {
    const inputEl = document.getElementById("fmPlayerAnswerInput");
    if(!inputEl) return;
    const rawGuess = inputEl.value.trim();
    const cleanGuess = rawGuess.toLowerCase();
    
    if (!rawGuess) return; 
    
    const currentQuestionObj = fastMoneyState.questions[fastMoneyState.currentQIdx];
    
    // Check trùng Lượt 1
    if (fastMoneyState.currentTurn === 2) {
        const p1CorrespondingAns = fastMoneyState.p1Answers[fastMoneyState.currentQIdx].userInput.toLowerCase();
        if (cleanGuess === p1CorrespondingAns && p1CorrespondingAns !== "") {
            if(document.getElementById("fmDuplicateWarning")) document.getElementById("fmDuplicateWarning").style.display = "block";
            inputEl.value = "";
            return; 
        }
    }
    
    if(document.getElementById("fmDuplicateWarning")) document.getElementById("fmDuplicateWarning").style.display = "none";
    
    let finalMatchedText = rawGuess.toUpperCase();
    let finalPoints = 0;
    
    const matchedRecord = currentQuestionObj.answers.find(ans => ans.match.some(m => m.toLowerCase() === cleanGuess));
    if (matchedRecord) {
        finalMatchedText = matchedRecord.text;
        finalPoints = matchedRecord.points;
    }
    
    const recordObj = { userInput: rawGuess, dbText: finalMatchedText, points: finalPoints };
    if (fastMoneyState.currentTurn === 1) {
        fastMoneyState.p1Answers.push(recordObj);
    } else {
        fastMoneyState.p2Answers.push(recordObj);
    }
    
    fastMoneyState.currentQIdx++;
    inputEl.value = "";
    
    if (fastMoneyState.currentQIdx < 5) {
        displayFmQuestion();
        inputEl.focus();
    } else {
        clearInterval(fastMoneyState.timerInterval);
        advanceFmFlow();
    }
}

function handleFmTurnTimeout() {
    while (fastMoneyState.currentQIdx < 5) {
        const recordObj = { userInput: "--- ❌", dbText: "N/A", points: 0 };
        if (fastMoneyState.currentTurn === 1) fastMoneyState.p1Answers.push(recordObj);
        else fastMoneyState.p2Answers.push(recordObj);
        fastMoneyState.currentQIdx++;
    }
    advanceFmFlow();
}

function advanceFmFlow() {
    if (fastMoneyState.currentTurn === 1) {
        alert("🌸 Lượt 1 đã xong! Click OK để chuyển sang Lượt 2 (Lưu ý: KHÔNG gõ trùng đáp án của lượt 1 nhé!)");
        startFastMoneyTurn(2);
    } else {
        alert("✨ Cả 2 lượt đấu Chung Kết đã khép lại. Hãy tiến về Bảng lật mở điểm số tổng kết!");
        prepareFmRevealBoard();
    }
}

function prepareFmRevealBoard() {
    const container = document.getElementById("fmTableRowsContainer");
    if (!container) return;
    
    container.innerHTML = "";
    if(document.getElementById("fastMoneyTotalScore")) document.getElementById("fastMoneyTotalScore").textContent = "000";
    if(document.getElementById("btnFmRevealNext")) {
        document.getElementById("btnFmRevealNext").disabled = false;
        document.getElementById("btnFmRevealNext").style.display = "inline-flex";
    }
    
    fastMoneyState.questions.forEach((q, idx) => {
        const p1 = fastMoneyState.p1Answers[idx];
        const p2 = fastMoneyState.p2Answers[idx];
        
        let rowDiv = document.createElement("div");
        rowDiv.className = "fm-table-row";
        rowDiv.innerHTML = `
            <div class="cell-q">${q.topic}</div>
            <div class="cell-p1" id="fm-slot-p1-${idx}">
                <span class="fm-ans-text">${p1.userInput}</span><span class="fm-pts-num">${p1.points}</span>
            </div>
            <div class="cell-p2" id="fm-slot-p2-${idx}">
                <span class="fm-ans-text">${p2.userInput}</span><span class="fm-pts-num">${p2.points}</span>
            </div>
        `;
        container.appendChild(rowDiv);
    });
    
    showSection("fastMoneyRevealScreen"); 
}

function revealNextFastMoneySlot() {
    let step = fastMoneyState.revealStep;
    if (step >= 10) return; 
    
    let targetSlotId = step < 5 ? `fm-slot-p1-${step}` : `fm-slot-p2-${step - 5}`;
    let currentPoints = step < 5 ? fastMoneyState.p1Answers[step].points : fastMoneyState.p2Answers[step - 5].points;
    
    const slotEl = document.getElementById(targetSlotId);
    if (slotEl) slotEl.classList.add("slot-revealed");
    
    fastMoneyState.accumulatedFmScore += currentPoints;
    if(document.getElementById("fastMoneyTotalScore")) {
        document.getElementById("fastMoneyTotalScore").textContent = String(fastMoneyState.accumulatedFmScore).padStart(3, '0');
    }
    
    fastMoneyState.revealStep++;
    
    if (fastMoneyState.revealStep === 10) {
        if(document.getElementById("btnFmRevealNext")) document.getElementById("btnFmRevealNext").style.display = "none";
        
        setTimeout(() => {
            const finalScore = fastMoneyState.accumulatedFmScore;
            endFastMoneySession(finalScore >= 200, finalScore); 
        }, 1500);
    }
}

function endFastMoneySession(isWin, totalPoints) {
    const cardTheme = document.getElementById("resultCardTheme");
    const iconEl = document.getElementById("resultIcon");
    const titleEl = document.getElementById("resultTitle");
    const msgEl = document.getElementById("resultMessage");
    
    if(document.getElementById("statRounds")) document.getElementById("statRounds").textContent = `Vòng Chung Kết`;
    if(document.getElementById("statTotalScore")) document.getElementById("statTotalScore").textContent = `${totalPoints} Điểm`;
    
    if (isWin) {
        if(cardTheme) cardTheme.className = "panel-card result-card text-center animate-pop theme-win";
        if(iconEl) iconEl.innerHTML = '<i class="fas fa-crown text-gold animate-pulse" style="color: #e67e22;"></i>';
        if(titleEl) titleEl.innerHTML = `<span style="color: #10ac84;">🏆 PHÁ ĐẢO CHUNG KẾT!</span>`;
        if(msgEl) msgEl.innerHTML = `Tuyệt vời <strong>${gameSession.playerName}</strong>! Bạn đã vượt mốc 200 điểm và giành cúp vàng!`;
    } else {
        if(cardTheme) cardTheme.className = "panel-card result-card text-center animate-pop theme-fail";
        if(iconEl) iconEl.innerHTML = '<i class="fas fa-sad-tear" style="color: #ff4757;"></i>';
        if(titleEl) titleEl.innerHTML = `<span style="color: #ff4757;">THIẾU CHÚT NỮA THÔI</span>`;
        if(msgEl) msgEl.innerHTML = `Tổng điểm: <strong>${totalPoints} điểm</strong>. Vẫn chưa đủ 200 điểm, hãy chơi vòng thường kiếm vé và phục thù nhé!`;
    }
    
    // Lưu vào Lịch sử Chung Kết
    userProfile.fmHistory.push({
        date: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}),
        player: gameSession.playerName,
        score: totalPoints,
        status: isWin ? "Thắng" : "Thua"
    });
    
    saveToLocalStorage();
    showSection("resultScreen"); 
}

/**
 * =================================================================
 * HỆ THỐNG LƯU TRỮ VÀ HIỂN THỊ GIAO DIỆN
 * =================================================================
 */
function saveToLocalStorage() {
    localStorage.setItem("chungsuc_profile_v3", JSON.stringify(userProfile));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem("chungsuc_profile_v3");
    if (saved) {
        userProfile = JSON.parse(saved);
    }
    updateTicketsUI(); // Cập nhật lại số vé lên màn hình ngay khi web mở
}

// Hàm cập nhật Giao diện Vé và Nút bấm
function updateTicketsUI() {
    if(document.getElementById("headerTicketCount")) document.getElementById("headerTicketCount").textContent = userProfile.tickets;
    if(document.getElementById("uiTicketCount")) document.getElementById("uiTicketCount").textContent = userProfile.tickets;
    if(document.getElementById("uiPointsProgress")) document.getElementById("uiPointsProgress").textContent = userProfile.totalPoints;
    
    const btnFM = document.getElementById("btnPlayFM");
    if (btnFM) {
        if (userProfile.tickets > 0) {
            btnFM.disabled = false;
            btnFM.style.opacity = "1";
        } else {
            btnFM.disabled = true;
            btnFM.style.opacity = "0.5";
        }
    }
}

// Hàm render Bảng Lịch sử tách biệt
function renderHistoryDashboard() {
    const tbodyNormal = document.getElementById("historyNormalBody");
    const tbodyFM = document.getElementById("historyFMBody");
    
    if(tbodyNormal) {
        tbodyNormal.innerHTML = "";
        const revNormal = [...userProfile.normalHistory].reverse();
        revNormal.forEach(r => {
            tbodyNormal.innerHTML += `
                <tr>
                    <td style="font-size:0.85rem; color:#888;">${r.date}</td>
                    <td><strong>${r.player}</strong></td>
                    <td>${r.roundsCleared} Vòng</td>
                    <td style="color:#a18cd1; font-weight:bold;">${r.score} Pts</td>
                </tr>
            `;
        });
        if(revNormal.length === 0) tbodyNormal.innerHTML = `<tr><td colspan="4" style="text-align:center;">Chưa có dữ liệu</td></tr>`;
    }
    
    if(tbodyFM) {
        tbodyFM.innerHTML = "";
        const revFM = [...userProfile.fmHistory].reverse();
        revFM.forEach(r => {
            let badge = r.status === "Thắng" ? `<span style="background:#e6fffa; color:#10ac84; padding:3px 8px; border-radius:5px;">Thắng</span>` : `<span style="background:#ffe3e3; color:#ff4757; padding:3px 8px; border-radius:5px;">Thua</span>`;
            tbodyFM.innerHTML += `
                <tr>
                    <td style="font-size:0.85rem; color:#888;">${r.date}</td>
                    <td><strong>${r.player}</strong></td>
                    <td style="color:#ff9a9e; font-weight:bold;">${r.score} Pts</td>
                    <td>${badge}</td>
                </tr>
            `;
        });
        if(revFM.length === 0) tbodyFM.innerHTML = `<tr><td colspan="4" style="text-align:center;">Chưa có dữ liệu</td></tr>`;
    }
}

function clearChungSucCache() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử điểm và vé chung kết không?")) {
        userProfile = { totalPoints: 0, tickets: 0, normalHistory: [], fmHistory: [] };
        saveToLocalStorage();
        updateTicketsUI();
        renderHistoryDashboard();
        alert("Đã xóa sạch bộ nhớ!");
    }
}

function backToSetup() {
    showSection("setupScreen");
}