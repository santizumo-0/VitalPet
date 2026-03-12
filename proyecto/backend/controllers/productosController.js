// ===================================
// CONTROLLER: PRODUCTOS
// ===================================
// Lógica de negocio para productos

const productosModel = require('../models/productosModel');
const categoriasModel = require('../models/categoriasModel');

// ===================================
// 1. OBTENER TODOS LOS PRODUCTOS
// ===================================
const obtenerProductos = async (req, res) => {
  try {
    const { categoria_id, para_animal, precioMin, precioMax } = req.query;

    const filtros = {
      soloActivos: true,
      categoria_id: categoria_id ? parseInt(categoria_id) : null,
      para_animal: para_animal || null,
      precioMin: precioMin ? parseFloat(precioMin) : null,
      precioMax: precioMax ? parseFloat(precioMax) : null
    };
    
    console.log('📥 GET /api/productos con filtros:', filtros);

    const productos = await productosModel.obtenerProductos(filtros);
    
    console.log(`📤 Retornando ${productos.length} productos`);

    return res.status(200).json({
      total: productos.length,
      productos: productos
    });

  } catch (error) {
    console.error('❌ Error en obtenerProductos:', error);
    return res.status(500).json({
      error: 'Error al obtener productos',
      detalles: error.message
    });
  }
};

// ===================================
// 2. OBTENER PRODUCTO POR ID
// ===================================
const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await productosModel.obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    return res.status(200).json({
      producto: producto
    });

  } catch (error) {
    console.error('❌ Error en obtenerProducto:', error);
    return res.status(500).json({
      error: 'Error al obtener producto',
      detalles: error.message
    });
  }
};

// ===================================
// 3. CREAR PRODUCTO (ADMIN)
// ===================================
const crearProducto = async (req, res) => {
  try {
    console.log('📝 Datos recibidos en req.body:', req.body);
    console.log('📁 Archivo recibido en req.file:', req.file);
    
    // Convertir null prototype object iterando todas las propiedades
    const datos = {};
    for (let key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        datos[key] = req.body[key];
      }
    }
    console.log('✅ Datos convertidos:', datos);
    
    const { nombre, descripcion, precio, stock, categoria_id, para_animal } = datos;
    console.log('✅ Desestructurados:', { nombre, descripcion, precio, stock, categoria_id, para_animal });

    // ✓ Validar campos requeridos
    if (!nombre || !precio || stock === undefined || !categoria_id || !para_animal) {
      console.log('❌ Validación fallida. Campos recibidos:', { nombre, precio, stock, categoria_id, para_animal });
      return res.status(400).json({
        error: 'Faltan campos requeridos: nombre, precio, stock, categoria_id, para_animal'
      });
    }

    // ✓ Validar tipos de datos
    if (isNaN(precio) || precio <= 0) {
      return res.status(400).json({ error: 'Precio debe ser mayor a 0' });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock no puede ser negativo' });
    }

    // ✓ Validar categoría existe
    const categoria = await categoriasModel.obtenerCategoriaPorId(categoria_id);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // ✓ Validar para_animal
    const valoresPermitidos = ['perros', 'gatos', 'ambos'];
    if (!valoresPermitidos.includes(para_animal)) {
      return res.status(400).json({
        error: 'para_animal debe ser: perros, gatos o ambos'
      });
    }

    // ✓ Obtener ruta de imagen si se subió
    const imagen = req.file ? `/uploads/productos/${req.file.filename}` : null;
    
    console.log(`📸 Ruta de imagen: ${imagen}`);

    // ✓ Crear producto
    const producto = await productosModel.crearProducto(
      nombre,
      descripcion || null,
      parseFloat(precio),
      parseInt(stock),
      categoria_id,
      para_animal,
      imagen
    );
    
    console.log(`✅ Producto guardado en BD:`, producto);

    return res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: producto
    });

  } catch (error) {
    console.error('❌ Error en crearProducto:', error);
    return res.status(500).json({
      error: 'Error al crear producto',
      detalles: error.message
    });
  }
};

// ===================================
// 4. ACTUALIZAR PRODUCTO (ADMIN)
// ===================================
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id, para_animal, activo } = req.body;

    // ✓ Validar que el producto existe
    const productoActual = await productosModel.obtenerProductoPorId(id);
    if (!productoActual) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // ✓ Preparar datos actualizados
    const datosActualizacion = {
      nombre: nombre || productoActual.nombre,
      descripcion: descripcion !== undefined ? descripcion : productoActual.descripcion,
      precio: precio !== undefined ? parseFloat(precio) : productoActual.precio,
      stock: stock !== undefined ? parseInt(stock) : productoActual.stock,
      categoria_id: categoria_id || productoActual.categoria_id,
      para_animal: para_animal || productoActual.para_animal,
      imagen: req.file ? `/uploads/productos/${req.file.filename}` : productoActual.imagen,
      activo: activo !== undefined ? activo : productoActual.activo
    };

    // ✓ Actualizar
    const resultado = await productosModel.actualizarProducto(id, datosActualizacion);

    return res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto: resultado
    });

  } catch (error) {
    console.error('❌ Error en actualizarProducto:', error);
    return res.status(500).json({
      error: 'Error al actualizar producto',
      detalles: error.message
    });
  }
};

// ===================================
// 5. ELIMINAR PRODUCTO (ADMIN)
// ===================================
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await productosModel.eliminarProducto(id);

    return res.status(200).json({
      mensaje: 'Producto eliminado exitosamente',
      producto: resultado
    });

  } catch (error) {
    console.error('❌ Error en eliminarProducto:', error);
    return res.status(500).json({
      error: error.message || 'Error al eliminar producto',
      detalles: error.message
    });
  }
};

// ===================================
// 6. OBTENER CATEGORÍAS
// ===================================
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await categoriasModel.obtenerCategorias();

    return res.status(200).json({
      total: categorias.length,
      categorias: categorias
    });

  } catch (error) {
    console.error('❌ Error en obtenerCategorias:', error);
    return res.status(500).json({
      error: 'Error al obtener categorías',
      detalles: error.message
    });
  }
};

// ===================================
// 7. OBTENER ESTADÍSTICAS (ADMIN)
// ===================================
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await productosModel.obtenerEstadisticas();

    return res.status(200).json({
      estadisticas: estadisticas
    });

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalles: error.message
    });
  }
};

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerCategorias,
  obtenerEstadisticas
};
