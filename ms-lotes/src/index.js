// =====================================================================
// Punto de arranque del microservicio ms-lotes
// Lee la configuración (variables de entorno) y pone el servidor a escuchar.
// =====================================================================
const app = require('./app');

const PORT = Number(process.env.PORT) || 3005; // 3005 como valor por defecto
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`ms-lotes escuchando en http://${HOST}:${PORT}`);
});