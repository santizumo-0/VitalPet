// ===================================
// MODEL: USUARIOS
// ===================================
// Funciones para acceder a la tabla usuarios en BD

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// ===================================
// 1. CREAR USUARIO (REGISTRO)
// ===================================
const crearUsuario = async (nombre, email, telefono, contraseña) => {
  try {
    // Validar que la contraseña no sea vacía
    if (!contraseña || contraseña.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Hashear la contraseña con bcrypt (10 rounds = muy seguro)
    const contraseniaHasheada = await bcrypt.hash(contraseña, 10);

    // Insertar en la BD
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nombre, email, telefono, contraseña, fecha_creacion, fecha_actualizacion, activo) VALUES (?, ?, ?, ?, NOW(), NOW(), true)',
      [nombre, email, telefono, contraseniaHasheada]
    );

    // Retornar el ID del usuario creado
    return {
      id: resultado.insertId,
      nombre,
      email,
      telefono,
      mensaje: 'Usuario creado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER USUARIO POR EMAIL (LOGIN)
// ===================================
const obtenerUsuarioPorEmail = async (email) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, telefono, contraseña, activo, fecha_creacion FROM usuarios WHERE email = ?',
      [email]
    );

    // Si no encuentra usuario, retorna null
    if (usuarios.length === 0) {
      return null;
    }

    // Retorna el primer (y único) usuario encontrado
    return usuarios[0];
  } catch (error) {
    console.error('❌ Error al obtener usuario por email:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER USUARIO POR ID (PERFIL)
// ===================================
const obtenerUsuarioPorId = async (id) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, telefono, activo, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = ?',
      [id]
    );

    // Nota: NO devolvemos la contraseña por seguridad
    if (usuarios.length === 0) {
      return null;
    }

    return usuarios[0];
  } catch (error) {
    console.error('❌ Error al obtener usuario por ID:', error);
    throw error;
  }
};

// ===================================
// 4. ACTUALIZAR USUARIO (EDITAR PERFIL)
// ===================================
const actualizarUsuario = async (id, datos) => {
  try {
    // Construir dinámicamente los campos a actualizar
    const campos = [];
    const valores = [];

    if (datos.nombre) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.email) {
      campos.push('email = ?');
      valores.push(datos.email);
    }
    if (datos.telefono) {
      campos.push('telefono = ?');
      valores.push(datos.telefono);
    }
    if (datos.contraseña) {
      // Si actualiza contraseña, hashear nuevamente
      const contraseniaHasheada = await bcrypt.hash(datos.contraseña, 10);
      campos.push('contraseña = ?');
      valores.push(contraseniaHasheada);
    }

    // Siempre actualizar fecha_actualizacion
    campos.push('fecha_actualizacion = NOW()');

    // No hay nada que actualizar
    if (campos.length === 1) {
      return { mensaje: 'No hay datos para actualizar' };
    }

    // Agregar ID al final
    valores.push(id);

    // Ejecutar query
    const [resultado] = await pool.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );

    return {
      id,
      affectedRows: resultado.affectedRows,
      mensaje: 'Usuario actualizado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    throw error;
  }
};

// ===================================
// 5. ELIMINAR USUARIO (BORRAR CUENTA)
// ===================================
const eliminarUsuario = async (id) => {
  try {
    const [resultado] = await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );

    return {
      id,
      affectedRows: resultado.affectedRows,
      mensaje: 'Usuario eliminado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    throw error;
  }
};

// ===================================
// 6. VERIFICAR SI EMAIL YA EXISTE
// ===================================
const verificarEmail = async (email) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    // Retorna true si existe, false si no
    return usuarios.length > 0;
  } catch (error) {
    console.error('❌ Error al verificar email:', error);
    throw error;
  }
};

// ===================================
// 7. COMPARAR CONTRASEÑA (PARA LOGIN)
// ===================================
const compararContraseña = async (contraseniaIngresada, contraseniaHasheada) => {
  try {
    // bcrypt.compare devuelve true o false
    return await bcrypt.compare(contraseniaIngresada, contraseniaHasheada);
  } catch (error) {
    console.error('❌ Error al comparar contraseña:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR FUNCIONES
// ===================================
module.exports = {
  crearUsuario,
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  verificarEmail,
  compararContraseña
};
