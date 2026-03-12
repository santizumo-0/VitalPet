// ===================================
// MIDDLEWARE: UPLOAD DE IMÁGENES
// ===================================
// Configuración de multer para subir imágenes

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===================================
// CREAR CARPETAS DE ALMACENAMIENTO
// ===================================

// Crear carpeta uploads/productos si no existe
const uploadDirProductos = path.join(__dirname, '../uploads/productos');
if (!fs.existsSync(uploadDirProductos)) {
  fs.mkdirSync(uploadDirProductos, { recursive: true });
}

// Crear carpeta uploads/mascotas si no existe
const uploadDirMascotas = path.join(__dirname, '../uploads/mascotas');
if (!fs.existsSync(uploadDirMascotas)) {
  fs.mkdirSync(uploadDirMascotas, { recursive: true });
}

// ===================================
// VALIDAR TIPO DE ARCHIVO
// ===================================
const fileFilter = (req, file, cb) => {
  // Solo permitir imágenes
  const tiposPermitidos = /jpeg|jpg|png|gif|webp/;
  const extension = tiposPermitidos.test(path.extname(file.originalname).toLowerCase().replace('.', ''));

  if (extension) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
  }
};

// ===================================
// CONFIGURAR ALMACENAMIENTO - PRODUCTOS
// ===================================
const storageProductos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirProductos);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ===================================
// CONFIGURAR ALMACENAMIENTO - MASCOTAS
// ===================================
const storageMascotas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirMascotas);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ===================================
// CREAR INSTANCIAS DE MULTER
// ===================================

const uploadProductos = multer({
  storage: storageProductos,
  limits: {
    fileSize: 5 * 1024 * 1024 // Máximo 5MB
  },
  fileFilter: fileFilter
});

const uploadMascotas = multer({
  storage: storageMascotas,
  limits: {
    fileSize: 5 * 1024 * 1024 // Máximo 5MB
  },
  fileFilter: fileFilter
});

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  uploadProductos,
  uploadMascotas
};
