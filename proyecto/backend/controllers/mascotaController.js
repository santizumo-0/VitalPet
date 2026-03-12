const mascotaModel = require('../models/mascotaModel');
const db = require('../config/database');

// ============================================
// FUNCIÓN AUXILIAR: Convertir ruta absoluta a relativa
// ============================================
function convertToRelativePath(absolutePath) {
  if (!absolutePath) return null;
  // Convertir barras invertidas a normales y extraer desde /backend/
  const normalized = absolutePath.replace(/\\/g, '/');
  const backendIndex = normalized.indexOf('/backend/');
  if (backendIndex === -1) return absolutePath;
  
  return normalized.substring(backendIndex + 9); // 9 = length('/backend/')
}

// ============================================
// CREAR MASCOTA COMPLETA
// ============================================

exports.crearMascota = async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const {
      nombre,
      raza,
      especie,
      tipo,
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
      // Información del dueño
      nombre_propietario,
      telefono_propietario,
      email_propietario,
      direccion_propietario,
      // Contacto de emergencia
      nombre_emergencia,
      telefono_emergencia,
      nombre_veterinario,
      telefono_veterinario,
      // Alimentación
      tipo_comida,
      porciones_diarias,
      horario_desayuno,
      horario_almuerzo,
      horario_cena,
    } = req.body;

    // Aceptar tanto "tipo" como "especie" (por compatibilidad)
    const especieFinal = especie || tipo || '';

    // Validaciones
    if (!nombre || !raza) {
      return res.status(400).json({ error: 'Nombre y raza son requeridos' });
    }

    if (!edad_valor || !edad_unidad || !peso_valor || !peso_unidad) {
      return res.status(400).json({ error: 'Edad y peso con unidades son requeridos' });
    }

    // ✅ 0. ACTUALIZAR INFORMACIÓN DEL DUEÑO EN LA TABLA USUARIOS
    if (nombre_propietario || telefono_propietario || email_propietario || direccion_propietario) {
      const queryUsuario = `
        UPDATE usuarios 
        SET nombre = COALESCE(?, nombre),
            telefono = COALESCE(?, telefono),
            email = COALESCE(?, email),
            direccion = COALESCE(?, direccion)
        WHERE id = ?
      `;
      await db.execute(queryUsuario, [
        nombre_propietario || null,
        telefono_propietario || null,
        email_propietario || null,
        direccion_propietario || null,
        usuarioId
      ]);
    }

    // 1. Crear mascota base
    const datosMascota = {
      nombre,
      raza,
      especie: especieFinal,
      sexo: sexo || null,
      color: color || null,
      edad_valor,
      edad_unidad,
      peso_valor,
      peso_unidad,
      alergias: alergias || null,
      enfermedades: enfermedades || null,
      ultima_visita_vet: ultima_visita_vet || null,
      foto_principal: convertToRelativePath(req.files?.find(f => f.fieldname === 'foto_principal')?.path) || null,
    };

    const mascotaId = await mascotaModel.crearMascota(usuarioId, datosMascota);

    // 2. Crear alimentación (opcional - solo si hay datos)
    if (tipo_comida || porciones_diarias || horario_desayuno || horario_almuerzo || horario_cena) {
      const datosAlimentacion = {
        tipo_comida,
        porciones_diarias,
        horario_desayuno,
        horario_almuerzo,
        horario_cena,
      };
      await mascotaModel.crearAlimentacion(mascotaId, datosAlimentacion).catch(err => {
        console.log('⚠️ Sin datos de alimentación, solo mascota creada');
      });
    }

    // 3. Crear contacto de emergencia (opcional)
    if (nombre_emergencia || telefono_emergencia || nombre_veterinario || telefono_veterinario) {
      const datosContacto = {
        nombre_emergencia,
        telefono_emergencia,
        nombre_veterinario,
        telefono_veterinario,
      };
      await mascotaModel.crearContactoEmergencia(mascotaId, datosContacto).catch(err => {
        console.log('⚠️ Sin datos de contacto, solo mascota creada');
      });
    }

    // 4. Guardar fotos de galería (opcional - múltiples archivos)
    const fotosGaleria = req.files?.filter(f => f.fieldname === 'fotos_galeria') || [];
    console.log('📸 Fotos de galería encontradas:', fotosGaleria.length);
    
    if (fotosGaleria.length > 0) {
      for (const file of fotosGaleria) {
        try {
          const rutaRelativa = convertToRelativePath(file.path);
          const resultId = await mascotaModel.agregarFotoGaleria(mascotaId, usuarioId, rutaRelativa);
          console.log('✅ Foto galería agregada (ID:', resultId, '):', rutaRelativa);
        } catch (err) {
          console.log('⚠️ Error al agregar foto de galería:', err.message);
        }
      }
    }

    res.status(201).json({
      mensaje: 'Mascota creada exitosamente',
      mascotaId,
    });
  } catch (error) {
    console.error('Error en crearMascota:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER TODAS LAS MASCOTAS DEL USUARIO
// ============================================

// NUEVA FUNCIÓN obtenerMascotas mejorada
exports.obtenerMascotas = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const mascotas = await mascotaModel.obtenerMascotasDelUsuario(usuarioId);

    // Enriquecer cada mascota con datos relacionados
    const mascotasCompletas = [];
    for (const m of mascotas) {
      // Separar edad/peso
      const edad = m.edad ? m.edad.split(' ') : ['', ''];
      const peso = m.peso ? m.peso.split(' ') : ['', ''];

      const mascota = {
        ...m,
        edad_valor: edad[0],
        edad_unidad: edad[1],
        peso_valor: peso[0],
        peso_unidad: peso[1],
      };

      // Convertir foto_principal a URL completa
      if (mascota.foto_principal) {
        mascota.foto_principal = `http://localhost:5000/${mascota.foto_principal}`;
      }

      // Traer info del dueño
      try {
        const [usuario] = await db.execute(
          'SELECT nombre, email, telefono, direccion FROM usuarios WHERE id = ?',
          [usuarioId]
        );
        if (usuario.length) {
          mascota.nombre_propietario = usuario[0].nombre;
          mascota.email_propietario = usuario[0].email;
          mascota.telefono_propietario = usuario[0].telefono;
          mascota.direccion_propietario = usuario[0].direccion;
        }
      } catch (e) {}

      // Traer alimentación
      try {
        const [alim] = await db.execute(
          'SELECT tipo_comida, porciones_dia, hora_desayuno, hora_almuerzo, hora_cena FROM alimentacion_mascotas WHERE mascota_id = ?',
          [m.id]
        );
        if (alim.length) {
          mascota.tipo_comida = alim[0].tipo_comida;
          mascota.porciones_diarias = alim[0].porciones_dia;
          mascota.horario_desayuno = alim[0].hora_desayuno;
          mascota.horario_almuerzo = alim[0].hora_almuerzo;
          mascota.horario_cena = alim[0].hora_cena;
        }
      } catch (e) {}

      // Traer contacto de emergencia
      try {
        const [contacto] = await db.execute(
          'SELECT nombre_contacto, telefono_contacto, nombre_veterinario, telefono_veterinario FROM contactos_emergencia WHERE mascota_id = ?',
          [m.id]
        );
        if (contacto.length) {
          mascota.nombre_emergencia = contacto[0].nombre_contacto;
          mascota.telefono_emergencia = contacto[0].telefono_contacto;
          mascota.nombre_veterinario = contacto[0].nombre_veterinario;
          mascota.telefono_veterinario = contacto[0].telefono_veterinario;
        }
      } catch (e) {}

      // Traer fotos de galería
      try {
        const [galeria] = await db.execute(
          'SELECT id, ruta_imagen FROM galeria_mascotas WHERE mascota_id = ? ORDER BY fecha_subida DESC',
          [m.id]
        );
        if (galeria.length) {
          mascota.fotos_galeria = galeria.map(g => ({
            id: g.id,
            url: `http://localhost:5000/${g.ruta_imagen}`
          }));
        }
      } catch (e) {}

      mascotasCompletas.push(mascota);
    }

    res.status(200).json(mascotasCompletas);
  } catch (error) {
    console.error('Error en obtenerMascotas:', error);
    res.status(500).json({ error: error.message });
  }
};


