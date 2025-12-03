(() => {
  const LOGIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxYvyszKKA71dkx524GAaGVtxyZsARzx10OE_LWFlLBCMmW-3KOlyD2Mb__KThQZaUMcQ/exec';
  const ADMIN_SECRET = 'desertadmin!!';
  const form = document.getElementById('loginForm');
  const phoneInput = document.getElementById('phoneInput');
  const toast = document.getElementById('toast');
  const submitButton = form.querySelector('button[type="submit"]');
  let toastTimer;
  let redirectScheduled = false;

  const showToast = (message, variant = 'success') => {
    toast.textContent = message;
    toast.classList.remove('visible', 'error');
    if (variant === 'error') {
      toast.classList.add('error');
    } else {
      toast.classList.remove('error');
    }
    // allow re-trigger animation
    void toast.offsetWidth;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  };

  const setLoading = (isLoading) => {
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = 'Signing In...';
    } else {
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = phoneInput.value.trim();
    if (!raw) {
      showToast('Enter a phone number to continue.', 'error');
      return;
    }

    let payload;
    const isAdminInput = raw === ADMIN_SECRET;
    if (isAdminInput) {
      payload = { action: 'login', phone: raw };
    } else {
      const normalized = raw.replace(/\D/g, '');
      if (normalized.length < 7) {
        showToast('Enter a valid phone number to continue.', 'error');
        return;
      }
      payload = { action: 'login', phone: normalized };
    }

    setLoading(true);

    fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=${encodeURIComponent(payload.action)}&phone=${encodeURIComponent(payload.phone)}`
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const isAdmin = data && data.status === 'admin';
        const isReturning = Boolean(
          (data && (data.status === 'found' || data.result === 'found')) ||
          (data && typeof data.found === 'boolean' && data.found)
        );
        const memberName = (data && (data.name || data.customer || data.fullName)) || 'loyal guest';
        const message = data && data.message
          ? data.message
          : (isAdmin ? 'Admin access granted.' : (isReturning ? `Welcome back, ${memberName}!` : 'Account created successfully.'));
        if (data) {
          sessionStorage.setItem('userPhone', data.phone || payload.phone);
          sessionStorage.setItem('userName', memberName);
        }
        showToast(message);

        redirectScheduled = true;
        setTimeout(() => {
          window.location.href = isAdmin ? 'admin.html' : 'loyalty.html';
        }, isAdmin ? 1200 : 2000);
      })
      .catch(err => {
        console.error(err);
        showToast('Failed to connect: ' + err.message, 'error');
        setLoading(false);
      });
  });
})();
