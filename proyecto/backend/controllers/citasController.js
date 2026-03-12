// ===================================
// CONTROLLER: CITAS
// ===================================
// Lógica de negocio para citas veterinarias y estética

const citasModel = require('../models/citasModel');
const mascotaModel = require('../models/mascotaModel');
const pool = require('../config/database');

// ===================================
// 1. CREAR CITA
// ===================================
const crearCita = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { mascota_id, servicio_id, fecha_cita, hora_cita, notas } = req.body;

    // ✓ Validar que todos los campos requeridos estén presentes
    if (!mascota_id || !servicio_id || !fecha_cita || !hora_cita) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: mascota_id, servicio_id, fecha_cita, hora_cita'
      });
    }

    // ✓ Validar que la mascota existe y pertenece al usuario
    const mascota = await mascotaModel.obtenerMascotaPorId(mascota_id, usuarioId);
    if (!mascota) {
      return res.status(404).json({
        error: 'Mascota no encontrada o no pertenece a este usuario'
      });
    }

    // ✓ Validar que el servicio existe
    const [servicios] = await pool.query(
      'SELECT id FROM servicios WHERE id = ?',
      [servicio_id]
    );
    if (servicios.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado'
      });
    }

    // ✓ Validar que la fecha es en el futuro
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha_cita);
    if (fechaSeleccionada < hoy) {
      return res.status(400).json({
        error: 'No se puede agendar cita en fecha pasada'
      });
    }

    // ✓ Validar que la hora tiene formato correcto (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(hora_cita)) {
      return res.status(400).json({
        error: 'Formato de hora inválido. Use HH:MM'
      });
    }

    // ✓ Validar que la hora esté en rango permitido (08:00 - 18:00)
    const [horas, minutos] = hora_cita.split(':').map(Number);
    if (horas < 8 || horas >= 18) {
      return res.status(400).json({
        error: 'Las citas solo se pueden agendar entre 08:00 y 18:00'
      });
    }

    // ✓ Verificar que no haya otra cita en el mismo horario
    const horariosDisponibles = await citasModel.obtenerHorariosDisponibles(servicio_id, fecha_cita);
    if (!horariosDisponibles.includes(hora_cita)) {
      return res.status(409).json({
        error: 'Este horario no está disponible. Seleccione otro horario',
        horariosDisponibles: horariosDisponibles
      });
    }

    // ✓ Crear la cita
    const citaCreada = await citasModel.crearCita(
      usuarioId,
      mascota_id,
      servicio_id,
      fecha_cita,
      hora_cita,
      notas
    );

    return res.status(201).json({
      mensaje: 'Cita agendada exitosamente',
      cita: citaCreada
    });

  } catch (error) {
    console.error('❌ Error en crearCita:', error);
    return res.status(500).json({
      error: 'Error al crear cita',
      detalles: error.message
    });
  }
};

// ===================================
// 2. OBTENER MIS CITAS
// ===================================
const obtenerMisCitas = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const citas = await citasModel.obtenerMisCitas(usuarioId);

    return res.status(200).json({
      total: citas.length,
      citas: citas
    });

  } catch (error) {
    console.error('❌ Error en obtenerMisCitas:', error);
    return res.status(500).json({
      error: 'Error al obtener citas',
      detalles: error.message
    });
  }
};

// ===================================
// 3. OBTENER CITA POR ID
// ===================================
const obtenerCita = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const cita = await citasModel.obtenerCitaPorId(id, usuarioId);

    if (!cita) {
      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    return res.status(200).json({
      cita: cita
    });

  } catch (error) {
    console.error('❌ Error en obtenerCita:', error);
    return res.status(500).json({
      error: 'Error al obtener cita',
      detalles: error.message
    });
  }
};

