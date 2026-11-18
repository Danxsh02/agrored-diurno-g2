(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  // Solo el administrador ve el panel general
  if (sesion.rol !== 'administrador') {
    location.replace(CONFIG.MODULOS[CONFIG.MENU[sesion.rol][0]].href);
    return;
  }

  const $ = (s) => document.querySelector(s);

  const FUENTES = [
    { k: 'clientes',  texto: 'Clientes',  ruta: '/clientes' },
    { k: 'productos', texto: 'Productos', ruta: '/productos' },
    { k: 'pedidos',   texto: 'Pedidos',   ruta: '/pedidos' },
    { k: 'lotes',     texto: 'Lotes',     ruta: '/lotes' },
    { k: 'usuarios',  texto: 'Usuarios',  ruta: '/usuarios' }
  ];

  function pintarMarco() {
    UI.pintarIconos();
    $('#nombreUsuario').textContent = sesion.nombre;
    $('#avatar').textContent = UI.iniciales(sesion.nombre);
    const rol = $('#rolUsuario');
    rol.textContent = CONFIG.ROLES[sesion.rol].texto;
    rol.dataset.rol = sesion.rol;
    $('#menu').innerHTML = CONFIG.MENU[sesion.rol].map((k, i) => {
      const m = CONFIG.MODULOS[k];
      const activo = location.pathname.endsWith(m.href) ? 'activo' : '';
      return `<a href="${m.href}" class="${activo}" style="--i:${i}">${UI.icono(m.icono)}<span>${m.texto}</span></a>`;
    }).join('');
  }

  // Una petición por microservicio (datos independientes: el panel puede pedirlos por separado)
  async function pedir(f) {
    const resp = await fetch(CONFIG.API_BASE + f.ruta, {
      headers: { Authorization: `Bearer ${Sesion.token()}` }
    });
    const cuerpo = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const e = new Error(cuerpo.error || 'Error inesperado');
      e.status = resp.status;
      throw e;
    }
    return Array.isArray(cuerpo) ? cuerpo.length : null;
  }

  async function cargar() {
    const resultados = await Promise.allSettled(FUENTES.map(pedir));

    if (resultados.some((r) => r.status === 'rejected' && r.reason.status === 401)) {
      UI.toast('error', 'Sesión vencida', 'Inicia sesión de nuevo.');
      setTimeout(() => Sesion.cerrar(), 1500);
      return;
    }

    let fallos = 0;
    $('#cuerpo').innerHTML = FUENTES.map((f, i) => {
      const r = resultados[i];
      const total = $(`#st-${f.k}`);
      let estado;
      if (r.status === 'fulfilled' && r.value !== null) {
        UI.animarNumero(total, r.value);
        estado = 'Disponible';
      } else {
        fallos++;
        total.textContent = '–';
        estado = r.status === 'rejected' ? `No disponible (${r.reason.status || 'sin respuesta'})` : 'Respuesta inesperada';
      }
      const mod = CONFIG.MODULOS[f.k];
      return `<tr><td data-label="Servicio">${UI.esc(f.texto)}</td><td data-label="Estado">${UI.esc(estado)}</td><td><a href="${mod.href}">Abrir</a></td></tr>`;
    }).join('');

    $('#conteo').textContent = fallos ? `${fallos} servicio(s) sin respuesta: los totales de esos servicios no se muestran.` : 'Todos los servicios responden.';
    if (fallos) UI.toast('error', 'Datos incompletos', 'Algún servicio no respondió.');
  }

  $('#btnSalir').addEventListener('click', () => Sesion.cerrar());
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();