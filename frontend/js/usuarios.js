(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  // Solo el administrador gestiona usuarios (el backend también lo exige: 403)
  if (sesion.rol !== 'administrador') {
    location.replace(CONFIG.MODULOS[CONFIG.MENU[sesion.rol][0]].href);
    return;
  }

  const $ = (s) => document.querySelector(s);
  const estado = { lista: [], texto: '', rol: '', editando: null, borrando: null, destacado: null };
  const modalForm = $('#modalForm');
  const modalEliminar = $('#modalEliminar');
  const form = $('#form');

  // ---------- Acceso a la API (por el gateway) ----------
  function fallo(status, mensaje, detalles) {
    const e = new Error(mensaje);
    e.status = status;
    e.detalles = detalles;
    return e;
  }

  async function http(ruta, opciones = {}) {
    const resp = await fetch(CONFIG.API_BASE + ruta, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Sesion.token()}` }
    });
    if (resp.status === 204) return null;
    const cuerpo = await resp.json().catch(() => ({}));
    if (!resp.ok) throw fallo(resp.status, cuerpo.error || 'Error inesperado', cuerpo.detalles);
    return cuerpo;
  }

  function armarCuerpo(d) {
    const c = {
      nombre: (d.nombre || '').trim(),
      email: (d.email || '').trim().toLowerCase(),
      rol: d.rol,
      activo: d.activo === 'true'
    };
    if (d.password) c.password = d.password; // en PUT es opcional
    return c;
  }

  const Api = {
    listar: () => http('/usuarios'),
    crear: (d) => http('/usuarios', { method: 'POST', body: JSON.stringify(armarCuerpo(d)) }),
    actualizar: (id, d) => http(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(armarCuerpo(d)) }),
    eliminar: (id) => http(`/usuarios/${id}`, { method: 'DELETE' })
  };

  // ---------- Marco ----------
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

  // ---------- Pintado ----------
  function pintarResumen() {
    const l = estado.lista;
    UI.animarNumero($('#stTotal'), l.length);
    UI.animarNumero($('#stAdm'), l.filter((u) => u.rol === 'administrador').length);
    UI.animarNumero($('#stCom'), l.filter((u) => u.rol === 'comercial').length);
    UI.animarNumero($('#stPro'), l.filter((u) => u.rol === 'produccion').length);
  }

  function filtrados() {
    const t = estado.texto.trim().toLowerCase();
    return estado.lista.filter((u) =>
      (!t || u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)) &&
      (!estado.rol || u.rol === estado.rol));
  }

  function pintarTabla() {
    const filas = filtrados();
    if (filas.length === 0) {
      $('#cuerpo').innerHTML = `<tr><td colspan="4"><div class="vacio">${UI.icono('search', 30)}<strong>Sin resultados</strong><span>Prueba con otro nombre, correo o rol.</span></div></td></tr>`;
    } else {
      $('#cuerpo').innerHTML = filas.map((u, i) => `
        <tr data-id="${u.id}" class="${u.id === estado.destacado ? 'destacado' : ''}" style="--i:${Math.min(i, 12)}">
          <td data-label="Usuario"><div class="cli"><span class="av">${UI.esc(UI.iniciales(u.nombre))}</span><div><strong>${UI.esc(u.nombre)}</strong><small>${UI.esc(u.email)}</small></div></div></td>
          <td data-label="Rol"><span class="rol-tag" data-rol="${UI.esc(u.rol)}">${UI.esc((CONFIG.ROLES[u.rol] || {}).texto || u.rol)}</span></td>
          <td data-label="Estado">${u.activo ? 'Activo' : 'Inactivo'}</td>
          <td class="acciones">
            <button class="icono-btn" data-accion="editar" data-id="${u.id}" title="Editar">${UI.icono('edit')}</button>
            <button class="icono-btn rojo" data-accion="eliminar" data-id="${u.id}" title="Eliminar">${UI.icono('trash')}</button>
          </td>
        </tr>`).join('');
    }
    $('#conteo').textContent = `Mostrando ${filas.length} de ${estado.lista.length} usuarios`;
    estado.destacado = null;
  }

  function pintarEsqueleto() {
    $('#cuerpo').innerHTML = Array.from({ length: 5 }, () => '<tr><td colspan="4"><span class="sk"></span></td></tr>').join('');
    $('#conteo').textContent = 'Cargando usuarios…';
  }

  function pintarFallo(e) {
    $('#cuerpo').innerHTML = `<tr><td colspan="4"><div class="vacio">${UI.icono('alert', 30)}<strong>No se pudieron cargar los usuarios</strong><span>${UI.esc(e.message)}</span></div></td></tr>`;
    $('#conteo').textContent = '';
  }

  async function cargar(conEsqueleto = true) {
    if (conEsqueleto) pintarEsqueleto();
    try {
      estado.lista = await Api.listar();
      pintarResumen();
      pintarTabla();
    } catch (e) {
      if (e.status === 401 || e.status === 403) manejarError(e);
      pintarFallo(e);
    }
  }

  function manejarError(e) {
    if (e.status === 401) { UI.toast('error', 'Sesión vencida', 'Inicia sesión de nuevo.'); setTimeout(() => Sesion.cerrar(), 1500); return; }
    if (e.status === 403) { UI.toast('error', 'Sin permiso', e.message); return; }
    UI.toast('error', 'No se pudo completar la operación', e.message);
  }

  // ---------- Modales ----------
  function abrir(modal) {
    modal.classList.add('abierto');
    const primero = modal.querySelector('input, select, button.btn');
    setTimeout(() => primero && primero.focus(), 60);
  }
  function cerrar(modal) { modal.classList.remove('abierto'); }

  document.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => cerrar(b.closest('.modal'))));
  document.querySelectorAll('.modal').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m) cerrar(m); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal.abierto').forEach((m) => cerrar(m)); });

  function limpiarErrores() {
    form.querySelectorAll('.campo').forEach((c) => { c.classList.remove('con-error'); c.querySelector('.err').textContent = ''; });
  }

  function mostrarErrores(e) {
    limpiarErrores();
    const mapa = {};
    (e.detalles || []).forEach((d) => { mapa[String(d).split(' ')[0]] = d; });
    if (e.status === 409) mapa.email = e.message;
    let alguno = false;
    Object.entries(mapa).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      const caja = input.closest('.campo');
      caja.classList.add('con-error');
      caja.querySelector('.err').textContent = msg;
      alguno = true;
    });
    if (!alguno) UI.toast('error', 'No se pudo guardar', e.message);
  }

  function abrirFormulario(u = null) {
    estado.editando = u ? u.id : null;
    form.reset();
    limpiarErrores();
    $('#tituloForm').textContent = u ? 'Editar usuario' : 'Nuevo usuario';
    $('#textoGuardar').textContent = u ? 'Guardar cambios' : 'Crear usuario';
    $('#etiquetaPass').textContent = u ? 'Contraseña nueva (opcional)' : 'Contraseña';
    if (u) {
      form.elements.nombre.value = u.nombre;
      form.elements.email.value = u.email;
      form.elements.rol.value = u.rol;
      form.elements.activo.value = String(u.activo);
    }
    abrir(modalForm);
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    limpiarErrores();
    const editando = estado.editando;
    const datos = Object.fromEntries(new FormData(form));
    const btn = $('#btnGuardar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      const guardado = editando ? await Api.actualizar(editando, datos) : await Api.crear(datos);
      cerrar(modalForm);
      estado.destacado = guardado.id;
      await cargar(false);
      UI.toast('ok', editando ? 'Usuario actualizado' : 'Usuario creado', guardado.nombre);
    } catch (e) {
      if (e.status === 400 || e.status === 409) mostrarErrores(e); else manejarError(e);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  $('#btnConfirmar').addEventListener('click', async () => {
    const u = estado.borrando;
    const btn = $('#btnConfirmar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      await Api.eliminar(u.id);
      cerrar(modalEliminar);
      await cargar(false);
      UI.toast('ok', 'Usuario eliminado', u.nombre);
    } catch (e) {
      cerrar(modalEliminar);
      manejarError(e);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  // ---------- Eventos ----------
  $('#btnNuevo').addEventListener('click', () => abrirFormulario());
  $('#btnSalir').addEventListener('click', () => Sesion.cerrar());
  $('#buscar').addEventListener('input', (e) => { estado.texto = e.target.value; pintarTabla(); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    estado.rol = b.dataset.rol;
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('activo', x === b));
    pintarTabla();
  });
  $('#cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const u = estado.lista.find((x) => x.id === Number(b.dataset.id));
    if (!u) return;
    if (b.dataset.accion === 'editar') abrirFormulario(u);
    else { estado.borrando = u; $('#nombreBorrar').textContent = u.nombre; abrir(modalEliminar); }
  });
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();