// ===============================
// VITALPET - CONFIRMACION.JS
// Obtiene datos del pedido del SERVIDOR (no solo localStorage)
// Muestra confirmación de compra al usuario
// ===============================

// Helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// UI Elements
const pedidoIdDisplay = $("#pedidoId");
const estadoPedidoDisplay = $("#estadoPedido");
const detallesCarrito = $("#detallesCarrito");
const detallesCliente = $("#detallesCliente");
const detallesMetodoPago = $("#detallesMetodoPago");
const detallesTotales = $("#detallesTotales");
const alertError = $("#alertError");
const alertSuccess = $("#alertSuccess");
const loadingOverlay = $("#loadingOverlay");
const btnVolver = $("#btnVolver");
const btnDescargarPDF = $("#btnDescargarPDF");

let pedidoData = null;

// ===============================
// Helpers
// ===============================

function formatPrice(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}

function showAlert(type, msg) {
  if (alertError) alertError.classList.remove("show");
  if (alertSuccess) alertSuccess.classList.remove("show");

  const el = type === "error" ? alertError : alertSuccess;
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function hideAlerts() {
  if (alertError) alertError.classList.remove("show");
  if (alertSuccess) alertSuccess.classList.remove("show");
}

// ===============================
// Obtener Pedido del SERVIDOR
// ===============================

async function cargarPedidoDelServidor() {
  /**
   * CRÍTICO: Obtener pedido del servidor, no solo localStorage
   * Esto asegura que el pedido realmente se guardó en BD
   */
  
  try {
    // Mostrar loading
    if (loadingOverlay) loadingOverlay.classList.add("active");

    // Obtener ID del pedido desde localStorage
    let pedidoId = null;
    if (typeof Storage !== 'undefined' && Storage.getPedidoConfirmado) {
      pedidoId = Storage.getPedidoConfirmado();
    } else {
      pedidoId = parseInt(localStorage.getItem("vitalpet_pedido_id"));
    }

    if (!pedidoId) {
      throw new Error("No se encontró ID de pedido. ¿Viniste de checkout?");
    }

    // ⭐ OBTENER DEL SERVIDOR (no localStorage)
    const respuesta = await API.Pedidos.obtenerPorId(pedidoId);
    pedidoData = respuesta;

    // Ocultar loading
    if (loadingOverlay) loadingOverlay.classList.remove("active");

    // Mostrar datos
    mostrarConfirmacion();
    showAlert("success", "✅ Tu compra fue registrada correctamente");

  } catch (error) {
    if (loadingOverlay) loadingOverlay.classList.remove("active");

    console.error("Error al cargar pedido:", error);

    // Si no está en servidor, usar localStorage como fallback
    console.warn("Intentando usar datos de localStorage como fallback...");
    usarDataLocalStorage();
  }
}

// ===============================
// Fallback: Usar localStorage (en caso de error)
// ===============================

function usarDataLocalStorage() {
  /**
   * Si no puedes obtener del servidor, usa localStorage
   * (puede pasar si hay error de conexión)
   */
  const checkoutData = localStorage.getItem("vitalpet_checkout_data");

  if (!checkoutData) {
    showAlert("error", "Error: No se encontraron datos de la compra. Por favor contacta al administrador.");
    return;
  }

  pedidoData = JSON.parse(checkoutData);
  mostrarConfirmacion();
  
  showAlert("warning", "⚠️ Datos cargados localmente. Tu compra está procesándose en nuestro servidor.");
}

// ===============================
// Mostrar Confirmación
// ===============================

function mostrarConfirmacion() {
  if (!pedidoData) return;

  hideAlerts();

  // 1. ID y Estado del pedido
  if (pedidoIdDisplay) {
    pedidoIdDisplay.textContent = `#${pedidoData.pedido_id || pedidoData.id}`;
  }

  if (estadoPedidoDisplay) {
    const estado = pedidoData.estado || "pendiente";
    let estadoBg = "bg-warning";
    
    if (estado === "entregado") estadoBg = "bg-success";
    if (estado === "cancelado") estadoBg = "bg-danger";
    if (estado === "enviado") estadoBg = "bg-info";
    
    estadoPedidoDisplay.innerHTML = `
      <span class="${estadoBg}">
        ${estado.toUpperCase()}
      </span>
    `;
  }

  // 2. Detalles del carrito
  if (detallesCarrito && pedidoData.carrito) {
    detallesCarrito.innerHTML = `
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${pedidoData.carrito.map(item => `
            <tr>
              <td>${item.name || item.nombre}</td>
              <td>${item.qty || item.cantidad}</td>
              <td>${formatPrice(item.price || item.precio_unitario)}</td>
              <td>${formatPrice((item.price || item.precio_unitario) * (item.qty || item.cantidad))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // 3. Detalles del cliente
  if (detallesCliente) {
    detallesCliente.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <strong>Nombre:</strong> ${pedidoData.nombre || 'N/A'}<br>
          <strong>Email:</strong> ${pedidoData.email || 'N/A'}<br>
          <strong>Teléfono:</strong> ${pedidoData.telefono || 'N/A'}
        </div>
        <div class="col-md-6">
          <strong>Dirección:</strong><br>
          ${pedidoData.direccion || 'N/A'}
        </div>
      </div>
    `;
  }

  // 4. Método de pago
  if (detallesMetodoPago) {
    const metodoPago = pedidoData.metodoPago || 'No especificado';
    detallesMetodoPago.innerHTML = `
      <strong>Método de pago:</strong> ${metodoPago}
    `;
  }

  // 5. Totales
  if (detallesTotales) {
    const subtotal = pedidoData.subtotal || 0;
    const envio = pedidoData.envio || 0;
    const total = pedidoData.total || (subtotal + envio);

    detallesTotales.innerHTML = `
      <div style="border-top: 2px solid #ddd; padding-top: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Subtotal:</span>
          <strong>${formatPrice(subtotal)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span>Envío:</span>
          <strong>${envio === 0 ? 'GRATIS 🎉' : formatPrice(envio)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.2em; border-top: 2px solid #ddd; padding-top: 10px;">
          <span><strong>TOTAL:</strong></span>
          <strong style="color: #28a745;">${formatPrice(total)}</strong>
        </div>
      </div>
    `;
  }
}

// ===============================
// Eventos
// ===============================

if (btnVolver) {
  btnVolver.addEventListener("click", () => {
    // Limpiar localStorage
    if (typeof Storage !== 'undefined' && Storage.limpiarPedidoConfirmado) {
      Storage.limpiarPedidoConfirmado();
    } else {
      localStorage.removeItem("vitalpet_pedido_id");
    }
    
    // Ir a inicio
    window.location.href = "inicio.html";
  });
}

if (btnDescargarPDF) {
  btnDescargarPDF.addEventListener("click", () => {
    alert("Funcionalidad de descarga PDF en desarrollo 📋");
    // TODO: Implementar descarga de PDF
  });
}

// ===============================
// INIT
// ===============================

// Cargar datos del servidor cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  cargarPedidoDelServidor();
});
