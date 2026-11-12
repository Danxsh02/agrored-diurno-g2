(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  const $ = (s) => document.querySelector(s);
  const ROLES_ESCRITURA_PEDIDOS = ['administrador', 'comercial'];
  const puedeEscribir = ROLES_ESCRITURA_PEDIDOS.includes(sesion.rol);
  const estado = { lista: [], clientes: [], productos: [], texto: '', centro: '', filtroEstado: '', editando: null, borrando: null, destacado: null };
  const modalForm = $('#modalForm');
  const modalEliminar = $('#modalEliminar');
  const form = $('#form');
  const CAMPOS = ['cliente_id', 'producto_id', 'cantidad', 'centro_distribucion', 'estado', 'fecha'];
  const TEXTO_ESTADO = { recibido: 'Recibido', despachado: 'Despachado', entregado: 'Entregado' };

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
      $('#avisoTexto').textContent = `Tu rol (${CONFIG.ROLES[sesion.rol].texto}) solo puede consultar pedidos. Crear, editar y eliminar requiere rol administrador o comercial.`;
    }
  }

  // ---------- Datos y pintado ----------
  function pintarResumen() {
    const l = estado.lista;
    const cuenta = (e) => l.filter((x) => x.estado === e).length;
    UI.animarNumero($('#stTotal'), l.length);
    UI.animarNumero($('#stRec'), cuenta('recibido'));
    UI.animarNumero($('#stDes'), cuenta('despachado'));
    UI.animarNumero($('#stEnt'), cuenta('entregado'));
  }

  function filtrados() {
    const t = estado.texto.trim().toLowerCase();
    return estado.lista.filter((p) =>
      (!t || (p.cliente && p.cliente.nombre.toLowerCase().includes(t)) || (p.producto && p.producto.nombre.toLowerCase().includes(t))) &&
      (!estado.centro || p.centro_distribucion === estado.centro) &&
      (!estado.filtroEstado || p.estado === estado.filtroEstado));
  }

  function pintarCabecera() {
    $('#cabecera').innerHTML = `<tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Centro</th><th>Estado</th><th>Fecha</th>${puedeEscribir ? '<th></th>' : ''}</tr>`;
  }

  // Si ms-clientes o ms-productos no respondieron, el objeto viene en null
  const noDisponible = '<span style="color:var(--tenue)">No disponible</span>';

  function pintarTabla() {
    const filas = filtrados();
    const columnas = puedeEscribir ? 8 : 7;
    pintarCabecera();
    if (filas.length === 0) {
      $('#cuerpo').innerHTML = `<tr><td colspan="${columnas}"><div class="vacio">${UI.icono('search', 30)}<strong>Sin resultados</strong><span>Prueba con otro cliente, producto, centro o estado.</span></div></td></tr>`;
    } else {
      $('#cuerpo').innerHTML = filas.map((p, i) => `
        <tr data-id="${p.id}" class="${p.id === estado.destacado ? 'destacado' : ''}" style="--i:${Math.min(i, 12)}">
          <td data-label="Pedido"><div class="cli"><span class="av">#${p.id}</span><div><strong>Pedido #${p.id}</strong></div></div></td>
          <td data-label="Cliente">${p.cliente ? `<strong>${UI.esc(p.cliente.nombre)}</strong>` : noDisponible}</td>
          <td data-label="Producto">${p.producto ? `<strong>${UI.esc(p.producto.nombre)}</strong>` : noDisponible}</td>
          <td data-label="Cantidad" class="mono">${Number(p.cantidad).toLocaleString('es-CO')}</td>
          <td data-label="Centro" class="dir">${UI.esc(p.centro_distribucion)}</td>
          <td data-label="Estado"><span class="tag ${p.estado}">${TEXTO_ESTADO[p.estado] || UI.esc(p.estado)}</span></td>
          <td data-label="Fecha" class="mono">${UI.esc(p.fecha)}</td>
          ${puedeEscribir ? `<td class="acciones">
            <button class="icono-btn" data-accion="editar" data-id="${p.id}" title="Editar">${UI.icono('edit')}</button>
            <button class="icono-btn rojo" data-accion="eliminar" data-id="${p.id}" title="Eliminar">${UI.icono('trash')}</button>
          </td>` : ''}
        </tr>`).join('');
    }
    $('#conteo').textContent = `Mostrando ${filas.length} de ${estado.lista.length} pedidos`;
    estado.destacado = null;
  }

  function pintarEsqueleto() {
    pintarCabecera();
    $('#cuerpo').innerHTML = Array.from({ length: 6 }, () => `<tr><td colspan="${puedeEscribir ? 8 : 7}"><span class="sk"></span></td></tr>`).join('');
    $('#conteo').textContent = 'Cargando pedidos…';
  }

  function pintarFallo(e) {
    const pista = CONFIG.MODO === 'ejemplo' ? 'Abre la página con Live Server (no con doble clic) para que pueda leer datos/pedidos.json.' : e.message;
    $('#cuerpo').innerHTML = `<tr><td colspan="${puedeEscribir ? 8 : 7}"><div class="vacio">${UI.icono('alert', 30)}<strong>No se pudieron cargar los pedidos</strong><span>${UI.esc(pista)}</span></div></td></tr>`;
    $('#conteo').textContent = '';
  }

  async function cargar(conEsqueleto = true) {
    if (conEsqueleto) pintarEsqueleto();
    try {
      estado.lista = await ApiPedidos.listar();
      ApiPedidos.clientes().then((c) => { estado.clientes = c; }).catch(() => {});
      ApiPedidos.productos().then((p) => { estado.productos = p; }).catch(() => {});
      pintarResumen();
      pintarTabla();
      const conAviso = estado.lista.find((p) => p.aviso);
      if (conAviso) UI.toast('error', 'Datos incompletos', conAviso.aviso);
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
    // 400 por cliente o producto inexistente: el mensaje trae solo un texto, sin detalles
    if (e.status === 400 && !(e.detalles || []).length) {
      if (/cliente/i.test(e.message)) mapa.cliente_id = e.message;
      else if (/producto/i.test(e.message)) mapa.producto_id = e.message;
    }
    Object.entries(mapa).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      const caja = input.closest('.campo');
      caja.classList.add('con-error');
      caja.querySelector('.err').textContent = msg;
    });
  }

  function llenarSelect(sel, lista, actual) {
    const items = [...lista];
    if (actual && !items.some((x) => x.id === actual.id)) items.push(actual);
    sel.innerHTML = '<option value="">Selecciona…</option>' +
      items.map((x) => `<option value="${x.id}">${UI.esc(x.nombre)} (#${x.id})</option>`).join('');
  }

  function abrirFormulario(pedido = null) {
    estado.editando = pedido ? pedido.id : null;
    form.reset();
    limpiarErrores();
    llenarSelect($('#selCliente'), estado.clientes, pedido && pedido.cliente);
    llenarSelect($('#selProducto'), estado.productos, pedido && pedido.producto);
    $('#tituloForm').textContent = pedido ? 'Editar pedido' : 'Nuevo pedido';
    $('#textoGuardar').textContent = pedido ? 'Guardar cambios' : 'Crear pedido';
    if (pedido) CAMPOS.forEach((k) => { form.elements[k].value = pedido[k] ?? ''; });
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
      const guardado = editando ? await ApiPedidos.actualizar(editando, datos) : await ApiPedidos.crear(datos);
      cerrar(modalForm);
      estado.destacado = guardado.id;
      await cargar(false);
      UI.toast('ok', editando ? 'Pedido actualizado' : 'Pedido creado', `Pedido #${guardado.id}`);
    } catch (e) {
      if (e.status === 400) mostrarErrores(e); else manejarError(e);
      if (e.status === 400 && !(e.detalles || []).length) UI.toast('error', 'No se pudo guardar', e.message);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  $('#btnConfirmar').addEventListener('click', async () => {
    const pedido = estado.borrando;
    const btn = $('#btnConfirmar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      await ApiPedidos.eliminar(pedido.id);
      cerrar(modalEliminar);
      const fila = document.querySelector(`tr[data-id="${pedido.id}"]`);
      if (fila) { fila.classList.add('saliendo'); await new Promise((r) => setTimeout(r, 300)); }
      await cargar(false);
      UI.toast('ok', 'Pedido eliminado', `Pedido #${pedido.id}`);
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
  $('#filtroCentro').addEventListener('change', (e) => { estado.centro = e.target.value; pintarTabla(); });
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    estado.filtroEstado = b.dataset.estado;
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('activo', x === b));
    pintarTabla();
  });
  $('#cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const pedido = estado.lista.find((p) => p.id === Number(b.dataset.id));
    if (!pedido) return;
    if (b.dataset.accion === 'editar') abrirFormulario(pedido);
    else { estado.borrando = pedido; $('#nombreBorrar').textContent = `#${pedido.id}`; abrir(modalEliminar); }
  });
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();
