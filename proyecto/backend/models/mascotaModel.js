const db = require('../config/database');

// ============================================
// FUNCIONES PARA TABLA: mascotas
// ============================================

// Crear una nueva mascota
async function crearMascota(usuarioId, datos) {
  try {
    const {
      nombre,
      raza,
      especie,
      sexo,
      color,
      edad_valor,
      edad_unidad,
      peso_valor,
      peso_unidad,
      alergias,
      enfermedades,
      ultima_visita_vet,
      foto_principal,
      vacunas_aplicadas,
      proximas_vacunas,
    } = datos;

    // Concatenar edad y peso con sus unidades
    const edad = `${edad_valor} ${edad_unidad}`;
    const peso = `${peso_valor} ${peso_unidad}`;

    // ✅ Query SIN sexo y color - solo los campos que necesito
    const query = `
      INSERT INTO mascotas 
      (usuario_id, nombre, raza, especie, edad, peso, alergias, enfermedades, ultima_visita_vet, foto_principal, vacunas_aplicadas, proximas_vacunas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      usuarioId,
      nombre,
      raza,
      especie,
      edad,
      peso,
      alergias || null,
      enfermedades || null,
      ultima_visita_vet || null,
      foto_principal || null,
      vacunas_aplicadas || null,
      proximas_vacunas || null,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(`Error al crear mascota: ${error.message}`);
  }
}

// Obtener todas las mascotas de un usuario
async function obtenerMascotasDelUsuario(usuarioId) {
  try {
    const query = `
      SELECT id, usuario_id, nombre, raza, especie, sexo, color, edad, peso, 
             alergias, enfermedades, ultima_visita_vet, foto_principal, vacunas_aplicadas, proximas_vacunas,
             fecha_creacion, fecha_actualizacion
      FROM mascotas
      WHERE usuario_id = ?
      ORDER BY fecha_creacion DESC
    `;

    const [mascotas] = await db.execute(query, [usuarioId]);
    return mascotas;
  } catch (error) {
    throw new Error(`Error al obtener mascotas: ${error.message}`);
  }
}

// Obtener una mascota específica por ID
async function obtenerMascotaPorId(mascotaId, usuarioId) {
  try {
    const query = `
      SELECT id, usuario_id, nombre, raza, especie, sexo, color, edad, peso, 
             alergias, enfermedades, ultima_visita_vet, foto_principal, vacunas_aplicadas, proximas_vacunas,
             fecha_creacion, fecha_actualizacion
      FROM mascotas
      WHERE id = ? AND usuario_id = ?
    `;

    const [mascotas] = await db.execute(query, [mascotaId, usuarioId]);
    return mascotas.length > 0 ? mascotas[0] : null;
  } catch (error) {
    throw new Error(`Error al obtener mascota: ${error.message}`);
  }
}

// Actualizar una mascota
async function actualizarMascota(mascotaId, usuarioId, datos) {
  try {
    const {
      nombre,
      raza,
      especie,
      edad_valor,
      edad_unidad,
      peso_valor,
      peso_unidad,
      alergias,
      enfermedades,
      ultima_visita_vet,
      foto_principal,
      vacunas_aplicadas,
      proximas_vacunas,
    } = datos;

    // Concatenar edad y peso con sus unidades
    const edad = `${edad_valor} ${edad_unidad}`;
    const peso = `${peso_valor} ${peso_unidad}`;

    // ✅ ACTUALIZAR: nombre, raza, especie, edad, peso, sexo, color, alergias, enfermedades, visita vet, vacunas
    const query = `
      UPDATE mascotas
      SET nombre = ?, raza = ?, especie = ?, sexo = ?, color = ?, edad = ?, peso = ?, 
          alergias = ?, enfermedades = ?, ultima_visita_vet = ?, foto_principal = COALESCE(?, foto_principal),
          vacunas_aplicadas = ?, proximas_vacunas = ?, fecha_actualizacion = NOW()
      WHERE id = ? AND usuario_id = ?
    `;

    const {sexo, color} = datos;
    const [result] = await db.execute(query, [
      nombre,
      raza,
      especie,
      sexo || null,
      color || null,
      edad,
      peso,
      alergias || null,
      enfermedades || null,
      ultima_visita_vet || null,
      foto_principal || null,
      vacunas_aplicadas || null,
      proximas_vacunas || null,
      mascotaId,
      usuarioId,
    ]);

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Error al actualizar mascota: ${error.message}`);
  }
}

