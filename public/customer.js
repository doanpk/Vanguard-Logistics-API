let currentStoreId = null;
let cart = [];
let activeMapOrder = null;
let allStores = []; // Store for filtering

// Tab Switching
function switchTab(tabId, element) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  
  if (tabId === 'orders') {
    loadCustomerOrders();
    switchOrderTab('active');
  }
}

// Order sub-tab switching
function switchOrderTab(subTab) {
  const btnActive = document.getElementById('btn-tab-active');
  const btnHistory = document.getElementById('btn-tab-history');
  
  if (subTab === 'active') {
    btnActive.className = 'pb-2 border-b-2 border-emerald-500 font-bold text-emerald-600';
    btnHistory.className = 'pb-2 font-bold text-gray-400';
    document.getElementById('active-orders-container').classList.remove('hidden');
    document.getElementById('history-orders-container').classList.add('hidden');
    if(activeMapOrder) document.getElementById('map-wrapper').classList.remove('hidden');
  } else {
    btnActive.className = 'pb-2 font-bold text-gray-400';
    btnHistory.className = 'pb-2 border-b-2 border-emerald-500 font-bold text-emerald-600';
    document.getElementById('active-orders-container').classList.add('hidden');
    document.getElementById('history-orders-container').classList.remove('hidden');
    document.getElementById('map-wrapper').classList.add('hidden');
  }
}

// Override auth flow to show Bottom Nav
const originalRefresh = window.refreshData;
window.refreshData = function() {
  if (tokens.customer) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('bottom-nav').style.display = 'flex';
    
    loadProfile('customer').then(() => {
      // Update header address and avatar after loading profile
      const userStr = localStorage.getItem('customerProfile');
      if(userStr) {
        const u = JSON.parse(userStr);
        if(u.lat && u.lng) document.getElementById('header-address').textContent = 'Vị trí GPS của bạn ▾';
        else document.getElementById('header-address').textContent = 'Ký Túc Xá UTC2 ▾';
        document.getElementById('profile-avatar').src = `https://ui-avatars.com/api/?name=${u.full_name || u.username}&background=random`;
      }
    });
    if (!currentStoreId) loadCustomerStores();
    loadCustomerOrders();
  }
};

async function loadCustomerStores() {
  try {
    const res = await apiCall('/customer/orders/stores', 'GET', null, 'customer');
    allStores = res.data;
    renderStores(allStores);
  } catch(e) {}
}

function renderStores(stores) {
  const container = document.getElementById('store-list-container');
  if (stores.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Chưa có quán nào trên hệ thống hoặc phù hợp tìm kiếm.</p>';
    return;
  }
  
  container.innerHTML = stores.map(s => `
    <div onclick="viewStoreMenu(${s.id}, '${s.username}')" class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3 cursor-pointer">
      <img src="https://ui-avatars.com/api/?name=${s.username}&background=random" class="w-16 h-16 rounded-lg object-cover">
      <div class="flex-1">
        <h3 class="font-bold text-gray-800">${s.username}</h3>
        <p class="text-xs text-gray-500 truncate"><i class="fa-solid fa-location-dot mr-1"></i>${s.address || 'Đang cập nhật'}</p>
        <p class="text-xs text-orange-500 font-semibold mt-1"><i class="fa-solid fa-star text-yellow-400"></i> 5.0 (99+)</p>
      </div>
    </div>
  `).join('');
}

function filterStores() {
  const q = document.getElementById('search-store').value.toLowerCase();
  const filtered = allStores.filter(s => s.username.toLowerCase().includes(q) || (s.address && s.address.toLowerCase().includes(q)));
  renderStores(filtered);
}

