const db = require('./config/database');

async function checkMascotas() {
  try {
    console.log("\n=== MASCOTA ID 14 ===");
    const [mascota] = await db.execute("SELECT * FROM mascotas WHERE id = 14");
    if (mascota.length) {
      console.log("MASCOTA:", JSON.stringify(mascota[0], null, 2));
    } else {
      console.log("No existe mascota 14");
    }

    console.log("\n=== ALIMENTACION MASCOTA 14 ===");
    const [alim] = await db.execute("SELECT * FROM alimentacion_mascotas WHERE mascota_id = 14");
    console.log("Registros alimentación:", alim.length);
    if (alim.length) {
      console.log(JSON.stringify(alim, null, 2));
    }

    console.log("\n=== CONTACTO EMERGENCIA MASCOTA 14 ===");
    const [contacto] = await db.execute("SELECT * FROM contactos_emergencia WHERE mascota_id = 14");
    console.log("Registros contacto:", contacto.length);
    if (contacto.length) {
      console.log(JSON.stringify(contacto, null, 2));
    }

    console.log("\n=== USUARIO 2 ===");
    const [usuario] = await db.execute("SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE id = 2");
    if (usuario.length) {
      console.log(JSON.stringify(usuario[0], null, 2));
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

checkMascotas();
