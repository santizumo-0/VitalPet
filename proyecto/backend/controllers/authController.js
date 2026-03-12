// ===================================
// CONTROLLER: AUTENTICACIÓN
// ===================================
// Lógica de negocio para registro, login y gestión de usuarios

const usuarioModel = require('../models/usuarioModel');
const pedidosModel = require('../models/pedidosModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ===================================
// GENERAR JWT TOKEN
// ===================================
const generarToken = (id, email) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ===================================
// 1. REGISTRAR USUARIO
// ===================================
const registrar = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    // ✓ Validar que todos los campos estén presentes
    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos',
        campos_faltantes: { nombre, email, telefono, password }
      });
    }

    // ✓ Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // ✓ Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // ✓ Verificar si el email ya existe
    const emailExiste = await usuarioModel.verificarEmail(email);
    if (emailExiste) {
      return res.status(409).json({
        error: 'El email ya está registrado'
      });
    }

    // ✓ Crear usuario en BD (modelo hashea la contraseña)
    const nuevoUsuario = await usuarioModel.crearUsuario(
      nombre,
      email,
      telefono,
      password
    );

    // ✓ Asociar compras antiguas (hechas como visitante) con esta nueva cuenta
    const comprasAsociadas = await pedidosModel.asociarComprasAntiguasPorEmail(nuevoUsuario.id, email);
    if (comprasAsociadas > 0) {
      console.log(`✓ ${comprasAsociadas} compra(s) antiguas asociada(s) al nuevo usuario ${nuevoUsuario.id}`);
    }

    // ✓ Generar JWT token
    const token = generarToken(nuevoUsuario.id, email);

    // ✓ Respuesta exitosa
    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        telefono: nuevoUsuario.telefono
      },
      token
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    return res.status(500).json({
      error: 'Error al registrar usuario',
      detalles: error.message
    });
  }
};

// ===================================
// 2. LOGIN USUARIO
// ===================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✓ Validar que email y contraseña estén presentes
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // ✓ Buscar usuario por email
    const usuario = await usuarioModel.obtenerUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({
        error: 'Email no registrado'
      });
    }

    // ✓ Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'La cuenta ha sido desactivada'
      });
    }

    // ✓ Comparar contraseña ingresada con la hasheada en BD
    const contraseñaValida = await usuarioModel.compararContraseña(
      password,
      usuario.contraseña
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      });
    }

    // ✓ Asociar compras antiguas (hechas como visitante) con esta cuenta
    const comprasAsociadas = await pedidosModel.asociarComprasAntiguasPorEmail(usuario.id, usuario.email);
    if (comprasAsociadas > 0) {
      console.log(`✓ ${comprasAsociadas} compra(s) antiguas asociada(s) al usuario ${usuario.id}`);
    }

    // ✓ Generar JWT token
    const token = generarToken(usuario.id, usuario.email);

    // ✓ Respuesta exitosa
    return res.status(200).json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono
      },
      token
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({
      error: 'Error al iniciar sesión',
      detalles: error.message
    });
  }
};

// ===================================
// 3. OBTENER PERFIL (PROTEGIDO)
// ===================================
const obtenerPerfil = async (req, res) => {
  try {
    // El middleware de autenticación ya verificó el JWT
    // y guardó el ID en req.usuario.id
    const id = req.usuario.id;

    // ✓ Obtener usuario de la BD
    const usuario = await usuarioModel.obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // ✓ Respuesta exitosa
    return res.status(200).json({
      mensaje: 'Perfil obtenido',
      usuario
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    return res.status(500).json({
      error: 'Error al obtener perfil',
      detalles: error.message
    });
  }
};

// ===================================
// 4. ACTUALIZAR PERFIL (PROTEGIDO)
// ===================================
const actualizarPerfil = async (req, res) => {
  try {
    const id = req.usuario.id;
    const { nombre, email, telefono, contraseña } = req.body;

    // ✓ Validar que haya al menos un campo para actualizar
    if (!nombre && !email && !telefono && !contraseña) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    // ✓ Si actualiza email, verificar que no esté fuera de uso
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Email inválido'
        });
      }

      // Verificar si el nuevo email ya está en uso (pero no por este usuario)
      const emailExiste = await usuarioModel.verificarEmail(email);
      if (emailExiste) {
        const usuarioActual = await usuarioModel.obtenerUsuarioPorId(id);
        if (usuarioActual.email !== email) {
          return res.status(409).json({
            error: 'El email ya está en uso'
          });
        }
      }
    }

    // ✓ Si actualiza contraseña, validar
    if (contraseña && contraseña.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // ✓ Actualizar usuario
    const datosActualizar = {};
    if (nombre) datosActualizar.nombre = nombre;
    if (email) datosActualizar.email = email;
    if (telefono) datosActualizar.telefono = telefono;
    if (contraseña) datosActualizar.contraseña = contraseña;

    const resultado = await usuarioModel.actualizarUsuario(id, datosActualizar);

    // ✓ Respuesta exitosa
    return res.status(200).json({
      mensaje: 'Perfil actualizado exitosamente',
      resultado
    });

  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    return res.status(500).json({
      error: 'Error al actualizar perfil',
      detalles: error.message
    });
  }
};

// ===================================
// 5. ELIMINAR CUENTA (PROTEGIDO)
// ===================================
const eliminarCuenta = async (req, res) => {
  try {
    const id = req.usuario.id;
    const { contraseña } = req.body;

    // ✓ Pedir confirmación con contraseña
    if (!contraseña) {
      return res.status(400).json({
        error: 'Debe proporcionar su contraseña para eliminar la cuenta'
      });
    }

    // ✓ Obtener usuario actual
    const usuario = await usuarioModel.obtenerUsuarioPorId(id);
    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // ✓ Verificar contraseña
    const usuarioCompleto = await usuarioModel.obtenerUsuarioPorEmail(usuario.email);
    const contraseñaValida = await usuarioModel.compararContraseña(
      contraseña,
      usuarioCompleto.contraseña
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Contraseña incorrecta. No se puede eliminar la cuenta'
      });
    }

    // ✓ Eliminar usuario
    const resultado = await usuarioModel.eliminarUsuario(id);

    // ✓ Respuesta exitosa
    return res.status(200).json({
      mensaje: 'Cuenta eliminada exitosamente',
      resultado
    });

  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    return res.status(500).json({
      error: 'Error al eliminar cuenta',
      detalles: error.message
    });
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  eliminarCuenta
};