// ============================================
// OBTENER MASCOTA POR ID
// ============================================

exports.obtenerMascota = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Obtener mascota básica
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    // Verificar propiedad
    if (mascota.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta mascota' });
    }

    // Obtener datos relacionados
    const alimentacion = await mascotaModel.obtenerAlimentacion(mascotaId, usuarioId);
    const contacto = await mascotaModel.obtenerContactoEmergencia(mascotaId, usuarioId);
    const galeria = await mascotaModel.obtenerGaleria(mascotaId, usuarioId);
    const vacunas = await mascotaModel.obtenerVacunas(mascotaId, usuarioId);

    // Convertir foto_principal a URL completa
    if (mascota.foto_principal) {
      mascota.foto_principal = `http://localhost:5000/${mascota.foto_principal}`;
    }

    // Convertir galería a URLs completas
    const galeriaConURLs = galeria.map(g => ({
      id: g.id,
      ruta_imagen: `http://localhost:5000/${g.ruta_imagen || g.url}`
    }));

    // Separar edad y peso
    const edad = mascota.edad ? mascota.edad.split(' ') : ['', ''];
    const peso = mascota.peso ? mascota.peso.split(' ') : ['', ''];

    // Separar vacunas aplicadas de próximas
    const vacunasAplicadas = vacunas.filter((v) => v.estado === 'aplicada');
    const proximaVacunas = vacunas.filter((v) => v.estado === 'pendiente');

    const respuesta = {
      mascota: {
        ...mascota,
        edad_valor: edad[0],
        edad_unidad: edad[1],
        peso_valor: peso[0],
        peso_unidad: peso[1],
      },
      alimentacion,
      contacto: contacto ? {
        nombre_emergencia: contacto.nombre_contacto,
        telefono_emergencia: contacto.telefono_contacto,
        nombre_veterinario: contacto.nombre_veterinario,
        telefono_veterinario: contacto.telefono_veterinario,
      } : null,
      galeria: galeriaConURLs,
      vacunasAplicadas,
      proximaVacunas,
    };

    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error en obtenerMascota:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ACTUALIZAR MASCOTA COMPLETA
