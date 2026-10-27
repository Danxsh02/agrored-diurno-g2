// =====================================================================
// Configuración de la aplicación Express para ms-lotes
// =====================================================================
const express = require('express');
const lotesRoutes = require('./routes/lotes.routes');

const app = express();

// Middleware: convierte el cuerpo JSON de la petición en un objeto (req.body)
app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ servicio: 'ms-lotes', estado: 'ok' });
});

// Rutas del recurso. Todas las URIs de este microservicio empiezan por /lotes
app.use('/lotes', lotesRoutes);

// Cualquier otra ruta: 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message, detalles: err.detalles });
});

module.exports = app;