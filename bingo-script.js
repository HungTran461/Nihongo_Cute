/**
 * GACHAPON KANJI BINGO ULTRA ENGINE - NIHONGO CUTE
 * Quy trình xử lý hạt nhuyễn Canvas và Hệ thống âm thanh độc lập ASMR.
 */

let databaseKanjiPool = [];
let userTrayKanji = [];
let pulledHistory = [];
let activatedStateGrid = Array(25).fill(false);
activatedStateGrid[12] = true; // Ô FREE trung tâm

let currentPulledToken = null;
let currentBingoLinesCount = 0;
let isMachineProcessing = false;

// 1. ENGINE XỬ LÝ HẠT CANVAS (Hiệu ứng khi nhấn trúng bánh)
const ParticleVisuals = {
    canvas: null,
    ctx: null,
    particlesArray: [],
    colors: ['#ff9a9e', '#fad0c4', '#fecfef', '#a18cd1', '#a6f1e0'],

    init() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    },
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    spawnBurst(x, y) {
        for (let i = 0; i < 25; i++) {
            this.particlesArray.push({
                x: x,
                y: y,
                size: Math.random() * 6 + 4,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                alpha: 1,
                decay: Math.random() * 0.02 + 0.015
            });
        }
    },
    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.particlesArray.length; i++) {
            let p = this.particlesArray[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.1; // Trọng lực nhẹ rơi xuống
            p.alpha -= p.decay;

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            // Vẽ hạt dạng hình tròn mềm mại
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            if (p.alpha <= 0) {
                this.particlesArray.splice(i, 1);
                i--;
            }
        }
    }
};

// 2. ENGINE ÂM THANH KỸ THUẬT SỐ ASMR (Web Audio API)
const AudioAsmrEngine = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    // Âm thanh lún sâu dẻo quánh khi chạm vào bánh dẻo Claymorphism
    playSquishyPop() {
        this.init();
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    },
    playErrorBuzz() {
        this.init();
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    },
    playEggCrack() {
        this.init();
        // Tiếng vỡ đôi cơ khí tách rời ròn rã
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    },
    playMagicChime() {
        this.init();
        const now = this.ctx.currentTime;
        const melody = [523.25, 659.25, 783.99, 987.77, 1046.50]; // Hợp âm rải lấp lánh Major 7th ngọt ngào
        melody.forEach((freq, index) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.06);
            gain.gain.setValueAtTime(0.25, now + index * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.5);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now + index * 0.06); osc.stop(now + index * 0.06 + 0.5);
        });
    }
};

// Khởi chạy hệ thống nền tảng
document.addEventListener("DOMContentLoaded", () => {
    ParticleVisuals.init();
    fetchDatabaseAndStart();
});

async function fetchDatabaseAndStart() {
    try {
        const res = await fetch('data/kanji-gacha-data.json');
        databaseKanjiPool = await res.json();
        initiateNewGame();
    } catch (err) {
        console.error("Lỗi nạp database:", err);
        alert("Không thể khởi động kho từ vựng!");
    }
}

function initiateNewGame() {
    pulledHistory = [];
    activatedStateGrid = Array(25).fill(false);
    activatedStateGrid[12] = true;
    currentPulledToken = null;
    currentBingoLinesCount = 0;
    isMachineProcessing = false;

    document.getElementById('txtCalled').innerText = "0/35";
    document.getElementById('txtLines').innerText = "0";
    document.getElementById('clueBody').innerHTML = `<p style="color: #bbb; font-style: italic; font-size: 0.9rem;">Đang đợi cậu xoay trục cơ khí...</p>`;
    
    resetEggUI();
    changeMascotEmotion("idle", "Khay bánh dẻo mới tinh mềm mượt đã sẵn sàng! Quay trứng thôi cậu ơi! 🍡");
    shuffleAndBuildTray();
    renderTrayUI();
}

function resetEggUI() {
    const egg = document.getElementById('eggContainer');
    egg.className = "egg-container";
    egg.style.display = "none";
}

function shuffleAndBuildTray() {
    let rawShuffled = [...databaseKanjiPool].sort(() => 0.5 - Math.random());
    userTrayKanji = [];
    let poolIndex = 0;

    for (let i = 0; i < 25; i++) {
        if (i === 12) {
            userTrayKanji.push({ c: "★ FREE", h: "Ô THƯỞNG", m: "Ô tự do", type: "free" });
        } else {
            userTrayKanji.push(rawShuffled[poolIndex]);
            poolIndex++;
        }
    }
}

