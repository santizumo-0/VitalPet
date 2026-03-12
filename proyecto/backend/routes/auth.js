// ===================================
// RUTAS: AUTENTICACIÓN
// ===================================
// Endpoints para registro, login y gestión de usuarios

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/auth');

// ===================================
// RUTAS PÚBLICAS (Sin token)
// ===================================

// POST /api/auth/register - Registrar usuario
router.post('/register', authController.registrar);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// ===================================
// RUTAS PROTEGIDAS (Requieren token)
// ===================================

// GET /api/usuarios/:id - Obtener perfil del usuario
router.get('/:id', verificarToken, authController.obtenerPerfil);

// PUT /api/usuarios/:id - Actualizar perfil del usuario
router.put('/:id', verificarToken, authController.actualizarPerfil);

// DELETE /api/usuarios/:id - Eliminar cuenta del usuario
router.delete('/:id', verificarToken, authController.eliminarCuenta);

// ===================================
// EXPORTAR RUTAS
// ===================================
module.exports = router;
