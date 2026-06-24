// Biến trạng thái toàn cục bổ sung kiến trúc theo dõi vị trí điền bất kỳ
let gameData = [];
let currentStage = null;
let queue = [];
let currentQuestion = null;
let totalGoal = 0;
let answeredCount = 0;

// Bộ nhớ đệm lưu trữ trợ từ tạm thời của người chơi cho câu hỏi hiện tại
let userAnswers = []; 
let activeBlankIndex = 0; 

const DOM = {
    screens: { map: document.getElementById('screen-map'), game: document.getElementById('screen-game') },
    map: { container: document.getElementById('stage-container') },
    game: { 
        board: document.getElementById('board-container'),
        jp: document.getElementById('question-text'), 
        vi: document.getElementById('translation-text'), 
        options: document.getElementById('options-container'),
        pFill: document.getElementById('progress-fill'),
        pText: document.getElementById('progress-text'),
        btnNext: document.getElementById('btn-next') // Thêm tham chiếu nút NEXT
    },
    modal: {
        overlay: document.getElementById('modal-feedback'),
        icon: document.getElementById('fb-icon'),
        title: document.getElementById('fb-title'),
        desc: document.getElementById('fb-desc'),
        btn: document.getElementById('fb-btn'),
        complete: document.getElementById('modal-complete')
    }
};

// 1. TẢI DỮ LIỆU TỪ JSON
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('data/journey_data.json');
        if (!response.ok) throw new Error("Không tìm thấy file JSON");
        const data = await response.json();
        gameData = data.journey_stages;
        renderMap();
    } catch (error) {
        console.error("Lỗi nạp dữ liệu:", error);
        alert("Lưu ý: Chạy ứng dụng bằng Live Server để tải file JSON chuẩn xác.");
    }
});

// 2. RENDER BẢN ĐỒ VỚI LOCALSTORAGE CHECK
function renderMap() {
    DOM.map.container.innerHTML = '';
    
    // Lấy dữ liệu CLEAR từ bộ nhớ trình duyệt
    const clearedStages = JSON.parse(localStorage.getItem('nihongo_cute_cleared_stages')) || [];

    gameData.forEach((stage, index) => {
        const isStageCleared = clearedStages.includes(stage.stage_id);
        
        const card = document.createElement('div');
        // Kèm thêm class .is-cleared nếu người dùng đã vượt qua trạm
        card.className = `stage-card ${isStageCleared ? 'is-cleared' : ''}`;
        card.style.animation = `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.15}s both`;
        
        card.innerHTML = `
            <div class="stage-num">${stage.stage_id}</div>
            
            ${isStageCleared ? '<span class="clear-badge">✨ CLEAR</span>' : ''}
            
            <h3>${stage.title}</h3>
            <p>${stage.desc}</p>
            <button class="btn-start">
                ${isStageCleared ? 'Huấn luyện lại' : 'Bắt đầu huấn luyện'}
            </button>
        `;
        card.onclick = () => startGame(stage.stage_id);
        DOM.map.container.appendChild(card);
    });
}

function switchScreen(screenId) {
    Object.values(DOM.screens).forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        document.getElementById(screenId).classList.add('active');
    }, 50);
}

function startGame(stageId) {
    currentStage = gameData.find(s => s.stage_id === stageId);
    if (!currentStage) return;

    queue = JSON.parse(JSON.stringify(currentStage.questions));
    totalGoal = queue.length; 
    answeredCount = 0;

    switchScreen('screen-game');
    loadNextQuestion();
}

function backToMap() {
    DOM.modal.complete.classList.remove('active');
    switchScreen('screen-map');
}

// 3. KHỞI TẠO CÂU HỎI MỚI VÀ PHÂN BỔ SỰ KIỆN CLICK CHO Ô TRỐNG
function loadNextQuestion() {
    DOM.game.board.classList.add('fade-out');

    setTimeout(() => {
        currentQuestion = queue[0];
        userAnswers = new Array(currentQuestion.a.length).fill('');
        activeBlankIndex = 0;

        const percent = (answeredCount / totalGoal) * 100;
        DOM.game.pFill.style.width = `${percent}%`;
        DOM.game.pText.innerText = `${answeredCount}/${totalGoal}`;

        let sentenceHTML = currentQuestion.s;
        
        // Tự động biên dịch [Kanji|Furigana] thành thẻ <ruby>
        sentenceHTML = sentenceHTML.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');

        // Thay thế các vị trí điền trợ từ {p1}, {p2}...
        currentQuestion.a.forEach((ans, index) => {
            sentenceHTML = sentenceHTML.replace(`{p${index + 1}}`, `<span class="blank" id="b-${index}">?</span>`);
        });
        
        DOM.game.jp.innerHTML = sentenceHTML;
        DOM.game.vi.innerText = currentQuestion.v;

        // Đăng ký sự kiện click cho ô trống
        currentQuestion.a.forEach((ans, index) => {
            const blankEl = document.getElementById(`b-${index}`);
            blankEl.onclick = (e) => {
                e.stopPropagation();
                selectBlank(index);
            };
        });

        selectBlank(0);

        // Khởi tạo khay đáp án
        DOM.game.options.innerHTML = '';
        const shuffledOptions = [...currentQuestion.o].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.innerText = opt;
            btn.onclick = () => handleAnswer(opt);
            DOM.game.options.appendChild(btn);
        });

        updateNextButtonState();
        DOM.game.board.classList.remove('fade-out');
    }, 300);
}

