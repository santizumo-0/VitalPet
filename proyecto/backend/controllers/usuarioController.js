// ===================================
// CONTROLLER: USUARIOS
// ===================================
// Controladores para gestión de perfil de usuario

const usuarioModel = require('../models/usuarioModel');

// ===================================
// 1. OBTENER PERFIL DEL USUARIO AUTENTICADO
// ===================================
exports.obtenerPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener datos del usuario
    const usuario = await usuarioModel.obtenerUsuarioPorId(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      mensaje: 'Perfil obtenido exitosamente',
      usuario: usuario
    });
  } catch (error) {
    console.error('❌ Error en obtenerPerfil:', error);
    return res.status(500).json({
      error: error.message
    });
  }
};

// ===================================
// 2. ACTUALIZAR PERFIL DEL USUARIO
// ===================================
exports.actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { nombre, email, telefono } = req.body;

    // ✓ Validar que al menos un campo se va a actualizar
    if (!nombre && !email && !telefono) {
      return res.status(400).json({
        error: 'Debes proporcionar al menos un campo para actualizar (nombre, email o telefono)'
      });
    }

    // ✓ Si el usuario intenta cambiar email, verificar que no exista
    if (email) {
      const usuarioActual = await usuarioModel.obtenerUsuarioPorId(usuarioId);
      if (email !== usuarioActual.email) {
        // Email es diferente, verificar que no exista
        const emailExiste = await usuarioModel.verificarEmail(email);
        if (emailExiste) {
          return res.status(409).json({
            error: 'El email ya está registrado'
          });
        }
      }
    }

    // ✓ Actualizar usuario
    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (email) datosActualizar.email = email;
    if (telefono) datosActualizar.telefono = telefono;

    const resultado = await usuarioModel.actualizarUsuario(usuarioId, datosActualizar);

    // ✓ Obtener datos actualizados para retornar
    const usuarioActualizado = await usuarioModel.obtenerUsuarioPorId(usuarioId);

    return res.status(200).json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('❌ Error en actualizarPerfil:', error);
    return res.status(500).json({
      error: error.message
    });
  }
};

// ===================================
// 3. CAMBIAR CONTRASEÑA DEL USUARIO
// ===================================
exports.cambiarContraseña = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { contrasenaActual, contrasenaNueva, confirmacion } = req.body;

    // ✓ Validar campos requeridos
    if (!contrasenaActual || !contrasenaNueva || !confirmacion) {
      return res.status(400).json({
        error: 'Faltan campos: contrasenaActual, contrasenaNueva, confirmacion'
      });
    }

    // ✓ Validar que la contraseña nueva cumple requisitos
    if (contrasenaNueva.length < 6) {
      return res.status(400).json({
        error: 'La contraseña nueva debe tener al menos 6 caracteres'
      });
    }

    // ✓ Validar que las dos contrasenias nuevas coinciden
    if (contrasenaNueva !== confirmacion) {
      return res.status(400).json({
        error: 'Las contraseñas nuevas no coinciden'
      });
    }

    // ✓ Obtener usuario actual con contraseña hasheada
    const usuario = await usuarioModel.obtenerUsuarioPorEmail(req.usuario.email);
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // ✓ Verificar que la contraseña actual sea correcta
    const contrasenaCorrecta = await usuarioModel.compararContraseña(
      contrasenaActual,
      usuario.contraseña
    );

    if (!contrasenaCorrecta) {
      return res.status(401).json({
        error: 'La contraseña actual es incorrecta'
      });
    }

    // ✓ Actualizar contraseña
    await usuarioModel.actualizarUsuario(usuarioId, {
      contraseña: contrasenaNueva
    });

    return res.status(200).json({
      mensaje: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en cambiarContraseña:', error);
    return res.status(500).json({
      error: error.message
    });
  }
};

// ===================================
// 4. ELIMINAR CUENTA DEL USUARIO
// ===================================
exports.eliminarCuenta = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { confirmacion } = req.body;

    // ✓ Pedir confirmación (palabra clave o checkbox)
    if (confirmacion !== 'ELIMINAR_CUENTA') {
      return res.status(400).json({
        error: 'Debes confirmar escribiendo "ELIMINAR_CUENTA" para proceder'
      });
    }

    // ✓ Eliminar usuario
    const resultado = await usuarioModel.eliminarUsuario(usuarioId);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      mensaje: 'Cuenta eliminada exitosamente',
      warning: 'Todos tus datos han sido eliminados de forma permanente'
    });
  } catch (error) {
    console.error('❌ Error en eliminarCuenta:', error);
    return res.status(500).json({
      error: error.message
    });
  }
};

// ===================================
// 5. VERIFICAR SI EMAIL EXISTE (Público)
// ===================================
exports.verificarEmail = async (req, res) => {
  try {
    const { email } = req.query;

    // ✓ Validar que email fue proporcionado
    if (!email) {
      return res.status(400).json({
        error: 'Parámetro requerido: email'
      });
    }

    // ✓ Verificar email
    const existe = await usuarioModel.verificarEmail(email);

    return res.status(200).json({
      email: email,
      existe: existe,
      disponible: !existe
    });
  } catch (error) {
    console.error('❌ Error en verificarEmail:', error);
    return res.status(500).json({
      error: error.message
    });
  }
};
