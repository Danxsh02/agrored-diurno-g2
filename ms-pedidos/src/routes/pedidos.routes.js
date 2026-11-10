// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador y decide
// qué rutas exigen token y qué roles pueden usarlas.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/pedidos.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                       // todas las rutas exigen token

router.get('/', controller.listar);               // cualquier rol autenticado
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'comercial'), controller.crear);
router.put('/:id', requiereRol('administrador', 'comercial'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'comercial'), controller.eliminar);

module.exports = router;