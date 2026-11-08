// CAPA DE PRESENTACIÓN: rutas de clientes, protegidas con token y permisos por rol

const { Router } = require('express');
const controller = require('../controllers/clientes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'comercial'), controller.crear);
router.put('/:id', requiereRol('administrador', 'comercial'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'comercial'), controller.eliminar);

module.exports = router;