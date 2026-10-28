// CAPA DE MODELO (entidad)

const TIPOS_VALIDOS = ['distribuidor', 'comercio'];

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esTextoVacio(valor) {
  return typeof valor !== 'string' || valor.trim() === '';
}

function validarCliente(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos del cliente'];
  }
  if (esTextoVacio(datos.nombre)) errores.push('nombre es obligatorio');
  if (esTextoVacio(datos.nit)) errores.push('nit es obligatorio');
  if (esTextoVacio(datos.ciudad)) errores.push('ciudad es obligatoria');
  if (esTextoVacio(datos.telefono)) errores.push('telefono es obligatorio');
  if (!TIPOS_VALIDOS.includes(datos.tipo)) {
    errores.push(`tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
  }
  if (datos.direccion !== undefined && typeof datos.direccion !== 'string') {
    errores.push('direccion debe ser texto');
  }
  if (datos.email !== undefined && datos.email !== '' &&
      (typeof datos.email !== 'string' || !EMAIL_VALIDO.test(datos.email.trim()))) {
    errores.push('email debe tener un formato válido');
  }
  return errores;
}

function construirCliente(datos) {
  return {
    nombre: datos.nombre.trim(),
    nit: datos.nit.trim(),
    ciudad: datos.ciudad.trim(),
    telefono: datos.telefono.trim(),
    tipo: datos.tipo,
    direccion: (datos.direccion || '').trim(),
    email: (datos.email || '').trim().toLowerCase(),
  };
}

module.exports = { validarCliente, construirCliente };