// 4. ĐIỀU HƯỚNG Ô TRỐNG CHỦ ĐỘNG (BẬT/TẮT HIGHLIGHT)
function selectBlank(index) {
    activeBlankIndex = index;
    
    currentQuestion.a.forEach((ans, i) => {
        const el = document.getElementById(`b-${i}`);
        if (el) el.classList.remove('active');
    });

    const currentEl = document.getElementById(`b-${index}`);
    if (currentEl) {
        currentEl.classList.remove('filled-user', 'correct', 'error');
        currentEl.classList.add('active');
    }
}

// 5. ĐIỀN ĐÁP ÁN TẠM THỜI (HỦY KIỂM TRA NGAY LẬP TỨC)
function handleAnswer(selectedOpt) {
    if (activeBlankIndex === -1) return;

    userAnswers[activeBlankIndex] = selectedOpt;
    const blankElement = document.getElementById(`b-${activeBlankIndex}`);
    blankElement.innerText = selectedOpt;
    blankElement.className = 'blank filled-user';

    const nextEmptyIndex = userAnswers.findIndex(ans => ans === '');
    
    if (nextEmptyIndex !== -1) {
        selectBlank(nextEmptyIndex);
    } else {
        activeBlankIndex = -1;
    }
    
    updateNextButtonState();
}

// 6. CẬP NHẬT TRẠNG THÁI NÚT NEXT (CHỈ KÍCH HOẠT KHI ĐIỀN ĐỦ)
function updateNextButtonState() {
    const isReady = userAnswers.every(ans => ans !== '');
    if (isReady) {
        DOM.game.btnNext.classList.remove('disabled');
    } else {
        DOM.game.btnNext.classList.add('disabled');
    }
}

// 7. HÀM THẨM ĐỊNH TOÀN DIỆN KHI ẤN NÚT NEXT
function validateCurrentQuestion() {
    if (!userAnswers.every(ans => ans !== '')) return;

    let isAllCorrect = true;

    userAnswers.forEach((ans, i) => {
        const blankElement = document.getElementById(`b-${i}`);
        blankElement.classList.remove('active', 'filled-user');

        if (ans === currentQuestion.a[i]) {
            blankElement.classList.add('correct');
        } else {
            blankElement.classList.add('error');
            isAllCorrect = false;
        }
    });

    if (isAllCorrect) {
        answeredCount++;
        fireConfetti();
        showFeedback(true, currentQuestion.e);
    } else {
        userAnswers.forEach((ans, i) => {
            if (ans !== currentQuestion.a[i]) {
                const blankElement = document.getElementById(`b-${i}`);
                setTimeout(() => blankElement.classList.remove('error'), 500);
            }
        });
        
        queue.push(currentQuestion);
        showFeedback(false, currentQuestion.e);
    }
}

// 8. CÁC HIỆU ỨNG PHỤ (CONFETTI & PHẢN HỒI MODAL)
function fireConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff8fa3', '#a0c4ff', '#38b000', '#f9c74f'];
    
    for (let i = 0; i < 30; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        conf.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(conf);
        
        setTimeout(() => conf.remove(), 3000);
    }
}

function showFeedback(isCorrect, explanation) {
    DOM.modal.icon.className = `modal-icon ${isCorrect ? 'icon-success' : 'icon-error'}`;
    DOM.modal.icon.innerHTML = isCorrect ? '✓' : '✕';
    
    DOM.modal.title.innerText = isCorrect ? 'Tuyệt vời!' : 'Chưa chính xác rồi!';
    DOM.modal.title.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
    
    DOM.modal.desc.innerHTML = explanation;
    
    DOM.modal.btn.className = `btn-modal ${isCorrect ? 'success' : 'error'}`;
    DOM.modal.btn.innerText = isCorrect ? 'Tiếp tục hành trình' : 'Ghi nhớ & Làm lại sau';

    DOM.modal.overlay.classList.add('active');
}

// 9. LOGIC CHUYỂN CÂU VÀ LƯU KẾT QUẢ
function nextAction() {
    DOM.modal.overlay.classList.remove('active');
    queue.shift(); 

    setTimeout(() => {
        if (answeredCount >= totalGoal) {
            // LƯU TRẠNG THÁI CLEAR VÀO LOCALSTORAGE
            let clearedStages = JSON.parse(localStorage.getItem('nihongo_cute_cleared_stages')) || [];
            if (!clearedStages.includes(currentStage.stage_id)) {
                clearedStages.push(currentStage.stage_id);
                localStorage.setItem('nihongo_cute_cleared_stages', JSON.stringify(clearedStages));
                
                // Cập nhật lại bản đồ ngay lập tức
                renderMap(); 
            }

            DOM.game.pFill.style.width = '100%';
            DOM.game.pText.innerText = `${totalGoal}/${totalGoal}`;
            DOM.modal.complete.classList.add('active');
        } else {
            loadNextQuestion();
        }
    }, 400); 
}