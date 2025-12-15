// about.js
document.addEventListener('DOMContentLoaded', function () {
  // set footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // counter animation
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // bigger = slower
  const runCounter = (el) => {
    const target = +el.getAttribute('data-target') || 0;
    let current = 0;
    const step = Math.ceil(target / speed);
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

  // simple team-photo modal
  const teamPhotos = document.querySelectorAll('.team-photo');
  teamPhotos.forEach(photo => {
    photo.style.cursor = 'pointer';
    photo.addEventListener('click', () => {
      const name = photo.dataset.name || '';
      const role = photo.dataset.role || '';
      const src = photo.src;

      // create modal
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.left = 0;
      modal.style.top = 0;
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.background = 'rgba(255, 255, 255, 1)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = 9999;
      modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:18px;max-width:720px;width:90%;text-align:center;">
          <img src="${src}" alt="${name}" style="max-width:260px;width:100%;height:auto;border-radius:8px;margin-bottom:12px;">
          <h4 style="margin:0 0 4px">${name}</h4>
          <small style="color:#666;display:block;margin-bottom:12px">${role}</small>
          <button id="closeTeamModal" class="boxed-btn3">Close</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#closeTeamModal').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    });
  });

});
