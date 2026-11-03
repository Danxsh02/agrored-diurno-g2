// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio Lotes)
// =====================================================================
const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM lotes';
  const valores = [];
  if (filtros.resultado_calidad) {
    sql += ' WHERE resultado_calidad = ?';
    valores.push(filtros.resultado_calidad);
  }
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM lotes WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function findByCodigo(codigo_lote) {
  const [filas] = await pool.query('SELECT * FROM lotes WHERE codigo_lote = ?', [codigo_lote]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(lote) {
  const [resultado] = await pool.query(
    `INSERT INTO lotes (codigo_lote, producto_id, fecha_produccion, cantidad,
      resultado_calidad, fecha_vencimiento, centro_produccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [lote.codigo_lote, lote.producto_id, lote.fecha_produccion, lote.cantidad,
     lote.resultado_calidad, lote.fecha_vencimiento, lote.centro_produccion]);
  return findById(resultado.insertId);
}

async function update(id, lote) {
  const [resultado] = await pool.query(
    `UPDATE lotes SET codigo_lote = ?, producto_id = ?, fecha_produccion = ?, cantidad = ?,
      resultado_calidad = ?, fecha_vencimiento = ?, centro_produccion = ? WHERE id = ?`,
    [lote.codigo_lote, lote.producto_id, lote.fecha_produccion, lote.cantidad,
     lote.resultado_calidad, lote.fecha_vencimiento, lote.centro_produccion, id]);
  return resultado.affectedRows > 0 ? findById(id) : null;
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM lotes WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByCodigo, create, update, remove };