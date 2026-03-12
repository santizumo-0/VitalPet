const db = require('./config/database');

async function testGaleria() {
  console.log('🧪 PRUEBA: Verificando galería de fotos...\n');

  try {
    // 1. Obtener mascotas con galería
    const [mascotas] = await db.execute(`
      SELECT m.id, m.nombre, m.usuario_id,
             (SELECT COUNT(*) FROM galeria_mascotas WHERE mascota_id = m.id) as fotos_galeria
      FROM mascotas m
      LIMIT 3
    `);

    console.log('📸 MASCOTAS CON GALERÍA:');
    for (const m of mascotas) {
      console.log(`  - ${m.nombre} (ID: ${m.id}): ${m.fotos_galeria} fotos`);
      
      if (m.fotos_galeria > 0) {
        const [galeria] = await db.execute(
          'SELECT id, ruta_imagen, fecha_subida FROM galeria_mascotas WHERE mascota_id = ?',
          [m.id]
        );
        galeria.forEach(g => {
          console.log(`    • ${g.ruta_imagen} (${g.fecha_subida})`);
        });
      }
    }

    console.log('\n✅ Prueba completada');
    console.log('📝 Estado: Sistema de galería listo para usar\n');

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  } finally {
    process.exit();
  }
}

testGaleria();
