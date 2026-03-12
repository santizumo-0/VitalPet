// ===================================
// MIDDLEWARE: VERIFICAR ADMIN
// ===================================
// Verifica que el usuario sea un administrador válido

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarAdmin = (req, res, next) => {
  try {
    // ✓ Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('⚠️ Token no proporcionado o formato inválido. Header:', authHeader?.substring(0, 20));
      return res.status(401).json({
        error: 'Token no proporcionado o formato inválido'
      });
    }

    // ✓ Extraer token
    const token = authHeader.substring(7);

    // ✓ Verificar y descodificar token
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    // ✓ Verificar que sea admin (rol debe estar en token)
    if (decodificado.rol !== 'admin') {
      console.log('⚠️ Rol no es admin:', decodificado.rol);
      return res.status(403).json({
        error: 'Acceso denegado. Solo administradores pueden acceder'
      });
    }

    // ✓ Guardar información en req
    req.usuario = {
      id: decodificado.id,
      email: decodificado.email,
      rol: decodificado.rol
    };

    console.log('✓ Admin verificado:', req.usuario.email, 'para', req.method, req.path);

    // ✓ Pasar al siguiente middleware
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

module.exports = verificarAdmin;
