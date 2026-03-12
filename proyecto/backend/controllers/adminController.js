// ===================================
// CONTROLLER: ADMINISTRACIÓN
// ===================================
// Lógica para panel administrativo

const pool = require('../config/database');
const adminModel = require('../models/adminModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// ===================================
// GENERAR JWT TOKEN PARA ADMIN
// ===================================
const generarTokenAdmin = (id, email) => {
  return jwt.sign(
    { 
      id, 
      email, 
      rol: 'admin'  // Marcar que es admin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ===================================
// 1. LOGIN ADMINISTRADOR
// ===================================
const loginAdmin = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    // ✓ Validar que email y contraseña estén presentes
    if (!email || !contraseña) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // ✓ Buscar admin por email
    const admin = await adminModel.obtenerAdminPorEmail(email);
    if (!admin) {
      return res.status(401).json({
        error: 'Email de administrador no encontrado'
      });
    }

    // ✓ Verificar si está activo
    if (!admin.activo) {
      return res.status(403).json({
        error: 'La cuenta de administrador ha sido desactivada'
      });
    }

    // ✓ Comparar contraseña
    const contraseñaValida = await adminModel.compararContraseña(
      contraseña,
      admin.contraseña
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      });
    }

    // ✓ Generar token con rol admin
    const token = generarTokenAdmin(admin.id, admin.email);

    // ✓ Respuesta exitosa
    return res.status(200).json({
      mensaje: 'Login administrativo exitoso',
      admin: {
        id: admin.id,
        email: admin.email,
        rol: admin.rol
      },
      token
    });

  } catch (error) {
    console.error('❌ Error en login admin:', error);
    return res.status(500).json({
      error: 'Error al iniciar sesión',
      detalles: error.message
    });
  }
};

// ===================================
// 2. LISTAR TODOS LOS USUARIOS
// ===================================
const listarUsuarios = async (req, res) => {
  try {
    // ✓ Obtener todos los usuarios (SIN mostrar contraseñas)
    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, telefono, activo, fecha_creacion, fecha_actualizacion FROM usuarios ORDER BY fecha_creacion DESC'
    );

    return res.status(200).json({
      total: usuarios.length,
      usuarios
    });

  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
    return res.status(500).json({
      error: 'Error al listar usuarios',
      detalles: error.message
    });
  }
};

// ===================================
// 3. OBTENER DATOS DE UN USUARIO
// ===================================
const obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // ✓ Validar que ID sea número
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'ID de usuario inválido'
      });
    }

    // ✓ Obtener usuario
    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, telefono, activo, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      usuario: usuarios[0]
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return res.status(500).json({
      error: 'Error al obtener usuario',
      detalles: error.message
    });
  }
};

// ===================================
// 4. LISTAR TODAS LAS MASCOTAS
// ===================================
const listarMascotas = async (req, res) => {
  try {
    // ✓ Obtener todas las mascotas
    const [mascotas] = await pool.query(
      'SELECT m.id, m.nombre, m.especie, m.raza, m.edad, m.usuario_id, u.nombre AS propietario FROM mascotas m LEFT JOIN usuarios u ON m.usuario_id = u.id ORDER BY m.fecha_creacion DESC'
    );

    return res.status(200).json({
      total: mascotas.length,
      mascotas
    });

  } catch (error) {
    console.error('❌ Error al listar mascotas:', error);
    return res.status(500).json({
      error: 'Error al listar mascotas',
      detalles: error.message
    });
  }
};

// ===================================
// 5. LISTAR TODAS LAS CITAS
// ===================================
const listarCitas = async (req, res) => {
  try {
    // ✓ Obtener todas las citas
    const [citas] = await pool.query(
      'SELECT c.id, c.fecha_cita, c.hora_cita, c.estado, c.usuario_id, c.mascota_id, u.nombre AS usuario, m.nombre AS mascota FROM citas c LEFT JOIN usuarios u ON c.usuario_id = u.id LEFT JOIN mascotas m ON c.mascota_id = m.id ORDER BY c.fecha_cita DESC'
    );

    return res.status(200).json({
      total: citas.length,
      citas
    });

  } catch (error) {
    console.error('❌ Error al listar citas:', error);
    return res.status(500).json({
      error: 'Error al listar citas',
      detalles: error.message
    });
  }
};

// ===================================
// 6. LISTAR TODOS LOS PEDIDOS
// ===================================
const listarPedidos = async (req, res) => {
  try {
    // ✓ Obtener todos los pedidos
    const [pedidos] = await pool.query(
      'SELECT p.id, p.fecha_creacion, p.estado, p.total, p.usuario_id, u.nombre AS usuario FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.fecha_creacion DESC'
    );

    return res.status(200).json({
      total: pedidos.length,
      pedidos
    });

  } catch (error) {
    console.error('❌ Error al listar pedidos:', error);
    return res.status(500).json({
      error: 'Error al listar pedidos',
      detalles: error.message
    });
  }
};

