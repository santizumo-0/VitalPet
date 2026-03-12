const db = require('./config/database');

async function testFotosBase() {
  console.log('🧪 PRUEBA: Verificar fotos en la base de datos\n');

  try {
    // Ver todas las fotos en galeria_mascotas
    const [galeria] = await db.execute(`
      SELECT id, mascota_id, ruta_imagen, fecha_subida 
      FROM galeria_mascotas 
      ORDER BY fecha_subida DESC
      LIMIT 10
    `);

    console.log('📸 FOTOS EN GALERIA_MASCOTAS:');
    console.log(`Total: ${galeria.length} fotos\n`);
    
    for (const foto of galeria) {
      console.log(`[ID: ${foto.id}] Mascota ${foto.mascota_id}`);
      console.log(`  📁 Ruta: ${foto.ruta_imagen}`);
      console.log(`  📅 Fecha: ${foto.fecha_subida}\n`);
    }

    // Ver fotos que se guardaron hoy (últimas 3 horas)
    const [recientes] = await db.execute(`
      SELECT COUNT(*) as total FROM galeria_mascotas 
      WHERE fecha_subida >= DATE_SUB(NOW(), INTERVAL 3 HOUR)
    `);

    console.log(`📊 Últimas 3 horas: ${recientes[0].total} fotos guardasas`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testFotosBase();
