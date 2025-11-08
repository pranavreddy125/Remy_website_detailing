document.addEventListener('DOMContentLoaded', () => {
  // set year
  document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());

  // mobile nav toggle (same code works on every page)
  document.querySelectorAll('.nav-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const header = btn.closest('.site-header');
      const nav = header && header.querySelector('.main-nav');
      if (!nav) return;
      nav.style.display = nav.style.display === 'block' ? '' : 'block';
    });
  });

  // basic demo form handlers
  const forms = {
    contact: document.getElementById('contactForm'),
    booking: document.getElementById('bookingForm'),
    payment: document.getElementById('paymentForm'),
    login: document.getElementById('loginForm')
  };

  if (forms.contact) {
    forms.contact.addEventListener('submit', e => {
      e.preventDefault();
      alert('Thanks — we received your message.');
      forms.contact.reset();
    });
  }
  if (forms.booking) {
    forms.booking.addEventListener('submit', e => {
      e.preventDefault();
      alert('Booking requested. We will confirm via email.');
      forms.booking.reset();
      location.href = 'index.html';
    });
  }
  if (forms.payment) {
    forms.payment.addEventListener('submit', e => {
      e.preventDefault();
      alert('Payment processed (demo). Thank you.');
      forms.payment.reset();
      location.href = 'index.html';
    });
  }
  if (forms.login) {
    forms.login.addEventListener('submit', e => {
      e.preventDefault();
      alert('Signed in (demo).');
      forms.login.reset();
      location.href = 'index.html';
    });
  }
});