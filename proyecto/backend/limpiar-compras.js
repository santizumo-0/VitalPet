// Script para limpiar y verificar compras
const pool = require('./config/database');

async function limpiar() {
  try {
    console.log('🔍 Verificando usuarios...');
    
    // Buscar usuario sandra
    const [usuarios] = await pool.query('SELECT id, email FROM usuarios WHERE email = ?', ['sandra@gmail.com']);
    if (usuarios.length === 0) {
      console.log('❌ No se encontró usuario sandra@gmail.com');
      process.exit(1);
    }
    
    const usuarioId = usuarios[0].id;
    console.log('✅ Usuario encontrado:', usuarioId, usuarios[0].email);
    
    // Asignar compras huérfanas a este usuario
    const [resultado] = await pool.query(
      'UPDATE pedidos SET usuario_id = ? WHERE usuario_id IS NULL AND email = ?',
      [usuarioId, 'sandra@gmail.com']
    );
    
    console.log('\n✨ Compras asignadas al usuario:', resultado.affectedRows);
    
    // Ver después
    const [comprasLimpias] = await pool.query(
      'SELECT id, usuario_id, email, total FROM pedidos WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
      [usuarioId]
    );
    console.log('\n📦 Tus compras ahora:', comprasLimpias.length);
    console.log(JSON.stringify(comprasLimpias, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

limpiar();
