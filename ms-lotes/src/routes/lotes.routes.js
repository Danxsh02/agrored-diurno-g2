// =====================================================================
// CAPA DE PRESENTACIÓN (rutas Lotes)
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/lotes.controller');

const router = Router();

router.get('/', controller.listar);      // listar todos los lotes
router.get('/:id', controller.obtener);  // obtener un lote por id
router.post('/', controller.crear);      // crear un lote

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;