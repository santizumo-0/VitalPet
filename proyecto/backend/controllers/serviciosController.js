// ===================================
// CONTROLLER: SERVICIOS
// ===================================

const serviciosModel = require('../models/serviciosModel');

// ===================================
// 1. OBTENER TODOS LOS SERVICIOS (PUBLIC)
// ===================================
const obtenerServicios = async (req, res) => {
  try {
    const { tipo } = req.query;
    console.log(`📋 Obteniendo servicios${tipo ? ` tipo: ${tipo}` : ''}...`);

    const servicios = await serviciosModel.obtenerServicios(tipo);

    if (servicios.length === 0) {
      return res.status(404).json({
        mensaje: 'No hay servicios disponibles',
        servicios: []
      });
    }

    res.json({
      mensaje: '✅ Servicios obtenidos',
      cantidad: servicios.length,
      servicios
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener servicios'
    });
  }
};

// ===================================
// 2. OBTENER SERVICIO POR ID (PUBLIC)
// ===================================
const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo servicio ID: ${id}`);

    const servicio = await serviciosModel.obtenerServicio(id);

    if (!servicio) {
      return res.status(404).json({
        error: 'Servicio no encontrado'
      });
    }

    res.json({
      mensaje: '✅ Servicio obtenido',
      servicio
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener servicio'
    });
  }
};

// ===================================
// 3. OBTENER TIPOS DE SERVICIOS (PUBLIC)
// ===================================
const obtenerTipos = async (req, res) => {
  try {
    console.log('📋 Obteniendo tipos de servicios...');

    const tipos = await serviciosModel.obtenerTipos();

    res.json({
      mensaje: '✅ Tipos obtenidos',
      cantidad: tipos.length,
      tipos
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener tipos'
    });
  }
};

// ===================================
// 4. CREAR SERVICIO (ADMIN)
// ===================================
const crearServicio = async (req, res) => {
  try {
    const { nombre, tipo, descripcion, precio, duracion_minutos = 30 } = req.body;
    const imagen = req.file ? `/uploads/servicios/${req.file.filename}` : null;

    console.log(`✨ Creando servicio: ${nombre}`);

    // Validar campos requeridos
    if (!nombre || !tipo || !descripcion || !precio) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: nombre, tipo, descripcion, precio'
      });
    }

    const servicio = await serviciosModel.crearServicio(
      nombre,
      tipo,
      descripcion,
      precio,
      duracion_minutos,
      imagen
    );

    res.status(201).json(servicio);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al crear servicio'
    });
  }
};

// ===================================
// 5. ACTUALIZAR SERVICIO (ADMIN)
// ===================================
const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, descripcion, precio, duracion_minutos = 30 } = req.body;
    const imagen = req.file ? `/uploads/servicios/${req.file.filename}` : null;

    console.log(`✏️ Actualizando servicio ID: ${id}`);

    // Validar campos requeridos
    if (!nombre || !tipo || !descripcion || !precio) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: nombre, tipo, descripcion, precio'
      });
    }

    const servicio = await serviciosModel.actualizarServicio(
      id,
      nombre,
      tipo,
      descripcion,
      precio,
      duracion_minutos,
      imagen
    );

    res.json(servicio);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al actualizar servicio'
    });
  }
};

// ===================================
// 6. ELIMINAR SERVICIO (ADMIN)
// ===================================
const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando servicio ID: ${id}`);

    const resultado = await serviciosModel.eliminarServicio(id);

    res.json(resultado);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar servicio'
    });
  }
};

// ===================================
// 7. OBTENER HORARIOS DISPONIBLES (PUBLIC)
// ===================================
const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { servicioId, fecha } = req.query;
    console.log(`⏰ Obteniendo horarios para servicio ${servicioId} en fecha ${fecha}`);

    if (!servicioId || !fecha) {
      return res.status(400).json({
        error: 'Faltan parámetros: servicioId y fecha requeridos'
      });
    }

    const horarios = await serviciosModel.obtenerHorariosDisponibles(servicioId, fecha);

    res.json({
      mensaje: '✅ Horarios obtenidos',
      servicioId,
      fecha,
      cantidad: horarios.length,
      horarios
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error.message || 'Error al obtener horarios'
    });
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
