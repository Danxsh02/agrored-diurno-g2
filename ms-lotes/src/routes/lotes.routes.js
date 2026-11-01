// =====================================================================
// CAPA DE PRESENTACIÓN (rutas Lotes)
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/lotes.controller');

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;