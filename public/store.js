let previousPendingCount = 0;
let isStoreOpen = true;

function toggleStoreStatus() {
  isStoreOpen = !isStoreOpen;
  const statusEl = document.getElementById('store-status-text');
  if (isStoreOpen) {
    statusEl.innerHTML = '<i class="fa-solid fa-circle text-[8px] mr-1"></i>Đang mở cửa ▾';
    statusEl.className = 'text-xs text-green-500 font-semibold cursor-pointer';
  } else {
    statusEl.innerHTML = '<i class="fa-solid fa-circle text-[8px] mr-1"></i>Đã đóng cửa ▾';
    statusEl.className = 'text-xs text-gray-500 font-semibold cursor-pointer';
  }
  // Persist to DB
  apiCall('/store/status', 'PUT', { is_open: isStoreOpen }, 'store').catch(e => console.error(e));
}

function switchTab(tabId, element) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-orange-50', 'text-orange-600');
    el.classList.add('text-gray-600');
  });
  element.classList.add('bg-orange-50', 'text-orange-600');
  element.classList.remove('text-gray-600');
}

document.getElementById('current-date').textContent = new Date().toLocaleDateString('vi-VN');

const originalRefresh = window.refreshData;
window.refreshData = function() {
  if (tokens.store) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
    
    loadProfile('store');
    loadStoreMenu();
    loadStoreOrders();
  }
};

