document.addEventListener('DOMContentLoaded', () => {
  const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxYvyszKKA71dkx524GAaGVtxyZsARzx10OE_LWFlLBCMmW-3KOlyD2Mb__KThQZaUMcQ/exec';
  const sessionPhone = sessionStorage.getItem('userPhone');
  if (!sessionPhone) {
    window.location.href = 'login.html';
    return;
  }

  const nameEl = document.getElementById('memberName');
  const visitEl = document.getElementById('visitCount');
  const lastVisitEl = document.getElementById('lastVisit');
  const statusEl = document.getElementById('statusMessage');
  const rewardEl = document.getElementById('rewardMessage');
  const progressFill = document.getElementById('progressFill');
  const progressDots = document.getElementById('progressDots');
  const logoutBtn = document.getElementById('logoutBtn');

  const renderDots = (count) => {
    if (!progressDots) return;
    const total = 4;
    progressDots.innerHTML = '';
    for (let i = 1; i <= total; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot' + (i <= count ? ' filled' : '');
      dot.textContent = i;
      progressDots.appendChild(dot);
    }
  };

  renderDots(0);

  const updateProgress = (visits) => {
    const capped = Math.max(0, Math.min(4, visits));
    const percentage = (capped / 4) * 100;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    renderDots(capped);
    if (visitEl) {
      visitEl.textContent = `${visits}/4`;
    }
    if (rewardEl) {
      if (visits >= 4) {
        rewardEl.textContent = 'Free detail unlocked!';
        rewardEl.classList.add('visible');
      } else {
        rewardEl.classList.remove('visible');
      }
    }
  };

  const formatLastVisit = (value) => {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  fetch(API_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=lookupCustomer&phone=${encodeURIComponent(sessionPhone)}`
  })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      const visits = Number.parseInt(data && data.visits, 10) || 0;
      const displayName = (data && data.name) || sessionStorage.getItem('userName') || 'Guest';
      if (nameEl) nameEl.textContent = displayName;
      if (lastVisitEl) lastVisitEl.textContent = formatLastVisit(data && data.lastVisit);
      updateProgress(visits);
      if (statusEl) {
        statusEl.textContent = data && data.status ? `Status: ${data.status}` : 'Up to date.';
      }
    })
    .catch(err => {
      console.error(err);
      if (statusEl) statusEl.textContent = 'Unable to load loyalty details. Please try again later.';
    });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = 'login.html';
    });
  }
});