async function viewStoreMenu(storeId, storeName) {
  document.getElementById('tab-home').classList.add('hidden');
  document.getElementById('store-menu-view').classList.remove('hidden');
  document.getElementById('menu-store-name').textContent = storeName;
  currentStoreId = storeId;
  cart = [];
  updateCartUI();

  try {
    const res = await apiCall(`/customer/orders/stores/${storeId}/menu`, 'GET', null, 'customer');
    const container = document.getElementById('menu-list-container');
    let html = '';
    res.data.menu.forEach(item => {
      html += `
        <div class="flex justify-between items-center border-b pb-3 border-gray-100">
          <div class="flex-1 pr-4">
            <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
            <p class="text-xs text-gray-500 my-1 truncate">${item.description || ''}</p>
            <p class="font-semibold text-emerald-600 text-sm">${item.price.toLocaleString('vi-VN')}đ</p>
          </div>
          <button onclick="addToCart('${item.name}', ${item.price})" class="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg hover:bg-emerald-200 shadow-sm">+</button>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch(e) {
    alert("Lỗi tải menu: " + e.message);
  }
}

function closeStoreMenu() {
  document.getElementById('store-menu-view').classList.add('hidden');
  document.getElementById('tab-home').classList.remove('hidden');
  currentStoreId = null;
  document.getElementById('cart-float').classList.add('hidden');
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, qty: 1 });
  updateCartUI();
}

function updateCartUI() {
  let total = 0;
  let count = 0;
  cart.forEach(i => { total += i.qty * i.price; count += i.qty; });
  
  if (count > 0) {
    document.getElementById('cart-float').classList.remove('hidden');
    document.getElementById('cart-badge').textContent = count;
    document.getElementById('cart-total-float').textContent = total.toLocaleString('vi-VN') + 'đ';
  } else {
    document.getElementById('cart-float').classList.add('hidden');
  }

  // Modal Update
  const list = document.getElementById('cart-items-list');
  list.innerHTML = cart.map(i => `
    <li class="flex justify-between items-center text-sm">
      <div class="font-semibold text-gray-800"><span class="text-emerald-500 mr-2">${i.qty}x</span> ${i.name}</div>
      <div class="text-gray-600">${(i.qty * i.price).toLocaleString('vi-VN')}đ</div>
    </li>
  `).join('');
  
  document.getElementById('cart-subtotal').textContent = total.toLocaleString('vi-VN') + 'đ';
  document.getElementById('cart-final').textContent = (total + 15000).toLocaleString('vi-VN') + 'đ';
}

function openCart() {
  document.getElementById('checkout-modal').classList.remove('hidden');
}
function closeCart() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

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

async function submitOrder() {
  if (cart.length === 0) return alert('Giỏ hàng trống!');
  const deliveryAddress = document.getElementById('delivery-address').value;
  if (!deliveryAddress) return alert('Vui lòng nhập địa chỉ giao hàng!');

  try {
    await apiCall('/customer/orders', 'POST', { storeId: currentStoreId, items: cart, deliveryAddress }, 'customer');
    alert('Đặt hàng thành công!');
    closeCart();
    closeStoreMenu();
    document.getElementById('delivery-address').value = '';
    // Chuyển sang tab Đơn hàng
    document.querySelectorAll('.nav-item')[1].click();
  } catch (err) {
    alert(`Lỗi đặt hàng: ${err.message}`);
  }
}

async function loadCustomerOrders() {
  try {
    const res = await apiCall('/customer/orders', 'GET', null, 'customer');
    renderCustomerOrders(res.data);
  } catch(e) {}
}

function translateStatusHTML(status) {
  const map = {
    'pending': '<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-bold">Chờ Xác Nhận</span>',
    'finding_driver': '<span class="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold">Tìm Tài Xế</span>',
    'preparing': '<span class="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-bold">Quán Đang Làm</span>',
    'delivering': '<span class="text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs font-bold">Tài Xế Đang Giao</span>',
    'completed': '<span class="text-gray-500 bg-gray-200 px-2 py-1 rounded text-xs font-bold">Đã Giao Xong</span>',
    'cancelled': '<span class="text-red-500 bg-red-100 px-2 py-1 rounded text-xs font-bold">Đã Hủy</span>'
  };
  return map[status] || status;
}

function renderOrderCard(o) {
  return `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h4 class="font-bold text-gray-800 text-sm">Đơn hàng #${o.id}</h4>
          <p class="text-xs text-gray-500">${o.item_description}</p>
        </div>
        ${translateStatusHTML(o.status)}
      </div>
      <div class="flex justify-between items-center border-t pt-3 mt-2">
        <div class="text-emerald-600 font-bold">${((o.total_price||0) + (o.delivery_fee||0)).toLocaleString('vi-VN')}đ</div>
        ${['pending', 'finding_driver', 'preparing'].includes(o.status) 
          ? `<button onclick="cancelOrder(${o.id})" class="text-red-500 text-sm font-bold">${o.status === 'preparing' ? 'Hủy (phạt 20%)' : 'Hủy đơn'}</button>` 
          : ''}
      </div>
    </div>
  `;
}

function renderCustomerOrders(orders) {
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const containerActive = document.getElementById('active-orders-container');
  const containerHistory = document.getElementById('history-orders-container');

  if (activeOrders.length === 0) {
    containerActive.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">Không có đơn hàng nào đang giao.</p>';
    document.getElementById('map-wrapper').classList.add('hidden');
  } else {
    containerActive.innerHTML = activeOrders.map(renderOrderCard).join('');
    
    activeMapOrder = null;
    activeOrders.forEach(o => {
      if ((o.status === 'delivering' || o.status === 'preparing') && o.store_lat && o.lat && !activeMapOrder) {
        activeMapOrder = o;
      }
    });

    if (activeMapOrder && window.L && document.getElementById('btn-tab-active').className.includes('emerald')) {
      document.getElementById('map-wrapper').classList.remove('hidden');
      if (!window.myMap) {
        window.myMap = L.map('map', { zoomControl: false }).setView([10.845, 106.794], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.myMap);
        window.mapLayerGroup = L.layerGroup().addTo(window.myMap);
      }
      
      window.mapLayerGroup.clearLayers();
      if (window.routingControl) {
        window.myMap.removeControl(window.routingControl);
        window.routingControl = null;
      }
      
      const storePoint = L.latLng(activeMapOrder.store_lat, activeMapOrder.store_lng);
      const custPoint = L.latLng(activeMapOrder.lat, activeMapOrder.lng);
      
      if (activeMapOrder.status === 'delivering' && L.Routing) {
        window.routingControl = L.Routing.control({
          waypoints: [storePoint, custPoint], addWaypoints: false, routeWhileDragging: false, show: false, createMarker: () => null, lineOptions: { styles: [{color: '#3b82f6', weight: 5}] }
        }).addTo(window.myMap);
      } else {
        L.polyline([storePoint, custPoint], {color: '#f97316', weight: 3, dashArray: '5, 5'}).addTo(window.mapLayerGroup);
        window.myMap.fitBounds([storePoint, custPoint], { padding: [20, 20] });
      }
      L.marker(storePoint).addTo(window.mapLayerGroup);
      L.marker(custPoint).addTo(window.mapLayerGroup);
    } else {
      document.getElementById('map-wrapper').classList.add('hidden');
    }
  }

  if (historyOrders.length === 0) {
    containerHistory.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">Chưa có lịch sử giao dịch.</p>';
  } else {
    containerHistory.innerHTML = historyOrders.map(renderOrderCard).join('');
  }
}

async function cancelOrder(id) {
  if(!confirm("Bạn chắc chắn muốn hủy?")) return;
  try {
    await apiCall(`/customer/orders/${id}/cancel`, 'PUT', null, 'customer');
    loadCustomerOrders();
    loadProfile('customer');
  } catch (err) { alert(err.message); }
}

// Intercept profile loading to save to local storage for header updating
const originalLoadProfile = window.loadProfile;
window.loadProfile = async function(role) {
  await originalLoadProfile(role);
  if(role === 'customer') {
    try {
      const res = await fetch(`${API_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${tokens.customer}` } });
      const data = await res.json();
      localStorage.setItem('customerProfile', JSON.stringify(data.data));
    } catch(e) {}
  }
}

setInterval(refreshData, 3000);