// Eliminar una mascota (cascada borra todo)
async function eliminarMascota(mascotaId, usuarioId) {
  try {
    // Eliminar en cascada: galería, vacunas, alimentación, contactos, luego mascota
    await db.execute('DELETE FROM galeria_mascotas WHERE mascota_id = ?', [mascotaId]);
    await db.execute('DELETE FROM vacunas_mascotas WHERE mascota_id = ?', [mascotaId]);
    await db.execute('DELETE FROM alimentacion_mascotas WHERE mascota_id = ?', [mascotaId]);
    await db.execute('DELETE FROM contactos_emergencia WHERE mascota_id = ?', [mascotaId]);
    
    // Finalmente eliminar la mascota
    const query = `DELETE FROM mascotas WHERE id = ? AND usuario_id = ?`;
    const [result] = await db.execute(query, [mascotaId, usuarioId]);
    return result.affectedRows;
  } catch (error) {
    throw new Error(`Error al eliminar mascota: ${error.message}`);
  }
}

// ============================================
// FUNCIONES PARA TABLA: alimentacion_mascotas
// ============================================

// Crear registro de alimentación
async function crearAlimentacion(mascotaId, datos) {
  try {
    const {
      tipo_comida,
      porciones_diarias,
      horario_desayuno,
      horario_almuerzo,
      horario_cena,
    } = datos;

    const query = `
      INSERT INTO alimentacion_mascotas 
      (mascota_id, tipo_comida, porciones_dia, hora_desayuno, hora_almuerzo, hora_cena)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      mascotaId,
      tipo_comida || null,
      porciones_diarias || null,
      horario_desayuno || null,
      horario_almuerzo || null,
      horario_cena || null,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(`Error al crear alimentación: ${error.message}`);
  }
}

// Obtener alimentación de una mascota
async function obtenerAlimentacion(mascotaId) {
  try {
    const query = `
      SELECT id, mascota_id, tipo_comida, porciones_dia, 
             hora_desayuno, hora_almuerzo, hora_cena, fecha_creacion
      FROM alimentacion_mascotas
      WHERE mascota_id = ?
    `;

    const [alimentacion] = await db.execute(query, [mascotaId]);
    return alimentacion.length > 0 ? alimentacion[0] : null;
  } catch (error) {
    throw new Error(`Error al obtener alimentación: ${error.message}`);
  }
}

// Actualizar alimentación
async function actualizarAlimentacion(mascotaId, datos) {
  try {
    const {
      tipo_comida,
      porciones_diarias,
      horario_desayuno,
      horario_almuerzo,
      horario_cena,
    } = datos;

    const query = `
      UPDATE alimentacion_mascotas
      SET tipo_comida = ?, porciones_dia = ?, 
          hora_desayuno = ?, hora_almuerzo = ?, hora_cena = ?
      WHERE mascota_id = ?
    `;

    const [result] = await db.execute(query, [
      tipo_comida || null,
      porciones_diarias || null,
      horario_desayuno || null,
      horario_almuerzo || null,
      horario_cena || null,
      mascotaId,
    ]);

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Error al actualizar alimentación: ${error.message}`);
  }
}

// ============================================
// FUNCIONES PARA TABLA: contactos_emergencia
// ============================================

