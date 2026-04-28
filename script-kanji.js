let fullKanjiData = []; // Biến toàn cục lưu trữ dữ liệu JSON

document.addEventListener("DOMContentLoaded", () => {
    initKanjiApp();
});

// Hàm khởi tạo ứng dụng
async function initKanjiApp() {
    try {
        const response = await fetch('data/kanji_logic.json');
        fullKanjiData = await response.json();
        
        if (fullKanjiData.length > 0) {
            renderTabs(); 
            renderTree(fullKanjiData[0].root_id); // Mặc định hiển thị cây đầu tiên
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu JSON:", error);
        document.getElementById('kanjiTree').innerHTML = 
            "<p style='color:red;'>Không thể tải dữ liệu. Hãy đảm bảo bạn đang chạy qua Live Server.</p>";
    }
}

// 1. Tạo các nút bấm (Tabs) chọn Bộ thủ
function renderTabs() {
    const selectorContainer = document.getElementById('rootSelector');
    
    let tabsHTML = fullKanjiData.map((item, index) => {
        let activeClass = index === 0 ? 'active' : '';
        return `
            <button class="root-btn ${activeClass}" 
                    onclick="switchRoot('${item.root_id}', this)">
                ${item.root_name} (${item.data.kanji})
            </button>
        `;
    }).join('');
    
    selectorContainer.innerHTML = tabsHTML;
}

// 2. Chuyển đổi khi bấm nút Tab
function switchRoot(rootId, btnElement) {
    // Đổi màu nút active
    document.querySelectorAll('.root-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Vẽ lại sơ đồ cây
    renderTree(rootId);
}

// 3. Hàm kích hoạt vẽ cây
function renderTree(rootId) {
    const rootData = fullKanjiData.find(item => item.root_id === rootId);
    const treeContainer = document.getElementById('kanjiTree');
    
    if (rootData) {
        // Tạo hiệu ứng mờ dần khi chuyển đổi
        treeContainer.style.opacity = 0;
        setTimeout(() => {
            treeContainer.innerHTML = `<ul>${buildTreeRecursive(rootData.data, true)}</ul>`;
            treeContainer.style.opacity = 1;
        }, 200);
    }
}

// 4. Hàm Đệ Quy (Vẽ HTML từng nhánh con) - Tối ưu bằng Data Attributes
function buildTreeRecursive(node, isRoot = false) {
    let html = `<li>`;
    let rootClass = isRoot ? 'root-node' : '';
    
    // Gắn dữ liệu vào các thẻ data- để an toàn tuyệt đối với mọi loại ký tự đặc biệt
    html += `
        <div class="node ${rootClass}" 
             data-name="${node.name}" 
             data-meaning="${node.meaning || ''}" 
             data-detail="${node.detail || ''}"
             onclick="openNodeModal(this)">
            <span class="kanji">${node.kanji}</span>
            <span class="name">${node.name}</span>
        </div>
    `;
    
    // Nếu có con, gọi lại chính nó
    if (node.children && node.children.length > 0) {
        html += `<ul>`;
        for (let child of node.children) {
            html += buildTreeRecursive(child, false);
        }
        html += `</ul>`;
    }
    
    html += `</li>`;
    return html;
}

// =====================================
// PHẦN XỬ LÝ MODAL (POPUP HIỂN THỊ CHI TIẾT)
// =====================================

const modal = document.getElementById("infoModal");
const closeBtn = document.getElementById("closeModalBtn");

// Hàm mở Modal lấy dữ liệu từ element vừa click
function openNodeModal(element) {
    const name = element.getAttribute('data-name');
    const meaning = element.getAttribute('data-meaning');
    const detail = element.getAttribute('data-detail');

    document.getElementById("modalTitle").innerText = name;
    document.getElementById("modalMeaning").innerText = meaning ? "Ý nghĩa: " + meaning : "";
    document.getElementById("modalDetail").innerText = detail;
    
    modal.style.display = "block";
}

// Hàm đóng Modal
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Bấm ra ngoài vùng xám cũng đóng modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// =====================================
// TÍNH NĂNG MỞ RỘNG: ZOOM VÀ KÉO THẢ (DRAG TO PAN)
// =====================================

// 1. Tính năng Phóng to / Thu nhỏ
let currentScale = 1;
const treeElement = document.getElementById('kanjiTree');

function zoomTree(step) {
    currentScale += step;
    // Giới hạn zoom từ 0.4 (nhỏ) đến 2 (lớn)
    if (currentScale < 0.4) currentScale = 0.4;
    if (currentScale > 2) currentScale = 2;
    
    treeElement.style.transform = `scale(${currentScale})`;
}

function resetZoom() {
    currentScale = 1;
    treeElement.style.transform = `scale(1)`;
}

// 2. Tính năng dùng chuột kéo để cuộn (Pan)
const container = document.getElementById('kanjiTreeContainer');
let isDown = false;
let startX, startY, scrollLeft, scrollTop;

container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.classList.add('active');
    startX = e.pageX - container.offsetLeft;
    startY = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
});

container.addEventListener('mouseleave', () => {
    isDown = false;
});

container.addEventListener('mouseup', () => {
    isDown = false;
});

container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault(); // Ngăn bôi đen text khi kéo
    
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    
    const walkX = (x - startX) * 1.5; // Nhân 1.5 để cuộn nhanh hơn
    const walkY = (y - startY) * 1.5;
    
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
});