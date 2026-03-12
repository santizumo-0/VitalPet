// ===================================
// RUTAS: PRODUCTOS
// ===================================
// Endpoints para productos

const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verificarToken = require('../middleware/auth');
const verificarAdmin = require('../middleware/verifyAdmin');
const { uploadProductos } = require('../middleware/upload');

// ===================================
// RUTAS PÚBLICAS
// ===================================

// GET /api/productos - Obtener todos los productos
// Query: ?categoria_id=1&para_animal=perros&precioMin=10&precioMax=100
router.get('/', productosController.obtenerProductos);

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', productosController.obtenerProducto);

// GET /api/categorias - Obtener categorías
router.get('/categorias/todas', productosController.obtenerCategorias);

// ===================================
// RUTAS PROTEGIDAS ADMIN - PRODUCTOS
// ===================================

// POST /api/admin/productos - Crear producto
// Body: { nombre, descripcion, precio, stock, categoria_id, para_animal }
// File: imagen
router.post('/admin/crear', verificarAdmin, uploadProductos.single('imagen'), productosController.crearProducto);

// PUT /api/admin/productos/:id - Actualizar producto
// Body: { nombre, descripcion, precio, stock, categoria_id, para_animal, activo }
// File: imagen (opcional)
router.put('/admin/:id', verificarAdmin, uploadProductos.single('imagen'), productosController.actualizarProducto);

// DELETE /api/admin/productos/:id - Eliminar producto
router.delete('/admin/:id', verificarAdmin, productosController.eliminarProducto);

// GET /api/admin/productos/estadisticas - Estadísticas
router.get('/admin/estadisticas', verificarAdmin, productosController.obtenerEstadisticas);

// ===================================
// EXPORTAR
// ===================================
module.exports = router;
