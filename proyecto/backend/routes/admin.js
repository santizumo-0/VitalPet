// ===================================
// RUTAS: ADMINISTRACIÓN
// ===================================
// Endpoints para panel administrativo

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarAdmin = require('../middleware/verifyAdmin');

// ===================================
// RUTA PÚBLICA
// ===================================

// POST /api/admin/login - Login administrador
router.post('/login', adminController.loginAdmin);

// ===================================
// RUTAS PROTEGIDAS (Requieren ser admin)
// ===================================

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/usuarios', verificarAdmin, adminController.listarUsuarios);

// GET /api/admin/usuarios/:id - Obtener datos de un usuario
router.get('/usuarios/:id', verificarAdmin, adminController.obtenerUsuario);

// GET /api/admin/mascotas - Listar todas las mascotas
router.get('/mascotas', verificarAdmin, adminController.listarMascotas);

// GET /api/admin/citas - Listar todas las citas
router.get('/citas', verificarAdmin, adminController.listarCitas);

// GET /api/admin/pedidos - Listar todos los pedidos
router.get('/pedidos', verificarAdmin, adminController.listarPedidos);

// GET /api/admin/estadisticas - Obtener estadísticas globales
router.get('/estadisticas', verificarAdmin, adminController.obtenerEstadisticas);

// ===================================
// NUEVAS RUTAS PARA DASHBOARD
// ===================================

// GET /api/admin/dashboard/estadisticas - Estadísticas del dashboard
router.get('/dashboard/estadisticas', verificarAdmin, adminController.obtenerDashboardEstadisticas);

// GET /api/admin/dashboard/citas - Obtener todas las citas
router.get('/dashboard/citas', verificarAdmin, adminController.obtenerTodasCitas);

// GET /api/admin/dashboard/cita/:citaId - Obtener cita específica
router.get('/dashboard/cita/:citaId', verificarAdmin, adminController.obtenerCitaPorId);

// PUT /api/admin/dashboard/cita/:citaId/aceptar - Aceptar (confirmar) cita
router.put('/dashboard/cita/:citaId/aceptar', verificarAdmin, adminController.aceptarCita);

// PUT /api/admin/dashboard/cita/:citaId/rechazar - Rechazar (cancelar) cita
router.put('/dashboard/cita/:citaId/rechazar', verificarAdmin, adminController.rechazarCita);

// DELETE /api/admin/dashboard/cita/:citaId - Eliminar cita
router.delete('/dashboard/cita/:citaId', verificarAdmin, adminController.eliminarCita);

// GET /api/admin/dashboard/mascota/:mascotaId - Obtener info completa de mascota (para modal)
router.get('/dashboard/mascota/:mascotaId', verificarAdmin, adminController.obtenerInfoMascota);

// ===================================
// RUTAS PARA PEDIDOS (DASHBOARD)
// ===================================

// GET /api/admin/dashboard/pedidos - Obtener todos los pedidos
router.get('/dashboard/pedidos', verificarAdmin, adminController.obtenerTodosPedidos);

// GET /api/admin/dashboard/pedido/:pedidoId - Obtener pedido específico con detalles
router.get('/dashboard/pedido/:pedidoId', verificarAdmin, adminController.obtenerPedidoPorId);

// ===================================
// EXPORTAR RUTAS
// ===================================
module.exports = router;
