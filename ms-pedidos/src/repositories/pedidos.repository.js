// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio) — versión MySQL
// Mismas funciones, mismos parámetros y mismo resultado que la versión
// en memoria: por eso rutas, controlador, servicio y modelo no cambian.
// Siempre se usan parámetros (?) para evitar la inyección SQL.
// =====================================================================
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM pedidos';
  const valores = [];
  if (filtros.estado) {
    sql += ' WHERE estado = ?';
    valores.push(filtros.estado);
  }
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(pedido) {
  const [resultado] = await pool.query(
    `INSERT INTO pedidos (cliente_id, producto_id, cantidad, centro_distribucion, estado, fecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [pedido.cliente_id, pedido.producto_id, pedido.cantidad,
     pedido.centro_distribucion, pedido.estado, pedido.fecha]);
  return findById(resultado.insertId);   // MySQL devuelve el id generado
}

// Devuelve el pedido actualizado, o null si no existe
async function update(id, datos) {
  const [resultado] = await pool.query(
    `UPDATE pedidos
        SET cliente_id = ?, producto_id = ?, cantidad = ?,
            centro_distribucion = ?, estado = ?, fecha = ?
      WHERE id = ?`,
    [datos.cliente_id, datos.producto_id, datos.cantidad,
     datos.centro_distribucion, datos.estado, datos.fecha, id]);
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}

// Devuelve true si eliminó algo, false si no existía
async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM pedidos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
