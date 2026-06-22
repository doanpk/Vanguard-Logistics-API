let activeOrder = null;
let chartInstance = null;
let isOnline = true;

function toggleOnlineStatus() {
  isOnline = !isOnline;
  const ind = document.getElementById('status-indicator');
  const txt = document.getElementById('status-text');
  
  if(isOnline) {
    ind.className = 'w-3 h-3 bg-emerald-500 rounded-full mr-2 radar-pulse';
    txt.textContent = 'Sẵn sàng nhận cuốc';
  } else {
    ind.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
    txt.textContent = 'Đang Offline';
    document.getElementById('incoming-order-popup').classList.add('hidden');
  }
}

function switchTab(tabId, element) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  
  if (tabId === 'income' && !chartInstance) initChart();
}

const originalRefresh = window.refreshData;
window.refreshData = function() {
  if (tokens.driver) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('bottom-nav').style.display = 'flex';
    
    loadProfile('driver');
    loadDriverData();
  }
};

async function loadDriverData() {
  try {
    const resActive = await apiCall('/driver/my-orders', 'GET', null, 'driver');
    const myOrders = resActive.data;
    
    const activeOrder = myOrders.find(o => ['preparing', 'delivering', 'arrived'].includes(o.status));
    
    if (activeOrder) {
      document.getElementById('incoming-order-popup').classList.add('hidden');
      document.getElementById('active-order-view').classList.remove('hidden');
      renderActiveOrder(activeOrder);
    } else {
      document.getElementById('active-order-view').classList.add('hidden');
      if (isOnline) {
        const resPending = await apiCall('/driver/orders/pending', 'GET', null, 'driver');
        if (resPending.data && resPending.data.length > 0) {
          showIncomingPopup(resPending.data[0]);
        } else {
          document.getElementById('incoming-order-popup').classList.add('hidden');
        }
      } else {
        document.getElementById('incoming-order-popup').classList.add('hidden');
      }
    }

    renderHistory(myOrders.filter(o => o.status === 'completed' || o.status === 'cancelled'));
  } catch (e) {}
}

function showIncomingPopup(order) {
  document.getElementById('incoming-order-popup').classList.remove('hidden');
  document.getElementById('incoming-fee').textContent = (order.delivery_fee || 15000).toLocaleString('vi-VN') + 'đ';
  document.getElementById('incoming-pickup').textContent = order.pickup_address;
  document.getElementById('incoming-delivery').textContent = order.delivery_address;
  
  const btn = document.getElementById('btn-accept');
  btn.onclick = () => acceptOrder(order.id);
}