// Crear contacto de emergencia
async function crearContactoEmergencia(mascotaId, datos) {
  try {
    const {
      nombre_emergencia,
      telefono_emergencia,
      nombre_veterinario,
      telefono_veterinario,
    } = datos;

    const query = `
      INSERT INTO contactos_emergencia
      (mascota_id, nombre_contacto, telefono_contacto, nombre_veterinario, telefono_veterinario)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      mascotaId,
      nombre_emergencia || null,
      telefono_emergencia || null,
      nombre_veterinario || null,
      telefono_veterinario || null,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(`Error al crear contacto de emergencia: ${error.message}`);
  }
}

// Obtener contacto de emergencia
async function obtenerContactoEmergencia(mascotaId, usuarioId) {
  try {
    const query = `
      SELECT id, mascota_id, nombre_contacto, telefono_contacto, nombre_veterinario, telefono_veterinario
      FROM contactos_emergencia
      WHERE mascota_id = ? AND usuario_id = ?
    `;

    const [contactos] = await db.execute(query, [mascotaId, usuarioId]);
    return contactos.length > 0 ? contactos[0] : null;
  } catch (error) {
    throw new Error(`Error al obtener contacto de emergencia: ${error.message}`);
  }
}

// Actualizar contacto de emergencia
async function actualizarContactoEmergencia(mascotaId, usuarioId, datos) {
  try {
    const {
      nombre_emergencia,
      telefono_emergencia,
      nombre_veterinario,
      telefono_veterinario,
    } = datos;

    const query = `
      UPDATE contactos_emergencia
      SET nombre_contacto = ?, telefono_contacto = ?, nombre_veterinario = ?, telefono_veterinario = ?
      WHERE mascota_id = ?
    `;

    const [result] = await db.execute(query, [
      nombre_emergencia || null,
      telefono_emergencia || null,
      nombre_veterinario || null,
      telefono_veterinario || null,
      mascotaId,
    ]);

    return result.affectedRows;
  } catch (error) {
    throw new Error(`Error al actualizar contacto de emergencia: ${error.message}`);
  }
}

// ============================================
// FUNCIONES PARA TABLA: galeria_mascotas
// ============================================

// Agregar foto a galería
async function agregarFotoGaleria(mascotaId, usuarioId, rutaFoto) {
  try {
    const query = `
      INSERT INTO galeria_mascotas (mascota_id, ruta_imagen)
      VALUES (?, ?)
    `;

    const [result] = await db.execute(query, [mascotaId, rutaFoto]);
    return result.insertId;
  } catch (error) {
    throw new Error(`Error al agregar foto: ${error.message}`);
  }
}

// Obtener galería de una mascota
async function obtenerGaleria(mascotaId, usuarioId) {
  try {
    const query = `
      SELECT id, mascota_id, ruta_imagen, fecha_subida
      FROM galeria_mascotas
      WHERE mascota_id = ?
      ORDER BY fecha_subida DESC
    `;

    const [fotos] = await db.execute(query, [mascotaId]);
    return fotos;
  } catch (error) {
    throw new Error(`Error al obtener galería: ${error.message}`);
  }
}

// Eliminar foto de galería
async function eliminarFotoGaleria(fotoId, usuarioId) {
  try {
    const query = `DELETE FROM galeria_mascotas WHERE id = ?`;
    const [result] = await db.execute(query, [fotoId]);
    return result.affectedRows;
  } catch (error) {
    throw new Error(`Error al eliminar foto: ${error.message}`);
  }
}

// ============================================
// FUNCIONES PARA TABLA: vacunas_mascotas
// ============================================

// Obtener vacunas de una mascota
async function obtenerVacunas(mascotaId, usuarioId) {
  try {
    const query = `
      SELECT id, mascota_id, nombre_vacuna, fecha_aplicada, fecha_creacion
      FROM vacunas_mascotas
      WHERE mascota_id = ?
      ORDER BY fecha_aplicada DESC
    `;

    const [vacunas] = await db.execute(query, [mascotaId]);
    return vacunas;
  } catch (error) {
    throw new Error(`Error al obtener vacunas: ${error.message}`);
  }
}

// Crear registro de vacuna
async function crearVacuna(mascotaId, datos) {
  try {
    const {
      nombre_vacuna,
      fecha_aplicacion,
    } = datos;

    const query = `
      INSERT INTO vacunas_mascotas
      (mascota_id, nombre_vacuna, fecha_aplicada)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      mascotaId,
      nombre_vacuna,
      fecha_aplicacion,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(`Error al crear vacuna: ${error.message}`);
  }
}

module.exports = {
  // Mascotas
  crearMascota,
  obtenerMascotasDelUsuario,
  obtenerMascotaPorId,
  actualizarMascota,
  eliminarMascota,
  // Alimentación
  crearAlimentacion,
  obtenerAlimentacion,
  actualizarAlimentacion,
  // Contactos de Emergencia
  crearContactoEmergencia,
  obtenerContactoEmergencia,
  actualizarContactoEmergencia,
  // Galería
  agregarFotoGaleria,
  obtenerGaleria,
  eliminarFotoGaleria,
  // Vacunas
  obtenerVacunas,
  crearVacuna,
};
