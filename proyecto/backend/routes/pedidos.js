// ===================================
// RUTAS: PEDIDOS
// ===================================
// Endpoints para pedidos y compras

const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/verifyAdmin');

// ===================================
// RUTAS PROTEGIDAS USUARIO
// ===================================

// POST /api/pedidos - Crear pedido
// Body: { carrito, cliente: { nombre, email, telefono, direccion }, metodoPago, subtotal, envio, total, notas }
// ✅ REQUIERE TOKEN para vincular el pedido al usuario
router.post('/', verificarToken, pedidosController.crearPedido);

// GET /api/pedidos - Obtener mis pedidos
router.get('/', verificarToken, pedidosController.obtenerMisPedidos);

// GET /api/pedidos/:id - Obtener detalle de pedido
router.get('/:id', verificarToken, pedidosController.obtenerPedido);

// DELETE /api/pedidos/:id - Cancelar pedido
router.delete('/:id', verificarToken, pedidosController.cancelarPedido);

// GET /api/pedidos/:id/detalles - Obtener detalles del pedido
router.get('/:id/detalles', verificarToken, pedidosController.obtenerDetallesPedido);

// ===================================
// RUTAS PROTEGIDAS ADMIN
// ===================================

// GET /api/admin/pedidos - Obtener todos los pedidos
// Query: ?estado=pendiente&fecha_desde=2027-02-01&fecha_hasta=2027-02-28
router.get('/admin/todas', verificarAdmin, pedidosController.obtenerTodosPedidos);

// PUT /api/admin/pedidos/:id/estado - Actualizar estado de pedido
// Body: { estado: 'confirmado' }
router.put('/admin/:id/estado', verificarAdmin, pedidosController.actualizarEstadoPedido);

// GET /api/admin/pedidos/estadisticas - Estadísticas de pedidos
router.get('/admin/estadisticas', verificarAdmin, pedidosController.obtenerEstadisticas);

// ===================================
// EXPORTAR
// ===================================
module.exports = router;
