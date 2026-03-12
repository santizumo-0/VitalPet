// ===================================
// RUTAS: CITAS
// ===================================
// Endpoints para agendamiento de citas

const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/verifyAdmin');

// ===================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================

// GET /api/citas/horarios-disponibles - Obtener horarios disponibles
// Query: ?servicio_id=1&fecha_cita=2027-02-15
router.get('/horarios-disponibles', citasController.obtenerHorariosDisponibles);

// ===================================
// RUTAS PROTEGIDAS (Requieren token)
// ===================================

// POST /api/citas - Crear nueva cita
// Body: { mascota_id, servicio_id, fecha_cita, hora_cita, notas }
router.post('/', verificarToken, citasController.crearCita);

// GET /api/citas - Obtener mis citas
router.get('/', verificarToken, citasController.obtenerMisCitas);

// GET /api/citas/:id - Obtener detalles de una cita
router.get('/:id', verificarToken, citasController.obtenerCita);

// PUT /api/citas/:id - Actualizar mi cita
// Body: { fecha_cita, hora_cita, notas }
router.put('/:id', verificarToken, citasController.actualizarCita);

// DELETE /api/citas/:id - Cancelar cita
router.delete('/:id', verificarToken, citasController.cancelarCita);

// ===================================
// RUTAS PROTEGIDAS ADMIN
// ===================================

// GET /api/admin/citas - Obtener todas las citas (con filtros)
// Query: ?estado=pendiente&fecha_desde=2027-02-01&fecha_hasta=2027-02-28&servicio_id=1
router.get('/admin/todas', verificarAdmin, citasController.obtenerTodasLasCitas);

// GET /api/admin/citas/estadisticas - Obtener estadísticas
router.get('/admin/estadisticas', verificarAdmin, citasController.obtenerEstadisticas);

// PUT /api/admin/citas/:id/confirmar - Confirmar cita
router.put('/admin/:id/confirmar', verificarAdmin, citasController.confirmarCita);

// PUT /api/admin/citas/:id/completar - Marcar cita como completada
router.put('/admin/:id/completar', verificarAdmin, citasController.completarCita);

// ===================================
// EXPORTAR RUTAS
// ===================================
module.exports = router;
