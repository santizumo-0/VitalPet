const bcrypt = require('bcryptjs');

async function generarHash() {
  const contraseña = 'admin123';
  const hash = await bcrypt.hash(contraseña, 10);
  console.log('✅ Hash para admin123:');
  console.log(hash);
  console.log('\n📝 Usa este hash exacto en MySQL:');
  console.log(`UPDATE administradores SET contraseña = '${hash}' WHERE email = 'admin@vitalpet.com';`);
}

generarHash();
