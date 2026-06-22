let storeCarts = {}; // { storeId: { items: [], storeName: '' } }
let currentStoreId = null;
let cart = []; // Points to current store's items array
let activeMapOrder = null;
let allStores = [];
let currentStoreName = "";
let currentCategory = null;

// Load multi-carts on start
try {
  const saved = localStorage.getItem('customerCarts');
  if (saved) {
    storeCarts = JSON.parse(saved);
  }
} catch(e) {}

// ===== TAB SWITCHING =====
function switchTab(tabId, element) {
  // Close store menu if open
  document.getElementById('store-menu-view').classList.add('hidden');
  document.getElementById('tab-home').classList.remove('hidden');

  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  if (tabId === 'orders') {
    loadCustomerOrders();
    switchOrderTab('active');
  }
  if (tabId === 'profile') {
    loadProfileData();
  }
}

// ===== ORDER SUB-TAB =====
function switchOrderTab(subTab) {
  const btnActive = document.getElementById('btn-tab-active');
  const btnHistory = document.getElementById('btn-tab-history');

  if (subTab === 'active') {
    btnActive.className = 'pb-2 border-b-2 border-emerald-500 font-bold text-emerald-600';
    btnHistory.className = 'pb-2 font-bold text-gray-400';
    document.getElementById('active-orders-container').classList.remove('hidden');
    document.getElementById('history-orders-container').classList.add('hidden');
    if (activeMapOrder) document.getElementById('map-wrapper').classList.remove('hidden');
  } else {
    btnActive.className = 'pb-2 font-bold text-gray-400';
    btnHistory.className = 'pb-2 border-b-2 border-emerald-500 font-bold text-emerald-600';
    document.getElementById('active-orders-container').classList.add('hidden');
    document.getElementById('history-orders-container').classList.remove('hidden');
    document.getElementById('map-wrapper').classList.add('hidden');
  }
}

// ===== AUTH FLOW =====
window.refreshData = function () {
  if (tokens.customer) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('bottom-nav').style.display = 'flex';

    loadProfileData();
    if (!currentStoreId && allStores.length === 0) loadCustomerStores();
    loadCustomerOrders();
    updateCartUI(); // Update global cart if exists
  }
};

