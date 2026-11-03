// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/pedidos.controller');

const router = Router();

router.get('/', controller.listar);          // listar (acepta ?estado=)
router.get('/:id', controller.obtener);      // obtener un pedido por id
router.post('/', controller.crear);          // crear un pedido
router.put('/:id', controller.actualizar);   // reemplazar un pedido
router.delete('/:id', controller.eliminar);  // eliminar un pedido

module.exports = router;
