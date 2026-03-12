// ===================================
// CONTROLLER: PEDIDOS
// ===================================
// Lógica de negocio para pedidos

const pedidosModel = require('../models/pedidosModel');
const productosModel = require('../models/productosModel');

// ===================================
// 1. CREAR PEDIDO
// ===================================
const crearPedido = async (req, res) => {
  try {
    // ✅ VALIDAR QUE EL USUARIO ESTÉ AUTENTICADO
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({
        error: 'Debes estar logueado para hacer una compra'
      });
    }
    
    let usuarioId = req.usuario.id;
    
    // ✅ Aceptar tanto estructura nueva como antigua
    let email, telefono, direccion, metodo_pago, items, subtotal, envio, total, cliente, carrito, metodoPago, notas;

    // Si viene estructura nueva (con cliente {...})
    if (req.body.cliente) {
      cliente = req.body.cliente;
      email = cliente.email;
      telefono = cliente.telefono;
      direccion = cliente.direccion; // String completo
      carrito = req.body.carrito;
      items = carrito; // Mapear carrito a items
      metodoPago = req.body.metodoPago;
      metodo_pago = metodoPago === 'efectivo' ? 'contra_entrega' : metodoPago;
      subtotal = req.body.subtotal;
      envio = req.body.envio;
      total = req.body.total;
      notas = req.body.notas;
    } else {
      // Estructura antigua (parámetros planos)
      ({ email, telefono, direccion, metodo_pago, items, subtotal, envio, total } = req.body);
    }

    // ✓ Validar campos requeridos
    if (!email || !telefono || !direccion || !metodo_pago || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Faltan campos: email, telefono, direccion, metodo_pago, items (array)'
      });
    }

    // ✓ Validar dirección
    // Puede ser string o objeto
    let direccionObj = {};
    if (typeof direccion === 'string') {
      // Parsear string en objeto (ej: "Cra 50 #11-45, Apt 502, CP 050021, Medellín - Antioquia")
      // Simplemente lo guardamos como está
      direccionObj = { completa: direccion };
    } else {
      // Es un objeto
      direccionObj = direccion;
      if (!direccion.calle || !direccion.numero || !direccion.ciudad || !direccion.departamento) {
        return res.status(400).json({
          error: 'Dirección incompleta. Requerido: calle, numero, ciudad, departamento'
        });
      }
    }

    // ✓ Validar método de pago
    const metodosValidos = ['tarjeta', 'pse', 'nequi', 'contra_entrega'];
    if (!metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({
        error: `Método de pago inválido. Opciones: ${metodosValidos.join(', ')}`
      });
    }

    // ✓ Procesar items y verificar stock
    const detalles = [];
    for (const item of items) {
      // El item puede tener estructura { id, name, price, qty, image, producto_id }
      const productoId = item.producto_id || item.id;
      const cantidad = item.qty || item.cantidad || 1;
      
      if (!productoId) {
        return res.status(400).json({ error: 'Cada item debe tener producto_id o id' });
      }

      // Verificar que el producto existe y tiene stock
      const producto = await productosModel.obtenerProductoPorId(productoId);
      if (!producto) {
        return res.status(404).json({ error: `Producto ${productoId} no encontrado` });
      }

      if (producto.stock < cantidad) {
        return res.status(409).json({
          error: `Stock insuficiente para ${producto.nombre}. Disponibles: ${producto.stock}`
        });
      }

      // Restar stock
      await productosModel.restarStock(productoId, cantidad);

      detalles.push({
        producto_id: productoId,
        cantidad: cantidad,
        precio_unitario: item.price || producto.precio,
        subtotal: (item.price || producto.precio) * cantidad
      });
    }

    // ✓ Crear pedido
    const pedido = await pedidosModel.crearPedido(
      usuarioId,
      email,
      telefono,
      typeof direccion === 'string' ? direccion : JSON.stringify(direccionObj),
      metodo_pago,
      parseFloat(subtotal) || 0,
      parseFloat(envio) || 0,
      parseFloat(total),
      detalles,
      notas
    );

    return res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      pedido_id: pedido.insertId || pedido.id,
      estado: 'pendiente',
      pedido: pedido
    });

  } catch (error) {
    console.error('❌ Error en crearPedido:', error);
    return res.status(500).json({
      error: 'Error al crear pedido',
      detalles: error.message
    });
  }
};

