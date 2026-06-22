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
    
    // We can just query the whole document, assuming only one active profile tab per page
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = profile.full_name || profile.username);
    document.querySelectorAll('.profile-balance').forEach(el => el.textContent = (profile.balance || 0).toLocaleString('vi-VN'));
    document.querySelectorAll('.profile-phone').forEach(el => el.textContent = profile.phone_number || '');
    document.querySelectorAll('.profile-vehicle').forEach(el => el.textContent = profile.vehicle_info || 'Chưa cập nhật');
  } catch(e) {
    console.error(e);
  }
}

async function depositWallet(role, amount) {
  try {
    await apiCall('/users/wallet/deposit', 'POST', { amount }, role);
    alert('Nạp ' + amount.toLocaleString('vi-VN') + 'đ thành công!');
    if (typeof refreshData === 'function') refreshData();
  } catch(e) {
    alert('Lỗi nạp tiền: ' + e.message);
  }
}

function customDeposit() {
  const input = prompt('Nhập số tiền muốn nạp (VND):');
  if (!input) return;
  const amount = parseInt(input);
  if (isNaN(amount) || amount < 10000) return alert('Số tiền tối thiểu là 10.000đ');
  if (amount > 10000000) return alert('Số tiền tối đa mỗi lần nạp là 10.000.000đ');
  depositWallet(currentRole, amount);
}

function translateStatus(status) {
  switch(status) {
    case 'pending': return 'Chờ Quán Nhận';
    case 'finding_driver': return 'Đang Tìm Tài Xế';
    case 'preparing': return 'Quán Đang Làm';
    case 'delivering': return 'Tài Xế Đang Giao';
    case 'arrived': return 'Tài Xế Đã Đến';
    case 'completed': return 'Đã Giao Xong';
    case 'cancelled': return 'Đã Hủy';
    default: return status;
  }
}

// ==========================================
// CHAT & NOTIFICATIONS LOGIC
// ==========================================

let activeChatOrderId = null;
let chatPollingInterval = null;

function openChat(orderId) {
  activeChatOrderId = orderId;
  document.getElementById('chat-modal').classList.remove('hidden');
  document.getElementById('chat-order-id').textContent = orderId;
  
  // Initial fetch
  fetchChatMessages();
  
  // Start polling every 3 seconds
  chatPollingInterval = setInterval(fetchChatMessages, 3000);
}

function closeChat() {
  document.getElementById('chat-modal').classList.add('hidden');
  activeChatOrderId = null;
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}

async function fetchChatMessages() {
  if (!activeChatOrderId) return;
  try {
    const res = await apiCall(`/messages/${activeChatOrderId}`, 'GET', null, currentRole);
    renderChatMessages(res.data);
  } catch (err) {
    console.error('Lỗi lấy tin nhắn:', err);
  }
}

function renderChatMessages(messages) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  let html = '';
  messages.forEach(m => {
    const isMe = m.sender_role === currentRole; // Simplified, assuming single login per role
    // Format time: HH:mm
    const timeStr = new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Bubble color mapping based on role
    let bubbleColor = isMe ? 'bg-emerald-500 text-white' : 'bg-white border text-gray-800';
    if (!isMe) {
        if (m.sender_role === 'store') bubbleColor = 'bg-orange-100 text-orange-800 border-orange-200';
        else if (m.sender_role === 'driver') bubbleColor = 'bg-blue-100 text-blue-800 border-blue-200';
        else bubbleColor = 'bg-white border text-gray-800';
    }

    const alignment = isMe ? 'justify-end' : 'justify-start';
    const borderRadius = isMe ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm' : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm';
    
    let senderLabel = '';
    if (!isMe) {
      if (m.sender_role === 'store') senderLabel = `<div class="text-[10px] text-gray-500 mb-1 ml-1"><i class="fa-solid fa-store mr-1"></i>${m.sender_name}</div>`;
      else if (m.sender_role === 'driver') senderLabel = `<div class="text-[10px] text-gray-500 mb-1 ml-1"><i class="fa-solid fa-motorcycle mr-1"></i>${m.sender_name} (Tài xế)</div>`;
      else senderLabel = `<div class="text-[10px] text-gray-500 mb-1 ml-1"><i class="fa-solid fa-user mr-1"></i>Khách hàng</div>`;
    }

    html += `
      <div class="flex ${alignment}">
        <div class="max-w-[75%]">
          ${senderLabel}
          <div class="${bubbleColor} ${borderRadius} px-4 py-2 shadow-sm relative">
            <p class="text-sm">${m.content}</p>
            <p class="text-[9px] text-right opacity-70 mt-1">${timeStr}</p>
          </div>
        </div>
      </div>
    `;
  });
  
  // Only scroll down if new messages were added
  const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
  container.innerHTML = html;
  if (isAtBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

async function sendChatMessage() {
  if (!activeChatOrderId) return;
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;
  
  input.value = ''; // clear input
  try {
    await apiCall(`/messages/${activeChatOrderId}`, 'POST', { content }, currentRole);
    fetchChatMessages(); // instantly fetch
  } catch (err) {
    alert('Không thể gửi tin nhắn: ' + err.message);
  }
}

// Global Toast Notification Logic
let toastTimeout;
function showToast(message, icon = 'fa-bell', colorClass = 'bg-emerald-500') {
  // Create toast container if not exists
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-sm pointer-events-none transition-all duration-300 -translate-y-20 opacity-0';
    document.body.appendChild(toastContainer);
  }

  toastContainer.innerHTML = `
    <div class="${colorClass} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center">
      <div class="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0">
        <i class="fa-solid ${icon}"></i>
      </div>
      <p class="font-semibold text-sm flex-1 leading-snug">${message}</p>
    </div>
  `;

  // Show
  toastContainer.classList.remove('-translate-y-20', 'opacity-0');
  toastContainer.classList.add('translate-y-0', 'opacity-100');

  // Hide after 4 seconds
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastContainer.classList.remove('translate-y-0', 'opacity-100');
    toastContainer.classList.add('-translate-y-20', 'opacity-0');
  }, 4000);
}
