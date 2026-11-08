(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  const $ = (s) => document.querySelector(s);
  const puedeEscribir = CONFIG.ROLES_ESCRITURA_CLIENTES.includes(sesion.rol);
  const estado = { lista: [], texto: '', ciudad: '', tipo: '', editando: null, borrando: null, destacado: null };
  const modalForm = $('#modalForm');
  const modalEliminar = $('#modalEliminar');
  const form = $('#form');
  const CAMPOS = ['nombre', 'nit', 'ciudad', 'telefono', 'tipo', 'direccion', 'email'];

  // ---------- Marco: encabezado, menú y permisos ----------
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
    $('#btnNuevo').hidden = !puedeEscribir;
    if (!puedeEscribir) {
      $('#aviso').hidden = false;
      $('#avisoTexto').textContent = `Tu rol (${CONFIG.ROLES[sesion.rol].texto}) solo puede consultar clientes. Crear, editar y eliminar requiere rol administrador o comercial.`;
    }
  }

  // ---------- Datos y pintado ----------
  function pintarResumen() {
    const l = estado.lista;
    UI.animarNumero($('#stTotal'), l.length);
    UI.animarNumero($('#stDist'), l.filter((c) => c.tipo === 'distribuidor').length);
    UI.animarNumero($('#stCom'), l.filter((c) => c.tipo === 'comercio').length);
    UI.animarNumero($('#stCiu'), new Set(l.map((c) => c.ciudad)).size);
  }

  function pintarCiudades() {
    const ciudades = [...new Set(estado.lista.map((c) => c.ciudad))].sort((a, b) => a.localeCompare(b, 'es'));
    const sel = $('#filtroCiudad');
    sel.innerHTML = '<option value="">Todas las ciudades</option>' + ciudades.map((c) => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('');
    sel.value = ciudades.includes(estado.ciudad) ? estado.ciudad : '';
    estado.ciudad = sel.value;
  }

  function filtrados() {
    const t = estado.texto.trim().toLowerCase();
    return estado.lista.filter((c) =>
      (!t || c.nombre.toLowerCase().includes(t) || c.nit.toLowerCase().includes(t) || (c.email || '').toLowerCase().includes(t)) &&
      (!estado.ciudad || c.ciudad === estado.ciudad) &&
      (!estado.tipo || c.tipo === estado.tipo));
  }

  function pintarCabecera() {
    $('#cabecera').innerHTML = `<tr><th>Cliente</th><th>NIT</th><th>Ciudad</th><th>Tipo</th><th>Teléfono</th><th>Dirección</th>${puedeEscribir ? '<th></th>' : ''}</tr>`;
  }

  function pintarTabla() {
    const filas = filtrados();
    const columnas = puedeEscribir ? 7 : 6;
    pintarCabecera();
    if (filas.length === 0) {
      $('#cuerpo').innerHTML = `<tr><td colspan="${columnas}"><div class="vacio">${UI.icono('search', 30)}<strong>Sin resultados</strong><span>Prueba con otro nombre, ciudad o tipo de cliente.</span></div></td></tr>`;
    } else {
      $('#cuerpo').innerHTML = filas.map((c, i) => `
        <tr data-id="${c.id}" class="${c.id === estado.destacado ? 'destacado' : ''}" style="--i:${Math.min(i, 12)}">
          <td data-label="Cliente"><div class="cli"><span class="av">${UI.esc(UI.iniciales(c.nombre))}</span><div><strong>${UI.esc(c.nombre)}</strong><small>${UI.esc(c.email || 'Sin correo')}</small></div></div></td>
          <td data-label="NIT" class="mono">${UI.esc(c.nit)}</td>
          <td data-label="Ciudad">${UI.esc(c.ciudad)}</td>
          <td data-label="Tipo"><span class="tag ${c.tipo}">${c.tipo === 'distribuidor' ? 'Distribuidor' : 'Comercio'}</span></td>
          <td data-label="Teléfono" class="mono">${UI.esc(c.telefono)}</td>
          <td data-label="Dirección" class="dir">${UI.esc(c.direccion || '—')}</td>
          ${puedeEscribir ? `<td class="acciones">
            <button class="icono-btn" data-accion="editar" data-id="${c.id}" title="Editar">${UI.icono('edit')}</button>
            <button class="icono-btn rojo" data-accion="eliminar" data-id="${c.id}" title="Eliminar">${UI.icono('trash')}</button>
          </td>` : ''}
        </tr>`).join('');
    }
    $('#conteo').textContent = `Mostrando ${filas.length} de ${estado.lista.length} clientes`;
    estado.destacado = null;
  }

  function pintarEsqueleto() {
    pintarCabecera();
    $('#cuerpo').innerHTML = Array.from({ length: 6 }, () => `<tr><td colspan="${puedeEscribir ? 7 : 6}"><span class="sk"></span></td></tr>`).join('');
    $('#conteo').textContent = 'Cargando clientes…';
  }

  function pintarFallo(e) {
    const pista = CONFIG.MODO === 'ejemplo' ? 'Abre la página con Live Server (no con doble clic) para que pueda leer datos/clientes.json.' : e.message;
    $('#cuerpo').innerHTML = `<tr><td colspan="${puedeEscribir ? 7 : 6}"><div class="vacio">${UI.icono('alert', 30)}<strong>No se pudieron cargar los clientes</strong><span>${UI.esc(pista)}</span></div></td></tr>`;
    $('#conteo').textContent = '';
  }

  async function cargar(conEsqueleto = true) {
    if (conEsqueleto) pintarEsqueleto();
    try {
      estado.lista = await ApiClientes.listar();
      pintarResumen();
      pintarCiudades();
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
    (e.detalles || []).forEach((d) => { mapa[d.split(' ')[0]] = d; });
    if (e.status === 409) mapa.nit = e.message;
    Object.entries(mapa).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      const caja = input.closest('.campo');
      caja.classList.add('con-error');
      caja.querySelector('.err').textContent = msg;
    });
  }

  function abrirFormulario(cliente = null) {
    estado.editando = cliente ? cliente.id : null;
    form.reset();
    limpiarErrores();
    $('#tituloForm').textContent = cliente ? 'Editar cliente' : 'Nuevo cliente';
    $('#textoGuardar').textContent = cliente ? 'Guardar cambios' : 'Crear cliente';
    if (cliente) CAMPOS.forEach((k) => { form.elements[k].value = cliente[k] || ''; });
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
      const guardado = editando ? await ApiClientes.actualizar(editando, datos) : await ApiClientes.crear(datos);
      cerrar(modalForm);
      estado.destacado = guardado.id;
      await cargar(false);
      UI.toast('ok', editando ? 'Cliente actualizado' : 'Cliente creado', guardado.nombre);
    } catch (e) {
      if (e.status === 400 || e.status === 409) mostrarErrores(e); else manejarError(e);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  $('#btnConfirmar').addEventListener('click', async () => {
    const cliente = estado.borrando;
    const btn = $('#btnConfirmar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      await ApiClientes.eliminar(cliente.id);
      cerrar(modalEliminar);
      const fila = document.querySelector(`tr[data-id="${cliente.id}"]`);
      if (fila) { fila.classList.add('saliendo'); await new Promise((r) => setTimeout(r, 300)); }
      await cargar(false);
      UI.toast('ok', 'Cliente eliminado', cliente.nombre);
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
  $('#filtroCiudad').addEventListener('change', (e) => { estado.ciudad = e.target.value; pintarTabla(); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    estado.tipo = b.dataset.tipo;
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('activo', x === b));
    pintarTabla();
  });
  $('#cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const cliente = estado.lista.find((c) => c.id === Number(b.dataset.id));
    if (!cliente) return;
    if (b.dataset.accion === 'editar') abrirFormulario(cliente);
    else { estado.borrando = cliente; $('#nombreBorrar').textContent = cliente.nombre; abrir(modalEliminar); }
  });
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();