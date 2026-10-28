// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/pedidos.controller');

const router = Router();

router.get('/', controller.listar);      // listar todos los pedidos
router.get('/:id', controller.obtener);  // obtener un pedido por id
router.post('/', controller.crear);      // crear un pedido

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;
