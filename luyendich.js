/**
 * GAMIFIED TRANSLATION SYSTEM
 */

let translationDatabase = {};
let transHistoryLog = [];

// HỆ THỐNG PROFILE NGƯỜI CHƠI
let userProfile = {
    points: 0,
    streak: 0,
    lastDate: "",
    unlocked: ["8_xuoi", "8_nguoc"], // Bài 8 mặc định miễn phí
    inventory: { hint: 2, shield: 0 }, // Cho sẵn 2 bùa trợ giúp
    exp: 0
};

let currentTransSession = {
    selectedLessonKey: "",
    data: null,
    hintsUsedInThisSession: 0 // Đổi từ usedHint (true/false) thành số đếm số lần dùng bùa
};

const SHOP_ITEMS = [
    { id: "hint", name: "Bùa Trợ Giúp", icon: "fa-magic", price: 150, desc: "Dịch mẫu 1 câu khó nhất lúc đang làm bài." },
    { id: "shield", name: "Khiên Hồi Sinh", icon: "fa-shield-alt", price: 500, desc: "Bảo vệ chuỗi Streak không bị đứt nếu quên học 1 ngày." },
    { id: "unlock_9x", name: "Mở khóa Bài 9 (Xuôi)", icon: "fa-lock-open", price: 1000, desc: "Bài tập dịch Việt - Nhật Bài 9." },
    { id: "unlock_9n", name: "Mở khóa Bài 9 (Ngược)", icon: "fa-lock-open", price: 1000, desc: "Bài tập dịch Nhật - Việt Bài 9." }
];

document.addEventListener("DOMContentLoaded", async () => {
    loadLocalData();
    checkStreak();
    updateProfileUI();
    await loadTranslationData();
});

// 2. TỐI ƯU HÀM TẢI DỮ LIỆU (Thêm bộ lọc chống lỗi dữ liệu rỗng cho Nhật ký)
function loadLocalData() {
    try {
        const rawProfile = localStorage.getItem("ninja_profile");
        if (rawProfile) userProfile = { ...userProfile, ...JSON.parse(rawProfile) };
        
        const rawHistory = localStorage.getItem("ninja_history");
        if (rawHistory) {
            transHistoryLog = JSON.parse(rawHistory);
        }
        // Đảm bảo nhật ký luôn luôn là 1 mảng hợp lệ để không bị lỗi hàm .reverse() hoặc .forEach()
        if (!Array.isArray(transHistoryLog)) {
            transHistoryLog = [];
        }
    } catch (e) {
        console.error("Lỗi đọc bộ nhớ trình duyệt, khởi tạo lại nhật ký trống.", e);
        transHistoryLog = [];
    }
}

function renderHistoryDashboard() {
    const tbody = document.getElementById("historyTransTableBody");
    if (!tbody) return; // Phòng trường hợp HTML chưa tải xong phần bảng
    
    tbody.innerHTML = "";
    
    if (transHistoryLog.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999; padding: 20px;">📭 Bạn chưa có nhật ký dịch thuật nào. Hãy làm bài tập để tích lũy thành tích nhé!</td></tr>`;
        return;
    }

    // Đảo ngược mảng để bài mới làm luôn hiện lên trên đầu bảng
    [...transHistoryLog].reverse().forEach(rec => {
        tbody.innerHTML += `
            <tr>
                <td><i class="far fa-clock" style="color:#aaa;"></i> ${rec.date}</td>
                <td style="font-weight: 600; color: #2c3e50;">${rec.lesson}</td>
                <td style="color:#2ed573; font-weight:800; text-align: right; padding-right: 25px;">${rec.points}</td>
            </tr>
        `;
    });
}

function saveLocalData() {
    localStorage.setItem("ninja_profile", JSON.stringify(userProfile));
    localStorage.setItem("ninja_history", JSON.stringify(transHistoryLog));
    updateProfileUI();
}

// LOGIC CHUỖI STREAK
function checkStreak() {
    const today = new Date().toLocaleDateString("vi-VN");
    if (!userProfile.lastDate) return;
    
    // Nếu hôm nay đã học rồi thì bỏ qua
    if (userProfile.lastDate === today) return; 

    const last = new Date(userProfile.lastDate.split('/').reverse().join('-'));
    const now = new Date(today.split('/').reverse().join('-'));
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        if (userProfile.inventory.shield > 0) {
            userProfile.inventory.shield--;
            alert("Bạn đã quên học! Hệ thống tự động dùng 1 Khiên Hồi Sinh để giữ Streak.");
        } else {
            alert("Rất tiếc! Chuỗi Streak của bạn đã bị đứt do nghỉ học quá 1 ngày.");
            userProfile.streak = 0;
        }
        saveLocalData();
    }
}

