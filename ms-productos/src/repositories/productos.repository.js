// CAPA DE ACCESO A DATOS (repositorio) con base de datosMySQL
const pool = require('../db');

// MySQL guarda BOOLEAN como 0/1 y DECIMAL puede llegar como texto:
// el repositorio lo traduce al formato del contrato
function aProducto(fila) {
  return { ...fila, precio: Number(fila.precio), activo: Boolean(fila.activo) };
}

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM productos';
  const condiciones = [];
  const valores = [];

  if (filtros.categoria) {
    condiciones.push('categoria = ?');
    valores.push(filtros.categoria);
  }
  if (filtros.ids) { // ?ids=1,2,3 → WHERE id IN (1, 2, 3)
    condiciones.push('id IN (?)');
    valores.push(filtros.ids);
  }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');

  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas.map(aProducto);
}

async function findById(id) {
  // ? es un parámetro: el valor viaja aparte de la consulta (evita inyección SQL)
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  return filas.length > 0 ? aProducto(filas[0]) : null;
}

async function findByNombre(nombre) {
  // La comparación de MySQL no distingue mayúsculas, igual que la versión en memoria
  const [filas] = await pool.query('SELECT * FROM productos WHERE nombre = ?', [nombre]);
  return filas.length > 0 ? aProducto(filas[0]) : null;
}

async function create(producto) {
  const [resultado] = await pool.query(
    'INSERT INTO productos (nombre, categoria, unidad, precio, activo) VALUES (?, ?, ?, ?, ?)',
    [producto.nombre, producto.categoria, producto.unidad, producto.precio, producto.activo]
  );
  return findById(resultado.insertId); // MySQL devuelve el id generado
}

// Devuelve el producto actualizado, o null si no existe
async function update(id, datos) {
  await pool.query(
    'UPDATE productos SET nombre = ?, categoria = ?, unidad = ?, precio = ?, activo = ? WHERE id = ?',
    [datos.nombre, datos.categoria, datos.unidad, datos.precio, datos.activo, id]
  );
  return findById(id);
}

// Devuelve true si eliminó, false si no existía
async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByNombre, create, update, remove };