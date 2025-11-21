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
    payment: document.getElementById('paymentForm')
  };

  if (forms.contact) {
    forms.contact.addEventListener('submit', e => {
      e.preventDefault();
      alert('Thanks — we received your message.');
      forms.contact.reset();
    });
  }
  if (forms.booking) {
    // Skip attaching demo handler when booking page has its own inline logic
    if (!forms.booking.dataset.inlineHandler) {
      forms.booking.addEventListener('submit', e => {
        e.preventDefault();
        alert('Booking requested. We will confirm via email.');
        forms.booking.reset();
        location.href = 'index.html';
      });
    }
  }
  if (forms.payment) {
    forms.payment.addEventListener('submit', e => {
      e.preventDefault();
      alert('Payment processed (demo). Thank you.');
      forms.payment.reset();
      location.href = 'index.html';
    });
  }

  const phoneInput = document.getElementById('phone');
  const formatPhoneDigits = digits => {
    if (!digits) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (phoneInput) {
    const applyPhoneMask = value => {
      const digitsOnly = (value || '').replace(/\D/g, '').slice(0, 10);
      phoneInput.dataset.raw = digitsOnly;
      phoneInput.value = formatPhoneDigits(digitsOnly);
    };

    const allowedKeys = new Set([
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Home', 'End', 'Escape', 'Enter', 'Shift'
    ]);

    phoneInput.addEventListener('keydown', event => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (allowedKeys.has(event.key)) return;
      if (!/^\d$/.test(event.key)) {
        event.preventDefault();
      }
    });

    phoneInput.addEventListener('input', () => applyPhoneMask(phoneInput.value));

    phoneInput.addEventListener('paste', event => {
      const clipboard = event.clipboardData || window.clipboardData;
      if (!clipboard) return;
      const text = clipboard.getData('text');
      if (!text) return;
      event.preventDefault();
      applyPhoneMask(text);
    });

    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value && phoneInput.dataset.raw) {
        phoneInput.value = formatPhoneDigits(phoneInput.dataset.raw);
      }
    });

    if (phoneInput.value) {
      applyPhoneMask(phoneInput.value);
    }

    if (forms.booking) {
      forms.booking.addEventListener('reset', () => {
        phoneInput.dataset.raw = '';
      });
      forms.booking.addEventListener('submit', () => {
        const rawValue = phoneInput.dataset.raw || phoneInput.value.replace(/\D/g, '');
        phoneInput.dataset.raw = rawValue;
        phoneInput.value = rawValue;
        setTimeout(() => {
          phoneInput.value = formatPhoneDigits(phoneInput.dataset.raw);
        });
      }, true);
    }
  }
});