// CẬP NHẬT GIAO DIỆN HEADER & DANH HIỆU
function updateProfileUI() {
    document.getElementById("uiPoints").textContent = userProfile.points;
    document.getElementById("uiStreak").textContent = userProfile.streak;
    document.getElementById("uiHintCount").textContent = userProfile.inventory.hint;
    
    let badge = "Ninja Tập Sự";
    if (userProfile.points > 1000) badge = "Sát Thủ Dịch Thuật";
    if (userProfile.points > 5000) badge = "Võ Sĩ Đoạn Văn";
    if (userProfile.points > 20000) badge = "Huyền Thoại Dịch";
    document.getElementById("uiBadge").textContent = badge;
}

// TẢI DATA & HIỂN THỊ MENU KHÓA/MỞ
async function loadTranslationData() {
    try {
        const response = await fetch('data/translation_data.json');
        translationDatabase = await response.json();
    } catch (e) {
        console.warn("Chạy offline.", e);
    }
    
    const selectEl = document.getElementById("singleLessonSelect");
    selectEl.innerHTML = "";
    Object.keys(translationDatabase).forEach(key => {
        let isUnlocked = userProfile.unlocked.includes(key);
        let opt = document.createElement("option");
        opt.value = key;
        opt.textContent = (isUnlocked ? "🟢 " : "🔒 ") + translationDatabase[key].title;
        selectEl.appendChild(opt);
    });
}

// 1. SỬA LỖI HÀM CHUYỂN MÀN HÌNH (Bỏ hoàn toàn biến 'event' gây crash)
function showSection(id) {
    // Ẩn toàn bộ các màn hình game và hiển thị màn hình mục tiêu
    document.querySelectorAll(".game-section").forEach(s => s.classList.remove("active"));
    const targetSection = document.getElementById(id);
    if (targetSection) targetSection.classList.add("active");
    
    // Gỡ bỏ class active ở tất cả các nút trên thanh Menu Điều hướng
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    
    // TỰ ĐỘNG KÍCH HOẠT ĐÚNG NÚT MENU DỰA VÀO ID MÀN HÌNH (An toàn, không lo crash)
    let navId = "";
    if (id === "setupScreen" || id === "gameScreen") navId = "nav-play";
    else if (id === "shopScreen") navId = "nav-shop";
    else if (id === "historyScreen") navId = "nav-history";
    
    const activeNav = document.getElementById(navId);
    if (activeNav) activeNav.classList.add("active");
}

// VÀO TRẬN
function startTranslationGame() {
    const key = document.getElementById("singleLessonSelect").value;
    if (!userProfile.unlocked.includes(key)) {
        alert("Bài học này đang bị khóa! Hãy vào Chợ Ninja để mua quyền mở khóa.");
        return;
    }

    currentTransSession.selectedLessonKey = key;
    currentTransSession.data = translationDatabase[key];
    currentTransSession.hintsUsedInThisSession = 0; // Đặt lại số lần dùng bùa về 0
    
    document.getElementById("transResultZone").style.display = "none";
    
    // Làm sạch và ẩn danh sách gợi ý cũ của bài trước
    const hintList = document.getElementById("hintRevealList");
    hintList.innerHTML = "";
    hintList.style.display = "none";
    
    document.getElementById("btnUseHint").disabled = false;
    
    const data = currentTransSession.data;
    document.getElementById("transPromptText").textContent = data.full_prompt;
    document.getElementById("sentenceCount").textContent = data.breakdown.length;
    
    const dirBadge = document.getElementById("transDirectionBadge");
    if (data.type === "vi-jp") {
        dirBadge.innerHTML = "🇻🇳 VIỆT ➔ 🇯🇵 NHẬT";
        dirBadge.style.backgroundColor = "#ffe3e3"; dirBadge.style.color = "#ff4757";
    } else {
        dirBadge.innerHTML = "🇯🇵 NHẬT ➔ 🇻🇳 VIỆT";
        dirBadge.style.backgroundColor = "#e3f2fd"; dirBadge.style.color = "#2196f3";
    }
    
    document.getElementById("transPlayerInput").value = "";
    document.getElementById("transPlayerInput").disabled = false;
    document.getElementById("btnSubmitTrans").disabled = false;
    showSection("gameScreen");
}

