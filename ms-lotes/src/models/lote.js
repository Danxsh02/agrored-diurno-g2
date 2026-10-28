// =====================================================================
// CAPA DE MODELO (entidad Lote)
// =====================================================================

// Lista de resultados de calidad permitidos
const RESULTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarLote(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del lote'];
  }
  
  if (!datos.codigo_lote || typeof datos.codigo_lote !== 'string' || datos.codigo_lote.trim() === '') {
    errores.push('codigo_lote es obligatorio');
  }
  if (!Number.isInteger(datos.producto_id) || datos.producto_id <= 0) {
    errores.push('producto_id es obligatorio y debe ser un entero positivo');
  }
  if (!datos.fecha_produccion || typeof datos.fecha_produccion !== 'string' || !FECHA.test(datos.fecha_produccion)) {
    errores.push('fecha_produccion es obligatoria (formato YYYY-MM-DD)');
  }
  if (typeof datos.cantidad !== 'number' || datos.cantidad <= 0) {
    errores.push('cantidad debe ser un número mayor a 0');
  }
  if (!RESULTADOS_VALIDOS.includes(datos.resultado_calidad)) {
    errores.push(`resultado_calidad debe ser uno de: ${RESULTADOS_VALIDOS.join(', ')}`);
  }
  // Campos opcionales/recomendados
  if (datos.fecha_vencimiento && (typeof datos.fecha_vencimiento !== 'string' || !FECHA.test(datos.fecha_vencimiento))) {
    errores.push('fecha_vencimiento debe tener formato YYYY-MM-DD');
  }
  if (datos.centro_produccion && typeof datos.centro_produccion !== 'string') {
    errores.push('centro_produccion debe ser un texto');
  }

  return errores;
}

// Construye un lote "limpio" solo con los campos permitidos
function construirLote(datos) {
  return {
    codigo_lote: datos.codigo_lote.trim(),
    producto_id: datos.producto_id,
    fecha_produccion: datos.fecha_produccion,
    cantidad: datos.cantidad,
    resultado_calidad: datos.resultado_calidad,
    fecha_vencimiento: datos.fecha_vencimiento || null,
    centro_produccion: datos.centro_produccion ? datos.centro_produccion.trim() : null
  };
}

module.exports = { validarLote, construirLote };