// ===================================
// 2. OBTENER MIS PEDIDOS
// ===================================
const obtenerMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const pedidos = await pedidosModel.obtenerMisPedidos(usuarioId);

    return res.status(200).json({
      total: pedidos.length,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('❌ Error en obtenerMisPedidos:', error);
    return res.status(500).json({
      error: 'Error al obtener pedidos',
      detalles: error.message
    });
  }
};

// ===================================
// 3. OBTENER PEDIDO POR ID
// ===================================
const obtenerPedido = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const pedido = await pedidosModel.obtenerPedidoPorId(id, usuarioId);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      });
    }

    return res.status(200).json({
      pedido: pedido
    });

  } catch (error) {
    console.error('❌ Error en obtenerPedido:', error);
    return res.status(500).json({
      error: 'Error al obtener pedido',
      detalles: error.message
    });
  }
};

// ===================================
// 4. CANCELAR PEDIDO
// ===================================
const cancelarPedido = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    // ✓ Obtener pedido para verificar estado
    const pedido = await pedidosModel.obtenerPedidoPorId(id, usuarioId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Solo se puede cancelar si está pendiente o confirmado
    if (pedido.estado === 'en_transito' || pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      return res.status(400).json({
        error: `No se puede cancelar un pedido ${pedido.estado}`
      });
    }

    // ✓ Devolver stock de los productos
    const detalles = await pedidosModel.obtenerDetallesPedido(id);
    for (const detalle of detalles) {
      await productosModel.sumarStock(detalle.producto_id, detalle.cantidad);
    }

    // ✓ Cancelar pedido
    const resultado = await pedidosModel.cancelarPedido(id, usuarioId);

    return res.status(200).json({
      mensaje: 'Pedido cancelado exitosamente',
      pedido: resultado
    });

  } catch (error) {
    console.error('❌ Error en cancelarPedido:', error);
    return res.status(500).json({
      error: error.message || 'Error al cancelar pedido',
      detalles: error.message
    });
  }
};

// ===================================
// 5. OBTENER TODOS LOS PEDIDOS (ADMIN)
// ===================================
const obtenerTodosPedidos = async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, metodo_pago } = req.query;

    const filtros = {
      estado: estado || null,
      fecha_desde: fecha_desde || null,
      fecha_hasta: fecha_hasta || null,
      metodo_pago: metodo_pago || null
    };

    const pedidos = await pedidosModel.obtenerTodosPedidos(filtros);

    return res.status(200).json({
      total: pedidos.length,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('❌ Error en obtenerTodosPedidos:', error);
    return res.status(500).json({
      error: 'Error al obtener pedidos',
      detalles: error.message
    });
  }
};

// ===================================
// 6. ACTUALIZAR ESTADO DE PEDIDO (ADMIN)
// ===================================
const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        error: 'Campo requerido: estado'
      });
    }

    const resultado = await pedidosModel.actualizarEstadoPedido(id, estado);

    return res.status(200).json({
      mensaje: 'Estado actualizado exitosamente',
      pedido: resultado
    });

  } catch (error) {
    console.error('❌ Error en actualizarEstadoPedido:', error);
    return res.status(500).json({
      error: error.message || 'Error al actualizar estado',
      detalles: error.message
    });
  }
};

// ===================================
// 7. OBTENER DETALLES DE PEDIDO
// ===================================
const obtenerDetallesPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const detalles = await pedidosModel.obtenerDetallesPedido(id);

    return res.status(200).json({
      total: detalles.length,
      detalles: detalles
    });

  } catch (error) {
    console.error('❌ Error en obtenerDetallesPedido:', error);
    return res.status(500).json({
      error: 'Error al obtener detalles',
      detalles: error.message
    });
  }
};

// ===================================
// 8. OBTENER ESTADÍSTICAS (ADMIN)
// ===================================
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await pedidosModel.obtenerEstadisticas();

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
  crearPedido,
  obtenerMisPedidos,
  obtenerPedido,
  cancelarPedido,
  obtenerTodosPedidos,
  actualizarEstadoPedido,
  obtenerDetallesPedido,
  obtenerEstadisticas
};