// ===================================
// 7. OBTENER ESTADÍSTICAS
// ===================================
const obtenerEstadisticas = async (req, res) => {
  try {
    // ✓ Contar usuarios
    const [countUsuarios] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    
    // ✓ Contar mascotas
    const [countMascotas] = await pool.query('SELECT COUNT(*) as total FROM mascotas');
    
    // ✓ Contar citas
    const [countCitas] = await pool.query('SELECT COUNT(*) as total FROM citas');
    
    // ✓ Contar pedidos
    const [countPedidos] = await pool.query('SELECT COUNT(*) as total FROM pedidos');
    
    // ✓ Obtener ingresos totales
    const [ingresos] = await pool.query('SELECT SUM(total) as total_ingresos FROM pedidos WHERE estado = "completado"');

    return res.status(200).json({
      estadisticas: {
        total_usuarios: countUsuarios[0].total,
        total_mascotas: countMascotas[0].total,
        total_citas: countCitas[0].total,
        total_pedidos: countPedidos[0].total,
        total_ingresos: ingresos[0].total_ingresos || 0
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// ===================================
const obtenerDashboardEstadisticas = async (req, res) => {
  try {
    const estadisticas = await adminModel.obtenerEstadisticas();
    
    return res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del dashboard:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER TODAS LAS CITAS
// ===================================
const obtenerTodasCitas = async (req, res) => {
  try {
    const { estado } = req.query;
    const citas = await adminModel.obtenerCitas(estado);
    
    // Convertir rutas de fotos a URLs completas
    const citasConURLs = citas.map(cita => {
      if (cita.foto_principal && !cita.foto_principal.startsWith('http')) {
        cita.foto_principal = `http://localhost:5000/${cita.foto_principal}`;
      }
      return cita;
    });

    return res.status(200).json({
      success: true,
      data: citasConURLs
    });
  } catch (error) {
    console.error('❌ Error al obtener citas:', error);
    return res.status(500).json({
      error: 'Error al obtener citas',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER CITA POR ID
// ===================================
const obtenerCitaPorId = async (req, res) => {
  try {
    const { citaId } = req.params;
    const cita = await adminModel.obtenerCitaById(citaId);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    // Convertir ruta de foto a URL completa
    if (cita.foto_principal && !cita.foto_principal.startsWith('http')) {
      cita.foto_principal = `http://localhost:5000/${cita.foto_principal}`;
    }

    return res.status(200).json({
      success: true,
      data: cita
    });
  } catch (error) {
    console.error('❌ Error al obtener cita:', error);
    return res.status(500).json({
      error: 'Error al obtener cita',
      detalles: error.message
    });
  }
};

// ===================================
// ACEPTAR CITA (cambiar a confirmada)
// ===================================
const aceptarCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    
    await adminModel.actualizarEstadoCita(citaId, 'confirmada');

    return res.status(200).json({
      success: true,
      mensaje: 'Cita confirmada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al aceptar cita:', error);
    return res.status(500).json({
      error: 'Error al confirmar cita',
      detalles: error.message
    });
  }
};

// ===================================
// RECHAZAR CITA (cambiar a cancelada)
// ===================================
const rechazarCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    
    await adminModel.actualizarEstadoCita(citaId, 'cancelada');

    return res.status(200).json({
      success: true,
      mensaje: 'Cita rechazada'
    });
  } catch (error) {
    console.error('❌ Error al rechazar cita:', error);
    return res.status(500).json({
      error: 'Error al rechazar cita',
      detalles: error.message
    });
  }
};

// ===================================
// ELIMINAR CITA
// ===================================
const eliminarCita = async (req, res) => {
  try {
    const { citaId } = req.params;
    console.log('🗑️ Eliminando cita ID:', citaId, 'por usuario:', req.usuario?.email);
    
    await adminModel.eliminarCitaPorId(citaId);

    console.log('✅ Cita eliminada exitosamente');
    return res.status(200).json({
      success: true,
      mensaje: 'Cita eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar cita:', error);
    return res.status(500).json({
      error: 'Error al eliminar cita',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER INFORMACIÓN DE MASCOTA (para modal)
// ===================================
const obtenerInfoMascota = async (req, res) => {
  try {
    const { mascotaId } = req.params;
    
    const mascota = await adminModel.obtenerMascotaCompleta(mascotaId);
    
    if (!mascota) {
      return res.status(404).json({
        error: 'Mascota no encontrada'
      });
    }

    // Convertir ruta de foto a URL completa
    if (mascota.foto_principal && !mascota.foto_principal.startsWith('http')) {
      mascota.foto_principal = `http://localhost:5000/${mascota.foto_principal}`;
    }

    // Obtener galería de fotos
    const fotos = await adminModel.obtenerGaleriaMascota(mascotaId);
    const fotosConURLs = fotos.map(foto => {
      if (foto.ruta_imagen && !foto.ruta_imagen.startsWith('http')) {
        foto.ruta_imagen = `http://localhost:5000/${foto.ruta_imagen}`;
      }
      return foto;
    });

    mascota.galeria = fotosConURLs;

    return res.status(200).json({
      success: true,
      data: mascota
    });
  } catch (error) {
    console.error('❌ Error al obtener información de mascota:', error);
    return res.status(500).json({
      error: 'Error al obtener información de mascota',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER TODOS LOS PEDIDOS
// ===================================
const obtenerTodosPedidos = async (req, res) => {
  try {
    const { estado } = req.query;
    const pedidos = await adminModel.obtenerPedidos(estado);

    return res.status(200).json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    return res.status(500).json({
      error: 'Error al obtener pedidos',
      detalles: error.message
    });
  }
};

// ===================================
// OBTENER PEDIDO POR ID CON DETALLES
// ===================================
const obtenerPedidoPorId = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const pedido = await adminModel.obtenerPedidoById(pedidoId);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: pedido
    });
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    return res.status(500).json({
      error: 'Error al obtener pedido',
      detalles: error.message
    });
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  loginAdmin,
  listarUsuarios,
  obtenerUsuario,
  listarMascotas,
  listarCitas,
  listarPedidos,
  obtenerEstadisticas,
  obtenerDashboardEstadisticas,
  obtenerTodasCitas,
  obtenerCitaPorId,
  aceptarCita,
  rechazarCita,
  eliminarCita,
  obtenerInfoMascota,
  obtenerTodosPedidos,
  obtenerPedidoPorId
};