// SỬ DỤNG BÙA TRỢ GIÚP
function useHintScroll() {
    // 1. Kiểm tra túi đồ xem còn bùa không
    if (userProfile.inventory.hint <= 0) {
        alert("Bạn đã hết Bùa Trợ Giúp! Mua thêm ở Chợ Ninja nhé.");
        return;
    }

    const data = currentTransSession.data;
    const currentHintIndex = currentTransSession.hintsUsedInThisSession;

    // 2. Kiểm tra xem đã lật hết số câu trong bài chưa
    if (currentHintIndex >= data.breakdown.length) {
        alert("Bạn đã lật mở gợi ý cho toàn bộ các câu trong bài này rồi!");
        document.getElementById("btnUseHint").disabled = true;
        return;
    }

    // 3. Trừ bùa và tăng số lần đã sử dụng trong bài này lên
    userProfile.inventory.hint--;
    currentTransSession.hintsUsedInThisSession++;
    saveLocalData(); // Cập nhật lại số lượng bùa trên thanh Profile Topbar
    
    // 4. Lấy dữ liệu câu hiện tại ra để hiển thị
    const targetSentence = data.breakdown[currentHintIndex];
    const hintList = document.getElementById("hintRevealList");
    
    // Thêm câu gợi ý mới vào danh sách (giữ lại các câu đã lật trước đó)
    hintList.innerHTML += `
        <li style="margin-bottom: 8px; border-bottom: 1px dashed #b2bec3; padding-bottom: 5px;">
            <strong style="color: #e67e22;"><i class="fas fa-lightbulb"></i> Gợi ý câu ${currentHintIndex + 1}:</strong> 
            <span class="jpan-text" style="font-weight: 700;">${targetSentence.answer}</span>
        </li>`;
    hintList.style.display = "block";

    // 5. Nếu vừa lật đến câu cuối cùng của bài, vô hiệu hóa nút bấm luôn
    if (currentTransSession.hintsUsedInThisSession >= data.breakdown.length) {
        document.getElementById("btnUseHint").disabled = true;
    }
}

function submitTranslationAnswer() {
    document.getElementById("transPlayerInput").disabled = true;
    document.getElementById("btnSubmitTrans").disabled = true;
    document.getElementById("btnUseHint").disabled = true;
    
    const data = currentTransSession.data;
    document.getElementById("transCorrectAnswerText").textContent = data.full_answer;
    
    const container = document.getElementById("breakdownContainer");
    container.innerHTML = "";
    data.breakdown.forEach(item => {
        container.innerHTML += `
            <div class="breakdown-item" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: #fafafa;">
                <div style="font-weight: 700; color: #2c3e50;">Gốc: ${item.prompt}</div>
                <div style="font-weight: 800; color: #8e44ad; margin: 5px 0;">Mẫu: ${item.answer}</div>
                <div style="font-size: 0.9rem; color: #7f8c8d;"><i>Giải thích: ${item.explanation}</i></div>
            </div>`;
    });
    
    document.getElementById("transResultZone").style.display = "block";
}

