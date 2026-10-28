// CAPA DE PRESENTACIÓN (rutas)

const { Router } = require('express');
const controller = require('../controllers/clientes.controller');

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;