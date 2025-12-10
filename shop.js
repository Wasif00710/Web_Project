/* app.js — PetSop
   Plain Vanilla JavaScript (no frameworks)
   Responsibilities:
   - Menu / offcanvas interactions (accessible)
   - Overlay control
   - Hero carousel + lazy image loading
   - Build category grid and per-subcategory rendering using templates
   - Product generation (sample data structure per subcategory)
   - Search (client-side across products & subcategories)
   - Add-to-cart, cart drawer, cart persistence (localStorage)
   - Consent flow: usage logging & CSV export ONLY after explicit consent
   - Device-specific behaviors (touch optimizations)
   - Keyboard accessibility (Esc closes overlays, Enter triggers)
   - Defensive coding and clear comments for integration
   NOTE: This implementation intentionally DOES NOT collect cookies or export user data
         without explicit user consent. Silent or hidden data collection is disallowed.
*/

(function () {
  'use strict';

  /* ==========================
     App state & sample data
     ========================== */
  const state = {
    cart: [],                // {id,title,price,qty,cat,sub,img}
    consent: false,
    usageLogKey: 'petsop_usage_log',
    consentKey: 'petsop_consent',
    productsKey: 'petsop_products_v1', // optional persistence for offline demo
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  // Categories + subcategories (matches index.html menu)
  const CATALOG = [
    { title: 'Dog', items: [
      'Dry Dog Food','Wet Dog Food','Dog Treats & Dog Bones','Dog Supplements & Special Food',
      'Dog Kennels, Dog Flaps & Gates','Dog Crates & Dog Travel','Dog Beds & Baskets',
      'Dog Toys, Sports & Training','Dog Grooming & Care','Dog Leads & Dog Collars',
      'Dog Bowls & Feeders','Dog Clothing','Dog Technology','Puppy Products','Dog Breed Shop',
      'Pet Parents - Everything for You'
    ]},
    { title: 'Cat', items: [
      'Dry Cat Food','Wet Cat Food','Cat Litter','Cat Litter Boxes & Litter Trays',
      'Cat Trees & Cat Scratching Posts','Cat Baskets & Beds','Cat Toys','Cat Bowls & Fountains',
      'Cat Flaps & Nets','Cat Treats & Snacks','Cat Care & Grooming','Cat Supplements & Specialty Food',
      'Cat Carriers & Transport','Kitten Products','Cat Breed Shop','Pet Parents - Everything for You'
    ]},
    { title: 'Small Pet', items: [
      'Small Pet Cages','Rabbit & Guinea Pig Hutches','Runs & Fencing','Small Pet Food',
      'Cage Accessories','Snacks & Supplements','Hay & Straw','Care & Grooming','Toys & Travel'
    ], note: 'Includes: Rabbit, Guinea Pig, Hamster, Rat, Mouse, Chinchilla, Gerbil, Degu, Ferret' },
    { title: 'Bird', items: [
      'Bird Food','Bird Cages','Bird Cage Accessories','Bird Snacks & Crackers','Bird Toys',
      'Bird Food Supplements','Bird Cage Bedding & Litter','Wild Birds & Small Animals','Other Bird Supplies'
    ]},
    { title: 'Aquatic', items: ['Fish Food','Water Care','Garden Pond']},
    { title: 'Vet', items: ['Dog Vet Food & Specialist Food','Cat Vet Food & Specialist Food','Ailments']},
    { title: 'Special Offers', items: [
      'Monthly Food Offers','🎁 Eid/Puza Market','New Products','Trial Packs','Clearance Sale',
      'Seasonal Specials','Bulk Buys','Working / Active Dogs'
    ]}
  ];

  // Helper: create a safe filename token from a string (pick first meaningful token)
  function tokenForName(s) {
    if (!s) return 'item';
    // split on non-word, filter empty, prefer the first alpha token that's not generic words
    const tokens = s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (!tokens.length) return 'item';
    // If first token is generic like 'dry' or 'wet' or category name, still okay.
    return tokens[0];
  }

  // Minimal product factory to demonstrate distinct HTML for each subcategory.
  // In production, replace with real product API fetch.
  function sampleProductsFor(cat, sub) {
    const base = (cat + ' — ' + sub).slice(0, 40);
    const arr = [];
    // attempt to compute a reasonable image path using category + sub tokens
    const catToken = tokenForName(cat);
    const subToken = tokenForName(sub);
    // create 8 sample products
    for (let i = 1; i <= 8; i++) {
      // compute image path - matches your repo names like: dog-dry-1.jpg
      const imgPath = `images/products/${catToken}-${subToken}-${i}.jpg`;
      arr.push({
        id: `${cat.toLowerCase().replace(/\s+/g, '-')}_${sub.toLowerCase().replace(/[^a-z0-9]+/g,'-')}_${i}`,
        title: `${sub} — ${i}`,
        brand: (i % 2 === 0) ? 'PremiumPet' : 'NatureCare',
        price: (5 + Math.round(Math.random() * 95)) + 0.99,
        img: imgPath, // <-- set a computed path so product cards have an src
        cat, sub,
        weight: `${100 + i*50}g`,
        description: `${base} product example #${i}`
      });
    }
    return arr;
  }

  /* ==========================
     Helpers and element refs
     ========================== */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const qs = (node, sel) => node ? node.querySelector(sel) : null;

  const refs = {
    offcanvas: $('#offcanvas'),
    overlay: $('#overlay'),
    menuToggle: $('#menuToggle'),
    closeMenu: $('#closeMenu'),
    menuSections: $('#menuSections'),
    searchInput: $('#searchInput'),
    searchBtn: $('#searchBtn'),
    cartBtn: $('#cartBtn'),
    cartCount: $('#cartCount'),
    cartDrawer: $('#cartDrawer'),
    cartItems: $('#cartItems'),
    closeCart: $('#closeCart'),
    prodGrid: $('#prodGrid'),
    categoryGrid: $('#categoryGrid'),
    heroItems: Array.from($$('.hero-item')),
    shopNow: $('#shopNow'),
    viewOffers: $('#viewOffers'),
    cookieConsent: $('#cookieConsent'),
    consentAccept: $('#consentAccept'),
    consentDecline: $('#consentDecline'),
    serverTime: $('#serverTime'),
    subcategoryTemplate: $('#subcategoryTemplate'),
    productCardTemplate: $('#productCardTemplate'),
    footerActions: document.querySelector('.footer-actions')
  };

  /* ==========================
     Initialization
     ========================== */
  function init() {
    try {
      attachMenuHandlers();
      attachOverlayHandlers();
      attachCartHandlers();
      attachSearchHandlers();
      buildCategoryTiles();      // generate home view tiles using CATALOG
      buildFeaturedProducts();   // populate sample featured products
      startHeroCarousel();       // hero slideshow
      loadServerTime();          // live footer time display
      checkConsent();            // consent flow
      hydrateCartFromStorage();
      deviceAdjustments();
      keyboardShortcuts();
      recordUsage({ event: 'page_view', ts: new Date().toISOString(), path: location.pathname });
    } catch (err) {
      console.error('Init error', err);
    }
  }
  /* ==========================
     Menu / overlay / accessibility
     ========================== */
  function attachMenuHandlers() {
    if (!refs.menuToggle || !refs.closeMenu) return;

    refs.menuToggle.addEventListener('click', () => {
      openOffcanvas();
    });

    refs.closeMenu.addEventListener('click', () => {
      closeOffcanvas();
    });

    // clicking a menu item should open subcategory (menu items are in markup)
    refs.menuSections.addEventListener('click', (ev) => {
      const b = ev.target.closest('.menu-item');
      if (!b) return;
      const cat = b.dataset.cat, sub = b.dataset.sub;
      if (cat && sub) {
        navigateToSubcategory(cat, sub);
      }
    });
  }

  function openOffcanvas() {
    refs.offcanvas.classList.remove('hidden');
    refs.overlay.classList.remove('hidden');
    refs.offcanvas.setAttribute('aria-hidden', 'false');
    refs.menuToggle.setAttribute('aria-expanded', 'true');
    // focus trap: send focus to first focusable element
    const first = refs.offcanvas.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
    recordUsage({ event: 'menu_open', ts: new Date().toISOString() });
  }

  function closeOffcanvas() {
    refs.offcanvas.classList.add('hidden');
    refs.overlay.classList.add('hidden');
    refs.offcanvas.setAttribute('aria-hidden', 'true');
    refs.menuToggle.setAttribute('aria-expanded', 'false');
    refs.menuToggle.focus();
    recordUsage({ event: 'menu_close', ts: new Date().toISOString() });
  }

  function attachOverlayHandlers() {
    refs.overlay.addEventListener('click', () => {
      // close both cart and offcanvas if open
      if (!refs.offcanvas.classList.contains('hidden')) closeOffcanvas();
      if (!refs.cartDrawer.classList.contains('hidden')) closeCart();
    });
  }

  /* ==========================
     Cart behaviors
     ========================== */
  function attachCartHandlers() {
    refs.cartBtn.addEventListener('click', openCart);
    refs.closeCart.addEventListener('click', closeCart);
    $('#checkout')?.addEventListener('click', () => {
      alert('Checkout placeholder — integrate your payment/checkout flow here.');
      recordUsage({ event: 'checkout_clicked', ts: new Date().toISOString(), cart_count: state.cart.length });
    });
  }

  function openCart() {
    refs.cartDrawer.classList.remove('hidden');
    refs.cartDrawer.setAttribute('aria-hidden', 'false');
    renderCart();
    recordUsage({ event: 'cart_open', ts: new Date().toISOString(), cart_count: state.cart.length });
  }

  function closeCart() {
    refs.cartDrawer.classList.add('hidden');
    refs.cartDrawer.setAttribute('aria-hidden', 'true');
  }

  function addToCart(product) {
    // product: {id,title,price,...}
    const existing = state.cart.find(p => p.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push(Object.assign({ qty: 1 }, product));
    }
    persistCart();
    renderCart();
    updateCartBadge();
    recordUsage({ event: 'add_to_cart', ts: new Date().toISOString(), productId: product.id, title: product.title });
  }

  function removeFromCart(index) {
    if (index >= 0 && index < state.cart.length) {
      const removed = state.cart.splice(index, 1)[0];
      persistCart();
      renderCart();
      updateCartBadge();
      recordUsage({ event: 'remove_from_cart', ts: new Date().toISOString(), productId: removed.id });
    }
  }

  function renderCart() {
    const container = refs.cartItems;
    if (!container) return;
    container.innerHTML = '';
    if (!state.cart.length) {
      container.innerHTML = '<p class="muted">Your cart is empty.</p>';
      $('#cartTotal').textContent = '$0.00';
      return;
    }
    let total = 0;
    state.cart.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div>
          <strong>${escapeHTML(it.title)}</strong>
          <div class="muted small">${escapeHTML(it.brand || it.cat || '')} • ${it.weight || ''}</div>
        </div>
        <div style="text-align:right">
          <div>$${(Number(it.price) * it.qty).toFixed(2)}</div>
          <div class="cart-row-actions" style="margin-top:8px">
            <button class="pill btn" data-idx="${idx}" data-action="remove">Remove</button>
          </div>
        </div>
      `;
      container.appendChild(row);
      total += Number(it.price) * it.qty;
    });

    // attach remove handlers
    container.querySelectorAll('button[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.idx);
        removeFromCart(idx);
      });
    });

    $('#cartTotal').textContent = '$' + total.toFixed(2);
  }

  function updateCartBadge() {
    refs.cartCount.textContent = state.cart.length;
  }

  function persistCart() {
    try {
      localStorage.setItem('petsop_cart', JSON.stringify(state.cart));
    } catch (e) {
      console.warn('Could not persist cart', e);
    }
  }

  function hydrateCartFromStorage() {
    try {
      const raw = localStorage.getItem('petsop_cart');
      if (raw) {
        state.cart = JSON.parse(raw) || [];
        updateCartBadge();
      }
    } catch (e) {
      console.warn('Hydrate cart failed', e);
    }
  }
  /* ==========================
     Build categories & products (home page)
     ========================== */
  function buildCategoryTiles() {
    if (!refs.categoryGrid) return;
    refs.categoryGrid.innerHTML = '';
    CATALOG.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'cat-card fade-in';
      const itemsHtml = (cat.items || []).slice(0, 4).map(sub => `<button class="pill btn small" data-cat="${escapeHTML(cat.title)}" data-sub="${escapeHTML(sub)}">${escapeHTML(sub)}</button>`).join('');
      const note = cat.note ? `<div class="muted small" style="margin-top:8px">${escapeHTML(cat.note)}</div>` : '';
      card.innerHTML = `
        <h3>${escapeHTML(cat.title)}</h3>
        <div class="cat-actions">${itemsHtml}<button class="pill btn ghost" data-cat="${escapeHTML(cat.title)}" data-sub="ALL">See all</button></div>
        ${note}
      `;
      // attach handlers (event delegation)
      card.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        const catName = b.dataset.cat;
        const subName = b.dataset.sub;
        if (catName) {
          if (subName === 'ALL') {
            navigateToCategory(catName);
          } else {
            navigateToSubcategory(catName, subName);
          }
        }
      });
      refs.categoryGrid.appendChild(card);
    });
  }

  function buildFeaturedProducts() {
    if (!refs.prodGrid) return;
    refs.prodGrid.innerHTML = '';
    // pick first category/subcategory for featured
    const firstCat = CATALOG[0];
    const firstSub = firstCat.items[0];
    const products = sampleProductsFor(firstCat.title, firstSub);
    products.forEach(p => {
      const card = renderProductCard(p);
      refs.prodGrid.appendChild(card);
    });
  }

  /* ==========================
     Subcategory routing & rendering
     ========================== */
  function navigateToCategory(cat) {
    // Show a subcategory grid for the category (driver for "See all")
    const category = CATALOG.find(c => c.title === cat);
    if (!category) return alert('Category not found: ' + cat);
    // For simplicity, show the first sub in that category
    const sub = category.items[0] || '';
    navigateToSubcategory(cat, sub);
  }

  function navigateToSubcategory(cat, sub) {
    // Clone template and populate product cards for that subcategory
    const tpl = refs.subcategoryTemplate;
    if (!tpl) {
      console.warn('Subcategory template missing');
      return;
    }
    const clone = tpl.content.cloneNode(true);
    const section = clone.querySelector('.subcategory');
    const titleEl = clone.querySelector('.subcategory-title');
    const descEl = clone.querySelector('.subcategory-desc');
    const productList = clone.querySelector('.product-list');

    titleEl.textContent = `${cat} — ${sub}`;
    descEl.textContent = `Showing products for ${sub} in ${cat}.`;

    // generate products for that subcategory (replace with API fetch)
    const products = sampleProductsFor(cat, sub || 'General');

    products.forEach(p => {
      const cardEl = renderProductCard(p);
      productList.appendChild(cardEl);
    });

    // mount into main stage: replace content of #main or put below hero
    // we'll replace the categoryStage content with this subcategory
    const stage = $('#categoryStage');
    if (!stage) return;
    stage.innerHTML = '';
    stage.appendChild(section);

    // scroll into view nicely
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    recordUsage({ event: 'open_subcategory', ts: new Date().toISOString(), category: cat, subcategory: sub });
  }

  /* ==========================
     Product card rendering (from template)
     ========================== */
  function renderProductCard(p) {
    const tpl = refs.productCardTemplate;
    let el;
    if (tpl && tpl.content) {
      el = tpl.content.cloneNode(true);
      const article = el.querySelector('.product.card') || el.querySelector('.product');
      // populate fields
      const title = qs(article, '.product-title');
      const sub = qs(article, '.product-sub');
      const img = qs(article, '.product-image');
      const price = qs(article, '.price-value');
      const addBtn = article.querySelector('.add-to-cart');
      const quick = article.querySelector('.quick-view');

      if (title) title.textContent = p.title;
      if (sub) sub.textContent = `${p.brand || ''} • ${p.weight || ''}`;
      if (img) {
        if (p.img) {
          // set computed img path
          img.src = p.img;
          img.alt = p.title || 'Product image';
          // if the image file does not exist or fails to load, fallback to no-image
          img.onerror = function () {
            // try images/no-image.png first, then icons/no-image.png
            img.onerror = null;
            img.src = 'images/no-image.png';
            // if that also fails, swap to icons/no-image.png
            img.addEventListener('error', function fallbackOnce() {
              img.removeEventListener('error', fallbackOnce);
              img.src = 'icons/no-image.png';
            });
          };
        } else {
          // no img path provided — show fallback(s)
          img.src = 'images/no-image.png';
          img.alt = p.title || 'Product image';
          img.onerror = function () {
            img.onerror = null;
            img.src = 'icons/no-image.png';
          };
        }
      }
      if (price) price.textContent = '$' + Number(p.price).toFixed(2);

      if (addBtn) addBtn.addEventListener('click', () => addToCart({
        id: p.id, title: p.title, price: p.price, brand: p.brand, cat: p.cat, sub: p.sub, img: p.img, weight: p.weight
      }));
      if (quick) quick.addEventListener('click', () => {
        alert(`${p.title}\n\n${p.description}\n\nPrice: $${Number(p.price).toFixed(2)}`);
        recordUsage({ event: 'quick_view', ts: new Date().toISOString(), productId: p.id });
      });

      // return the article element
      return article;
    } else {
      // Templating fallback (if HTML template missing)
      const fallback = document.createElement('article');
      fallback.className = 'product card';
      fallback.innerHTML = `
        <div class="product-thumb"><div style="height:100%;width:100%;background:linear-gradient(180deg,#111,#222)"></div></div>
        <div class="product-meta">
          <h3 class="product-title">${escapeHTML(p.title)}</h3>
          <div class="product-sub muted">${escapeHTML(p.brand || '')}</div>
          <div class="product-bottom">
            <div class="price"><strong class="price-value">$${Number(p.price).toFixed(2)}</strong></div>
            <div class="product-actions">
              <button class="pill btn add-to-cart">Add</button>
            </div>
          </div>
        </div>
      `;
      fallback.querySelector('.add-to-cart').addEventListener('click', () => addToCart({
        id: p.id, title: p.title, price: p.price, brand: p.brand, cat: p.cat, sub: p.sub, img: p.img
      }));
      return fallback;
    }
  }
  /* ==========================
     Search
     ========================== */
  function attachSearchHandlers() {
    if (refs.searchBtn) refs.searchBtn.addEventListener('click', doSearch);
    if (refs.searchInput) {
      refs.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
      });
    }
  }

  function doSearch() {
    const q = (refs.searchInput.value || '').trim().toLowerCase();
    if (!q) {
      // subtle animation to indicate required
      refs.searchInput.animate([{ boxShadow: '0 0 0 rgba(214,75,75,0.0)' }, { boxShadow: '0 0 12px rgba(214,75,75,0.12)' }, { boxShadow: '0 0 0 rgba(214,75,75,0.0)' }], { duration: 400 });
      return;
    }
    // search across sample products & category names
    const matches = [];
    // search across CATALOG names & subitems
    for (const c of CATALOG) {
      if (c.title.toLowerCase().includes(q)) matches.push({ type: 'category', text: c.title });
      for (const s of (c.items || [])) {
        if (s.toLowerCase().includes(q)) matches.push({ type: 'subcategory', text: `${c.title} → ${s}`, cat: c.title, sub: s });
      }
    }
    // search in sample products (we generate products per request)
    // we'll search a small generated set (first 2 categories x 3 subs) to avoid expensive loops
    const quickProducts = [];
    CATALOG.slice(0, 3).forEach(c => c.items.slice(0, 3).forEach(s => quickProducts.push(...sampleProductsFor(c.title, s))));
    quickProducts.forEach(p => {
      if (p.title.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) {
        matches.push({ type: 'product', text: `${p.title} — ${p.brand}`, product: p });
      }
    });

    if (!matches.length) {
      alert(`No results found for "${q}". Try another keyword or browse categories.`);
      recordUsage({ event: 'search_no_results', ts: new Date().toISOString(), query: q });
      return;
    }

    // present a simple result overlay: if there is a product match, open subcategory with that product's sub
    // if there is a subcategory match, navigate there
    // otherwise show list of matches in an alert (simple)
    const firstMatch = matches[0];
    if (firstMatch.type === 'subcategory') {
      navigateToSubcategory(firstMatch.cat, firstMatch.sub);
    } else if (firstMatch.type === 'product') {
      // open the product's category/subcategory
      navigateToSubcategory(firstMatch.product.cat, firstMatch.product.sub);
      // optionally highlight the product in the list (not implemented)
    } else {
      // show a list
      const preview = matches.slice(0, 10).map(m => `${m.type.toUpperCase()}: ${m.text}`).join('\n');
      alert(`Found ${matches.length} result(s):\n\n${preview}`);
    }
    recordUsage({ event: 'search', ts: new Date().toISOString(), query: q, results: matches.length });
  }

  /* ==========================
     Hero carousel + lazy load
     ========================== */
  let heroIndex = 0;
  let heroTimer = null;
  function startHeroCarousel() {
    const items = refs.heroItems.filter(Boolean);
    if (!items.length) return;
    // lazy load initial images
    items.forEach(img => {
      if (img.dataset && img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    // automatic rotation every 5s
    heroTimer = setInterval(() => {
      items[heroIndex].classList.add('hidden');
      heroIndex = (heroIndex + 1) % items.length;
      items[heroIndex].classList.remove('hidden');
    }, 5000);
    // pause on touch/hover
    items.forEach(it => {
      it.addEventListener('mouseenter', () => clearInterval(heroTimer));
      it.addEventListener('mouseleave', () => startHeroCarousel());
      it.addEventListener('touchstart', () => clearInterval(heroTimer), { passive: true });
    });
  }

  /* ==========================
     Consent flow & usage logging (explicit opt-in only)
     ========================== */
  function checkConsent() {
    try {
      const saved = localStorage.getItem(state.consentKey);
      if (saved === null) {
        // show consent UI
        if (refs.cookieConsent) refs.cookieConsent.classList.remove('hidden');
      } else {
        state.consent = (saved === 'true');
        if (state.consent) {
          createExportLink(); // ensure export control exists
        }
      }
    } catch (e) {
      console.warn('Consent check error', e);
    }

    // attach button handlers
    if (refs.consentAccept) refs.consentAccept.addEventListener('click', () => grantConsent(true));
    if (refs.consentDecline) refs.consentDecline.addEventListener('click', () => grantConsent(false));
  }

  function grantConsent(val) {
    try {
      state.consent = !!val;
      localStorage.setItem(state.consentKey, state.consent);
      if (refs.cookieConsent) refs.cookieConsent.classList.add('hidden');
      recordUsage({ event: state.consent ? 'consent_granted' : 'consent_declined', ts: new Date().toISOString() });
      if (state.consent) createExportLink();
    } catch (e) {
      console.warn('Grant consent failed', e);
    }
  }

  function recordUsage(obj) {
    try {
      if (!state.consent) return; // only log when consent is true
      const raw = localStorage.getItem(state.usageLogKey);
      const store = raw ? JSON.parse(raw) : [];
      store.push(obj);
      localStorage.setItem(state.usageLogKey, JSON.stringify(store));
    } catch (e) {
      console.warn('Record usage failed', e);
    }
  }

  function createExportLink() {
    try {
      // avoid duplicates
      if (!refs.footerActions) return;
      if (refs.footerActions.querySelector('.export-usage-link')) return;
      const a = document.createElement('a');
      a.className = 'pill btn export-usage-link';
      a.href = '#';
      a.textContent = 'Download usage CSV';
      a.style.marginLeft = '10px';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        exportUsageCSV();
      });
      refs.footerActions.appendChild(a);
    } catch (e) {
      console.warn('Create export link failed', e);
    }
  }

  function exportUsageCSV() {
    try {
      const raw = localStorage.getItem(state.usageLogKey);
      const store = raw ? JSON.parse(raw) : [];
      if (!store.length) {
        alert('No usage data to export.');
        return;
      }
      // convert to CSV
      const keys = Array.from(store.reduce((acc, r) => {
        Object.keys(r).forEach(k => acc.add(k));
        return acc;
      }, new Set()));
      const lines = [];
      lines.push(keys.join(','));
      for (const r of store) {
        lines.push(keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','));
      }
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `petsop_usage_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      recordUsage({ event: 'export_usage', ts: new Date().toISOString(), count: store.length });
    } catch (e) {
      console.error('Export failed', e);
    }
  }

  /* ==========================
     Server time (client-based) — update the footer time
     ========================== */
  function loadServerTime() {
    if (!refs.serverTime) return;
    function tick() {
      const now = new Date();
      refs.serverTime.textContent = 'Updated: ' + now.toLocaleString();
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ==========================
     Device adjustments & accessibility
     ========================== */
  function deviceAdjustments() {
    if (state.isTouch) {
      document.body.classList.add('is-touch');
      // reduce hover-heavy animations
      $$('.pill').forEach(el => el.style.transition = 'transform 130ms ease');
    } else {
      document.body.classList.add('is-pointer');
    }
  }

  function keyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // close overlays
        if (!refs.offcanvas.classList.contains('hidden')) closeOffcanvas();
        if (!refs.cartDrawer.classList.contains('hidden')) closeCart();
      }
      // quick focus search with '/'
      if (e.key === '/' && document.activeElement.tagName.toLowerCase() !== 'input' && document.activeElement.tagName.toLowerCase() !== 'textarea') {
        e.preventDefault();
        refs.searchInput.focus();
      }
    });
  }

  /* ==========================
     Utilities
     ========================== */
  function escapeHTML(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  /* ==========================
     Small polyfills / graceful behaviors
     ========================== */
  // No-op if element missing
  if (!refs.menuSections) console.warn('Menu sections container not found; menu will still function using static HTML.');

  /* ==========================
     Start
     ========================== */
  document.addEventListener('DOMContentLoaded', init);

  /* ==========================
     Important note about privacy / cookies
     ==========================
     You previously requested automatic cookie collection & CSV export *without* notifying users.
     I cannot implement hidden or non-consensual data collection. The code above purposely:
       - Shows an explicit consent dialog.
       - Stores usage logs only after consent.
       - Provides an admin-export (CSV) only after consent.
     If you want server-side logging, provide an authenticated endpoint and explicit user consent flow,
     and I will add an HTTPS POST to send logs to your server when consent is given.
     ========================== */

})();