// TÍNH ĐIỂM ĐỘNG (GAMIFICATION LOGIC)
function rateTransSelf(isGood) {
    const data = currentTransSession.data;
    
    // 1. Điểm gốc: Số câu x 30
    let basePoints = data.breakdown.length * 30;
    
    // 2. Cơ chế phạt điểm bùa mới: 
    // Nếu hoàn toàn KHÔNG dùng bùa nào: Thưởng trọn vẹn +100 điểm.
    // Nếu CÓ dùng bùa: Cứ mỗi câu lật ra sẽ bị trừ 20 điểm (trừ tối đa đến khi bằng 0, không âm điểm gốc)
    if (currentTransSession.hintsUsedInThisSession === 0) {
        basePoints += 100; 
    } else {
        let penalty = currentTransSession.hintsUsedInThisSession * 20;
        basePoints = Math.max(basePoints - penalty, data.breakdown.length * 10); // Điểm gốc tối thiểu không thấp hơn (Số câu x 10)
    }
    
    // 3. Hệ số đánh giá (Tốt giữ nguyên, Cần cải thiện giảm một nửa)
    let finalPoints = isGood ? basePoints : Math.floor(basePoints * 0.5);
    
    // 4. Hệ số nhân chuỗi Streak (Tối đa x1.5)
    let streakMultiplier = 1 + (Math.min(userProfile.streak, 10) * 0.05);
    finalPoints = Math.floor(finalPoints * streakMultiplier);
    
    // Cập nhật điểm vào Hồ sơ
    userProfile.points += finalPoints;
    
    const today = new Date().toLocaleDateString("vi-VN");
    if (userProfile.lastDate !== today) {
        userProfile.streak += 1;
        userProfile.lastDate = today;
    }
    
    transHistoryLog.push({
        date: today,
        lesson: data.title,
        points: `+${finalPoints}`
    });
    
    saveLocalData();
    alert(`🎉 Hoàn thành! Nhận được ${finalPoints} Ninjacoin. (Đã dùng ${currentTransSession.hintsUsedInThisSession} bùa trợ giúp)`);
    loadTranslationData(); 
    showSection("setupScreen");
}

// CHỢ NINJA
// 1. CHỈ KHAI BÁO CÁC VẬT PHẨM TIÊU HAO CỐ ĐỊNH (Không khai báo bài học ở đây nữa)
const STANDARD_SHOP_ITEMS = [
    { id: "hint", type: "consumable", name: "Bùa Trợ Giúp", icon: "fa-magic", price: 150, desc: "Dịch mẫu 1 câu khó nhất lúc đang làm bài." },
    { id: "shield", type: "consumable", name: "Khiên Hồi Sinh", icon: "fa-shield-alt", price: 500, desc: "Bảo vệ chuỗi Streak không bị đứt." }
];

// 2. HÀM TỰ ĐỘNG LẤY DANH SÁCH SẢN PHẨM (Tự động nạp bài học vào Shop)
function getShopItems() {
    // Copy các vật phẩm tiêu hao vào mảng hiển thị
    let items = [...STANDARD_SHOP_ITEMS];

    // Quy định những bài học miễn phí mặc định không bán trong Shop
    const defaultFreeLessons = ["8_xuoi", "8_nguoc"]; 

    // Quét toàn bộ database bài học, tự động biến các bài còn lại thành Hàng Hóa
    for (const key in translationDatabase) {
        if (!defaultFreeLessons.includes(key)) {
            items.push({
                id: `unlock_${key}`, // Tự tạo ID động, ví dụ: unlock_9_xuoi
                type: "unlock",
                lessonKey: key,      // Lưu chính xác ID của bài học để check
                name: `Mở khóa: ${translationDatabase[key].title}`,
                icon: "fa-lock",
                price: 1000,         // Giá mặc định cho 1 bài mới
                desc: translationDatabase[key].type === 'vi-jp' ? 'Dịch từ Việt sang Nhật' : 'Dịch từ Nhật sang Việt'
            });
        }
    }
    return items;
}

// 3. HÀM RENDER SHOP ĐÃ ĐƯỢC FIX LỖI "MUA RỒI VẪN HIỆN"
function renderShop() {
    const grid = document.getElementById("shopGrid");
    grid.innerHTML = "";
    
    // Lấy danh sách tổng hợp (Bao gồm Bùa/Khiên + Các bài học tự động tạo)
    const allItems = getShopItems();

    allItems.forEach(item => {
        let isOwned = false;
        
        // Chỉ check 'isOwned' nếu nó là dạng mua đứt (unlock)
        if (item.type === "unlock") {
            isOwned = userProfile.unlocked.includes(item.lessonKey);
        }

        grid.innerHTML += `
            <div class="shop-card" style="${isOwned ? 'opacity: 0.6; pointer-events: none;' : ''}">
                <i class="fas ${item.icon} shop-icon"></i>
                <h3>${item.name}</h3>
                <p style="font-size:0.9rem; color:#666; height: 40px;">${item.desc}</p>
                <div class="price-tag">${item.price} Coin</div><br>
                <button class="btn ${isOwned ? 'btn-success' : 'btn-submit'}" 
                        ${isOwned ? 'disabled' : ''} 
                        onclick="buyItem('${item.id}')">
                    ${isOwned ? '<i class="fas fa-check"></i> Đã mở khóa' : '<i class="fas fa-shopping-cart"></i> Mua ngay'}
                </button>
            </div>
        `;
    });
}