function renderActiveOrder(order) {
  document.getElementById('active-id').textContent = order.id;
  document.getElementById('active-items').innerHTML = `
    <div class="mb-2 pb-2 border-b border-gray-600">
      <p class="text-xs text-gray-400">Món ăn:</p>
      <p class="font-semibold text-sm">${order.item_description}</p>
    </div>
    <div class="flex flex-col space-y-1 text-sm text-gray-300">
      <p><i class="fa-solid fa-store w-5 text-orange-400"></i> ${order.store_name || 'Quán'} - ${order.store_phone || 'Không có SĐT'}</p>
      <p><i class="fa-solid fa-user w-5 text-blue-400"></i> ${order.customer_name || 'Khách'} - ${order.customer_phone || 'Không có SĐT'}</p>
    </div>
  `;
  document.getElementById('driver-chat-btn').onclick = () => openChat(order.id);
  
  const statusText = document.getElementById('active-status-text');
  const btnContainer = document.getElementById('active-action-btn-container');
  
  if (order.status === 'preparing') {
    statusText.textContent = "Đang đến lấy hàng";
    btnContainer.innerHTML = `
      <div class="flex space-x-2">
        <button onclick="openChat(${order.id})" class="w-1/3 bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-600"><i class="fa-solid fa-comment-dots"></i> Chat</button>
        <button onclick="pickupOrder(${order.id})" class="w-2/3 bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30 text-lg hover:bg-orange-600">Đã lấy hàng</button>
      </div>
    `;
  } else if (order.status === 'delivering') {
    statusText.textContent = "Đang giao cho khách";
    btnContainer.innerHTML = `
      <div class="flex space-x-2">
        <button onclick="openChat(${order.id})" class="w-1/3 bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-600"><i class="fa-solid fa-comment-dots"></i> Chat</button>
        <button onclick="arriveOrder(${order.id})" class="w-2/3 bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/30 text-lg hover:bg-purple-600">Đã đến nơi</button>
      </div>
    `;
  } else if (order.status === 'arrived') {
    statusText.textContent = "Đã đến điểm giao";
    btnContainer.innerHTML = `
      <div class="flex space-x-2">
        <button onclick="openChat(${order.id})" class="w-1/3 bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-600"><i class="fa-solid fa-comment-dots"></i> Chat</button>
        <button onclick="completeOrder(${order.id})" class="w-2/3 bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 text-lg hover:bg-emerald-600">Giao xong</button>
      </div>
    `;
  }

  // Draw Map
  if (window.L && order.store_lat && order.lat) {
    if (!window.driverMap) {
      window.driverMap = L.map('driver-map', { zoomControl: false }).setView([10.845, 106.794], 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(window.driverMap);
      window.driverMapLayer = L.layerGroup().addTo(window.driverMap);
    }
    window.driverMapLayer.clearLayers();
    if (window.routingControl) {
      window.driverMap.removeControl(window.routingControl);
      window.routingControl = null;
    }

    const p1 = L.latLng(order.store_lat, order.store_lng);
    const p2 = L.latLng(order.lat, order.lng);

    const iconStore = L.divIcon({ className: 'bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow text-sm', html: '<i class="fa-solid fa-store"></i>', iconSize: [32,32], iconAnchor: [16,16] });
    const iconCust = L.divIcon({ className: 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow text-sm', html: '<i class="fa-solid fa-user"></i>', iconSize: [32,32], iconAnchor: [16,16] });

    if (order.status === 'delivering' && L.Routing) {
      window.routingControl = L.Routing.control({
        waypoints: [p1, p2], addWaypoints: false, routeWhileDragging: false, show: false, createMarker: () => null, lineOptions: { styles: [{color: '#10b981', weight: 5}] }
      }).addTo(window.driverMap);
    } else {
      L.polyline([p1, p2], {color: '#f97316', weight: 3, dashArray: '5, 5'}).addTo(window.driverMapLayer);
      window.driverMap.fitBounds([p1, p2], { padding: [30, 30] });
    }
    
    L.marker(p1, {icon: iconStore}).addTo(window.driverMapLayer);
    L.marker(p2, {icon: iconCust}).addTo(window.driverMapLayer);
  }
}

function renderHistory(orders) {
  // Update Income Tab dynamically
  let todayIncome = 0;
  let todayCount = 0;
  orders.forEach(o => {
    if(o.status === 'completed') {
      todayIncome += (o.delivery_fee || 15000);
      todayCount++;
    }
  });
  
  const incomeEl = document.querySelector('#tab-income .text-3xl');
  if(incomeEl) incomeEl.textContent = todayIncome.toLocaleString('vi-VN') + 'đ';
  const countEl = document.querySelector('#tab-income .flex .font-bold');
  if(countEl) countEl.textContent = todayCount;

  const container = document.getElementById('history-list');
  if (orders.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">Chưa có chuyến xe nào.</p>';
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
      <div class="flex justify-between mb-2">
        <span class="font-bold text-sm text-gray-300">Đơn #${o.id}</span>
        <span class="${o.status === 'completed' ? 'text-emerald-400' : 'text-red-400'} text-sm font-bold">${o.status === 'completed' ? '+'+(o.delivery_fee||15000).toLocaleString()+'đ' : 'Hủy'}</span>
      </div>
      <p class="text-xs text-gray-400 truncate"><i class="fa-solid fa-arrow-right text-gray-600 w-4"></i> ${o.delivery_address}</p>
    </div>
  `).join('');
}

async function acceptOrder(id) {
  try {
    await apiCall(`/driver/orders/${id}/accept`, 'PUT', null, 'driver');
    loadDriverData();
  } catch (err) { alert(err.message); }
}

async function pickupOrder(id) {
  try {
    await apiCall(`/driver/orders/${id}/pickup`, 'PUT', null, 'driver');
    loadDriverData();
  } catch (err) { alert(err.message); }
}

async function arriveOrder(id) {
  try {
    await apiCall(`/driver/orders/${id}/arrive`, 'PUT', null, 'driver');
    loadDriverData();
  } catch (err) { alert(err.message); }
}

async function completeOrder(id) {
  try {
    await apiCall(`/driver/orders/${id}/complete`, 'PUT', null, 'driver');
    loadDriverData();
    loadProfile('driver');
  } catch (err) { alert(err.message); }
}

function initChart() {
  const ctx = document.getElementById('incomeChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [{
        label: 'Thu nhập (k)',
        data: [150, 230, 180, 290, 200, 350, 400],
        backgroundColor: '#10b981',
        borderRadius: 4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: '#9ca3af' } } }, plugins: { legend: { display: false } } }
  });
}

function requestWithdrawal() {
  const amount = prompt("Nhập số tiền muốn rút (VND):");
  if(amount && !isNaN(amount)) {
    if(parseInt(amount) < 50000) return alert("Số tiền rút tối thiểu là 50.000đ");
    alert(`Yêu cầu rút ${parseInt(amount).toLocaleString('vi-VN')}đ đã được gửi thành công. Tiền sẽ về tài khoản ngân hàng trong 24h.`);
  }
}

setInterval(refreshData, 3000);