// ===================================
// 4. OBTENER HORARIOS DISPONIBLES
// ===================================
const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { servicio_id, fecha_cita } = req.query;

    // ✓ Validar parámetros
    if (!servicio_id || !fecha_cita) {
      return res.status(400).json({
        error: 'Parámetros requeridos: servicio_id, fecha_cita'
      });
    }

    // ✓ Validar que el servicio existe
    const [servicios] = await pool.query(
      'SELECT id FROM servicios WHERE id = ?',
      [servicio_id]
    );
    if (servicios.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado'
      });
    }

    const horariosDisponibles = await citasModel.obtenerHorariosDisponibles(servicio_id, fecha_cita);

    return res.status(200).json({
      servicio_id: servicio_id,
      fecha_cita: fecha_cita,
      horarios_disponibles: horariosDisponibles,
      total: horariosDisponibles.length
    });

  } catch (error) {
    console.error('❌ Error en obtenerHorariosDisponibles:', error);
    return res.status(500).json({
      error: 'Error al obtener horarios',
      detalles: error.message
    });
  }
};

// ===================================
// 5. ACTUALIZAR CITA
// ===================================
const actualizarCita = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const { fecha_cita, hora_cita, notas } = req.body;

    // ✓ Validar que al menos un campo esté presente
    if (!fecha_cita && !hora_cita && !notas) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un campo para actualizar: fecha_cita, hora_cita, notas'
      });
    }

    const citaActualizada = await citasModel.actualizarCita(
      id,
      usuarioId,
      { fecha_cita, hora_cita, notas }
    );

    return res.status(200).json({
      mensaje: 'Cita actualizada exitosamente',
      cita: citaActualizada
    });

  } catch (error) {
    console.error('❌ Error en actualizarCita:', error);
    return res.status(500).json({
      error: error.message || 'Error al actualizar cita',
      detalles: error.message
    });
  }
};

// ===================================
// 6. CANCELAR CITA (Usuario)
// ===================================
const cancelarCita = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const citaCancelada = await citasModel.cancelarCita(id, usuarioId);

    return res.status(200).json({
      mensaje: 'Cita cancelada exitosamente',
      cita: citaCancelada
    });

  } catch (error) {
    console.error('❌ Error en cancelarCita:', error);
    return res.status(500).json({
      error: error.message || 'Error al cancelar cita',
      detalles: error.message
    });
  }
};

// ===================================
// 7. CONFIRMAR CITA (ADMIN)
// ===================================
const confirmarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const citaConfirmada = await citasModel.confirmarCita(id);

    return res.status(200).json({
      mensaje: 'Cita confirmada exitosamente',
      cita: citaConfirmada
    });

  } catch (error) {
    console.error('❌ Error en confirmarCita:', error);
    return res.status(500).json({
      error: error.message || 'Error al confirmar cita',
      detalles: error.message
    });
  }
};

// ===================================
// 8. COMPLETAR CITA (ADMIN)
// ===================================
const completarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const citaCompletada = await citasModel.completarCita(id);

    return res.status(200).json({
      mensaje: 'Cita marcada como completada',
      cita: citaCompletada
    });

  } catch (error) {
    console.error('❌ Error en completarCita:', error);
    return res.status(500).json({
      error: error.message || 'Error al completar cita',
      detalles: error.message
    });
  }
};

// ===================================
// 9. OBTENER TODAS LAS CITAS (ADMIN)
// ===================================
const obtenerTodasLasCitas = async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, servicio_id } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (fecha_desde && fecha_hasta) {
      filtros.fecha_desde = fecha_desde;
      filtros.fecha_hasta = fecha_hasta;
    }
    if (servicio_id) filtros.servicio_id = servicio_id;

    const citas = await citasModel.obtenerTodasLasCitas(filtros);

    return res.status(200).json({
      total: citas.length,
      citas: citas
    });

  } catch (error) {
    console.error('❌ Error en obtenerTodasLasCitas:', error);
    return res.status(500).json({
      error: 'Error al obtener citas',
      detalles: error.message
    });
  }
};

// ===================================
// 10. OBTENER ESTADÍSTICAS (ADMIN)
// ===================================
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await citasModel.obtenerEstadisticasCitas();

    return res.status(200).json({
      estadisticas: estadisticas
    });

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalles: error.message
    });
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  crearCita,
  obtenerMisCitas,
  obtenerCita,
  obtenerHorariosDisponibles,
  actualizarCita,
  cancelarCita,
  confirmarCita,
  completarCita,
  obtenerTodasLasCitas,
  obtenerEstadisticas
};
