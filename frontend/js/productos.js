(() => {
  const sesion = Sesion.exigir();
  if (!sesion) return;

  const $ = (s) => document.querySelector(s);
  // Tabla de permisos del Taller 1: solo el administrador crea, modifica y elimina productos
  const ROLES_ESCRITURA_PRODUCTOS = ['administrador'];
  const puedeEscribir = ROLES_ESCRITURA_PRODUCTOS.includes(sesion.rol);
  const estado = { lista: [], texto: '', categoria: '', editando: null, borrando: null, destacado: null };
  const modalForm = $('#modalForm');
  const modalEliminar = $('#modalEliminar');
  const form = $('#form');
  const CAMPOS = ['nombre', 'categoria', 'unidad', 'precio', 'activo'];
  const TEXTO_CATEGORIA = { fruta: 'Fruta', hortaliza: 'Hortaliza', procesado: 'Procesado' };
  const TEXTO_UNIDAD = { kg: 'Kilogramo', caja: 'Caja' };
  const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

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
      $('#avisoTexto').textContent = `Tu rol (${CONFIG.ROLES[sesion.rol].texto}) solo puede consultar productos. Crear, editar y eliminar requiere rol administrador.`;
    }
  }

  // ---------- Datos y pintado ----------
  function pintarResumen() {
    const l = estado.lista;
    const cuenta = (c) => l.filter((p) => p.categoria === c).length;
    UI.animarNumero($('#stTotal'), l.length);
    UI.animarNumero($('#stFru'), cuenta('fruta'));
    UI.animarNumero($('#stHor'), cuenta('hortaliza'));
    UI.animarNumero($('#stPro'), cuenta('procesado'));
  }

  function filtrados() {
    const t = estado.texto.trim().toLowerCase();
    return estado.lista.filter((p) =>
      (!t || p.nombre.toLowerCase().includes(t)) &&
      (!estado.categoria || p.categoria === estado.categoria));
  }

  function pintarCabecera() {
    $('#cabecera').innerHTML = `<tr><th>Producto</th><th>Categoría</th><th>Unidad</th><th>Precio</th><th>Estado</th>${puedeEscribir ? '<th></th>' : ''}</tr>`;
  }

  function pintarTabla() {
    const filas = filtrados();
    const columnas = puedeEscribir ? 6 : 5;
    pintarCabecera();
    if (filas.length === 0) {
      $('#cuerpo').innerHTML = `<tr><td colspan="${columnas}"><div class="vacio">${UI.icono('search', 30)}<strong>Sin resultados</strong><span>Prueba con otro nombre o categoría.</span></div></td></tr>`;
    } else {
      $('#cuerpo').innerHTML = filas.map((p, i) => `
        <tr data-id="${p.id}" class="${p.id === estado.destacado ? 'destacado' : ''}" style="--i:${Math.min(i, 12)}">
          <td data-label="Producto"><div class="cli"><span class="av">${UI.esc(UI.iniciales(p.nombre))}</span><div><strong>${UI.esc(p.nombre)}</strong><small>ID ${p.id}</small></div></div></td>
          <td data-label="Categoría"><span class="tag ${p.categoria}">${UI.esc(TEXTO_CATEGORIA[p.categoria] || p.categoria)}</span></td>
          <td data-label="Unidad">${UI.esc(TEXTO_UNIDAD[p.unidad] || p.unidad)}</td>
          <td data-label="Precio" class="mono">${pesos.format(p.precio)}</td>
          <td data-label="Estado"><span class="tag ${p.activo ? 'activo' : 'inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
          ${puedeEscribir ? `<td class="acciones">
            <button class="icono-btn" data-accion="editar" data-id="${p.id}" title="Editar">${UI.icono('edit')}</button>
            <button class="icono-btn rojo" data-accion="eliminar" data-id="${p.id}" title="Eliminar">${UI.icono('trash')}</button>
          </td>` : ''}
        </tr>`).join('');
    }
    $('#conteo').textContent = `Mostrando ${filas.length} de ${estado.lista.length} productos`;
    estado.destacado = null;
  }

  function pintarEsqueleto() {
    pintarCabecera();
    $('#cuerpo').innerHTML = Array.from({ length: 6 }, () => `<tr><td colspan="${puedeEscribir ? 6 : 5}"><span class="sk"></span></td></tr>`).join('');
    $('#conteo').textContent = 'Cargando productos…';
  }

  function pintarFallo(e) {
    const pista = CONFIG.MODO === 'ejemplo' ? 'Abre la página con Live Server (no con doble clic) para que pueda leer datos/productos.json.' : e.message;
    $('#cuerpo').innerHTML = `<tr><td colspan="${puedeEscribir ? 6 : 5}"><div class="vacio">${UI.icono('alert', 30)}<strong>No se pudieron cargar los productos</strong><span>${UI.esc(pista)}</span></div></td></tr>`;
    $('#conteo').textContent = '';
  }

  async function cargar(conEsqueleto = true) {
    if (conEsqueleto) pintarEsqueleto();
    try {
      estado.lista = await ApiProductos.listar();
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
    (e.detalles || []).forEach((d) => { mapa[d.split(' ')[0]] = d; });
    if (e.status === 409) mapa.nombre = e.message;
    Object.entries(mapa).forEach(([campo, msg]) => {
      const input = form.elements[campo];
      if (!input) return;
      const caja = input.closest('.campo');
      caja.classList.add('con-error');
      caja.querySelector('.err').textContent = msg;
    });
  }

  function abrirFormulario(producto = null) {
    estado.editando = producto ? producto.id : null;
    form.reset();
    limpiarErrores();
    $('#tituloForm').textContent = producto ? 'Editar producto' : 'Nuevo producto';
    $('#textoGuardar').textContent = producto ? 'Guardar cambios' : 'Crear producto';
    if (producto) CAMPOS.forEach((k) => { form.elements[k].value = String(producto[k] ?? ''); });
    abrir(modalForm);
  }

  // El formulario entrega texto: se convierte al tipo del contrato (precio número, activo booleano)
  function leerFormulario() {
    const d = Object.fromEntries(new FormData(form));
    return {
      nombre: d.nombre,
      categoria: d.categoria,
      unidad: d.unidad,
      precio: d.precio === '' ? undefined : Number(d.precio),
      activo: d.activo === 'true'
    };
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    limpiarErrores();
    const editando = estado.editando;
    const datos = leerFormulario();
    const btn = $('#btnGuardar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      const guardado = editando ? await ApiProductos.actualizar(editando, datos) : await ApiProductos.crear(datos);
      cerrar(modalForm);
      estado.destacado = guardado.id;
      await cargar(false);
      UI.toast('ok', editando ? 'Producto actualizado' : 'Producto creado', guardado.nombre);
    } catch (e) {
      if (e.status === 400 || e.status === 409) mostrarErrores(e); else manejarError(e);
    } finally {
      btn.disabled = false; btn.classList.remove('cargando');
    }
  });

  $('#btnConfirmar').addEventListener('click', async () => {
    const producto = estado.borrando;
    const btn = $('#btnConfirmar');
    btn.disabled = true; btn.classList.add('cargando');
    try {
      await ApiProductos.eliminar(producto.id);
      cerrar(modalEliminar);
      const fila = document.querySelector(`tr[data-id="${producto.id}"]`);
      if (fila) { fila.classList.add('saliendo'); await new Promise((r) => setTimeout(r, 300)); }
      await cargar(false);
      UI.toast('ok', 'Producto eliminado', producto.nombre);
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
    estado.categoria = b.dataset.categoria;
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('activo', x === b));
    pintarTabla();
  });
  $('#cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const producto = estado.lista.find((p) => p.id === Number(b.dataset.id));
    if (!producto) return;
    if (b.dataset.accion === 'editar') abrirFormulario(producto);
    else { estado.borrando = producto; $('#nombreBorrar').textContent = producto.nombre; abrir(modalEliminar); }
  });
  const alternarMenu = () => { $('#lateral').classList.toggle('abierto'); $('#velo').classList.toggle('abierto'); };
  $('#btnMenu').addEventListener('click', alternarMenu);
  $('#velo').addEventListener('click', alternarMenu);

  pintarMarco();
  cargar();
})();