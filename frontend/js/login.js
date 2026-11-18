(() => {
  if (Sesion.actual()) { location.replace(inicioDe(Sesion.actual().rol)); return; }

  const form = document.getElementById('formLogin');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const entrar = document.getElementById('entrar');
  const error = document.getElementById('error');

  // La página de inicio es el primer módulo del menú del rol (config.js)
  function inicioDe(rol) {
    const menu = CONFIG.MENU[rol];
    return menu ? CONFIG.MODULOS[menu[0]].href : 'login.html';
  }

  function mostrarError(texto) {
    error.textContent = texto;
    error.style.display = 'block';
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    error.style.display = 'none';
    entrar.disabled = true;
    try {
      const r = await fetch(CONFIG.API_BASE + '/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      if (r.status === 401) { mostrarError('Correo o contraseña incorrectos'); return; }
      if (!r.ok) { mostrarError('No se pudo iniciar sesión (error ' + r.status + ')'); return; }
      const { token, usuario } = await r.json();
      if (!CONFIG.MENU[usuario.rol]) { mostrarError('Rol sin página de inicio: ' + usuario.rol); return; }
      Sesion.iniciar({ nombre: usuario.nombre, rol: usuario.rol, token });
      document.body.classList.add('saliendo');
      setTimeout(() => { location.href = inicioDe(usuario.rol); }, 350);
    } catch (e) {
      mostrarError('No se pudo conectar con el servidor');
    } finally {
      entrar.disabled = false;
    }
  });
})();