async function loadStoreMenu() {
  try {
    const res = await apiCall('/store/menu', 'GET', null, 'store');
    const tbody = document.getElementById('menu-table-body');
    if(res.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">Chưa có món ăn nào.</td></tr>';
      return;
    }
    
    tbody.innerHTML = res.data.map(m => `
      <tr class="hover:bg-gray-50" id="menu-row-${m.name.replace(/\s+/g, '')}">
        <td class="p-4 font-bold text-gray-800">${m.name}</td>
        <td class="p-4 text-sm text-gray-600 max-w-xs truncate">${m.description || ''}</td>
        <td class="p-4 text-emerald-600 font-semibold">${m.price.toLocaleString('vi-VN')}đ</td>
        <td class="p-4 text-right">
          <button onclick="editMenuMock('${m.name}')" class="text-blue-500 hover:text-blue-700 mr-3"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteMenuMock('${m.name}')" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (e) {}
}

async function addMenuItem() {
  const name = document.getElementById('item-name').value;
  const price = document.getElementById('item-price').value;
  const desc = document.getElementById('item-desc').value;
  if (!name || !price) return alert('Nhập đủ tên và giá!');

  try {
    await apiCall('/store/menu', 'POST', { name, description: desc, price: parseFloat(price) }, 'store');
    document.getElementById('modal-add-item').classList.add('hidden');
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-desc').value = '';
    loadStoreMenu();
  } catch (err) { alert(err.message); }
}

async function loadStoreOrders() {
  try {
    const res = await apiCall('/store/orders', 'GET', null, 'store');
    if (typeof checkNewChatMessages === 'function') checkNewChatMessages(res.data);
    renderKanban(res.data);
    updateDashboardStats(res.data);
    renderHistory(res.data);
  } catch(e) {}
}

function updateDashboardStats(orders) {
  const completed = orders.filter(o => o.status === 'completed');
  const cancelled = orders.filter(o => o.status === 'cancelled');
  
  let revenue = 0;
  completed.forEach(o => revenue += (o.total_price || 0));
  
  document.querySelector('.profile-balance').textContent = revenue.toLocaleString('vi-VN');
  document.getElementById('stat-completed').textContent = completed.length;
  document.getElementById('stat-cancelled').textContent = cancelled.length;
}

function renderKanban(orders) {
  const newOrders = orders.filter(o => o.status === 'pending');
  const prepOrders = orders.filter(o => o.status === 'finding_driver');
  const waitOrders = orders.filter(o => o.status === 'preparing' || o.status === 'arrived_store' || o.status === 'delivering' || o.status === 'arrived');

  document.getElementById('col-new-count').textContent = newOrders.length;
  document.getElementById('col-prep-count').textContent = prepOrders.length;
  document.getElementById('col-wait-count').textContent = waitOrders.length;

  // Audio Alert for new orders
  if (newOrders.length > previousPendingCount) {
    document.getElementById('audio-ding').play().catch(e => console.log('Audio autoplay blocked'));
    document.getElementById('new-badge').classList.remove('hidden');
  } else if (newOrders.length === 0) {
    document.getElementById('new-badge').classList.add('hidden');
  }
  previousPendingCount = newOrders.length;

  // Render Col New
  document.getElementById('col-new').innerHTML = newOrders.map(o => {
    const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
    const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow">${unreadCount}</span>` : '';
    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 hover:shadow-md transition">
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-bold">Đơn #${o.id}</h4>
        <span class="text-xs text-gray-500">${new Date(o.created_at + 'Z').toLocaleTimeString('vi-VN')}</span>
      </div>
      <p class="text-sm font-semibold text-gray-700 mb-1">${o.item_description}</p>
      ${o.note ? `<p class="text-xs text-yellow-700 bg-yellow-50 p-1.5 rounded mb-2 border border-yellow-200">📝 Ghi chú: ${o.note}</p>` : ''}
      <p class="text-xs text-gray-500 truncate mb-1"><i class="fa-solid fa-user mr-1 text-blue-400"></i> ${o.customer_name || 'Khách'} - ${o.customer_phone || 'Chưa cập nhật'}</p>
      <p class="text-xs text-gray-500 truncate mb-3"><i class="fa-solid fa-location-dot mr-1 text-red-400"></i> Tới: ${o.delivery_address}</p>
      <div class="flex space-x-2 mb-2">
        <button onclick="storeRejectOrder(${o.id})" class="w-1/3 bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm hover:bg-gray-300">Từ chối</button>
        <button onclick="storeAcceptOrder(${o.id})" class="w-2/3 bg-red-100 text-red-600 font-bold py-2 rounded-lg text-sm hover:bg-red-200">Nhận Đơn</button>
      </div>
      <button onclick="openChat(${o.id})" class="relative w-full text-blue-600 bg-blue-50 px-2 py-2 rounded-lg font-bold hover:bg-blue-100 text-sm"><i class="fa-solid fa-comment-dots mr-1"></i>Chat với khách${unreadDot}</button>
    </div>
  `}).join('') || '<p class="text-gray-400 text-sm text-center py-4">Trống</p>';

  // Render Col Prep
  document.getElementById('col-prep').innerHTML = prepOrders.map(o => {
    const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
    const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow">${unreadCount}</span>` : '';
    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 relative">
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-bold">Đơn #${o.id}</h4>
        <span class="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Tìm Tx</span>
      </div>
      <p class="text-sm font-semibold text-gray-700 mb-2">${o.item_description}</p>
      ${o.note ? `<p class="text-xs text-yellow-700 bg-yellow-50 p-1.5 rounded mb-2 border border-yellow-200">📝 Ghi chú: ${o.note}</p>` : ''}
      <p class="text-xs text-gray-500 truncate mb-3"><i class="fa-solid fa-user mr-1 text-blue-400"></i> ${o.customer_name || 'Khách'} - ${o.customer_phone || 'Chưa cập nhật'}</p>
      <button onclick="openChat(${o.id})" class="relative w-full text-blue-600 bg-blue-50 px-2 py-2 rounded-lg font-bold hover:bg-blue-100 text-sm"><i class="fa-solid fa-comment-dots mr-1"></i>Chat với khách${unreadDot}</button>
    </div>
  `}).join('') || '<p class="text-gray-400 text-sm text-center py-4">Trống</p>';

  // Render Col Wait
  document.getElementById('col-wait').innerHTML = waitOrders.map(o => {
    const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
    const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow">${unreadCount}</span>` : '';
    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 relative">
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-bold">Đơn #${o.id}</h4>
        <span class="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded font-bold">${o.status === 'preparing' ? 'Chờ Tx đến' : o.status === 'arrived_store' ? 'Tx Đợi Món' : o.status === 'delivering' ? 'Tx Đang Giao' : 'Tx Đã Đến'}</span>
      </div>
      <p class="text-sm font-semibold text-gray-700 mb-2">${o.item_description}</p>
      ${o.note ? `<p class="text-xs text-yellow-700 bg-yellow-50 p-1.5 rounded mb-2 border border-yellow-200">📝 Ghi chú: ${o.note}</p>` : ''}
      <p class="text-xs text-gray-500 truncate mb-1"><i class="fa-solid fa-user mr-1 text-blue-400"></i> ${o.customer_name || 'Khách'} - ${o.customer_phone || 'Chưa cập nhật'}</p>
      <div class="flex justify-between items-center text-xs text-gray-600 mt-2 pt-2 border-t">
        <div class="flex items-center">
          <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2"><i class="fa-solid fa-motorcycle text-xs"></i></div>
          <span>Tài xế: <b>${o.driver_name || ('#' + o.driver_id)}</b></span>
        </div>
        <button onclick="openChat(${o.id})" class="relative text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold hover:bg-blue-100"><i class="fa-solid fa-comment-dots mr-1"></i>Chat${unreadDot}</button>
      </div>
    </div>
  `}).join('') || '<p class="text-gray-400 text-sm text-center py-4">Trống</p>';
}

function renderHistory(orders) {
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled' || o.status === 'failed');
  const container = document.getElementById('store-history-list');
  if (!container) return;
  if (historyOrders.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Chưa có lịch sử.</p>';
    return;
  }
  
  container.innerHTML = historyOrders.map(o => {
    let chatBtn = '';
    if (o.status === 'completed') {
      const timeRef = o.updated_at || o.created_at;
      if (timeRef) {
        const diffMs = Date.now() - new Date(timeRef + 'Z').getTime();
        if (diffMs / 1000 / 60 <= 30) {
          const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
          const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">${unreadCount}</span>` : '';
          chatBtn = `<button onclick="openChat(${o.id})" class="relative mt-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 text-xs w-full"><i class="fa-solid fa-comment-dots mr-1"></i>Chat với khách / Tx${unreadDot}</button>`;
        }
      }
    }
    
    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <h4 class="font-bold">Đơn #${o.id} - ${o.status === 'completed' ? '<span class="text-emerald-500">Hoàn thành</span>' : '<span class="text-red-500">Thất bại/Hủy</span>'}</h4>
        <p class="text-sm text-gray-600">${o.item_description}</p>
        <p class="text-xs text-gray-400">${new Date(o.created_at + 'Z').toLocaleString('vi-VN')}</p>
      </div>
      <div class="flex items-center">
        <span class="font-bold text-gray-800">${(o.total_price || 0).toLocaleString('vi-VN')}đ</span>
        ${chatBtn}
      </div>
    </div>
  `}).join('');
}

async function storeAcceptOrder(id) {
  try {
    await apiCall(`/store/orders/${id}/accept`, 'PUT', null, 'store');
    loadStoreOrders();
  } catch (err) { alert(err.message); }
}

async function storeRejectOrder(id) {
  if(confirm(`Bạn có chắc chắn muốn TỪ CHỐI đơn hàng #${id}? Tiền sẽ được hoàn cho khách.`)) {
    try {
      await apiCall(`/store/orders/${id}/reject`, 'PUT', null, 'store');
      alert('Từ chối đơn thành công! Tiền đã hoàn cho khách.');
      loadStoreOrders();
    } catch(err) { alert(err.message); }
  }
}

function editMenuMock(name) {
  alert(`Cập nhật món: ${name} (Cần Backend API)`);
}

function deleteMenuMock(name) {
  if(confirm(`Xóa món ${name} khỏi thực đơn?`)) {
    const row = document.getElementById(`menu-row-${name.replace(/\s+/g, '')}`);
    if(row) row.remove();
    alert("Đã xóa (Mock UI, cần Backend API).");
  }
}

setInterval(refreshData, 3000);
