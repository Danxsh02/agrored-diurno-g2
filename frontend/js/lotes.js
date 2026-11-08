(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  const $ = (s) => document.querySelector(s);
  const ROLES_ESCRITURA_LOTES = ['administrador', 'produccion'];
  const puedeEscribir = ROLES_ESCRITURA_LOTES.includes(sesion.rol);
  const estado = { lista: [], productos: [], texto: '', centro: '', resultado: '', editando: null, borrando: null, destacado: null };
  const modalForm = $('#modalForm');
  const modalEliminar = $('#modalEliminar');
  const form = $('#form');
  const CAMPOS = ['codigo_lote', 'producto_id', 'fecha_produccion', 'cantidad', 'resultado_calidad', 'fecha_vencimiento', 'centro_produccion'];
  const TEXTO_CALIDAD = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };
  const hoy = () => new Date().toLocaleDateString('en-CA');

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
      $('#avisoTexto').textContent = `Tu rol (${CONFIG.ROLES[sesion.rol].texto}) solo puede consultar lotes. Crear, editar y eliminar requiere rol administrador o producción.`;
    }
  }

  // ---------- Datos y pintado ----------
  function pintarResumen() {
    const l = estado.lista;
    const cuenta = (r) => l.filter((x) => x.resultado_calidad === r).length;
    UI.animarNumero($('#stTotal'), l.length);
    UI.animarNumero($('#stApr'), cuenta('aprobado'));
    UI.animarNumero($('#stPen'), cuenta('pendiente'));
    UI.animarNumero($('#stRec'), cuenta('rechazado'));
  }

  function pintarCentros() {
    const centros = [...new Set(estado.lista.map((l) => l.centro_produccion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const sel = $('#filtroCentro');
    sel.innerHTML = '<option value="">Todos los centros</option>' + centros.map((c) => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('');
    sel.value = centros.includes(estado.centro) ? estado.centro : '';
    estado.centro = sel.value;
  }

  function filtrados() {
    const t = estado.texto.trim().toLowerCase();
    return estado.lista.filter((l) =>
      (!t || l.codigo_lote.toLowerCase().includes(t) || (l.producto && l.producto.nombre.toLowerCase().includes(t))) &&
      (!estado.centro || l.centro_produccion === estado.centro) &&
      (!estado.resultado || l.resultado_calidad === estado.resultado));
  }

  function pintarCabecera() {
    $('#cabecera').innerHTML = `<tr><th>Lote</th><th>Producto</th><th>Producción</th><th>Cantidad</th><th>Calidad</th><th>Vencimiento</th><th>Centro</th>${puedeEscribir ? '<th></th>' : ''}</tr>`;
  }

  function pintarTabla() {
    const filas = filtrados();
    const columnas = puedeEscribir ? 8 : 7;
    pintarCabecera();
    if (filas.length === 0) {
      $('#cuerpo').innerHTML = `<tr><td colspan="${columnas}"><div class="vacio">${UI.icono('search', 30)}<strong>Sin resultados</strong><span>Prueba con otro código, producto, centro o resultado de calidad.</span></div></td></tr>`;
    } else {
      $('#cuerpo').innerHTML = filas.map((l, i) => {
        const p = l.producto;
        return `
        <tr data-id="${l.id}" class="${l.id === estado.destacado ? 'destacado' : ''}" style="--i:${Math.min(i, 12)}">
          <td data-label="Lote"><div class="cli"><span class="av">${UI.esc(UI.iniciales(p ? p.nombre : 'Lote'))}</span><div><strong>${UI.esc(l.codigo_lote)}</strong><small>Lote #${l.id}</small></div></div></td>
          <td data-label="Producto">${p ? `<strong>${UI.esc(p.nombre)}</strong><small style="display:block;color:var(--tenue)">${UI.esc(p.categoria)}</small>` : '<span style="color:var(--tenue)">No disponible</span>'}</td>
          <td data-label="Producción" class="mono">${UI.esc(l.fecha_produccion)}</td>
          <td data-label="Cantidad" class="mono">${Number(l.cantidad).toLocaleString('es-CO')}</td>
          <td data-label="Calidad"><span class="tag ${l.resultado_calidad}">${TEXTO_CALIDAD[l.resultado_calidad] || UI.esc(l.resultado_calidad)}</span></td>
          <td data-label="Vencimiento" class="mono">${UI.esc(l.fecha_vencimiento || '—')}</td>
          <td data-label="Centro" class="dir">${UI.esc(l.centro_produccion || '—')}</td>
          ${puedeEscribir ? `<td class="acciones">
            <button class="icono-btn" data-accion="editar" data-id="${l.id}" title="Editar">${UI.icono('edit')}</button>
            <button class="icono-btn rojo" data-accion="eliminar" data-id="${l.id}" title="Eliminar">${UI.icono('trash')}</button>
          </td>` : ''}
        </tr>`;
      }).join('');
    }
    $('#conteo').textContent = `Mostrando ${filas.length} de ${estado.lista.length} lotes`;
    estado.destacado = null;
  }

  function pintarEsqueleto() {
    pintarCabecera();
    $('#cuerpo').innerHTML = Array.from({ length: 6 }, () => `<tr><td colspan="${puedeEscribir ? 8 : 7}"><span class="sk"></span></td></tr>`).join('');
    $('#conteo').textContent = 'Cargando lotes…';
  }

  function pintarFallo(e) {
    const pista = CONFIG.MODO === 'ejemplo' ? 'Abre la página con Live Server (no con doble clic) para que pueda leer datos/lotes.json.' : e.message;
    $('#cuerpo').innerHTML = `<tr><td colspan="${puedeEscribir ? 8 : 7}"><div class="vacio">${UI.icono('alert', 30)}<strong>No se pudieron cargar los lotes</strong><span>${UI.esc(pista)}</span></div></td></tr>`;
    $('#conteo').textContent = '';
  }

  async function cargar(conEsqueleto = true) {
    if (conEsqueleto) pintarEsqueleto();
    try {
      estado.lista = await ApiLotes.listar();
      ApiLotes.productos().then((p) => { estado.productos = p; }).catch(() => {});
      pintarResumen();
      pintarCentros();
      pintarTabla();
      const conAviso = estado.lista.find((l) => l.aviso);
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
    if (e.status === 409) mapa.codigo_lote = e.message;
    Object.entries(mapa).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      const caja = input.closest('.campo');
      caja.classList.add('con-error');
      caja.querySelector('.err').textContent = msg;
    });
  }

  function llenarProductos(actual) {
    const productos = [...estado.productos];
    if (actual && actual.producto && !productos.some((p) => p.id === actual.producto.id)) productos.push(actual.producto);
    $('#selProducto').innerHTML = '<option value="">Selecciona…</option>' +
      productos.map((p) => `<option value="${p.id}">${UI.esc(p.nombre)} (#${p.id})</option>`).join('');
  }

  function abrirFormulario(lote = null) {
    estado.editando = lote ? lote.id : null;
    form.reset();
    limpiarErrores();
    llenarProductos(lote);
    form.elements.fecha_produccion.max = hoy();
    $('#tituloForm').textContent = lote ? 'Editar lote' : 'Nuevo lote';
    $('#textoGuardar').textContent = lote ? 'Guardar cambios' : 'Crear lote';
    if (lote) CAMPOS.forEach((k) => { form.elements[k].value = lote[k] ?? ''; });
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
      const guardado = editando ? await ApiLotes.actualizar(editando, datos) : await ApiLotes.crear(datos);
      cerrar(modalForm);
      estado.destacado = guardado.id;
      await cargar(false);
      UI.toast('ok', editando ? 'Lote actualizado' : 'Lote creado', guardado.codigo_lote);
    } catch (e) {
      if ((e.status === 400 && (e.detalles || []).length) || e.status === 409) mostrarErrores(e); else manejarError(e);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  $('#btnConfirmar').addEventListener('click', async () => {
    const lote = estado.borrando;
    const btn = $('#btnConfirmar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      await ApiLotes.eliminar(lote.id);
      cerrar(modalEliminar);
      const fila = document.querySelector(`tr[data-id="${lote.id}"]`);
      if (fila) { fila.classList.add('saliendo'); await new Promise((r) => setTimeout(r, 300)); }
      await cargar(false);
      UI.toast('ok', 'Lote eliminado', lote.codigo_lote);
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
    estado.resultado = b.dataset.resultado;
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('activo', x === b));
    pintarTabla();
  });
  $('#cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const lote = estado.lista.find((l) => l.id === Number(b.dataset.id));
    if (!lote) return;
    if (b.dataset.accion === 'editar') abrirFormulario(lote);
    else { estado.borrando = lote; $('#nombreBorrar').textContent = lote.codigo_lote; abrir(modalEliminar); }
  });
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();