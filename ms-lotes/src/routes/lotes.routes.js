// =====================================================================
// CAPA DE PRESENTACIÓN (rutas Lotes)
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/lotes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

// Todas las rutas exigen un token válido (401 si falta o es inválido)
router.use(verificarToken);

// Consultar: cualquier usuario autenticado
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Crear, modificar y eliminar: solo administrador y producción (403 a los demás)
router.post('/', requiereRol('administrador', 'produccion'), controller.crear);
router.put('/:id', requiereRol('administrador', 'produccion'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'produccion'), controller.eliminar);

module.exports = router;