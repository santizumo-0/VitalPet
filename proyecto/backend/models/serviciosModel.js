// ===================================
// MODEL: SERVICIOS
// ===================================
// Funciones para acceder a la tabla servicios en BD

const pool = require('../config/database');

// ===================================
// 1. OBTENER TODOS LOS SERVICIOS
// ===================================
const obtenerServicios = async (tipo = null) => {
  try {
    let query = 'SELECT id, nombre, tipo, descripcion, precio, duracion_minutos, activo, imagen FROM servicios WHERE activo = true';
    const params = [];

    // Filtrar por tipo si se proporciona
    if (tipo) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY tipo, nombre ASC';

    const [servicios] = await pool.query(query, params);
    return servicios;
  } catch (error) {
    console.error('❌ Error al obtener servicios:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER SERVICIO POR ID
// ===================================
const obtenerServicio = async (id) => {
  try {
    const [servicios] = await pool.query(
      'SELECT id, nombre, tipo, descripcion, precio, duracion_minutos, activo, imagen FROM servicios WHERE id = ?',
      [id]
    );

    if (servicios.length === 0) {
      return null;
    }

    return servicios[0];
  } catch (error) {
    console.error('❌ Error al obtener servicio:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER TIPOS DE SERVICIOS (ÚNICOS)
// ===================================
const obtenerTipos = async () => {
  try {
    const [tipos] = await pool.query(
      'SELECT DISTINCT tipo FROM servicios WHERE activo = true ORDER BY tipo ASC'
    );
    return tipos.map(t => t.tipo);
  } catch (error) {
    console.error('❌ Error al obtener tipos:', error);
    throw error;
  }
};

// ===================================
// 4. CREAR NUEVO SERVICIO (ADMIN)
// ===================================
const crearServicio = async (nombre, tipo, descripcion, precio, duracion_minutos = 30, imagen = null) => {
  try {
    // Validar que no exista otro servicio con el mismo nombre
    const [existente] = await pool.query(
      'SELECT id FROM servicios WHERE nombre = ?',
      [nombre]
    );

    if (existente.length > 0) {
      throw new Error('Ya existe un servicio con este nombre');
    }

    // Validar tipo válido
    const tiposValidos = ['Veterinaria', 'Estética', 'Grooming', 'Consulta', 'Emergencia', 'Otro'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error(`Tipo inválido. Debe ser: ${tiposValidos.join(', ')}`);
    }

    // Insertar en BD
    const [resultado] = await pool.query(
      'INSERT INTO servicios (nombre, tipo, descripcion, precio, duracion_minutos, imagen, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, true, NOW())',
      [nombre, tipo, descripcion, precio, duracion_minutos, imagen]
    );

    return {
      id: resultado.insertId,
      nombre,
      tipo,
      descripcion,
      precio,
      duracion_minutos,
      imagen,
      mensaje: 'Servicio creado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al crear servicio:', error);
    throw error;
  }
};

// ===================================
// 5. ACTUALIZAR SERVICIO (ADMIN)
// ===================================
const actualizarServicio = async (id, nombre, tipo, descripcion, precio, duracion_minutos = 30, imagen = null) => {
  try {
    // Verificar que existe
    const [existente] = await pool.query(
      'SELECT id FROM servicios WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    // Construir query dinámico
    let query = 'UPDATE servicios SET nombre = ?, tipo = ?, descripcion = ?, precio = ?, duracion_minutos = ?';
    const params = [nombre, tipo, descripcion, precio, duracion_minutos];

    if (imagen) {
      query += ', imagen = ?';
      params.push(imagen);
    }

    query += ', fecha_actualizacion = NOW() WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    return {
      id,
      nombre,
      tipo,
      descripcion,
      precio,
      duracion_minutos,
      imagen,
      mensaje: 'Servicio actualizado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al actualizar servicio:', error);
    throw error;
  }
};

// ===================================
// 6. ELIMINAR SERVICIO (ADMIN) - SOFT DELETE
// ===================================
const eliminarServicio = async (id) => {
  try {
    // Verificar que existe
    const [existente] = await pool.query(
      'SELECT id FROM servicios WHERE id = ?',
      [id]
    );

    if (existente.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    // Soft delete - solo marcar como inactivo
    await pool.query(
      'UPDATE servicios SET activo = false, fecha_actualizacion = NOW() WHERE id = ?',
      [id]
    );

    return {
      id,
      mensaje: 'Servicio eliminado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    throw error;
  }
};

// ===================================
// 7. OBTENER HORARIOS DISPONIBLES
// ===================================
const obtenerHorariosDisponibles = async (servicioId, fecha) => {
  try {
    // Obtener duracion del servicio
    const [servicio] = await pool.query(
      'SELECT duracion_minutos FROM servicios WHERE id = ?',
      [servicioId]
    );

    if (servicio.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const duracion = servicio[0].duracion_minutos;
    const horariosDisponibles = [];

    // Horario de atención: 08:00 a 17:00
    const horaInicio = 8;
    const horaFin = 17;

    // Obtener citas ya reservadas para esa fecha
    const [citasReservadas] = await pool.query(
      `SELECT hora_cita FROM citas 
       WHERE servicio_id = ? AND DATE(fecha_cita) = ? AND estado != 'cancelada'`,
      [servicioId, fecha]
    );

    // Generar bloques de tiempo disponibles
    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const hora_formateada = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

        // Verificar si existe una cita en este horario
        const ocupado = citasReservadas.some(cita => cita.hora_cita === hora_formateada);

        if (!ocupado) {
          horariosDisponibles.push(hora_formateada);
        }
      }
    }

    return horariosDisponibles;
  } catch (error) {
    console.error('❌ Error al obtener horarios:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  obtenerServicios,
  obtenerServicio,
  obtenerTipos,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
  obtenerHorariosDisponibles
};
