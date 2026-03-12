// ===================================
// SERVIDOR PRINCIPAL - VITALPET
// ===================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Crear aplicación Express
const app = express();

// ===================================
// MIDDLEWARE
// ===================================

// CORS - Permitir peticiones desde frontend
// ✅ Configuración automática por ambiente (desarrollo/producción)
app.use(cors({
  origin: function(origin, callback) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'file://',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];
    
    if (isDevelopment) {
      // Desarrollo: permitir localhost y file://
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ CORS bloqueado para origen:', origin);
        callback(new Error('CORS no permitido'));
      }
    } else {
      // Producción: permitir dominio desde FRONTEND_URL
      const frontendUrl = process.env.FRONTEND_URL;
      if (!origin || origin === frontendUrl) {
        callback(null, true);
      } else {
        console.log('❌ CORS bloqueado para origen:', origin);
        callback(new Error('CORS no permitido'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Body Parser - Convertir JSON a objetos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos (fotos, etc)
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
console.log('📁 Sirviendo archivos estáticos desde: /uploads');

// ===================================
// RUTAS
// ===================================

// Ruta de prueba (raíz)
app.get('/', (req, res) => {
  res.json({
    mensaje: '✅ Backend de VitalPet está funcionando',
    version: '1.0.0',
    estado: 'activo'
  });
});

// ✅ Rutas de autenticación (Registro, Login, Perfil)
app.use('/api/auth', require('./routes/auth'));

// ✅ Rutas de usuarios (Perfil, contraseña, cuenta)
app.use('/api/usuarios', require('./routes/usuarios'));

// ✅ Rutas de administración (Panel admin)
app.use('/api/admin', require('./routes/admin'));

// ✅ Rutas de productos (Catálogo, crear productos admin)
app.use('/api/productos', require('./routes/productos'));

// ✅ Rutas de pedidos (Compras, historial de pedidos)
app.use('/api/pedidos', require('./routes/pedidos'));

// ✅ Rutas de mascotas (Perfil, alimentación, vacunas, emergencia, galería)
app.use('/api/mascotas', require('./routes/mascotas'));

// ✅ Rutas de citas (Agendamiento de citas veterinarias y estética)
app.use('/api/citas', require('./routes/citas'));

// ✅ Rutas de servicios (Veterinaria, estética, grooming)
app.use('/api/servicios', require('./routes/servicios'));

// ===================================
// MANEJO DE ERRORES
// ===================================

// Ruta 404 - No encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// ===================================
// INICIAR SERVIDOR
// ===================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log('\n================================');
  console.log('🚀 SERVIDOR DE VITALPET');
  console.log('================================');
  console.log(`✅ Puerto: ${PORT}`);
  console.log(`✅ Ambiente: ${NODE_ENV}`);
  console.log(`✅ URL: http://localhost:${PORT}`);
  console.log('================================\n');
});

module.exports = app;
