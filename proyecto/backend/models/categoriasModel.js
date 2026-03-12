// ===================================
// MODEL: CATEGORÍAS
// ===================================
// Funciones para acceder a tabla categorias

const pool = require('../config/database');

// ===================================
// 1. OBTENER TODAS LAS CATEGORÍAS
// ===================================
const obtenerCategorias = async () => {
  try {
    const [categorias] = await pool.query(
      'SELECT id, nombre, descripcion FROM categorias ORDER BY nombre ASC'
    );
    return categorias;
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER CATEGORÍA POR ID
// ===================================
const obtenerCategoriaPorId = async (id) => {
  try {
    const [categorias] = await pool.query(
      'SELECT id, nombre, descripcion FROM categorias WHERE id = ?',
      [id]
    );
    if (categorias.length === 0) return null;
    return categorias[0];
  } catch (error) {
    console.error('❌ Error al obtener categoría:', error);
    throw error;
  }
};

// ===================================
// 3. CREAR CATEGORÍA (ADMIN)
// ===================================
const crearCategoria = async (nombre, descripcion) => {
  try {
    const [resultado] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion, fecha_creacion, fecha_actualizacion) VALUES (?, ?, NOW(), NOW())',
      [nombre, descripcion || null]
    );
    return {
      id: resultado.insertId,
      nombre,
      descripcion: descripcion || null,
      mensaje: 'Categoría creada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al crear categoría:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria
};
