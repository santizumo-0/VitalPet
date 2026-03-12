// ===================================
// RUTAS: USUARIOS
// ===================================
// Endpoints para gestión de perfil de usuario

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middleware/auth');

// ===================================
// RUTAS PÚBLICAS
// ===================================

// GET /api/usuarios/verificar-email?email=usuario@mail.com
// Verifica si un email está disponible (para registro)
router.get('/verificar-email', usuarioController.verificarEmail);

// ===================================
// RUTAS PROTEGIDAS (requieren token)
// ===================================

// GET /api/usuarios/perfil
// Obtener datos del perfil del usuario autenticado
router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);

// PUT /api/usuarios/perfil
// Actualizar nombre, email, teléfono del usuario
// Body: { nombre?, email?, telefono? }
router.put('/perfil', verificarToken, usuarioController.actualizarPerfil);

// PUT /api/usuarios/password
// Cambiar contraseña del usuario
// Body: { contrasenaActual, contrasenaNueva, confirmacion }
router.put('/password', verificarToken, usuarioController.cambiarContraseña);

// DELETE /api/usuarios/cuenta
// Eliminar cuenta (requiere confirmación)
// Body: { confirmacion: "ELIMINAR_CUENTA" }
router.delete('/cuenta', verificarToken, usuarioController.eliminarCuenta);

// ===================================
// EXPORTAR
// ===================================
module.exports = router;
