const db = require('./config/database');

async function testDirectos() {
  console.log('🧪 VERIFICACIÓN DIRECTA: Última mascota en BD\n');

  try {
    // 1. Ver la última mascota creada/actualizada
    const [mascotas] = await db.execute(`
      SELECT 
        m.id, m.usuario_id, m.nombre, 
        m.ultima_visita_vet, 
        m.foto_principal,
        m.fecha_actualizacion,
        (SELECT COUNT(*) FROM galeria_mascotas WHERE mascota_id = m.id) as fotos_galeria
      FROM mascotas m
      ORDER BY m.fecha_actualizacion DESC
      LIMIT 3
    `);

    console.log('📋 ÚLTIMAS 3 MASCOTAS:\n');
    for (const m of mascotas) {
      console.log(`[ID: ${m.id}] ${m.nombre}`);
      console.log(`  📅 Última actualización: ${m.fecha_actualizacion}`);
      console.log(`  🏥 Última visita vet: ${m.ultima_visita_vet || '❌ SIN DATO'}`);
      console.log(`  📸 Foto principal: ${m.foto_principal || '❌ SIN DATO'}`);
      console.log(`  🖼️  Fotos galería: ${m.fotos_galeria} fotos`);
      console.log('');
    }

    console.log('✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testDirectos();
