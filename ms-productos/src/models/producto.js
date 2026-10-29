// CAPA DE MODELO (entidad)
const CATEGORIAS_VALIDAS = ['fruta', 'hortaliza', 'procesado'];
const UNIDADES_VALIDAS = ['kg', 'caja'];

function validarProducto(datos) {
  const errores = [];

  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del producto'];
  }

  if (!Number.isInteger(datos.id) || datos.id <= 0) {
    errores.push('id es obligatorio y debe ser un entero positivo');
  }

  if (typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
    errores.push('nombre es obligatorio');
  }

  if (!CATEGORIAS_VALIDAS.includes(datos.categoria)) {
    errores.push(`categoria debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  if (!UNIDADES_VALIDAS.includes(datos.unidad)) {
    errores.push(`unidad debe ser una de: ${UNIDADES_VALIDAS.join(', ')}`);
  }

  if (typeof datos.precio !== 'number' || !(datos.precio > 0)) {
    errores.push('precio es obligatorio y debe ser un número mayor que 0');
  }

  if (datos.activo !== undefined && typeof datos.activo !== 'boolean') {
    errores.push('activo debe ser true o false');
  }

  return errores;
}

function construirProducto(datos) {
  return {
    id: datos.id,
    nombre: datos.nombre.trim(),
    categoria: datos.categoria,
    unidad: datos.unidad,
    precio: datos.precio,
    activo: datos.activo === undefined ? true : datos.activo,
  };
}

module.exports = { validarProducto, construirProducto };