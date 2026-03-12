// ===================================
// MODEL: ADMINISTRADOR
// ===================================
// Funciones para acceder a la tabla administradores en BD

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// ===================================
// 1. CREAR ADMINISTRADOR
// ===================================
const crearAdmin = async (email, contraseña, rol) => {
  try {
    // Validar que la contraseña no sea vacía
    if (!contraseña || contraseña.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar que el rol sea válido
    const rolesValidos = ['veterinario', 'asistente', 'recepcion'];
    if (!rolesValidos.includes(rol)) {
      throw new Error('Rol inválido. Debe ser: veterinario, asistente o recepcion');
    }

    // Hashear la contraseña
    const contraseniaHasheada = await bcrypt.hash(contraseña, 10);

    // Insertar en la BD
    const [resultado] = await pool.query(
      'INSERT INTO administradores (email, contraseña, rol, fecha_creacion, fecha_actualizacion, activo) VALUES (?, ?, ?, NOW(), NOW(), true)',
      [email, contraseniaHasheada, rol]
    );

    return {
      id: resultado.insertId,
      email,
      rol,
      mensaje: 'Administrador creado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al crear administrador:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER ADMIN POR EMAIL (LOGIN)
// ===================================
const obtenerAdminPorEmail = async (email) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, email, contraseña, rol, activo, fecha_creacion FROM administradores WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return null;
    }

    return admins[0];
  } catch (error) {
    console.error('❌ Error al obtener admin por email:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER ADMIN POR ID
// ===================================
const obtenerAdminPorId = async (id) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, email, rol, activo, fecha_creacion, fecha_actualizacion FROM administradores WHERE id = ?',
      [id]
    );

    if (admins.length === 0) {
      return null;
    }

    return admins[0];
  } catch (error) {
    console.error('❌ Error al obtener admin por ID:', error);
    throw error;
  }
};

// ===================================
// 4. VERIFICAR EMAIL (NO DUPLICADO)
// ===================================
const verificarEmail = async (email) => {
  try {
    const [admins] = await pool.query(
      'SELECT id FROM administradores WHERE email = ?',
      [email]
    );

    return admins.length > 0;
  } catch (error) {
    console.error('❌ Error al verificar email:', error);
    throw error;
  }
};

// ===================================
// 5. COMPARAR CONTRASEÑA
// ===================================
const compararContraseña = async (contraseniaIngresada, contraseniaHasheada) => {
  try {
    return await bcrypt.compare(contraseniaIngresada, contraseniaHasheada);
  } catch (error) {
    console.error('❌ Error al comparar contraseña:', error);
    throw error;
  }
};

// ===================================
// ESTADÍSTICAS DEL DASHBOARD
// ===================================
const obtenerEstadisticas = async () => {
  try {
    const [usuarios] = await pool.execute('SELECT COUNT(*) as total FROM usuarios');
    
    // Contar citas de veterinaria pendientes
    const [citasVeterinariaPendientes] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas c 
       JOIN servicios s ON c.servicio_id = s.id 
       WHERE c.estado = 'pendiente' AND s.tipo = 'veterinaria'`
    );
    
    // Contar citas de estética pendientes
    const [citasEsteticaPendientes] = await pool.execute(
      `SELECT COUNT(*) as total FROM citas c 
       JOIN servicios s ON c.servicio_id = s.id 
       WHERE c.estado = 'pendiente' AND s.tipo = 'estetica'`
    );

    return {
      clientesRegistrados: usuarios[0].total,
      citasVeterinariaPendientes: citasVeterinariaPendientes[0].total,
      citasEsteticaPendientes: citasEsteticaPendientes[0].total,
    };
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    throw error;
  }
};

// ===================================
// OBTENER TODAS LAS CITAS CON DATOS COMPLETOS
// ===================================
const obtenerCitas = async (estado = null) => {
  try {
    let query = `
      SELECT 
        c.id,
        c.usuario_id,
        c.mascota_id,
        c.servicio_id,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        c.notas,
        c.fecha_creacion,
        u.nombre as nombre_cliente,
        u.email,
        u.telefono,
        u.direccion,
        m.nombre as mascota_nombre,
        m.raza,
        m.especie,
        m.foto_principal,
        s.nombre as servicio_nombre,
        s.tipo as servicio_tipo
      FROM citas c
      JOIN usuarios u ON c.usuario_id = u.id
      JOIN mascotas m ON c.mascota_id = m.id
      LEFT JOIN servicios s ON c.servicio_id = s.id
    `;

    const params = [];
    if (estado) {
      query += ` WHERE c.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY c.fecha_cita DESC, c.hora_cita DESC`;

    const [citas] = await pool.execute(query, params);
    return citas;
  } catch (error) {
    console.error('❌ Error en obtenerCitas:', error);
    throw error;
  }
};

// ===================================
// OBTENER CITA POR ID
// ===================================
const obtenerCitaById = async (citaId) => {
  try {
    const [cita] = await pool.execute(
      `SELECT 
        c.id,
        c.usuario_id,
        c.mascota_id,
        c.servicio_id,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        c.notas,
        c.fecha_creacion,
        u.nombre as nombre_cliente,
        u.email,
        u.telefono,
        u.direccion,
        m.nombre as mascota_nombre,
        m.raza,
        m.especie,
        m.foto_principal
      FROM citas c
      JOIN usuarios u ON c.usuario_id = u.id
      JOIN mascotas m ON c.mascota_id = m.id
      WHERE c.id = ?`,
      [citaId]
    );

    return cita[0] || null;
  } catch (error) {
    console.error('❌ Error en obtenerCitaById:', error);
    throw error;
  }
};

// ===================================
// ACTUALIZAR ESTADO DE CITA
// ===================================
const actualizarEstadoCita = async (citaId, estado) => {
  try {
    const [result] = await pool.execute(
      'UPDATE citas SET estado = ? WHERE id = ?',
      [estado, citaId]
    );
    return result;
  } catch (error) {
    console.error('❌ Error en actualizarEstadoCita:', error);
    throw error;
  }
};

// ===================================
// ELIMINAR CITA POR ID
// ===================================
const eliminarCitaPorId = async (citaId) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM citas WHERE id = ?',
      [citaId]
    );
    return result;
  } catch (error) {
    console.error('❌ Error al eliminar cita:', error);
    throw error;
  }
};

// ===================================
// OBTENER INFORMACIÓN COMPLETA DE MASCOTA
// ===================================
const obtenerMascotaCompleta = async (mascotaId) => {
  try {
    const [mascota] = await pool.execute(
      `SELECT 
        m.id,
        m.usuario_id,
        m.nombre,
        m.raza,
        m.especie,
        m.sexo,
        m.color,
        m.edad,
        m.peso,
        m.alergias,
        m.enfermedades,
        m.ultima_visita_vet,
        m.foto_principal,
        u.nombre as dueño_nombre,
        u.email as dueño_email,
        u.telefono as dueño_telefono,
        u.direccion as dueño_direccion
      FROM mascotas m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.id = ?`,
      [mascotaId]
    );

    return mascota[0] || null;
  } catch (error) {
    console.error('❌ Error en obtenerMascotaCompleta:', error);
    throw error;
  }
};

// ===================================
// OBTENER FOTOS GALERÍA DE MASCOTA
// ===================================
const obtenerGaleriaMascota = async (mascotaId) => {
  try {
    const [fotos] = await pool.execute(
      'SELECT id, ruta_imagen, fecha_subida FROM galeria_mascotas WHERE mascota_id = ?',
      [mascotaId]
    );
    return fotos;
  } catch (error) {
    console.error('❌ Error en obtenerGaleriaMascota:', error);
    throw error;
  }
};

// ===================================
// OBTENER TODOS LOS PEDIDOS
// ===================================
const obtenerPedidos = async (estado = null) => {
  try {
    let query = `
      SELECT 
        p.id,
        p.usuario_id,
        p.email,
        p.telefono,
        p.estado,
        p.metodo_pago,
        p.direccion_calle,
        p.direccion_numero,
        p.direccion_apartamento,
        p.direccion_codigo_postal,
        p.direccion_ciudad,
        p.direccion_departamento,
        p.subtotal,
        p.envio,
        p.total,
        p.fecha_creacion,
        u.nombre as nombre_cliente
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
    `;

    const params = [];
    if (estado) {
      query += ` WHERE p.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY p.fecha_creacion DESC`;

    const [pedidos] = await pool.execute(query, params);
    return pedidos;
  } catch (error) {
    console.error('❌ Error en obtenerPedidos:', error);
    throw error;
  }
};

// ===================================
// OBTENER PEDIDO POR ID CON DETALLES
// ===================================
const obtenerPedidoById = async (pedidoId) => {
  try {
    const [pedido] = await pool.execute(
      `SELECT 
        p.id,
        p.usuario_id,
        p.email,
        p.telefono,
        p.estado,
        p.metodo_pago,
        p.direccion_calle,
        p.direccion_numero,
        p.direccion_apartamento,
        p.direccion_codigo_postal,
        p.direccion_ciudad,
        p.direccion_departamento,
        p.subtotal,
        p.envio,
        p.total,
        p.fecha_creacion,
        u.nombre as nombre_cliente
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = ?`,
      [pedidoId]
    );

    if (pedido.length === 0) return null;

    // Obtener detalles del pedido
    const [detalles] = await pool.execute(
      `SELECT 
        dp.id,
        dp.cantidad,
        dp.precio_unitario,
        dp.subtotal,
        pr.nombre as producto_nombre,
        pr.descripcion,
        pr.imagen,
        pr.categoria_id
      FROM detalles_pedidos dp
      LEFT JOIN productos pr ON dp.producto_id = pr.id
      WHERE dp.pedido_id = ?`,
      [pedidoId]
    );

    return {
      ...pedido[0],
      detalles: detalles
    };
  } catch (error) {
    console.error('❌ Error en obtenerPedidoById:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  crearAdmin,
  obtenerAdminPorEmail,
  obtenerAdminPorId,
  verificarEmail,
  compararContraseña,
  obtenerEstadisticas,
  obtenerCitas,
  obtenerCitaById,
  actualizarEstadoCita,
  eliminarCitaPorId,
  obtenerMascotaCompleta,
  obtenerGaleriaMascota,
  obtenerPedidos,
  obtenerPedidoById
};
