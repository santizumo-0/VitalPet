// ===================================
// MIDDLEWARE: AUTENTICACIÓN JWT
// ===================================
// Verifica que el usuario tenga un token JWT válido

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
  try {
    // ✓ Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado o formato inválido'
      });
    }

    // ✓ Extraer token (quitar "Bearer ")
    const token = authHeader.substring(7);

    // ✓ Verificar y descodificar token
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    // ✓ Guardar información del usuario en req para usar en controllers
    req.usuario = {
      id: decodificado.id,
      email: decodificado.email
    };

    // ✓ Pasar al siguiente middleware/route
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }

    return res.status(500).json({
      error: 'Error al verificar token',
      detalles: error.message
    });
  }
};

module.exports = verificarToken;
