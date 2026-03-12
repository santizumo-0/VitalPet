const db = require('./config/database');

async function testAPI() {
  console.log('🧪 PRUEBA: Verificar qué retorna obtenerMascotas para mascota con fotos\n');

  try {
    const usuarioId = 1;
    
    // Simular lo que hace obtenerMascotas
    const [mascotas] = await db.execute(
      'SELECT m.* FROM mascotas m WHERE m.usuario_id = ? LIMIT 1',
      [usuarioId]
    );
    
    if (!mascotas.length) {
      console.log('No hay mascotas');
      process.exit();
    }
    
    const m = mascotas[0];
    console.log('📋 Mascota encontrada:');
    console.log('  ID:', m.id, 'Nombre:', m.nombre);
    
    // Obtener fotos de galería
    const [galeria] = await db.execute(
      'SELECT id, ruta_imagen FROM galeria_mascotas WHERE mascota_id = ? ORDER BY fecha_subida DESC',
      [m.id]
    );
    
    console.log('\n📸 Fotos en BD:');
    galeria.forEach(g => {
      console.log('  - ID:', g.id, 'Ruta:', g.ruta_imagen.substring(0, 50) + '...');
    });
    
    // Estruturar como retorna el API
    if (galeria.length) {
      const fotos_galeria = galeria.map(g => ({
        id: g.id,
        url: g.ruta_imagen
      }));
      
      console.log('\n📦 Lo que retorna el API (fotos_galeria):');
      console.log(JSON.stringify(fotos_galeria, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testAPI();
