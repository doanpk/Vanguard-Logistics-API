function selectRole(role) {
  // Update hidden input
  document.getElementById('role').value = role;

  // Update button styles
  const roles = ['customer', 'driver', 'store'];
  roles.forEach(r => {
    const btn = document.getElementById(`btn-${r}`);
    if (r === role) {
      btn.classList.add('active');
      btn.classList.remove('text-gray-600', 'hover:bg-gray-200');
    } else {
      btn.classList.remove('active');
      btn.classList.add('text-gray-600');
    }
  });

  // Show/Hide dynamic fields
  const vehicleField = document.getElementById('field-vehicle');
  const addressField = document.getElementById('field-address');
  
  if (role === 'driver') {
    vehicleField.classList.add('show');
    addressField.classList.remove('show');
    document.getElementById('vehicle_info').required = true;
    document.getElementById('address').required = false;
  } else if (role === 'store') {
    addressField.classList.add('show');
    vehicleField.classList.remove('show');
    document.getElementById('address').required = true;
    document.getElementById('vehicle_info').required = false;
  } else {
    vehicleField.classList.remove('show');
    addressField.classList.remove('show');
    document.getElementById('vehicle_info').required = false;
    document.getElementById('address').required = false;
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const role = document.getElementById('role').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const full_name = document.getElementById('full_name').value;
  const phone_number = document.getElementById('phone_number').value;
  const vehicle_info = document.getElementById('vehicle_info').value;
  const address = document.getElementById('address').value;
  
  const errorDiv = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');
  
  // Prepare payload
  const payload = { role, username, password, full_name, phone_number };
  if (role === 'driver') payload.vehicle_info = vehicle_info;
  if (role === 'store') payload.address = address;

  try {
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-70');
    errorDiv.classList.add('hidden');
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đăng ký thành công!';
      submitBtn.classList.replace('from-emerald-500', 'from-green-500');
      
      // Attempt login immediately
      const loginResp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginData = await loginResp.json();

      if (loginData.success && loginData.data && loginData.data.token) {
        localStorage.setItem('token', loginData.data.token);
      }
      
      // Redirect after 1.5s
      setTimeout(() => {
        if (role === 'customer') window.location.href = 'customer.html';
        else if (role === 'driver') window.location.href = 'driver.html';
        else if (role === 'store') window.location.href = 'store.html';
      }, 1500);
    } else {
      errorDiv.innerText = data.message || "Có lỗi xảy ra khi đăng ký.";
      errorDiv.classList.remove('hidden');
      resetBtn();
    }
  } catch (error) {
    errorDiv.innerText = "Lỗi kết nối máy chủ!";
    errorDiv.classList.remove('hidden');
    resetBtn();
  }

  function resetBtn() {
    submitBtn.innerHTML = 'Tạo tài khoản ngay';
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-70');
  }
}
