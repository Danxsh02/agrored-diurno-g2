// Utilidades visuales compartidas: iconos, mensajes y animación de números.
const UI = (() => {
  const ICONOS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>',
    layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
  };

  function icono(nombre, tam = 18) {
    return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] || ''}</svg>`;
  }

  // Rellena los elementos <span data-ico="nombre" data-tam="18">
  function pintarIconos(raiz = document) {
    raiz.querySelectorAll('[data-ico]').forEach((el) => {
      el.innerHTML = icono(el.dataset.ico, Number(el.dataset.tam) || 18);
    });
  }

  function esc(t) {
    return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function iniciales(nombre) {
    return String(nombre).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  // Cuenta desde el valor anterior hasta el nuevo
  function animarNumero(el, hasta, dur = 900) {
    const desde = Number(el.dataset.valor || 0);
    el.dataset.valor = hasta;
    if (desde === hasta || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = hasta; return; }
    const t0 = performance.now();
    const paso = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(desde + (hasta - desde) * suave);
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  function toast(tipo, titulo, texto = '') {
    const caja = document.getElementById('toasts');
    if (!caja) return;
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.innerHTML = `<span class="toast-ico">${icono(tipo === 'ok' ? 'check' : 'alert')}</span><div><strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ''}</div>`;
    caja.appendChild(t);
    setTimeout(() => { t.classList.add('sale'); setTimeout(() => t.remove(), 320); }, 4200);
  }

  return { icono, pintarIconos, esc, iniciales, animarNumero, toast };
})();