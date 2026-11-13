// CAPA DE PRESENTACIÓN (rutas)
// Todas las rutas exigen token. Consultan: administrador, comercial y produccion.
// Crean, modifican y eliminan: solo administrador
const { Router } = require('express');
const controller = require('../controllers/productos.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');
const router = Router();

router.use(verificarToken);   

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador, produccion'), controller.crear);
router.put('/:id', requiereRol('administrador, produccion'), controller.actualizar);
router.delete('/:id', requiereRol('administrador, produccion'), controller.eliminar);

module.exports = router;