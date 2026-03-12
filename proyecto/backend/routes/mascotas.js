const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const verificarToken = require('../middleware/auth');
const { uploadMascotas } = require('../middleware/upload');

// Todas las rutas de mascota requieren autenticación
router.use(verificarToken);

// ============================================
// RUTAS PARA MASCOTAS
// ============================================

// Crear una nueva mascota
// POST /api/mascotas
// Body: { nombre, raza, especie, sexo, color, edad_valor, edad_unidad, peso_valor, peso_unidad, ... }
router.post('/', uploadMascotas.any(), mascotaController.crearMascota);

// Obtener todas las mascotas del usuario autenticado
// GET /api/mascotas
router.get('/', mascotaController.obtenerMascotas);

// Obtener una mascota específica con todos sus datos
// GET /api/mascotas/:mascotaId
router.get('/:mascotaId', mascotaController.obtenerMascota);

// Actualizar mascota
// PUT /api/mascotas/:mascotaId
router.put('/:mascotaId', uploadMascotas.any(), mascotaController.actualizarMascota);

// Eliminar mascota
// DELETE /api/mascotas/:mascotaId
router.delete('/:mascotaId', mascotaController.eliminarMascota);

// ============================================
// RUTAS PARA GALERÍA
// ============================================

// Agregar fotos a galería
// POST /api/mascotas/:mascotaId/galeria
// Body: form-data con field 'fotos' (múltiples archivos)
router.post('/:mascotaId/galeria', uploadMascotas.any(), mascotaController.agregarFotoGaleria);

// Obtener galería de una mascota
// GET /api/mascotas/:mascotaId/galeria
router.get('/:mascotaId/galeria', mascotaController.obtenerGaleria);

// Eliminar foto de galería
// DELETE /api/mascotas/:mascotaId/galeria/:fotoId
router.delete('/:mascotaId/galeria/:fotoId', mascotaController.eliminarFoto);

// ============================================
// RUTAS PARA VACUNAS
// ============================================

// Crear vacuna
// POST /api/mascotas/:mascotaId/vacunas
// Body: { nombre_vacuna, fecha_aplicacion }
router.post('/:mascotaId/vacunas', mascotaController.crearVacuna);

// Obtener vacunas de una mascota
// GET /api/mascotas/:mascotaId/vacunas
router.get('/:mascotaId/vacunas', mascotaController.obtenerVacunas);

module.exports = router;