// 4. HÀM XỬ LÝ MUA HÀNG BẢO MẬT HƠN
function buyItem(itemId) {
    const allItems = getShopItems();
    const item = allItems.find(i => i.id === itemId);

    if (!item) return;

    // Check bảo mật: Tránh trường hợp user dùng F12 hack nút HTML để mua lại
    if (item.type === "unlock" && userProfile.unlocked.includes(item.lessonKey)) {
        alert("Bạn đã sở hữu bài học này rồi!");
        return;
    }

    // Check tiền
    if (userProfile.points < item.price) {
        alert("Bạn không đủ Ninjacoin! Hãy luyện dịch thêm để kiếm tiền nhé.");
        return;
    }
    
    // Tiến hành thanh toán
    if(confirm(`Bạn có chắc muốn mua "${item.name}" với giá ${item.price} coin?`)) {
        userProfile.points -= item.price;
        
        if (item.type === "consumable") {
            // Cộng item vào túi đồ
            if (item.id === "hint") userProfile.inventory.hint++;
            if (item.id === "shield") userProfile.inventory.shield++;
        } else if (item.type === "unlock") {
            // Đẩy ID bài học vào mảng đã mở khóa
            userProfile.unlocked.push(item.lessonKey);
        }
        
        saveLocalData();
        renderShop();            // Load lại nút Mua thành Đã mở khóa
        loadTranslationData();   // Load lại select box ở Sảnh Tập (Tắt icon khóa)
        alert("Mua thành công!");
    }
}

/**
 * HÀM RESET TOÀN BỘ TIẾN TRÌNH (XÓA SẠCH DỮ LIỆU)
 */
function resetGameProgress() {
    // Bước 1: Cảnh báo lần đầu tiên
    const firstConfirm = confirm(
        "⚠️ CẢNH BÁO NGUY HIỂM!\nHành động này sẽ xóa vĩnh viễn:\n" +
        "- Toàn bộ số Ninjacoin tích lũy\n" +
        "- Chuỗi ngày học (Streak)\n" +
        "- Tất cả vật phẩm (Bùa, Khiên) trong túi đồ\n" +
        "- Khóa lại tất cả các bài học bạn đã mua.\n\n" +
        "Bạn có thực sự muốn tiếp tục không?"
    );
    
    if (!firstConfirm) return; // Nếu chọn Cancel thì dừng lại

    // Bước 2: Xác nhận nghiêm túc lần hai để tránh việc bấm nhầm
    const secondConfirm = confirm(
        "🔥 BẠN CÓ CHẮC CHẮN LẦN NỮA KHÔNG?\n" +
        "Dữ liệu sau khi xóa sẽ KHÔNG THỂ KHÔI PHỤC được nữa. Hãy suy nghĩ kỹ!"
    );
    
    if (!secondConfirm) return;

    // Bước 3: Tiến hành xóa sạch dữ liệu trong LocalStorage
    localStorage.removeItem("ninja_profile");
    localStorage.removeItem("ninja_history");

    // Bước 4: Khôi phục đối tượng dữ liệu về trạng thái ban đầu của người chơi mới
    userProfile = {
        points: 0,
        streak: 0,
        lastDate: "",
        unlocked: ["8_xuoi", "8_nguoc"], // Chỉ mở khóa sẵn Bài 8 mặc định
        inventory: { hint: 2, shield: 0 }, // Tặng lại 2 bùa trợ giúp tân thủ
        exp: 0
    };
    transHistoryLog = [];

    // Bước 5: Đồng bộ lại dữ liệu mới lên LocalStorage và cập nhật giao diện toàn hệ thống
    saveLocalData();         // Cập nhật lại điểm, chuỗi học về 0 trên màn hình
    loadTranslationData();   // Khóa lại các bài học trong ô Chọn bài tập

    // Đưa người dùng về màn hình chính (nếu họ đang mở tab khác)
    showSection('setupScreen');

    alert("🎉 Đã xóa toàn bộ tiến trình thành công! Chúc bạn có một hành trình học tiếng Nhật mới thật nhiều niềm vui.");
}