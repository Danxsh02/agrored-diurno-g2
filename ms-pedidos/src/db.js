// src/db.js — conexión a MySQL con los datos del archivo .env
const mysql = require('mysql2/promise');

// Un pool mantiene varias conexiones abiertas y las reutiliza
// en lugar de abrir una nueva por cada petición.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dateStrings: true,      // fechas como texto '2026-10-26', no como objetos Date
  decimalNumbers: true,   // los DECIMAL llegan como números, no como texto
});

module.exports = pool;
