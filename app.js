// Waitlist emails stored locally (will send to Formspree/Resend later)
const FORMSPREE_URL = 'https://formspree.io/f/YOUR_FORM_ID'; // replace after setup

function handleSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email-input').value;
  submitEmail(email, 'success-msg', 'submit-btn');
}

function handleSubmit2(e) {
  e.preventDefault();
  const email = document.getElementById('email-input-2').value;
  submitEmail(email, 'success-msg-2', null);
}

function submitEmail(email, successId, btnId) {
  // Save to localStorage
  const list = JSON.parse(localStorage.getItem('waitlist') || '[]');
  if (!list.includes(email)) {
    list.push(email);
    localStorage.setItem('waitlist', JSON.stringify(list));
  }

  // Show success
  const successEl = document.getElementById(successId);
  if (successEl) {
    successEl.style.display = 'block';
    successEl.style.animation = 'fadeIn 0.4s ease';
  }

  // Update button
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.innerHTML = '✓ You\'re in!';
      btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
    }
  }

  // Log
  console.log('Waitlist signup:', email);

  // Optional: send to Formspree (uncomment when you set up form)
  // fetch(FORMSPREE_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //   body: JSON.stringify({ email })
  // });
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .investor-card, .compare-table').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
