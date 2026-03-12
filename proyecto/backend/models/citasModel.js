// ===================================
// MODEL: CITAS
// ===================================
// Funciones para acceder a la tabla citas en BD

const pool = require('../config/database');

// ===================================
// 1. CREAR CITA
// ===================================
const crearCita = async (usuarioId, mascotaId, servicioId, fechaCita, horaCita, notas) => {
  try {
    const [resultado] = await pool.query(
      `INSERT INTO citas 
       (usuario_id, mascota_id, servicio_id, fecha_cita, hora_cita, estado, notas, fecha_creacion, fecha_actualizacion) 
       VALUES (?, ?, ?, ?, ?, 'pendiente', ?, NOW(), NOW())`,
      [usuarioId, mascotaId, servicioId, fechaCita, horaCita, notas || null]
    );

    return {
      id: resultado.insertId,
      usuario_id: usuarioId,
      mascota_id: mascotaId,
      servicio_id: servicioId,
      fecha_cita: fechaCita,
      hora_cita: horaCita,
      estado: 'pendiente',
      notas: notas || null,
      mensaje: 'Cita creada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al crear cita:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER CITAS DEL USUARIO
// ===================================
const obtenerMisCitas = async (usuarioId) => {
  try {
    const [citas] = await pool.query(
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
        m.nombre AS mascota_nombre,
        m.raza AS mascota_raza,
        s.nombre AS servicio_nombre
       FROM citas c
       LEFT JOIN mascotas m ON c.mascota_id = m.id
       LEFT JOIN servicios s ON c.servicio_id = s.id
       WHERE c.usuario_id = ?
       ORDER BY c.fecha_cita DESC, c.hora_cita DESC`,
      [usuarioId]
    );

    return citas;
  } catch (error) {
    console.error('❌ Error al obtener citas del usuario:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER CITA POR ID
// ===================================
const obtenerCitaPorId = async (citaId, usuarioId = null) => {
  try {
    let query = `SELECT 
                  c.id, 
                  c.usuario_id, 
                  c.mascota_id, 
                  c.servicio_id, 
                  c.fecha_cita, 
                  c.hora_cita, 
                  c.estado, 
                  c.notas, 
                  c.fecha_creacion,
                  m.nombre AS mascota_nombre,
                  m.raza AS mascota_raza,
                  s.nombre AS servicio_nombre
                 FROM citas c
                 LEFT JOIN mascotas m ON c.mascota_id = m.id
                 LEFT JOIN servicios s ON c.servicio_id = s.id
                 WHERE c.id = ?`;
    let params = [citaId];

    // Si se proporciona usuarioId, verificar que la cita le pertenezca
    if (usuarioId) {
      query += ' AND c.usuario_id = ?';
      params.push(usuarioId);
    }

    const [citas] = await pool.query(query, params);

    if (citas.length === 0) {
      return null;
    }

    return citas[0];
  } catch (error) {
    console.error('❌ Error al obtener cita por ID:', error);
    throw error;
  }
};

// ===================================
// 4. OBTENER HORARIOS DISPONIBLES
// ===================================
const obtenerHorariosDisponibles = async (servicioId, fechaCita) => {
  try {
    // Horas disponibles (08:00 a 17:00) - Formato 24 horas
    const horasDisponibles = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // ✅ VALIDACIÓN CORRECTA: comparar solo fechas sin importar hora/zona horaria
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer a medianoche

    const [fechaYear, fechaMonth, fechaDay] = fechaCita.split('-');
    const fecha = new Date(parseInt(fechaYear), parseInt(fechaMonth) - 1, parseInt(fechaDay));
    fecha.setHours(0, 0, 0, 0);

    if (fecha < hoy) {
      return [];
    }

    // Obtener horas ocupadas para ese servicio y día
    const [citasOcupadas] = await pool.query(
      `SELECT hora_cita FROM citas 
       WHERE servicio_id = ? AND fecha_cita = ? AND estado IN ('pendiente', 'confirmada')`,
      [servicioId, fechaCita]
    );

    const horasOcupadas = citasOcupadas.map(c => c.hora_cita);

    // Retornar horas disponibles (que no estén ocupadas)
    const horasLibres = horasDisponibles.filter(hora => !horasOcupadas.includes(hora));

    return horasLibres;
  } catch (error) {
    console.error('❌ Error al obtener horarios disponibles:', error);
    throw error;
  }
};

// ===================================
// 5. ACTUALIZAR CITA
// ===================================
const actualizarCita = async (citaId, usuarioId, datosActualizacion) => {
  try {
    const { fecha_cita, hora_cita, notas } = datosActualizacion;

    // Obtener cita actual para validar estado
    const citaActual = await obtenerCitaPorId(citaId, usuarioId);
    if (!citaActual) {
      throw new Error('Cita no encontrada');
    }

    // No se puede actualizar si está completada o cancelada
    if (citaActual.estado === 'completada' || citaActual.estado === 'cancelada') {
      throw new Error(`No se puede actualizar una cita ${citaActual.estado}`);
    }

    const [resultado] = await pool.query(
      `UPDATE citas 
       SET fecha_cita = ?, hora_cita = ?, notas = ?, fecha_actualizacion = NOW()
       WHERE id = ? AND usuario_id = ?`,
      [fecha_cita || citaActual.fecha_cita, hora_cita || citaActual.hora_cita, notas || citaActual.notas, citaId, usuarioId]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('No se pudo actualizar la cita');
    }

    return {
      id: citaId,
      mensaje: 'Cita actualizada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al actualizar cita:', error);
    throw error;
  }
};

// ===================================
// 6. CAMBIAR ESTADO DE CITA (Usuario cancela)
// ===================================
const cancelarCita = async (citaId, usuarioId) => {
  try {
    const citaActual = await obtenerCitaPorId(citaId, usuarioId);
    if (!citaActual) {
      throw new Error('Cita no encontrada');
    }

    const [resultado] = await pool.query(
      `UPDATE citas 
       SET estado = 'cancelada', fecha_actualizacion = NOW()
       WHERE id = ? AND usuario_id = ?`,
      [citaId, usuarioId]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('No se pudo cancelar la cita');
    }

    return {
      id: citaId,
      estado: 'cancelada',
      mensaje: 'Cita cancelada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al cancelar cita:', error);
    throw error;
  }
};

// ===================================
// 7. CONFIRMAR CITA (ADMIN)
// ===================================
const confirmarCita = async (citaId) => {
  try {
    const [resultado] = await pool.query(
      `UPDATE citas 
       SET estado = 'confirmada', fecha_actualizacion = NOW()
       WHERE id = ?`,
      [citaId]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('Cita no encontrada');
    }

    return {
      id: citaId,
      estado: 'confirmada',
      mensaje: 'Cita confirmada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al confirmar cita:', error);
    throw error;
  }
};

// ===================================
// 8. COMPLETAR CITA (ADMIN)
// ===================================
const completarCita = async (citaId) => {
  try {
    const [resultado] = await pool.query(
      `UPDATE citas 
       SET estado = 'completada', fecha_actualizacion = NOW()
       WHERE id = ?`,
      [citaId]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('Cita no encontrada');
    }

    return {
      id: citaId,
      estado: 'completada',
      mensaje: 'Cita marcada como completada'
    };
  } catch (error) {
    console.error('❌ Error al completar cita:', error);
    throw error;
  }
};

// ===================================
// 9. OBTENER TODAS LAS CITAS (ADMIN)
// ===================================
const obtenerTodasLasCitas = async (filtros = {}) => {
  try {
    let query = `SELECT 
                  c.id, 
                  c.usuario_id, 
                  c.mascota_id, 
                  c.servicio_id, 
                  c.fecha_cita, 
                  c.hora_cita, 
                  c.estado, 
                  c.notas, 
                  c.fecha_creacion,
                  u.nombre AS usuario_nombre,
                  u.email AS usuario_email,
                  m.nombre AS mascota_nombre,
                  m.raza AS mascota_raza,
                  s.nombre AS servicio_nombre
                 FROM citas c
                 LEFT JOIN usuarios u ON c.usuario_id = u.id
                 LEFT JOIN mascotas m ON c.mascota_id = m.id
                 LEFT JOIN servicios s ON c.servicio_id = s.id
                 WHERE 1=1`;

    const params = [];

    // Filtrar por estado
    if (filtros.estado) {
      query += ' AND c.estado = ?';
      params.push(filtros.estado);
    }

    // Filtrar por fecha
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      query += ' AND c.fecha_cita BETWEEN ? AND ?';
      params.push(filtros.fecha_desde, filtros.fecha_hasta);
    }

    // Filtrar por servicio
    if (filtros.servicio_id) {
      query += ' AND c.servicio_id = ?';
      params.push(filtros.servicio_id);
    }

    query += ' ORDER BY c.fecha_cita DESC, c.hora_cita DESC';

    const [citas] = await pool.query(query, params);
    return citas;
  } catch (error) {
    console.error('❌ Error al obtener todas las citas:', error);
    throw error;
  }
};

// ===================================
// 10. OBTENER ESTADÍSTICAS DE CITAS (ADMIN)
// ===================================
const obtenerEstadisticasCitas = async () => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) AS confirmadas,
        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM citas
    `);

    return stats[0];
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  crearCita,
  obtenerMisCitas,
  obtenerCitaPorId,
  obtenerHorariosDisponibles,
  actualizarCita,
  cancelarCita,
  confirmarCita,
  completarCita,
  obtenerTodasLasCitas,
  obtenerEstadisticasCitas
};
