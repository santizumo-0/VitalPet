const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadWithPhotos() {
  console.log('🧪 PRUEBA: Upload con fotos y última visita veterinaria\n');

  try {
    // Datos de prueba
    const testData = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoibHVpcyIsImlhdCI6MTczMDA1MjEzOX0.nMxUMJJzNEr8W3J3bSW1YjrfCBMjuwvNgbKnAOWdh1w', // Token de prueba
      mascotaId: 1
    };

    // Crear FormData
    const formData = new FormData();
    formData.append('nombre', 'Max Updated');
    formData.append('raza', 'Labrador');
    formData.append('especie', 'Perro');
    formData.append('sexo', 'Macho');
    formData.append('color', 'Negro');
    formData.append('edad_valor', '5');
    formData.append('edad_unidad', 'años');
    formData.append('peso_valor', '30');
    formData.append('peso_unidad', 'kg');
    formData.append('alergias', 'Ninguna');
    formData.append('enfermedades', 'Ninguna');
    formData.append('ultima_visita_vet', '2024-03-01');
    formData.append('nombre_propietario', 'Luis');
    formData.append('telefono_propietario', '123456789');
    formData.append('email_propietario', 'luis@example.com');
    formData.append('direccion_propietario', 'Calle test 123');
    formData.append('nombre_emergencia', 'Juan');
    formData.append('telefono_emergencia', '987654321');
    formData.append('nombre_veterinario', 'Dr. Smith');
    formData.append('telefono_veterinario', '555555555');
    formData.append('tipo_comida', 'Alimento premium');
    formData.append('porciones_diarias', '2');
    formData.append('horario_desayuno', '08:00');
    formData.append('horario_almuerzo', '14:00');
    formData.append('horario_cena', '20:00');

    // Crear archivos de prueba (imágenes dummy)
    const imagenPrincipal = Buffer.from('dummy image principal');
    const imagenesGaleria = [
      Buffer.from('dummy image galeria 1'),
      Buffer.from('dummy image galeria 2')
    ];

    // Agregar foto principal
    formData.append('foto_principal', imagenPrincipal, 'foto_principal.jpg');

    // Agregar fotos galería
    imagenesGaleria.forEach((img, index) => {
      formData.append('fotos_galeria', img, `galeria_${index + 1}.jpg`);
    });

    console.log('📤 Enviando PUT con FormData a http://localhost:5000/api/mascotas/1');
    console.log('📋 Datos incluidos:');
    console.log('  - nombre: Max Updated');
    console.log('  - ultima_visita_vet: 2024-03-01');
    console.log('  - foto_principal: 1 archivo');
    console.log('  - fotos_galeria: 2 archivos\n');

    const response = await fetch('http://localhost:5000/api/mascotas/1', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${testData.token}`
      },
      body: formData
    });

    const responseData = await response.json();

    console.log(`📥 Respuesta (${response.status}):`);
    console.log(JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Upload exitoso');
      
      // Verificar en BD
      const db = require('./config/database');
      const [mascotas] = await db.execute(
        'SELECT nivel_último_visit_vet, foto_principal FROM mascotas WHERE id = 1'
      );
      
      if (mascotas.length) {
        console.log('\n📊 VERIFICACIÓN EN BD:');
        console.log('  - ultima_visita_vet:', mascotas[0].ultima_visita_vet);
        console.log('  - foto_principal:', mascotas[0].foto_principal);
      }
    } else {
      console.log('\n❌ Error en upload');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

testUploadWithPhotos();
