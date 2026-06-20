let allOrders = [];

function switchTab(tabId, element) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.getElementById(`tab-${tabId}`).classList.add('block'); // fix flex issues if any
  
  if(tabId === 'map') {
    document.getElementById(`tab-map`).classList.add('flex', 'flex-col');
    if (window.adminMap) window.adminMap.invalidateSize();
  } else {
    document.getElementById(`tab-map`).classList.remove('flex', 'flex-col');
  }

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-blue-600/20', 'text-blue-400');
    el.classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
  });
  element.classList.add('bg-blue-600/20', 'text-blue-400');
  element.classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
}

const originalRefresh = window.refreshData;
window.refreshData = function() {
  if (tokens.manager) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
    loadManagerOrders();
    loadManagerUsers();
  }
};

async function loadManagerOrders() {
  try {
    const res = await apiCall('/orders', 'GET', null, 'manager');
    allOrders = res.data;
    
    // Update Stats
    let rev = 0; 
    let cancelled = 0;
    const uniqueCustomers = new Set();
    const uniqueDrivers = new Set();

    allOrders.forEach(o => {
      if (o.status === 'completed') rev += (o.total_price||0) + (o.delivery_fee||0);
      if (o.status === 'cancelled') cancelled++;
      if (o.customer_id) uniqueCustomers.add(o.customer_id);
      if (o.driver_id) uniqueDrivers.add(o.driver_id);
    });

    document.getElementById('stat-revenue').textContent = rev.toLocaleString('vi-VN') + 'đ';
    document.getElementById('stat-users').textContent = uniqueCustomers.size;
    document.getElementById('stat-drivers').textContent = uniqueDrivers.size;
    const cancelRate = allOrders.length ? (cancelled / allOrders.length * 100).toFixed(1) : 0;
    document.getElementById('stat-cancel').textContent = cancelRate + '%';

    // Filter and Render
    filterOrders();

    // Draw Map
    const delivering = allOrders.filter(o => o.status === 'delivering' && o.lat && o.store_lat);
    drawAdminMap(delivering);
  } catch(e) {}
}

function filterOrders() {
  const q = document.getElementById('search-order') ? document.getElementById('search-order').value.toLowerCase() : '';
  const filtered = allOrders.filter(o => o.id.toString().includes(q));
  renderManagerOrders(filtered);
}

function renderManagerOrders(orders) {
  const tbody = document.getElementById('admin-orders-table');
  tbody.innerHTML = orders.map(o => `
    <tr class="hover:bg-gray-50">
      <td class="p-4 font-bold text-gray-800">#${o.id}</td>
      <td class="p-4"><p class="font-semibold text-gray-700 truncate w-48">${o.pickup_address}</p><p class="text-xs text-gray-500 truncate w-48"><i class="fa-solid fa-arrow-right mr-1"></i>${o.delivery_address}</p></td>
      <td class="p-4 font-bold text-emerald-600">${((o.total_price||0) + (o.delivery_fee||0)).toLocaleString('vi-VN')}đ</td>
      <td class="p-4">${translateStatusHTML(o.status)}</td>
      <td class="p-4 text-right">
        ${o.status !== 'completed' && o.status !== 'cancelled' ? `<button onclick="forceCancelOrder(${o.id})" class="text-red-500 hover:text-white hover:bg-red-500 px-3 py-1 rounded border border-red-500 transition font-bold text-xs"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Hủy</button>` : '-'}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-500">Không tìm thấy đơn hàng</td></tr>';
}

async function loadManagerUsers() {
  try {
    const res = await apiCall('/users/all', 'GET', null, 'manager');
    const users = res.data;
    const tbody = document.getElementById('admin-users-table');

    const roleColors = {
      customer: 'bg-gray-100 text-gray-600',
      store: 'bg-orange-100 text-orange-600',
      driver: 'bg-blue-100 text-blue-600',
      manager: 'bg-purple-100 text-purple-600'
    };

    // Update overview stats with real user data
    document.getElementById('stat-users').textContent = users.filter(u => u.role === 'customer').length;
    document.getElementById('stat-drivers').textContent = users.filter(u => u.role === 'driver').length;

    tbody.innerHTML = users.map(u => `
      <tr class="hover:bg-gray-50">
        <td class="p-4">${u.id}</td>
        <td class="p-4 font-bold">${u.username}</td>
        <td class="p-4"><span class="${roleColors[u.role] || 'bg-gray-100 text-gray-600'} px-2 py-1 rounded font-bold text-xs">${u.role}</span></td>
        <td class="p-4">${u.is_locked ? '<span class="text-red-500 font-bold">Locked</span>' : '<span class="text-emerald-500 font-bold">Active</span>'}</td>
        <td class="p-4 text-right">
          ${u.is_locked 
            ? `<button onclick="unlockUserAction(${u.id})" class="text-emerald-500 hover:text-emerald-700 font-semibold"><i class="fa-solid fa-lock-open mr-1"></i>Mở khóa</button>`
            : `<button onclick="lockUserAction(${u.id})" class="text-red-500 hover:text-red-700 font-semibold"><i class="fa-solid fa-lock mr-1"></i>Khóa</button>`
          }
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="p-4 text-center text-gray-500">Không có người dùng</td></tr>';
  } catch(e) {
    console.error('Failed to load users:', e);
  }
}

