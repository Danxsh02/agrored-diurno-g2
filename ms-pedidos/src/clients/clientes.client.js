// =====================================================================
// CLIENTE HTTP de ms-clientes: la única parte de ms-pedidos que sabe
// cómo hablar con ese microservicio (análogo al repositorio).
// =====================================================================
const HttpError = require('../utils/http-error');
const CLIENTES_URL = process.env.CLIENTES_URL;

// Hace la petición reenviando el token del usuario. null si no hubo respuesta.
async function pedir(ruta, token) {
  try {
    return await fetch(`${CLIENTES_URL}${ruta}`, {
      headers: { Authorization: token },        // el token de la petición original
      signal: AbortSignal.timeout(3000),         // no esperar más de 3 segundos
    });
  } catch (error) {
    return null;                                 // ms-clientes caído o sin responder
  }
}

// VALIDACIÓN: ¿existe el cliente? Si ms-clientes no responde → 503
async function existeCliente(id, token) {
  const respuesta = await pedir(`/clientes/${id}`, token);
  if (!respuesta) throw new HttpError(503, 'ms-clientes no está disponible');
  if (respuesta.status === 404) return false;
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-clientes respondió ${respuesta.status}`);
  }
  return true;
}

// COMPOSICIÓN: varios clientes en UNA petición → Map id → cliente (null si no responde)
async function clientesPorIds(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/clientes?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const clientes = await respuesta.json();
  return new Map(clientes.map((c) =>
    [c.id, { id: c.id, nombre: c.nombre }]));
}

module.exports = { existeCliente, clientesPorIds };
