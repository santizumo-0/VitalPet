// ===================================
// MODEL: PRODUCTOS
// ===================================
// Funciones para acceder a tabla productos con manejo de stock

const pool = require('../config/database');

// ===================================
// 1. CREAR PRODUCTO (ADMIN)
// ===================================
const crearProducto = async (nombre, descripcion, precio, stock, categoriaId, paraAnimal, imagen) => {
  try {
    console.log('🟦 [CREAR PRODUCTO] Iniciando...');
    console.log('📥 Parámetros recibidos:', { nombre, descripcion, precio, stock, categoriaId, paraAnimal, imagen });
    
    const query = `INSERT INTO productos 
       (nombre, descripcion, precio, stock, categoria_id, para_animal, imagen, activo, fecha_creacion, fecha_actualizacion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`;
    
    const valores = [nombre, descripcion, precio, stock, categoriaId, paraAnimal, imagen || null];
    
    console.log('📋 Query SQL:', query);
    console.log('🔢 Valores:', valores);
    
    const [resultado] = await pool.query(query, valores);
    
    console.log('✅ INSERT exitoso en tabla productos');
    console.log('🆔 ID generado:', resultado.insertId);
    console.log('📊 Resultado completo:', resultado);

    const productoGuardado = {
      id: resultado.insertId,
      nombre,
      descripcion,
      precio,
      stock,
      categoria_id: categoriaId,
      para_animal: paraAnimal,
      imagen,
      activo: true,
      fecha_creacion: new Date(),
      mensaje: 'Producto creado exitosamente'
    };
    
    console.log('🎉 Producto guardado retorna:', productoGuardado);
    return productoGuardado;
    
  } catch (error) {
    console.error('❌ ERROR EN crearProducto:', error);
    console.error('📌 Error message:', error.message);
    console.error('📌 Error code:', error.code);
    console.error('📌 Error errno:', error.errno);
    throw error;
  }
};

// ===================================
// 2. OBTENER TODOS LOS PRODUCTOS
// ===================================
const obtenerProductos = async (filtros = {}) => {
  try {
    let query = `SELECT 
                  p.id, p.nombre, p.descripcion, p.precio, p.stock, 
                  p.categoria_id, p.para_animal, p.imagen, p.activo, 
                  p.fecha_creacion,
                  c.nombre AS categoria_nombre
                 FROM productos p
                 LEFT JOIN categorias c ON p.categoria_id = c.id
                 WHERE 1=1`;
    
    const params = [];

    // Filtro: solo activos
    if (filtros.soloActivos !== false) {
      query += ' AND p.activo = true';
    }

    // Filtro: por categoría
    if (filtros.categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(filtros.categoria_id);
    }

    // Filtro: por animal
    if (filtros.para_animal) {
      query += ' AND p.para_animal IN (?, "ambos")';
      params.push(filtros.para_animal);
    }

    // Filtro: rango de precio
    if (filtros.precioMin && filtros.precioMax) {
      query += ' AND p.precio BETWEEN ? AND ?';
      params.push(filtros.precioMin, filtros.precioMax);
    }

    query += ' ORDER BY p.nombre ASC';
    
    console.log('🔍 Query productos:', query);
    console.log('📊 Parámetros:', params);

    const [productos] = await pool.query(query, params);
    
    console.log(`✅ Se obtuvieron ${productos.length} productos`);
    if (productos.length > 0) {
      console.log('📦 Primer producto:', productos[0]);
    }
    
    return productos;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER PRODUCTO POR ID
// ===================================
const obtenerProductoPorId = async (id) => {
  try {
    const [productos] = await pool.query(
      `SELECT 
        p.id, p.nombre, p.descripcion, p.precio, p.stock, 
        p.categoria_id, p.para_animal, p.imagen, p.activo, 
        p.fecha_creacion,
        c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (productos.length === 0) return null;
    return productos[0];
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    throw error;
  }
};

// ===================================
// 4. ACTUALIZAR PRODUCTO (ADMIN)
// ===================================
const actualizarProducto = async (id, datos) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id, para_animal, imagen, activo } = datos;

    const [resultado] = await pool.query(
      `UPDATE productos 
       SET nombre = ?, descripcion = ?, precio = ?, stock = ?, 
           categoria_id = ?, para_animal = ?, imagen = ?, activo = ?, fecha_actualizacion = NOW()
       WHERE id = ?`,
      [nombre, descripcion, precio, stock, categoria_id, para_animal, imagen, activo, id]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('Producto no encontrado');
    }

    return { id, mensaje: 'Producto actualizado exitosamente' };
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    throw error;
  }
};

// ===================================
// 5. RESTAR STOCK (Cuando se compra)
// ===================================
const restarStock = async (productoId, cantidad) => {
  try {
    // ✓ Verificar que hay stock suficiente
    const producto = await obtenerProductoPorId(productoId);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    if (producto.stock < cantidad) {
      throw new Error(`Stock insuficiente. Disponibles: ${producto.stock}`);
    }

    // ✓ Restar stock
    const [resultado] = await pool.query(
      'UPDATE productos SET stock = stock - ?, fecha_actualizacion = NOW() WHERE id = ?',
      [cantidad, productoId]
    );

    // ✓ Si stock llegó a 0, desactivar producto
    if (producto.stock - cantidad === 0) {
      await pool.query('UPDATE productos SET activo = false WHERE id = ?', [productoId]);
    }

    return { id: productoId, stock_anterior: producto.stock, stock_nuevo: producto.stock - cantidad };
  } catch (error) {
    console.error('❌ Error al restar stock:', error);
    throw error;
  }
};

// ===================================
// 6. SUMAR STOCK (Cuando se cancela compra)
// ===================================
const sumarStock = async (productoId, cantidad) => {
  try {
    const producto = await obtenerProductoPorId(productoId);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // ✓ Sumar stock
    const [resultado] = await pool.query(
      'UPDATE productos SET stock = stock + ?, activo = true, fecha_actualizacion = NOW() WHERE id = ?',
      [cantidad, productoId]
    );

    return { id: productoId, stock_anterior: producto.stock, stock_nuevo: producto.stock + cantidad };
  } catch (error) {
    console.error('❌ Error al sumar stock:', error);
    throw error;
  }
};

// ===================================
// 7. ELIMINAR PRODUCTO (ADMIN)
// ===================================
const eliminarProducto = async (id) => {
  try {
    // En lugar de eliminar, desactivamos el producto (soft delete)
    // Esto preserva el histórico de pedidos
    const [resultado] = await pool.query(
      'UPDATE productos SET activo = false, fecha_actualizacion = NOW() WHERE id = ?', 
      [id]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('Producto no encontrado');
    }

    console.log(`✅ Producto ${id} desactivado exitosamente`);
    return { id, mensaje: 'Producto desactivado exitosamente (no se muestra en tienda)' };
  } catch (error) {
    console.error('❌ Error al desactivar producto:', error);
    throw error;
  }
};

// ===================================
// 8. OBTENER ESTADÍSTICAS (ADMIN)
// ===================================
const obtenerEstadisticas = async () => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_productos,
        SUM(CASE WHEN activo = true THEN 1 ELSE 0 END) AS productos_activos,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS productos_agotados,
        SUM(CASE WHEN stock < 3 THEN 1 ELSE 0 END) AS productos_bajo_stock,
        SUM(stock) AS stock_total,
        AVG(precio) AS precio_promedio
      FROM productos
    `);

    return stats[0];
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
};

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  restarStock,
  sumarStock,
  eliminarProducto,
  obtenerEstadisticas
};