async function lockUserAction(id) {
  if(!confirm(`Xác nhận KHÓA tài khoản #${id}?`)) return;
  try {
    await apiCall(`/users/${id}/lock`, 'PUT', null, 'manager');
    alert('Khóa tài khoản thành công!');
    loadManagerUsers();
  } catch(e) { alert(e.message); }
}

async function unlockUserAction(id) {
  try {
    await apiCall(`/users/${id}/unlock`, 'PUT', null, 'manager');
    alert('Mở khóa tài khoản thành công!');
    loadManagerUsers();
  } catch(e) { alert(e.message); }
}

function exportReport() {
  alert("Tính năng Xuất Báo Cáo đang phát triển. Báo cáo PDF sẽ được gửi qua email Admin.");
}

function translateStatusHTML(status) {
  const map = {
    'pending': '<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded font-bold text-[10px] uppercase">Pending</span>',
    'finding_driver': '<span class="text-orange-600 bg-orange-100 px-2 py-1 rounded font-bold text-[10px] uppercase">Finding</span>',
    'preparing': '<span class="text-blue-600 bg-blue-100 px-2 py-1 rounded font-bold text-[10px] uppercase">Preparing</span>',
    'delivering': '<span class="text-emerald-600 bg-emerald-100 px-2 py-1 rounded font-bold text-[10px] uppercase flex items-center w-max"><div class="pulse-dot mr-1 w-2 h-2"></div>Delivering</span>',
    'completed': '<span class="text-gray-500 bg-gray-200 px-2 py-1 rounded font-bold text-[10px] uppercase">Done</span>',
    'cancelled': '<span class="text-red-500 bg-red-100 px-2 py-1 rounded font-bold text-[10px] uppercase">Cancelled</span>'
  };
  return map[status] || status;
}

function drawAdminMap(orders) {
  if (!window.L) return;
  if (!window.adminMap) {
    window.adminMap = L.map('admin-map').setView([10.845, 106.794], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(window.adminMap);
    window.adminLayer = L.layerGroup().addTo(window.adminMap);
  }
  
  window.adminLayer.clearLayers();
  
  const iconStore = L.divIcon({ className: 'bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow text-xs', html: '<i class="fa-solid fa-store"></i>', iconSize: [24,24], iconAnchor: [12,12] });
  const iconCust = L.divIcon({ className: 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow text-xs', html: '<i class="fa-solid fa-user"></i>', iconSize: [24,24], iconAnchor: [12,12] });
  
  orders.forEach(o => {
    const p1 = [o.store_lat, o.store_lng];
    const p2 = [o.lat, o.lng];
    L.marker(p1, {icon: iconStore}).addTo(window.adminLayer).bindPopup(`Quán (Đơn #${o.id})`);
    L.marker(p2, {icon: iconCust}).addTo(window.adminLayer).bindPopup(`Khách (Đơn #${o.id})`);
    L.polyline([p1, p2], {color: '#3b82f6', weight: 2, opacity: 0.6}).addTo(window.adminLayer);
  });
}

async function forceCancelOrder(id) {
  if(!confirm(`Xác nhận HỦY KHẨN CẤP đơn hàng #${id}?`)) return;
  try {
    await apiCall(`/orders/${id}/status`, 'PATCH', { status: 'cancelled' }, 'manager');
    alert("Hủy khẩn cấp thành công!");
    loadManagerOrders();
  } catch (err) { alert(err.message); }
}

setInterval(refreshData, 3000);
