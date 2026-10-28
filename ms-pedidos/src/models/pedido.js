// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Pedido y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
// =====================================================================

const ESTADOS = ['recibido', 'despachado', 'entregado'];
const CENTROS = ['Bogotá', 'Cali'];
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

function esFechaReal(texto) {
  if (typeof texto !== 'string' || !FECHA_VALIDA.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarPedido(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del pedido'];
  }
  if (!esEnteroPositivo(datos.cliente_id)) {
    errores.push('cliente_id es obligatorio y debe ser un entero positivo');
  }
  if (!esEnteroPositivo(datos.producto_id)) {
    errores.push('producto_id es obligatorio y debe ser un entero positivo');
  }
  if (!esEnteroPositivo(datos.cantidad)) {
    errores.push('cantidad es obligatoria y debe ser un entero mayor que 0');
  }
  if (!CENTROS.includes(datos.centro_distribucion)) {
    errores.push(`centro_distribucion debe ser uno de: ${CENTROS.join(', ')}`);
  }
  if (datos.estado !== undefined && !ESTADOS.includes(datos.estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
  }
  if (datos.fecha !== undefined && !esFechaReal(datos.fecha)) {
    errores.push('fecha debe tener el formato AAAA-MM-DD y ser una fecha real');
  }
  return errores;
}

// Construye un pedido "limpio" solo con los campos permitidos
function construirPedido(datos) {
  return {
    cliente_id: datos.cliente_id,
    producto_id: datos.producto_id,
    cantidad: datos.cantidad,
    centro_distribucion: datos.centro_distribucion,
    estado: datos.estado === undefined ? 'recibido' : datos.estado,
    fecha: datos.fecha === undefined ? new Date().toISOString().slice(0, 10) : datos.fecha,
  };
}

module.exports = { validarPedido, construirPedido, ESTADOS, CENTROS };
