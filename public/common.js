const API_URL = 'http://localhost:5000/api';

// State
let tokens = { customer: null, store: null, driver: null, manager: null };

// Generic API call
async function apiCall(endpoint, method = 'GET', body = null, role = currentRole) {
  const headers = { 'Content-Type': 'application/json' };
  if (tokens[role]) {
    headers['Authorization'] = `Bearer ${tokens[role]}`;
  }
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}

// Authentication - Login
async function login(role) {
  let prefix = role === 'customer' ? 'cust' : role === 'driver' ? 'drv' : role === 'manager' ? 'mgr' : 'store';
  const username = document.getElementById(`${prefix}-user`).value;
  const password = document.getElementById(`${prefix}-pass`).value;
  
  if (!username || !password) return alert('Vui lòng nhập tài khoản và mật khẩu!');

  try {
    const res = await apiCall('/auth/login', 'POST', { username, password }, role);
    tokens[role] = res.data.token;
    if (typeof refreshData === 'function') refreshData();
  } catch (err) {
    alert(`Đăng nhập thất bại: ${err.message}`);
  }
}

// Authentication - Register
async function register(role) {
  let prefix = role === 'customer' ? 'cust' : role === 'driver' ? 'drv' : role === 'manager' ? 'mgr' : 'store';
  const username = document.getElementById(`${prefix}-user`).value;
  const password = document.getElementById(`${prefix}-pass`).value;

  if (!username || !password) return alert('Vui lòng nhập tài khoản và mật khẩu!');
  
  let body = { username, password, role };
  
  // Registration additional fields
  const nameEl = document.getElementById(`${prefix}-name`);
  if (nameEl && nameEl.value) body.full_name = nameEl.value;
  
  const phoneEl = document.getElementById(`${prefix}-phone`);
  if (phoneEl && phoneEl.value) body.phone_number = phoneEl.value;
  
  const vehicleEl = document.getElementById(`${prefix}-vehicle`);
  if (vehicleEl && vehicleEl.value) body.vehicle_info = vehicleEl.value;

  if (role === 'store') {
    const addrEl = document.getElementById('store-address');
    if (addrEl && addrEl.value) body.address = addrEl.value;
    if (!body.address) return alert('Quán ăn cần nhập địa chỉ!');
  }

  try {
    await apiCall('/auth/register', 'POST', body, role);
    alert('Đăng ký thành công! Đang đăng nhập...');
    // Auto-login after register
    const res = await apiCall('/auth/login', 'POST', { username, password }, role);
    tokens[role] = res.data.token;
    if (typeof refreshData === 'function') refreshData();
  } catch (err) {
    alert(`Đăng ký thất bại: ${err.message}`);
  }
}

async function loadProfile(role) {
  try {
    const res = await apiCall('/users/profile', 'GET', null, role);
    const profile = res.data;
    const dashboard = document.getElementById(`${role}-dashboard`);
    if(!dashboard) return;
    
    const nameEl = dashboard.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = profile.full_name || profile.username;
    
    const balanceEl = dashboard.querySelector('.profile-balance');
    if (balanceEl) balanceEl.textContent = (profile.balance || 0).toLocaleString('vi-VN');
    
    const phoneEl = dashboard.querySelector('.profile-phone');
    if (phoneEl) phoneEl.textContent = profile.phone_number || '';

    const vehicleEl = dashboard.querySelector('.profile-vehicle');
    if (vehicleEl) vehicleEl.textContent = profile.vehicle_info || 'Không rõ';
  } catch(e) {
    console.error(e);
  }
}

async function depositWallet(role, amount) {
  try {
    await apiCall('/users/wallet/deposit', 'POST', { amount }, role);
    alert('Nạp tiền thành công!');
    if (typeof refreshData === 'function') refreshData();
  } catch(e) {
    alert('Lỗi nạp tiền: ' + e.message);
  }
}

function translateStatus(status) {
  switch(status) {
    case 'pending': return 'Chờ Quán Nhận';
    case 'finding_driver': return 'Đang Tìm Tài Xế';
    case 'preparing': return 'Quán Đang Làm';
    case 'delivering': return 'Tài Xế Đang Giao';
    case 'completed': return 'Đã Giao Xong';
    case 'cancelled': return 'Đã Hủy';
    default: return status;
  }
}

