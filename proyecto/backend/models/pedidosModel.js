// ===================================
// MODEL: PEDIDOS
// ===================================
// Funciones para acceder a tabla pedidos y detalles_pedidos

const pool = require('../config/database');

// ===================================
// 1. CREAR PEDIDO
// ===================================
const crearPedido = async (usuarioId, email, telefono, direccion, metodoPago, subtotal, envio, total, detalles, notas = null) => {
  try {
    // Iniciar transacción para evitar inconsistencias
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // ✓ Parsear dirección (puede ser string o objeto)
      let direccionData = {};
      if (typeof direccion === 'string') {
        // Es un string completo, lo guardamos como campo completo
        direccionData = {
          calle: direccion,
          numero: '',
          apartamento: null,
          codigo_postal: '',
          ciudad: '',
          departamento: ''
        };
      } else {
        // Es un objeto
        direccionData = {
          calle: direccion.calle || '',
          numero: direccion.numero || '',
          apartamento: direccion.apartamento || null,
          codigo_postal: direccion.codigo_postal || '',
          ciudad: direccion.ciudad || '',
          departamento: direccion.departamento || ''
        };
      }

      // ✓ Insertar pedido
      const [resuladoPedido] = await connection.query(
        `INSERT INTO pedidos 
         (usuario_id, email, telefono, metodo_pago, estado,
          direccion_calle, direccion_numero, direccion_apartamento, 
          direccion_codigo_postal, direccion_ciudad, direccion_departamento,
          subtotal, envio, total, notas, fecha_creacion, fecha_actualizacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          usuarioId, email, telefono, metodoPago, 'pendiente',
          direccionData.calle, direccionData.numero, direccionData.apartamento,
          direccionData.codigo_postal, direccionData.ciudad, direccionData.departamento,
          subtotal, envio, total, notas
        ]
      );

      const pedidoId = resuladoPedido.insertId;

      // ✓ Insertar detalles del pedido
      for (const detalle of detalles) {
        await connection.query(
          `INSERT INTO detalles_pedidos 
           (pedido_id, producto_id, cantidad, precio_unitario, subtotal, fecha_creacion) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [pedidoId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
        );
      }

      await connection.commit();
      connection.release();

      return {
        insertId: pedidoId,
        id: pedidoId,
        usuario_id: usuarioId,
        email: email,
        telefono: telefono,
        estado: 'pendiente',
        metodo_pago: metodoPago,
        subtotal: subtotal,
        envio: envio,
        total: total,
        notas: notas,
        mensaje: 'Pedido creado exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    throw error;
  }
};

// ===================================
// 2. OBTENER PEDIDO POR ID
// ===================================
const obtenerPedidoPorId = async (id, usuarioId = null) => {
  try {
    let query = `SELECT 
                  p.id, p.usuario_id, p.email, p.telefono, p.estado, p.metodo_pago,
                  p.direccion_calle, p.direccion_numero, p.direccion_apartamento,
                  p.direccion_codigo_postal, p.direccion_ciudad, p.direccion_departamento,
                  p.subtotal, p.envio, p.total, p.fecha_creacion, p.fecha_actualizacion
                 FROM pedidos p
                 WHERE p.id = ?`;
    
    const params = [id];

    if (usuarioId) {
      query += ' AND p.usuario_id = ?';
      params.push(usuarioId);
    }

    const [pedidos] = await pool.query(query, params);
    if (pedidos.length === 0) return null;

    const pedido = pedidos[0];

    // ✓ Obtener detalles del pedido
    const [detalles] = await pool.query(
      `SELECT 
        dp.id, dp.producto_id, dp.cantidad, dp.precio_unitario, dp.subtotal,
        pr.nombre AS producto_nombre, pr.imagen AS producto_imagen
       FROM detalles_pedidos dp
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       WHERE dp.pedido_id = ?`,
      [id]
    );

    pedido.detalles = detalles;
    return pedido;
  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    throw error;
  }
};

// ===================================
// 3. OBTENER PEDIDOS DEL USUARIO
// ===================================
const obtenerMisPedidos = async (usuarioId) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT 
        p.id, p.usuario_id, p.email, p.telefono, p.total, p.estado, p.metodo_pago, 
        p.fecha_creacion, p.fecha_actualizacion,
        p.direccion_calle, p.direccion_numero, p.direccion_apartamento, 
        p.direccion_codigo_postal, p.direccion_ciudad, p.direccion_departamento,
        p.subtotal, p.envio, p.notas
       FROM pedidos p
       WHERE p.usuario_id = ?
       ORDER BY p.fecha_creacion DESC`,
      [usuarioId]
    );

    return pedidos;
  } catch (error) {
    console.error('❌ Error al obtener mis pedidos:', error);
    throw error;
  }
};

// ===================================
// 4. OBTENER TODOS LOS PEDIDOS (ADMIN)
// ===================================
const obtenerTodosPedidos = async (filtros = {}) => {
  try {
    let query = `SELECT 
                  p.id, p.usuario_id, p.email, p.telefono, p.total, p.estado, 
                  p.metodo_pago, p.fecha_creacion,
                  u.nombre AS usuario_nombre
                 FROM pedidos p
                 LEFT JOIN usuarios u ON p.usuario_id = u.id
                 WHERE 1=1`;
    
    const params = [];

    // Filtro: por estado
    if (filtros.estado) {
      query += ' AND p.estado = ?';
      params.push(filtros.estado);
    }

    // Filtro: por rango de fecha
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      query += ' AND p.fecha_creacion BETWEEN ? AND ?';
      params.push(filtros.fecha_desde, filtros.fecha_hasta);
    }

    // Filtro: por método de pago
    if (filtros.metodo_pago) {
      query += ' AND p.metodo_pago = ?';
      params.push(filtros.metodo_pago);
    }

    query += ' ORDER BY p.fecha_creacion DESC';

    const [pedidos] = await pool.query(query, params);
    return pedidos;
  } catch (error) {
    console.error('❌ Error al obtener todos los pedidos:', error);
    throw error;
  }
};

// ===================================
// 5. ACTUALIZAR ESTADO DE PEDIDO (ADMIN)
// ===================================
const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
  try {
    const estadosValidos = ['pendiente', 'confirmado', 'en_transito', 'entregado', 'cancelado'];

    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    const [resultado] = await pool.query(
      'UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [nuevoEstado, pedidoId]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('Pedido no encontrado');
    }

    return { id: pedidoId, estado: nuevoEstado, mensaje: 'Estado actualizado exitosamente' };
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    throw error;
  }
};

// ===================================
// 6. CANCELAR PEDIDO
// ===================================
const cancelarPedido = async (pedidoId, usuarioId = null) => {
  try {
    let query = 'UPDATE pedidos SET estado = "cancelado", fecha_actualizacion = NOW() WHERE id = ?';
    const params = [pedidoId];

    if (usuarioId) {
      query += ' AND usuario_id = ?';
      params.push(usuarioId);
    }

    const [resultado] = await pool.query(query, params);

    if (resultado.affectedRows === 0) {
      throw new Error('Pedido no encontrado');
    }

    return { id: pedidoId, estado: 'cancelado', mensaje: 'Pedido cancelado exitosamente' };
  } catch (error) {
    console.error('❌ Error al cancelar pedido:', error);
    throw error;
  }
};

// ===================================
// 7. OBTENER DETALLES DE PEDIDO
// ===================================
const obtenerDetallesPedido = async (pedidoId) => {
  try {
    const [detalles] = await pool.query(
      `SELECT 
        dp.id, dp.pedido_id, dp.producto_id, dp.cantidad, 
        dp.precio_unitario, dp.subtotal, dp.fecha_creacion,
        pr.nombre AS producto_nombre, pr.imagen AS producto_imagen
       FROM detalles_pedidos dp
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       WHERE dp.pedido_id = ?`,
      [pedidoId]
    );

    return detalles;
  } catch (error) {
    console.error('❌ Error al obtener detalles:', error);
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
        COUNT(*) AS total_pedidos,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
        SUM(CASE WHEN estado = 'en_transito' THEN 1 ELSE 0 END) AS en_transito,
        SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) AS entregados,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
        SUM(total) AS ingresos_totales,
        AVG(total) AS valor_promedio_pedido
      FROM pedidos
    `);

    return stats[0];
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
};

// ===================================
// ASOCIAR COMPRAS ANTIGUAS (GUEST) CON NUEVO USUARIO
// ===================================
// Cuando un usuario se registra/login, asocia sus compras antiguas hechas como visitante
const asociarComprasAntiguasPorEmail = async (usuarioId, email) => {
  try {
    if (!usuarioId || !email) return 0;

    const [resultado] = await pool.execute(
      `UPDATE pedidos 
       SET usuario_id = ? 
       WHERE usuario_id IS NULL AND email = ?`,
      [usuarioId, email]
    );

    return resultado.affectedRows;
  } catch (error) {
    console.error('Error asociando compras antiguas:', error);
    return 0;
  }
};

// ===================================
// EXPORTAR
// ===================================
module.exports = {
  crearPedido,
  obtenerPedidoPorId,
  obtenerMisPedidos,
  obtenerTodosPedidos,
  actualizarEstadoPedido,
  cancelarPedido,
  obtenerDetallesPedido,
  obtenerEstadisticas,
  asociarComprasAntiguasPorEmail
};
