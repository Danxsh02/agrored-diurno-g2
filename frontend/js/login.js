(() => {
  if (Sesion.actual()) { location.replace(CONFIG.INICIO); return; }

  const caja = document.getElementById('roles');
  const nombre = document.getElementById('nombre');
  const entrar = document.getElementById('entrar');
  let rol = null;

  caja.innerHTML = Object.entries(CONFIG.ROLES).map(([k, r]) => `
    <button type="button" class="rol" data-rol="${k}">
      <span class="rol-ico">${UI.icono(r.icono, 22)}</span>
      <span><strong>${r.texto}</strong><small>${r.desc}</small></span>
      <span class="rol-ok">${UI.icono('check', 14)}</span>
    </button>`).join('');

  const botones = [...caja.querySelectorAll('.rol')];
  botones.forEach((b) => b.addEventListener('click', () => {
    rol = b.dataset.rol;
    botones.forEach((x) => x.classList.toggle('sel', x === b));
    nombre.value = CONFIG.ROLES[rol].usuario;
    entrar.disabled = false;
  }));

  document.getElementById('formLogin').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!rol) return;
    Sesion.iniciar({ nombre: nombre.value.trim() || CONFIG.ROLES[rol].usuario, rol, token: 'token-simulado' });
    document.body.classList.add('saliendo');
    setTimeout(() => { location.href = CONFIG.INICIO; }, 350);
  });
})();