// ===== PROFILE (Fixed: querySelector on #main-content, not #customer-dashboard) =====
async function loadProfileData() {
  try {
    const res = await apiCall('/users/profile', 'GET', null, 'customer');
    const p = res.data;

    // Update all profile-name elements
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = p.full_name || p.username);
    document.querySelectorAll('.profile-balance').forEach(el => el.textContent = (p.balance || 0).toLocaleString('vi-VN'));
    document.querySelectorAll('.profile-phone').forEach(el => el.textContent = p.phone_number || '090xxxxxxx');

    // Avatar
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || p.username)}&background=random`;

    // Header address
    const hdr = document.getElementById('header-address');
    if (hdr) {
      if (p.lat && p.lng) hdr.textContent = 'Vị trí GPS của bạn ▾';
      else hdr.textContent = 'Ký Túc Xá UTC2 ▾';
    }
  } catch (e) { console.error('Profile load error:', e); }
}

// ===== STORE LIST =====
async function loadCustomerStores() {
  try {
    const res = await apiCall('/customer/orders/stores', 'GET', null, 'customer');
    allStores = res.data;
    renderStores(allStores);
  } catch (e) { console.error(e); }
}

function renderStores(stores) {
  const container = document.getElementById('store-list-container');
  if (!stores || stores.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Chưa có quán nào trên hệ thống.</p>';
    return;
  }

  container.innerHTML = stores.map(s => `
    <div onclick="viewStoreMenu(${s.id}, '${s.username.replace(/'/g, "\\'")}')" class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 cursor-pointer hover:shadow-md transition">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.username)}&background=random" class="w-16 h-16 rounded-lg object-cover">
      <div class="flex-1">
        <h3 class="font-bold text-gray-800">${s.username} ${s.category ? `<span class="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-md font-normal ml-1">${s.category}</span>` : ''}</h3>
        <p class="text-xs text-gray-500 truncate mt-1"><i class="fa-solid fa-location-dot mr-1"></i>${s.address || 'Đang cập nhật'}</p>
        <p class="text-xs text-orange-500 font-semibold mt-1"><i class="fa-solid fa-star text-yellow-400"></i> 5.0 (99+)</p>
      </div>
    </div>
  `).join('');
}

function filterByCategory(cat) {
  if (currentCategory === cat) {
    currentCategory = null; // Toggle off if clicked again
  } else {
    currentCategory = cat;
  }
  applyFilters();
}

function filterStores() {
  applyFilters();
}

function applyFilters() {
  let filtered = allStores;
  const q = document.getElementById('search-store').value.toLowerCase();
  
  if (q) {
    filtered = filtered.filter(s => 
      s.username.toLowerCase().includes(q) || 
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.menu_items && s.menu_items.toLowerCase().includes(q))
    );
  }
  
  if (currentCategory) {
    if (currentCategory === 'Thêm') {
      filtered = filtered.filter(s => !['Cơm', 'FastFood', 'Trà Sữa'].includes(s.category));
    } else {
      filtered = filtered.filter(s => s.category === currentCategory);
    }
  }
  
  renderStores(filtered);
}

// ===== STORE MENU =====
async function viewStoreMenu(storeId, storeName) {
  document.getElementById('tab-home').classList.add('hidden');
  document.getElementById('store-menu-view').classList.remove('hidden');
  document.getElementById('menu-store-name').textContent = storeName;
  currentStoreId = storeId;
  currentStoreName = storeName;
  
  // Load specific cart for this store
  if (!storeCarts[storeId]) {
    storeCarts[storeId] = { items: [], storeName: storeName };
  }
  cart = storeCarts[storeId].items;
  updateCartUI();

  try {
    const res = await apiCall(`/customer/orders/stores/${storeId}/menu`, 'GET', null, 'customer');
    const container = document.getElementById('menu-list-container');
    const menuItems = res.data.menu;

    if (!menuItems || menuItems.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Quán chưa có món nào.</p>';
      return;
    }

    container.innerHTML = menuItems.map(item => `
      <div class="flex justify-between items-center border-b pb-3 border-gray-100">
        <div class="flex-1 pr-4">
          <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
          <p class="text-xs text-gray-500 my-1 truncate">${item.description || ''}</p>
          <p class="font-semibold text-emerald-600 text-sm">${item.price.toLocaleString('vi-VN')}đ</p>
        </div>
        <button onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${item.price})" class="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg hover:bg-emerald-200 shadow-sm flex-shrink-0">+</button>
      </div>
    `).join('');
  } catch (e) {
    alert("Lỗi tải menu: " + e.message);
  }
}

function closeStoreMenu() {
  document.getElementById('store-menu-view').classList.add('hidden');
  document.getElementById('tab-home').classList.remove('hidden');
  document.getElementById('cart-float').classList.add('hidden');
}

// ===== CART =====
function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, qty: 1 });
  updateCartUI();
}

function removeFromCart(name) {
  const idx = cart.findIndex(i => i.name === name);
  if (idx > -1) {
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  }
  updateCartUI();
}

function deleteFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  updateCartUI();
}

function updateCartUI() {
  let total = 0;
  let count = 0;
  cart.forEach(i => { total += i.qty * i.price; count += i.qty; });

  // Save to local storage for multi-cart
  if (cart.length === 0) {
    delete storeCarts[currentStoreId];
  } else {
    storeCarts[currentStoreId] = { items: cart, storeName: currentStoreName };
  }
  localStorage.setItem('customerCarts', JSON.stringify(storeCarts));

  // Float button inside menu
  const floatBtn = document.getElementById('cart-float');
  if (floatBtn) {
    if (count > 0 && !document.getElementById('store-menu-view').classList.contains('hidden')) {
      floatBtn.classList.remove('hidden');
      document.getElementById('cart-badge').textContent = count;
      document.getElementById('cart-total-float').textContent = total.toLocaleString('vi-VN') + 'đ';
    } else {
      floatBtn.classList.add('hidden');
    }
  }

  // Cart modal items with +/- buttons
  const list = document.getElementById('cart-items-list');
  if (list) {
    list.innerHTML = cart.map(i => `
    <li class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
      <div class="flex-1">
        <p class="font-semibold text-gray-800 text-sm">${i.name}</p>
        <p class="text-xs text-gray-500">${i.price.toLocaleString('vi-VN')}đ/món</p>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="removeFromCart('${i.name.replace(/'/g, "\\'")}')" class="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold hover:bg-gray-300">−</button>
        <span class="font-bold text-sm w-6 text-center">${i.qty}</span>
        <button onclick="addToCart('${i.name.replace(/'/g, "\\'")}', ${i.price})" class="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold hover:bg-emerald-200">+</button>
        <button onclick="deleteFromCart('${i.name.replace(/'/g, "\\'")}')" class="ml-1 text-red-400 hover:text-red-600"><i class="fa-solid fa-trash-can text-xs"></i></button>
      </div>
      <p class="font-bold text-emerald-600 text-sm ml-3 w-20 text-right">${(i.qty * i.price).toLocaleString('vi-VN')}đ</p>
    </li>
  `).join('');
  }

  document.getElementById('cart-subtotal').textContent = total.toLocaleString('vi-VN') + 'đ';
  // Phí ship tạm tính ~15k, backend sẽ tính chính xác bằng Haversine
  document.getElementById('cart-final').textContent = (total + 15000).toLocaleString('vi-VN') + 'đ';
}

function openCart() {
  document.getElementById('checkout-modal').classList.remove('hidden');
}
function closeCart() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

// ===== GEOLOCATION =====
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('delivery-address').value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        document.getElementById('header-address').textContent = 'Vị trí GPS của bạn ▾';
      },
      (err) => alert("Không thể lấy vị trí: " + err.message)
    );
  } else {
    alert("Trình duyệt không hỗ trợ Geolocation.");
  }
}

// ===== SUBMIT ORDER =====
async function submitOrder() {
  if (cart.length === 0) return alert('Giỏ hàng trống!');
  const deliveryAddress = document.getElementById('delivery-address').value;
  const note = document.getElementById('order-note') ? document.getElementById('order-note').value : '';
  if (!deliveryAddress) return alert('Vui lòng nhập địa chỉ giao hàng!');

  const isCoords = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(deliveryAddress);
  if (isCoords) {
    const [latStr, lngStr] = deliveryAddress.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (lat < 10.3 || lat > 11.2 || lng < 106.3 || lng > 107.0) {
      return alert("Tọa độ của bạn nằm ngoài khu vực TP. Hồ Chí Minh. Hệ thống chưa hỗ trợ giao hàng ở đây.");
    }
  } else {
    const addressLower = deliveryAddress.toLowerCase();
    const isHCM = addressLower.includes('hồ chí minh') || addressLower.includes('ho chi minh') || addressLower.includes('hcm') || addressLower.includes('sài gòn') || addressLower.includes('sai gon') || addressLower.includes('tp hcm');
    if (!isHCM) {
      return alert("Rất tiếc, chúng tôi hiện tại chỉ hỗ trợ giao hàng trong khu vực TP. Hồ Chí Minh. Vui lòng ghi rõ 'Hồ Chí Minh' vào địa chỉ của bạn hoặc sử dụng Tọa độ GPS hiện tại.");
    }
  }

  try {
    const res = await apiCall('/customer/orders', 'POST', { storeId: currentStoreId, items: cart, deliveryAddress, note }, 'customer');
    const order = res.data;
    const fee = order.delivery_fee ? order.delivery_fee.toLocaleString('vi-VN') : '15.000';

    alert(`Đặt hàng thành công! (Phí ship: ${fee}đ)`);
    // Clear cart upon successful order
    cart = [];
    delete storeCarts[currentStoreId];
    localStorage.setItem('customerCarts', JSON.stringify(storeCarts));
    updateCartUI();

    closeCart();
    closeStoreMenu();
    document.getElementById('delivery-address').value = '';
    if(document.getElementById('order-note')) document.getElementById('order-note').value = '';

    // Cập nhật balance ngay
    loadProfileData();
    
    // Chuyển sang tab Đơn hàng
    switchTab('orders', document.querySelectorAll('.nav-item')[1]);
  } catch (err) {
    alert(`Lỗi đặt hàng: ${err.message}`);
  }
}

// ===== ORDERS =====
let lastOrderStatuses = {};

async function loadCustomerOrders() {
  try {
    const res = await apiCall('/customer/orders', 'GET', null, 'customer');
    const orders = res.data || [];
    
    // Check for status changes
    window.customerOrdersList = orders;
    orders.forEach(o => {
      if (lastOrderStatuses[o.id] && lastOrderStatuses[o.id] !== o.status) {
        showToast(`Đơn hàng #${o.id} chuyển sang: ${translateStatus(o.status)}`, 'fa-bell', 'bg-blue-500');
      }
      lastOrderStatuses[o.id] = o.status;
    });
    
    if (typeof checkNewChatMessages === 'function') checkNewChatMessages(orders);

    renderCustomerOrders(orders);
    renderNotifications(orders);
  } catch (e) { console.error(e); }
}

