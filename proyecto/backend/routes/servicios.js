// ===================================
// RUTAS: SERVICIOS
// ===================================
// Endpoints para servicios veterinarios y estética

const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/serviciosController');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/verifyAdmin');
const { uploadProductos } = require('../middleware/upload');

// ===================================
// RUTAS PÚBLICAS
// ===================================

// GET /api/servicios - Obtener todos los servicios
// Query: ?tipo=Veterinaria
router.get('/', serviciosController.obtenerServicios);

// GET /api/servicios/tipos - Obtener tipos de servicios
router.get('/tipos/todos', serviciosController.obtenerTipos);

// GET /api/servicios/:id - Obtener servicio por ID
router.get('/:id', serviciosController.obtenerServicio);

// GET /api/servicios/horarios/disponibles - Obtener horarios disponibles
// Query: ?servicioId=1&fecha=2024-03-15
router.get('/horarios/disponibles', serviciosController.obtenerHorariosDisponibles);

// ===================================
// RUTAS PROTEGIDAS ADMIN - SERVICIOS
// ===================================

// POST /api/servicios - Crear servicio (ADMIN)
// Body: { nombre, tipo, descripcion, precio, duracion_minutos }
// File: imagen (opcional)
router.post('/', verificarAdmin, uploadProductos.single('imagen'), serviciosController.crearServicio);

// PUT /api/servicios/:id - Actualizar servicio (ADMIN)
// Body: { nombre, tipo, descripcion, precio, duracion_minutos }
// File: imagen (opcional)
router.put('/:id', verificarAdmin, uploadProductos.single('imagen'), serviciosController.actualizarServicio);

// DELETE /api/servicios/:id - Eliminar servicio (ADMIN)
router.delete('/:id', verificarAdmin, serviciosController.eliminarServicio);

// ===================================
// EXPORTAR
// ===================================
module.exports = router;