function renderTrayUI() {
    const gridContainer = document.getElementById('wagashiGrid');
    gridContainer.innerHTML = '';

    userTrayKanji.forEach((cake, idx) => {
        const cell = document.createElement('div');
        cell.className = 'wagashi-cell';
        cell.setAttribute('data-flavor', cake.type);
        
        if (idx === 12) cell.classList.add('free-cake', 'marked-cake');

        cell.innerHTML = `
            <div class="cell-kj">${cake.c}</div>
            <div class="cell-hv">${cake.h}</div>
        `;

        cell.addEventListener('click', (e) => onWagashiCakeClicked(e, idx));
        gridContainer.appendChild(cell);
    });
}

// Cấu hình vật lý cho lồng cầu
const GachaPhysicsEngine = {
    balls: [],
    containerRadius: 94, // Bán kính thực tế bên trong lồng kính trừ độ dày và viền bóng
    centerX: 102,       // Tâm X lồng kính (220px / 2 - viền)
    centerY: 102,       // Tâm Y lồng kính
    animationFrameId: null,
    isShaking: false,
    
    // Bảng màu kẹo dẻo cho bóng
    colors: [
        { main: '#ff9a9e', dark: '#ff758c' }, // Dâu
        { main: '#a6f1e0', dark: '#76d7c4' }, // Matcha
        { main: '#ffeaa7', dark: '#f1c40f' }, // Vani
        { main: '#a18cd1', dark: '#884ea0' }, // Khoai lang
        { main: '#fad0c4', dark: '#f5b041' }  // Việt quất
    ],

    // Tạo các viên bóng ban đầu nằm yên ở đáy lồng cầu
    setupBalls() {
        const pool = document.getElementById('capsulePool');
        pool.innerHTML = '';
        this.balls = [];

        // Khởi tạo 18 viên bóng ngẫu nhiên tạo độ đặc cho lồng kính
        for (let i = 0; i < 18; i++) {
            const colorPair = this.colors[i % this.colors.length];
            const ballEl = document.createElement('div');
            ballEl.className = 'physics-ball';
            ballEl.style.setProperty('--ball-color', colorPair.main);
            ballEl.style.setProperty('--ball-dark', colorPair.dark);
            pool.appendChild(ballEl);

            // Vị trí xếp chồng tự nhiên dưới đáy lồng cầu lúc ban đầu
            const angle = Math.PI * (0.2 + Math.random() * 0.6); // Chỉ nằm góc dưới nửa vòng tròn
            const distance = 50 + Math.random() * 30;

            this.balls.push({
                element: ballEl,
                x: this.centerX + Math.cos(angle) * distance - 16, // Trừ tâm viên bóng 16px
                y: this.centerY + Math.sin(angle) * distance - 16,
                vx: 0,
                vy: 0,
                radius: 16
            });
        }
        this.updateElements();
    },

    // Cập nhật vị trí CSS cho từng viên bóng
    updateElements() {
        this.balls.forEach(ball => {
            ball.element.style.transform = `translate3d(${ball.x}px, ${ball.y}px, 0)`;
        });
    },

    // Bắt đầu nhồi và tạo lực đẩy ly tâm cực đại (Khi người dùng vặn trục gacha)
    startPhysicsShake() {
        this.isShaking = true;
        this.balls.forEach(ball => {
            // Bắn tung tóe vận tốc ngẫu nhiên lên cao theo mọi hướng
            ball.vx = (Math.random() - 0.5) * 35;
            ball.vy = (Math.random() - 0.7) * 40; 
        });
        this.runPhysicsLoop();
    },

    // Dừng xáo trộn bóng, đưa bóng trở lại trạng thái rơi tự do về đáy lồng
    stopPhysicsShake() {
        this.isShaking = false;
    },

    // Vòng lặp tính toán tọa độ vật lý thời gian thực
    runPhysicsLoop() {
        if (!this.isShaking && this.balls.every(b => Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.2)) {
            // Dừng hẳn vòng lặp nếu máy đã tắt lắc và bóng đã nằm im ở đáy để tiết kiệm hiệu năng CPU
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        this.balls.forEach((ball, idx) => {
            if (this.isShaking) {
                // Nếu đang lắc liên tục, bổ sung thêm xung lực hỗn loạn liên tục từ cánh quạt gạt bánh
                ball.vx += (Math.random() - 0.5) * 4;
                ball.vy += (Math.random() - 0.5) * 4;
            } else {
                // Nếu hết lắc, áp dụng trọng lực (Gravity) kéo bóng rơi xuống đáy
                ball.vy += 1.2;
                // Áp dụng lực ma sát không khí làm chậm dần chuyển động (Damping)
                ball.vx *= 0.95;
                ball.vy *= 0.95;
            }

            // Thay đổi tọa độ theo vận tốc hiện hành
            ball.x += ball.vx;
            ball.y += ball.vy;

            // THUẬT TOÁN KIỂM TRA VA CHẠM BIÊN VÒNG TRÒN (LỒNG KÍNH KHỐI CẦU)
            // Tính khoảng cách từ tâm viên bóng đến tâm lồng kính
            const ballCenterX = ball.x + ball.radius;
            const ballCenterY = ball.y + ball.radius;
            const dx = ballCenterX - this.centerX;
            const dy = ballCenterY - this.centerY;
            const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

            // Giới hạn biên tối đa viên bóng có thể di chuyển ra xa tâm lồng kính
            const maxDistance = this.containerRadius - ball.radius;

            if (distanceToCenter > maxDistance) {
                // Chuẩn hóa Vector hướng va chạm biên
                const nx = dx / distanceToCenter;
                const ny = dy / distanceToCenter;

                // Đẩy viên bóng ngược lại vào trong lòng kính để không bị lọt ra ngoài rìa
                ball.x = this.centerX + nx * maxDistance - ball.radius;
                ball.y = this.centerY + ny * maxDistance - ball.radius;

                // Tính toán phản xạ vận tốc (Lực nảy bật ngược trở lại góc đối xứng)
                const dotProduct = ball.vx * nx + ball.vy * ny;
                const restitution = 0.65; // Hệ số đàn hồi của viên kẹo dẻo (0.65 = Nảy vừa phải tinh nghịch)
                
                ball.vx = ball.vx - (1 + restitution) * dotProduct * nx;
                ball.vy = ball.vy - (1 + restitution) * dotProduct * ny;
            }
        });

        this.updateElements();
        this.animationFrameId = requestAnimationFrame(() => this.runPhysicsLoop());
    }
};

// Hàm điều khiển sự kiện click quay Gacha mới kết hợp Vật lý chuyển động
function triggerPhysicsGachaDraw() {
    if (isMachineProcessing) return;

    let availableWords = databaseKanjiPool.filter(item => !pulledHistory.some(h => h.c === item.c));
    if (availableWords.length === 0) {
        changeMascotEmotion("idle", "Hết sạch kẹo trong lồng rồi cậu ơi! Nhấp làm khay mới nha!");
        return;
    }

    isMachineProcessing = true;
    AudioAsmrEngine.playSquishyPop(); // Phát âm thanh xoay cơ khí trục

    const crank = document.getElementById('gachaCrank');
    const machine = document.getElementById('gachaMachine');
    const egg = document.getElementById('eggContainer');

    crank.classList.add('rotating');
    machine.classList.add('shaking');
    
    egg.className = "egg-container";
    egg.style.display = "none"; // Ẩn trứng cũ đi

    // 🚀 KÍCH HOẠT LẮC BÓNG VẬT LÝ TRONG KÍNH
    GachaPhysicsEngine.startPhysicsShake();
    changeMascotEmotion("idle", "Lồng cầu đang quay dữ dội quá! Quả trứng may mắn nào sẽ bắn ra đây... 👀");

    // Thả xáo trộn bóng trong vòng 1.5 giây để nhìn chuyển động cực kỳ bắt mắt
    setTimeout(() => {
        crank.classList.remove('rotating');
        machine.classList.remove('shaking');
        
        // 🛑 TẮT LẮC (Bóng tự động nảy nhẹ rơi xuống ổn định lại đáy lòng kính)
        GachaPhysicsEngine.stopPhysicsShake();

        currentPulledToken = availableWords[Math.floor(Math.random() * availableWords.length)];
        pulledHistory.push(currentPulledToken);

        document.getElementById('eggCore').innerText = currentPulledToken.c;
        
        // ---- ĐÂY LÀ DÒNG FIX LỖI ẨN TRỨNG ----
        egg.style.display = "block"; 
        // -------------------------------------

        egg.classList.add('animate-drop');
        document.getElementById('txtCalled').innerText = `${pulledHistory.length}/35`;

        setTimeout(() => {
            egg.classList.add('crackOpen');
            AudioAsmrEngine.playEggCrack();

            document.getElementById('clueBody').innerHTML = `
                <div class="clue-label" style="font-size:0.8rem; color:#aaa; font-weight:700;">HÁN VIỆT:</div>
                <div class="clue-hv">${currentPulledToken.h}</div>
                <div class="clue-m">Nghĩa: ${currentPulledToken.m}</div>
                <div class="clue-r">(On: ${currentPulledToken.on} | Kun: ${currentPulledToken.kun})</div>
            `;
            changeMascotEmotion("idle", `Tách vỏ thành công! Ô kìa, là chữ [${currentPulledToken.h}]. Tìm nhanh nào! 🎉`);
            isMachineProcessing = false;
            speakJapaneseVoice(currentPulledToken.c);
        }, 600);

    }, 1500);
}

// Bổ sung lệnh chạy khởi tạo bóng vật lý lúc tải trang xong
document.addEventListener("DOMContentLoaded", () => {
    ParticleVisuals.init();
    fetchDatabaseAndStart();
    // Chạy Engine nạp bóng vật lý lúc trang sẵn sàng
    setTimeout(() => { GachaPhysicsEngine.setupBalls(); }, 600);
});

// Thêm lệnh setup lại bóng vào cuối hàm khởi tạo ván mới `initiateNewGame()`
// GachaPhysicsEngine.setupBalls();

// 4. LOGIC CHẠM BÁNH VÀ BẮN VỤN SÁNG
function onWagashiCakeClicked(event, index) {
    if (index === 12 || isMachineProcessing) return;
    if (activatedStateGrid[index]) return;

    const targetCake = userTrayKanji[index];
    const cellsUI = document.querySelectorAll('.wagashi-cell');
    let isValidSelection = pulledHistory.some(h => h.c === targetCake.c);

    if (isValidSelection) {
        activatedStateGrid[index] = true;
        cellsUI[index].classList.add('marked-cake');
        
        // Kích hoạt bắn hạt lấp lánh tại tọa độ chuột vừa nhấn
        ParticleVisuals.spawnBurst(event.clientX, event.clientY);
        AudioAsmrEngine.playSquishyPop(); // Tiếng lún bánh ngậy dẻo

        changeMascotEmotion("happy", `Tuyệt cú mèo! Chữ [${targetCake.c}] đúng là [${targetCake.h}] rồi! ✨`);
        verifyBingoWinScenarios();
    } else {
        cellsUI[index].classList.add('shake-error');
        AudioAsmrEngine.playErrorBuzz();
        changeMascotEmotion("idle", `Sai mất rồi! Viên kẹo [${targetCake.h}] chưa được mở ra đâu nhé! 😿`);
        
        setTimeout(() => { cellsUI[index].classList.remove('shake-error'); }, 400);
    }
}

function verifyBingoWinScenarios() {
    let foundLines = 0;
    const cellsUI = document.querySelectorAll('.wagashi-cell');
    const winMatrices = [
        [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
        [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
        [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
    ];

    winMatrices.forEach(linePattern => {
        if (linePattern.every(cellIdx => activatedStateGrid[cellIdx])) {
            foundLines++;
            linePattern.forEach(cellIdx => cellsUI[cellIdx].classList.add('line-glow'));
        }
    });

    document.getElementById('txtLines').innerText = foundLines;

    if (foundLines > currentBingoLinesCount) {
        currentBingoLinesCount = foundLines;
        AudioAsmrEngine.playMagicChime(); // Chuông tiên reo ngân vang khi kết nối hàng thành công
        launchVictoryDisplay(foundLines);
    }
}

function changeMascotEmotion(statusClass, quoteText) {
    const mascotBox = document.getElementById('mascotBox');
    const bubble = document.getElementById('mascotBubble');
    mascotBox.classList.remove('happy');
    if (statusClass === 'happy') mascotBox.classList.add('happy');
    bubble.innerText = quoteText;
}

function launchVictoryDisplay(totalLines) {
    document.getElementById('mCalled').innerText = pulledHistory.length;
    document.getElementById('mLines').innerText = totalLines;
    document.getElementById('victoryOverlay').classList.add('activate');
    changeMascotEmotion("happy", "Bingo rồi kìa! Khay kẹo dẻo phát sáng đẹp mắt quá đi mất! 🌸👑");
}

function hideVictoryScreen() {
    document.getElementById('victoryOverlay').classList.remove('activate');
}

function speakJapaneseVoice(textCharacters) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let voiceMessage = new SpeechSynthesisUtterance(textCharacters);
        voiceMessage.lang = 'ja-JP';
        voiceMessage.rate = 0.75; // Tốc độ chuẩn ASMR thư giãn thính giác
        window.speechSynthesis.speak(voiceMessage);
    }
}