function renderNotifications(orders) {
  const notifList = document.getElementById('notif-list');
  const relevantOrders = orders.filter(o => ['completed', 'failed', 'cancelled'].includes(o.status));
  
  if (relevantOrders.length === 0) {
    notifList.innerHTML = `
      <div class="flex space-x-3 items-start">
        <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0"><i class="fa-solid fa-gift"></i></div>
        <div>
          <p class="font-semibold text-sm">Chào mừng bạn mới 🎁</p>
          <p class="text-xs text-gray-500">Hãy đặt đơn hàng đầu tiên để trải nghiệm dịch vụ.</p>
          <p class="text-xs text-gray-400 mt-1">Hệ thống</p>
        </div>
      </div>
    `;
    return;
  }

  const htmls = relevantOrders.map(o => {
    let icon = '', bg = '', title = '', desc = '';
    const timeAgo = o.created_at ? new Date(o.created_at + 'Z').toLocaleString('vi-VN') : 'Gần đây';
    
    if (o.status === 'completed') {
      icon = 'fa-check'; bg = 'bg-emerald-100 text-emerald-600';
      title = `Đơn hàng #${o.id} hoàn thành`;
      desc = `Chúc bạn ăn ngon miệng món "${o.item_description || ''}" từ quán ${o.store_name || 'Quán'}.`;
    } else if (o.status === 'failed') {
      icon = 'fa-triangle-exclamation'; bg = 'bg-red-100 text-red-600';
      title = `Đơn hàng #${o.id} giao thất bại (Bom hàng)`;
      desc = `Tài xế báo cáo không thể giao đơn. Xin lỗi vì sự bất tiện này.`;
    } else if (o.status === 'cancelled') {
      icon = 'fa-xmark'; bg = 'bg-gray-100 text-gray-500';
      title = `Đơn hàng #${o.id} đã hủy`;
      desc = `Đơn hàng đã được hủy. Số tiền hoàn lại phụ thuộc vào quy định của hệ thống.`;
    }
    
    return `
      <div onclick="viewOrderDetails(${o.id})" class="flex space-x-3 items-start border-b border-gray-100 pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
        <div class="w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0"><i class="fa-solid ${icon}"></i></div>
        <div>
          <p class="font-semibold text-sm text-gray-800">${title}</p>
          <p class="text-xs text-gray-500 mt-1">${desc}</p>
          <p class="text-[10px] text-gray-400 mt-1">${timeAgo}</p>
        </div>
      </div>
    `;
  });
  
  notifList.innerHTML = htmls.join('');
}

