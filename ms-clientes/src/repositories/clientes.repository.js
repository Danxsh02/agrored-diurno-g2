// CAPA DE ACCESO A DATOS (repositorio): versión MySQL

const pool = require('../db');

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM clientes';
  const condiciones = [];
  const valores = [];

  if (filtros.ciudad) {
    condiciones.push('ciudad = ?');
    valores.push(filtros.ciudad);
  }
  if (filtros.tipo) {
    condiciones.push('tipo = ?');
    valores.push(filtros.tipo);
  }
  if (filtros.ids) {
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');

  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
  const [filas] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}

async function findByNit(nit) {
  const [filas] = await pool.query('SELECT * FROM clientes WHERE nit = ?', [nit]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(cliente) {
  const [resultado] = await pool.query(
    'INSERT INTO clientes (nombre, nit, ciudad, telefono, tipo, direccion, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [cliente.nombre, cliente.nit, cliente.ciudad, cliente.telefono, cliente.tipo, cliente.direccion, cliente.email]
  );
  return findById(resultado.insertId);
}

async function update(id, cliente) {
  const [resultado] = await pool.query(
    'UPDATE clientes SET nombre = ?, nit = ?, ciudad = ?, telefono = ?, tipo = ?, direccion = ?, email = ? WHERE id = ?',
    [cliente.nombre, cliente.nit, cliente.ciudad, cliente.telefono, cliente.tipo, cliente.direccion, cliente.email, id]
  );
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}

async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByNit, create, update, remove };