/* =========================================================
   Global Lightbox — click any chart image to expand
   ========================================================= */

(function () {
  // ── 1. Inject styles ──────────────────────────────────
  const css = `
    /* overlay */
    #lb-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(6px);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      animation: lb-fadein 0.22s ease;
    }
    #lb-overlay.open { display: flex; }

    @keyframes lb-fadein {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* image wrapper */
    #lb-box {
      position: relative;
      max-width: 92vw;
      max-height: 90vh;
      animation: lb-scalein 0.22s ease;
    }
    @keyframes lb-scalein {
      from { transform: scale(0.93); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    /* the image */
    #lb-img {
      display: block;
      max-width: 90vw;
      max-height: 86vh;
      width: auto;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.7);
      object-fit: contain;
      cursor: default;
    }

    /* caption bar */
    #lb-caption {
      background: rgba(44,47,79,0.92);
      border-top: 1px solid rgba(255,255,255,0.1);
      border-radius: 0 0 10px 10px;
      padding: 12px 18px;
      font-family: 'Lato', sans-serif;
      font-size: 0.88rem;
      color: #C0C8FF;
      text-align: center;
      min-height: 20px;
    }

    /* close button */
    #lb-close {
      position: absolute;
      top: -14px;
      right: -14px;
      width: 36px;
      height: 36px;
      background: #FFD6E0;
      border: none;
      border-radius: 50%;
      color: #4a4a4a;
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 36px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    }
    #lb-close:hover {
      background: white;
      transform: scale(1.1) rotate(90deg);
    }

    /* zoom cursor on all chart images */
    .img-card img,
    .chart-card img,
    .chart-full img,
    .dash-card img,
    .full-card img,
    .lb-zoomable {
      cursor: zoom-in !important;
      transition: opacity 0.2s ease;
    }
    .img-card img:hover,
    .chart-card img:hover,
    .chart-full img:hover,
    .dash-card img:hover,
    .full-card img:hover,
    .lb-zoomable:hover {
      opacity: 0.92;
    }

    /* zoom icon badge that appears on hover */
    .lb-wrap {
      position: relative;
      display: block;
      overflow: hidden;
    }
    .lb-wrap::after {
      content: '🔍';
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(44,47,79,0.75);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    .lb-wrap:hover::after { opacity: 1; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── 2. Build overlay DOM ──────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'lb-overlay';
  overlay.innerHTML = `
    <div id="lb-box">
      <button id="lb-close" aria-label="Close image">✕</button>
      <img id="lb-img" src="" alt="">
      <div id="lb-caption"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose   = document.getElementById('lb-close');

  // ── 3. Open / Close ───────────────────────────────────
  function openLightbox(src, caption) {
    lbImg.src = src;
    lbImg.alt = caption || '';
    lbCaption.textContent = caption || '';
    lbCaption.style.display = caption ? 'block' : 'none';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    // slight delay so animation shows before clearing src
    setTimeout(() => { lbImg.src = ''; }, 250);
  }

  lbClose.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // ── 4. Wire up images on load (and after DOM mutations) ─
  function getCaption(img) {
    // Try nearest h4 sibling inside .cap / .chart-caption / .dash-info
    const card = img.closest('.img-card, .chart-card, .chart-full, .dash-card, .full-card');
    if (card) {
      const h4 = card.querySelector('h4');
      if (h4) return h4.textContent.trim();
    }
    return img.alt || '';
  }

  function wrapAndBind(img) {
    if (img.dataset.lbBound) return;
    img.dataset.lbBound = 'true';

    // Wrap in .lb-wrap for the 🔍 hover badge
    if (!img.parentElement.classList.contains('lb-wrap')) {
      const wrap = document.createElement('span');
      wrap.className = 'lb-wrap';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }

    img.addEventListener('click', function () {
      openLightbox(img.src, getCaption(img));
    });
  }

  function bindAll() {
    const selectors = [
      '.img-card img',
      '.chart-card img',
      '.chart-full img',
      '.dash-card img',
      '.full-card img',
      '.lb-zoomable',
    ];
    document.querySelectorAll(selectors.join(',')).forEach(wrapAndBind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAll);
  } else {
    bindAll();
  }
})();