function translateStatusHTML(status) {
  const map = {
    'pending': '<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-bold">Chờ Quán Nhận</span>',
    'finding_driver': '<span class="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold animate-pulse">Đang Tìm Tài Xế</span>',
    'preparing': '<span class="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-bold">Quán Đang Nấu</span>',
    'arrived_store': '<span class="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-bold animate-pulse">Tài Xế Đang Đợi Món</span>',
    'delivering': '<span class="text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs font-bold animate-pulse">Đang Giao Hàng</span>',
    'arrived': '<span class="text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs font-bold animate-bounce">Tài Xế Đã Đến</span>',
    'completed': '<span class="text-gray-500 bg-gray-200 px-2 py-1 rounded text-xs font-bold">Đã Giao Xong ✓</span>',
    'cancelled': '<span class="text-red-500 bg-red-100 px-2 py-1 rounded text-xs font-bold">Đã Hủy</span>'
  };
  return map[status] || status;
}

function renderOrderCard(o) {
  const totalMoney = ((o.total_price || 0) + (o.delivery_fee || 0)).toLocaleString('vi-VN');
  const canCancel = o.status === 'pending';
  const cancelLabel = 'Hủy đơn';
  const timeAgo = o.created_at ? new Date(o.created_at + 'Z').toLocaleString('vi-VN') : '';

  const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
  const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow">${unreadCount}</span>` : '';

  let driverInfo = '';
  if (o.driver_name && ['preparing', 'arrived_store', 'delivering', 'arrived', 'completed'].includes(o.status)) {
    driverInfo = `
      <div class="mt-2 p-2 bg-blue-50 rounded-lg flex items-center border border-blue-100">
        <div class="w-8 h-8 bg-blue-200 text-blue-600 rounded-full flex items-center justify-center mr-2"><i class="fa-solid fa-motorcycle"></i></div>
        <div class="flex-1">
          <p class="text-xs font-bold text-gray-800">${o.driver_name}</p>
          <p class="text-[10px] text-gray-500">${o.driver_phone || 'Không có sđt'} • ${o.driver_vehicle || 'Chưa cập nhật xe'}</p>
        </div>
      </div>
    `;
  }

  return `
    <div onclick="viewOrderDetails(${o.id})" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 pr-2">
          <h4 class="font-bold text-gray-800 text-sm">Đơn #${o.id} <span class="font-normal text-xs text-gray-500">• ${o.store_name || 'Quán'}</span></h4>
          <p class="text-xs text-gray-500 mt-1">${o.item_description || ''}</p>
          <p class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-location-dot mr-1"></i>${o.delivery_address || ''}</p>
        </div>
        ${translateStatusHTML(o.status)}
      </div>
      ${driverInfo}
      <div class="flex justify-between items-center border-t pt-3 mt-3">
        <div>
          <span class="text-emerald-600 font-bold">${totalMoney}đ</span>
          <span class="text-xs text-gray-400 ml-2">${timeAgo}</span>
        </div>
        <div class="flex space-x-2" onclick="event.stopPropagation()">
          ${canCancel ? `<button onclick="cancelOrder(${o.id})" class="text-red-500 text-sm font-bold hover:text-red-700 bg-red-50 px-3 py-1 rounded-lg">${cancelLabel}</button>` : ''}
          ${['finding_driver', 'preparing', 'arrived_store', 'delivering', 'arrived'].includes(o.status) ? `<button onclick="openChat(${o.id})" class="relative text-blue-600 text-sm font-bold hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg"><i class="fa-solid fa-comment-dots mr-1"></i>Chat${unreadDot}</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderCustomerOrders(orders) {
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const containerActive = document.getElementById('active-orders-container');
  const containerHistory = document.getElementById('history-orders-container');

  // Active Orders
  if (activeOrders.length === 0) {
    containerActive.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">Không có đơn hàng nào đang giao.</p>';
    document.getElementById('map-wrapper').classList.add('hidden');
    activeMapOrder = null;
  } else {
    containerActive.innerHTML = activeOrders.map(renderOrderCard).join('');

    // Find order to show on map
    activeMapOrder = null;
    for (const o of activeOrders) {
      if ((o.status === 'delivering' || o.status === 'preparing') && o.store_lat && o.lat) {
        activeMapOrder = o;
        break;
      }
    }

    if (activeMapOrder && window.L && document.getElementById('btn-tab-active').className.includes('emerald')) {
      renderMap(activeMapOrder);
    } else {
      document.getElementById('map-wrapper').classList.add('hidden');
    }
  }

  // History Orders
  if (historyOrders.length === 0) {
    containerHistory.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">Chưa có lịch sử giao dịch.</p>';
  } else {
    containerHistory.innerHTML = historyOrders.map(renderOrderCard).join('');
  }
}

// ===== MAP =====
function renderMap(order) {
  document.getElementById('map-wrapper').classList.remove('hidden');

  if (!window.myMap) {
    window.myMap = L.map('map', { zoomControl: false }).setView([10.845, 106.794], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.myMap);
    window.mapLayerGroup = L.layerGroup().addTo(window.myMap);
  }

  setTimeout(() => window.myMap.invalidateSize(), 100);

  window.mapLayerGroup.clearLayers();
  if (window.routingControl) {
    window.myMap.removeControl(window.routingControl);
    window.routingControl = null;
  }

  const storePoint = L.latLng(order.store_lat, order.store_lng);
  const custPoint = L.latLng(order.lat, order.lng);

  // Custom icons
  const iconStore = L.divIcon({
    className: '',
    html: '<div style="background:#f97316;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px"><i class="fa-solid fa-store"></i></div>',
    iconSize: [32, 32], iconAnchor: [16, 16]
  });
  const iconCust = L.divIcon({
    className: '',
    html: '<div style="background:#3b82f6;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px"><i class="fa-solid fa-house"></i></div>',
    iconSize: [32, 32], iconAnchor: [16, 16]
  });

  if (order.status === 'delivering' && L.Routing) {
    window.routingControl = L.Routing.control({
      waypoints: [storePoint, custPoint],
      addWaypoints: false, routeWhileDragging: false, show: false,
      createMarker: () => null,
      lineOptions: { styles: [{ color: '#10b981', weight: 5 }] }
    }).addTo(window.myMap);
  } else {
    L.polyline([storePoint, custPoint], { color: '#f97316', weight: 3, dashArray: '5, 5' }).addTo(window.mapLayerGroup);
    window.myMap.fitBounds([storePoint, custPoint], { padding: [30, 30] });
  }

  L.marker(storePoint, { icon: iconStore }).addTo(window.mapLayerGroup).bindPopup('Quán: ' + (order.pickup_address || ''));
  L.marker(custPoint, { icon: iconCust }).addTo(window.mapLayerGroup).bindPopup('Giao đến: ' + (order.delivery_address || ''));

  // Update map status text
  const statusMap = {
    preparing: { text: 'Quán đang nấu', sub: 'Tài xế sẽ đến lấy khi xong' },
    arrived_store: { text: 'Tài xế đang đợi món', sub: 'Tài xế đã đến quán và đang chờ' },
    delivering: { text: 'Đang giao hàng', sub: 'Tài xế đang trên đường tới bạn' }
  };
  const info = statusMap[order.status] || { text: 'Đang xử lý', sub: '' };
  const mapInfo = document.querySelector('#map-wrapper .font-bold');
  const mapSub = document.querySelector('#map-wrapper .text-xs');
  if (mapInfo) mapInfo.textContent = info.text;
  if (mapSub) mapSub.textContent = info.sub;
}

// ===== CANCEL ORDER =====
async function cancelOrder(id) {
  if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
  try {
    await apiCall(`/customer/orders/${id}/cancel`, 'PUT', null, 'customer');
    alert('Hủy đơn thành công! Tiền đã được hoàn vào ví.');
    loadCustomerOrders();
    loadProfileData(); // Update balance immediately
  } catch (err) { alert(err.message); }
}

// ===== POLLING =====

// ===== ORDER DETAILS MODAL =====
function viewOrderDetails(id) {
  if(!window.customerOrdersList) return;
  const o = window.customerOrdersList.find(x => x.id === id);
  if(!o) return;

  document.getElementById('detail-id').textContent = o.id;
  document.getElementById('detail-status').innerHTML = translateStatusHTML(o.status);
  document.getElementById('detail-store').textContent = o.store_name || 'Quán';
  document.getElementById('detail-driver').textContent = o.driver_name ? `${o.driver_name} (${o.driver_phone || 'Không có sđt'})` : 'Chưa có tài xế';
  document.getElementById('detail-items').textContent = o.item_description || 'Không có món ăn';
  
  if (o.note) {
    document.getElementById('detail-note').textContent = o.note;
    document.getElementById('detail-note').classList.remove('hidden');
    document.getElementById('detail-note').previousElementSibling.classList.remove('hidden');
  } else {
    document.getElementById('detail-note').classList.add('hidden');
    document.getElementById('detail-note').previousElementSibling.classList.add('hidden');
  }

  document.getElementById('detail-price').textContent = (o.total_price || 0).toLocaleString('vi-VN') + 'đ';
  document.getElementById('detail-fee').textContent = (o.delivery_fee || 0).toLocaleString('vi-VN') + 'đ';
  document.getElementById('detail-total').textContent = ((o.total_price || 0) + (o.delivery_fee || 0)).toLocaleString('vi-VN') + 'đ';

  const chatContainer = document.getElementById('detail-chat-container');
  
  // Logic: Show chat button if active OR (completed AND within 30 mins)
  let showChat = false;
  if (['finding_driver', 'preparing', 'arrived_store', 'delivering', 'arrived'].includes(o.status)) {
    showChat = true;
  } else if (o.status === 'completed') {
    const timeRef = o.updated_at || o.created_at;
    if (timeRef) {
      const diffMs = Date.now() - new Date(timeRef + 'Z').getTime();
      const diffMins = diffMs / 1000 / 60;
      if (diffMins <= 30) {
        showChat = true;
      }
    }
  }

  if (showChat) {
    const unreadCount = (o.msg_count || 0) - parseInt(localStorage.getItem('chat_read_' + o.id) || 0);
    const unreadDot = unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow">${unreadCount}</span>` : '';
    chatContainer.innerHTML = `<button onclick="closeOrderDetails(); openChat(${o.id})" class="relative w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow hover:bg-blue-600 transition"><i class="fa-solid fa-comment-dots mr-2"></i>Nhắn tin (với Quán / Tài xế)${unreadDot}</button>`;
    chatContainer.classList.remove('hidden');
  } else {
    chatContainer.innerHTML = '';
    chatContainer.classList.add('hidden');
  }

  document.getElementById('order-details-modal').classList.remove('hidden');
}

function closeOrderDetails() {
  document.getElementById('order-details-modal').classList.add('hidden');
}

setInterval(refreshData, 3000);