// ============================================

exports.actualizarMascota = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Verificar que la mascota pertenece al usuario
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    if (mascota.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta mascota' });
    }

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
      // Información del dueño
      nombre_propietario,
      telefono_propietario,
      email_propietario,
      direccion_propietario,
      // Alimentación
      tipo_comida,
      porciones_diarias,
      horario_desayuno,
      horario_almuerzo,
      horario_cena,
      // Contacto emergencia
      nombre_emergencia,
      telefono_emergencia,
      nombre_veterinario,
      telefono_veterinario,
      // Vacunas
      vacunas_aplicadas,
      proximas_vacunas,
    } = req.body;

    // ✅ ACTUALIZAR INFORMACIÓN DEL DUEÑO EN LA TABLA USUARIOS
    if (nombre_propietario || telefono_propietario || email_propietario || direccion_propietario) {
      const queryUsuario = `
        UPDATE usuarios 
        SET nombre = COALESCE(?, nombre),
            telefono = COALESCE(?, telefono),
            email = COALESCE(?, email),
            direccion = COALESCE(?, direccion)
        WHERE id = ?
      `;
      await db.execute(queryUsuario, [
        nombre_propietario || null,
        telefono_propietario || null,
        email_propietario || null,
        direccion_propietario || null,
        usuarioId
      ]);
    }

    // ✅ SIEMPRE actualizar mascota con TODOS los datos nuevos
    const datosMascota = {
      nombre: nombre || mascota.nombre,
      raza: raza || mascota.raza,
      especie: especie || mascota.especie,
      sexo: sexo || mascota.sexo,
      color: color || mascota.color,
      edad_valor: edad_valor || mascota.edad_valor,
      edad_unidad: edad_unidad || mascota.edad_unidad,
      peso_valor: peso_valor || mascota.peso_valor,
      peso_unidad: peso_unidad || mascota.peso_unidad,
      alergias: alergias !== undefined ? alergias : mascota.alergias,
      enfermedades: enfermedades !== undefined ? enfermedades : mascota.enfermedades,
      ultima_visita_vet: ultima_visita_vet || mascota.ultima_visita_vet,
      foto_principal: convertToRelativePath(req.files?.find(f => f.fieldname === 'foto_principal')?.path) || mascota.foto_principal,
      vacunas_aplicadas: vacunas_aplicadas || mascota.vacunas_aplicadas,
      proximas_vacunas: proximas_vacunas || mascota.proximas_vacunas,
    };

    await mascotaModel.actualizarMascota(mascotaId, usuarioId, datosMascota);
    console.log('✅ Mascota actualizada:', mascotaId);

    // Actualizar alimentación si existe
    if (tipo_comida || porciones_diarias || horario_desayuno || horario_almuerzo || horario_cena) {
      const datosAlimentacion = {
        tipo_comida,
        porciones_diarias,
        horario_desayuno,
        horario_almuerzo,
        horario_cena,
      };

      await mascotaModel.actualizarAlimentacion(mascotaId, datosAlimentacion);
    }

    // Actualizar contacto de emergencia si existe
    if (nombre_emergencia || telefono_emergencia || nombre_veterinario || telefono_veterinario) {
      const datosContacto = {
        nombre_emergencia,
        telefono_emergencia,
        nombre_veterinario,
        telefono_veterinario,
      };

      await mascotaModel.actualizarContactoEmergencia(mascotaId, usuarioId, datosContacto);
    }

    // Guardar fotos de galería si se envían (múltiples archivos)
    const fotosGaleria = req.files?.filter(f => f.fieldname === 'fotos_galeria') || [];
    console.log('📸 Fotos de galería encontradas (actualizar):', fotosGaleria.length);
    
    if (fotosGaleria.length > 0) {
      for (const file of fotosGaleria) {
        try {
          const rutaRelativa = convertToRelativePath(file.path);
          const resultId = await mascotaModel.agregarFotoGaleria(mascotaId, usuarioId, rutaRelativa);
          console.log('✅ Foto galería agregada (ID:', resultId, '):', rutaRelativa);
        } catch (err) {
          console.log('⚠️ Error al agregar foto de galería:', err.message);
        }
      }
    }

    res.status(200).json({ mensaje: 'Mascota actualizada exitosamente' });
  } catch (error) {
    console.error('Error en actualizarMascota:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR MASCOTA
// ============================================

exports.eliminarMascota = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Verificar propiedad
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    if (mascota.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta mascota' });
    }

    await mascotaModel.eliminarMascota(mascotaId, usuarioId);

    res.status(200).json({ mensaje: 'Mascota eliminada exitosamente' });
  } catch (error) {
    console.error('Error en eliminarMascota:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// AGREGAR FOTO A GALERÍA
// ============================================

exports.agregarFotoGaleria = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Verificar propiedad
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    if (mascota.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para agregar fotos a esta mascota' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos una imagen' });
    }

    const fotosAgregadas = [];

    for (const file of req.files) {
      const fotoId = await mascotaModel.agregarFotoGaleria(
        mascotaId,
        usuarioId,
        file.path
      );
      fotosAgregadas.push({ id: fotoId, ruta: file.path });
    }

    res.status(201).json({
      mensaje: 'Fotos agregadas exitosamente',
      fotos: fotosAgregadas,
    });
  } catch (error) {
    console.error('Error en agregarFotoGaleria:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER GALERÍA DE MASCOTA
// ============================================

exports.obtenerGaleria = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Verificar propiedad
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const galeria = await mascotaModel.obtenerGaleria(mascotaId, usuarioId);

    res.status(200).json(galeria);
  } catch (error) {
    console.error('Error en obtenerGaleria:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR FOTO DE GALERÍA
// ============================================

exports.eliminarFoto = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { fotoId } = req.params;

    const eliminadas = await mascotaModel.eliminarFotoGaleria(fotoId, usuarioId);

    if (eliminadas === 0) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    res.status(200).json({ mensaje: 'Foto eliminada exitosamente' });
  } catch (error) {
    console.error('Error en eliminarFoto:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR VACUNA
// ============================================

exports.crearVacuna = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;
    const {
      nombre_vacuna,
      fecha_aplicacion,
    } = req.body;

    // Verificar propiedad
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    if (mascota.usuario_id !== usuarioId) {
      return res.status(403).json({ error: 'No tienes permiso para agregar vacunas a esta mascota' });
    }

    if (!nombre_vacuna || !fecha_aplicacion) {
      return res.status(400).json({ error: 'Nombre de vacuna y fecha son requeridos' });
    }

    const datosVacuna = {
      nombre_vacuna,
      fecha_aplicacion,
    };

    const vacunaId = await mascotaModel.crearVacuna(mascotaId, datosVacuna);

    res.status(201).json({
      mensaje: 'Vacuna registrada exitosamente',
      vacunaId,
    });
  } catch (error) {
    console.error('Error en crearVacuna:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER VACUNAS
// ============================================

exports.obtenerVacunas = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuarioId = req.usuario.id;
    const { mascotaId } = req.params;

    // Verificar propiedad
    const mascota = await mascotaModel.obtenerMascotaPorId(mascotaId, usuarioId);

    if (!mascota) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const vacunas = await mascotaModel.obtenerVacunas(mascotaId, usuarioId);

    res.status(200).json(vacunas);
  } catch (error) {
    console.error('Error en obtenerVacunas:', error);
    res.status(500).json({ error: error.message });
  }
};



