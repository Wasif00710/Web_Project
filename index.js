document.addEventListener('DOMContentLoaded', function () {
  // set footer year (if there's an element with id="year")
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // counter animation (reads data-target or the numeric value in the element)
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // bigger = slower
  const parseNumber = (el) => {
    // prefer explicit data-target, otherwise parse digits from textContent
    const dt = el.getAttribute('data-target');
    if (dt && !isNaN(Number(dt))) return Number(dt);
    const digits = (el.textContent || '').replace(/[^0-9]/g, '');
    return digits ? Number(digits) : 0;
  };
  const runCounter = (el) => {
    const target = parseNumber(el);
    let current = 0;
    if (target <= 0) { el.textContent = target; return; }
    const step = Math.max(1, Math.ceil(target / speed));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = current;
      }
    }, 12);
  };

  // IntersectionObserver to start when counters visible
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
  } else {
    // fallback
    counters.forEach(runCounter);
  }

  // team-photo modal: make it robust (works if images have class "team-photo" or data attrs)
  const teamPhotos = document.querySelectorAll('img.team-photo');
  teamPhotos.forEach(photo => {
    photo.style.cursor = 'pointer';
    photo.addEventListener('click', () => {
      const name = photo.dataset.name || photo.alt || '';
      const role = photo.dataset.role || '';
      const src = photo.src;

      // create modal overlay
      const modal = document.createElement('div');
      Object.assign(modal.style, {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      });

      modal.innerHTML = `
        <div role="dialog" aria-modal="true" style="background:#fff;border-radius:12px;padding:18px;max-width:720px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.25);">
          <img src="${src}" alt="${name}" style="max-width:260px;width:100%;height:auto;border-radius:8px;margin-bottom:12px;">
          <h4 style="margin:0 0 4px">${name}</h4>
          <small style="color:#666;display:block;margin-bottom:12px">${role}</small>
          <div style="display:flex;justify-content:center;gap:8px;">
            <button id="closeTeamModal" class="boxed-btn3">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      // close handlers
      modal.querySelector('#closeTeamModal').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
      // close on ESC
      const escHandler = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', escHandler); } };
      document.addEventListener('keydown', escHandler);
    });
  });

  // cart button (safe attach)
  var cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    cartBtn.addEventListener('click', function () {
      window.location.href = 'cart.html';
    });
  }
});
