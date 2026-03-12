// ===============================
// VITALPET - CHECKOUT.JS
// Lee carrito desde localStorage
// Renderiza + valida + guarda datos para confirmación
// INTEGRADO CON API BACKEND
// ===============================

// Helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const CART_KEY = "vitalpet_cart";
const CHECKOUT_DATA_KEY = "vitalpet_checkout_data";

// UI
const cartItemsList = $("#cartItemsList");
const subtotalDisplay = $("#subtotalDisplay");
const envioDisplay = $("#envioDisplay");
const totalDisplay = $("#totalDisplay");

const btnVolver = $("#btnVolver");
const btnProcesar = $("#btnProcesar");

const alertError = $("#alertError");
const alertSuccess = $("#alertSuccess");
const alertWarning = $("#alertWarning");

const processingOverlay = $("#processingOverlay");

// Campos form
const nombreCliente = $("#nombreCliente");
const emailCliente = $("#emailCliente");
const telefonoCliente = $("#telefonoCliente");

const direccionCalle = $("#direccionCalle");
const direccionNumero = $("#direccionNumero");
const direccionApartamento = $("#direccionApartamento");
const direccionCodigoPostal = $("#direccionCodigoPostal");
const direccionCiudad = $("#direccionCiudad");
const direccionDepartamento = $("#direccionDepartamento");

const notasOrden = $("#notasOrden");

// Pago
const paymentCards = $$(".payment-method-card");

// Estado
let cart = [];
let selectedPayment = "efectivo"; // ✅ Solo contra entrega

// ===============================
// Helpers precio
// ===============================
function formatPrice(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}

// ===============================
// Alerts
// ===============================
function hideAlerts() {
  alertError.classList.remove("show");
  alertSuccess.classList.remove("show");
  alertWarning.classList.remove("show");
}

function showAlert(type, msg) {
  hideAlerts();

  const el =
    type === "error" ? alertError :
    type === "success" ? alertSuccess :
    alertWarning;

  el.textContent = msg;
  el.classList.add("show");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===============================
// Storage - Usar helpers de Storage.js
// ===============================
function loadCartFromStorage() {
  // Usar Storage.js helper si está disponible
  if (typeof Storage !== 'undefined' && Storage.getCarrito) {
    cart = Storage.getCarrito();
  } else {
    // Fallback si Storage.js no está cargado
    const saved = localStorage.getItem(CART_KEY);
    cart = saved ? JSON.parse(saved) : [];
  }
}

function saveCartToStorage() {
  if (typeof Storage !== 'undefined' && Storage.setCarrito) {
    Storage.setCarrito(cart);
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
}

function clearCartStorage() {
  if (typeof Storage !== 'undefined' && Storage.limpiarCarrito) {
    Storage.limpiarCarrito();
  } else {
    localStorage.removeItem(CART_KEY);
  }
}

// ===============================
// Totales
// ===============================
function getSubtotal() {
  return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
}

function getShippingCost(subtotal) {
  if (subtotal === 0) return 0;
  if (subtotal >= 50000) return 0;
  return 8000;
}

function updateTotals() {
  const subtotal = getSubtotal();
  const envio = getShippingCost(subtotal);
  const total = subtotal + envio;

  subtotalDisplay.textContent = formatPrice(subtotal);
  envioDisplay.textContent = envio === 0 ? "Gratis 🎉" : formatPrice(envio);

  // OJO: tu HTML no tiene totalDisplay aún, así que validamos
  if (totalDisplay) totalDisplay.textContent = formatPrice(total);

  return { subtotal, envio, total };
}

// ===============================
// Render carrito
// ===============================
function renderCart() {
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div style="padding: 20px; color: #666; text-align:center; font-weight:700;">
        Tu carrito está vacío 🐾 <br><br>
        Vuelve a la tienda y agrega productos.
      </div>
    `;
    updateTotals();
    btnProcesar.disabled = true;
    return;
  }

  btnProcesar.disabled = false;

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item-row";

    row.innerHTML = `
      <img class="cart-item-image" src="${item.image}" alt="${item.name}">
      
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        
        <div style="margin-top:10px;">
          <div class="quantity-control">
            <button class="quantity-btn btn-minus">−</button>
            <span class="quantity-display">${item.qty}</span>
            <button class="quantity-btn btn-plus">+</button>
          </div>
        </div>
      </div>

      <button class="remove-btn" title="Eliminar">✖</button>
    `;

    // −
    row.querySelector(".btn-minus").addEventListener("click", () => {
      item.qty -= 1;
      if (item.qty <= 0) {
        cart = cart.filter((p) => p.id !== item.id);
      }
      saveCartToStorage();
      renderCart();
      updateTotals();
    });

    // +
    row.querySelector(".btn-plus").addEventListener("click", () => {
      item.qty += 1;
      saveCartToStorage();
      renderCart();
      updateTotals();
    });

    // eliminar
    row.querySelector(".remove-btn").addEventListener("click", () => {
      cart = cart.filter((p) => p.id !== item.id);
      saveCartToStorage();
      renderCart();
      updateTotals();
    });

    cartItemsList.appendChild(row);
  });

  updateTotals();
}

// ✅ Con contra entrega no necesitamos seleccionar método

// ===============================
// Validaciones
// ===============================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCheckout() {
  if (!nombreCliente.value.trim()) return "Falta tu nombre completo.";
  if (!emailCliente.value.trim()) return "Falta tu email.";
  if (!isValidEmail(emailCliente.value.trim())) return "El email no es válido.";
  if (!telefonoCliente.value.trim()) return "Falta tu teléfono.";

  if (!direccionCalle.value.trim()) return "Falta la calle.";
  if (!direccionNumero.value.trim()) return "Falta el número de la dirección.";
  if (!direccionCiudad.value.trim()) return "Falta la ciudad.";
  if (!direccionDepartamento.value.trim()) return "Falta el departamento.";

  return "";
}

// ===============================
// Guardar para confirmación
// ===============================
function buildDireccionCompleta() {
  let direccion = `${direccionCalle.value.trim()} #${direccionNumero.value.trim()}`;

  if (direccionApartamento.value.trim()) {
    direccion += `, Apto ${direccionApartamento.value.trim()}`;
  }

  if (direccionCodigoPostal.value.trim()) {
    direccion += `, CP ${direccionCodigoPostal.value.trim()}`;
  }

  direccion += `, ${direccionCiudad.value.trim()} - ${direccionDepartamento.value.trim()}`;

  return direccion;
}

function getPaymentLabel() {
  if (selectedPayment === "tarjeta") return "Tarjeta";
  if (selectedPayment === "pse") return "PSE";
  if (selectedPayment === "nequi") return "Nequi";
  if (selectedPayment === "efectivo") return "Contra entrega";
  return "No definido";
}

// ===============================
// Procesar compra - INTEGRADO CON BACKEND
// ===============================
async function processOrder() {
  hideAlerts();

  if (cart.length === 0) {
    showAlert("warning", "Tu carrito está vacío.");
    return;
  }

  const error = validateCheckout();
  if (error) {
    showAlert("error", error);
    return;
  }

  const totals = updateTotals();

  // Mostrar overlay de procesamiento
  processingOverlay?.classList.add("active");

  try {
    // ⭐ PASO 1: Preparar datos para enviar al servidor
    const datosPedido = {
      carrito: cart,
      cliente: {
        nombre: nombreCliente.value.trim(),
        email: emailCliente.value.trim(),
        telefono: telefonoCliente.value.trim(),
        direccion: buildDireccionCompleta()
      },
      metodoPago: selectedPayment,
      notas: notasOrden.value.trim(),
      subtotal: totals.subtotal,
      envio: totals.envio,
      total: totals.total
    };

    console.log("📤 ENVIANDO PEDIDO AL BACKEND:", datosPedido);
    console.log("🔑 Token:", Storage.getToken()?.substring(0, 20) + "...");

    // ⭐ PASO 2: Enviar POST /api/pedidos al backend
    const respuestaPedido = await API.Pedidos.crear(datosPedido);

    console.log("✅ RESPUESTA DEL SERVIDOR:", respuestaPedido);

    // ⭐ PASO 3: Si éxito, guardar en localStorage y redirigir
    const pedidoId = respuestaPedido.pedido_id;

    // Guardar ID del pedido para confirmación
    if (typeof Storage !== 'undefined' && Storage.setPedidoConfirmado) {
      Storage.setPedidoConfirmado(pedidoId);
    } else {
      localStorage.setItem("vitalpet_pedido_id", pedidoId.toString());
    }

    // Guardar datos de checkout para mostrar en confirmación
    const checkoutData = {
      pedido_id: pedidoId,
      estado: respuestaPedido.estado || "pendiente",
      nombre: nombreCliente.value.trim(),
      email: emailCliente.value.trim(),
      telefono: telefonoCliente.value.trim(),
      direccion: buildDireccionCompleta(),
      metodoPago: getPaymentLabel(),
      notas: notasOrden.value.trim(),
      subtotal: totals.subtotal,
      envio: totals.envio,
      total: totals.total,
      carrito: cart,
      fecha: new Date().toLocaleString('es-CO')
    };

    localStorage.setItem(CHECKOUT_DATA_KEY, JSON.stringify(checkoutData));

    // Limpiar carrito
    clearCartStorage();

    // Esperar un poco para que se vea el overlay
    setTimeout(() => {
      processingOverlay?.classList.remove("active");
      // Ir a confirmación
      window.location.href = "confirmacion.html";
    }, 1500);

  } catch (error) {
    processingOverlay?.classList.remove("active");
    
    let mensajeError = "Error al procesar la compra";
    
    if (error.status === 400) {
      mensajeError = error.mensaje || "Datos inválidos";
    } else if (error.status === 401) {
      mensajeError = "Debes estar logueado para comprar";
    } else if (error.status === 409) {
      mensajeError = error.mensaje || "Stock insuficiente en algunos productos";
    } else if (error.status === 500) {
      mensajeError = "Error en el servidor. Intenta más tarde.";
    }
    
    showAlert("error", mensajeError);
    console.error("Error crear pedido:", error);
  }
}

// ✅ Sin tarjeta, no necesitamos formateo especial

// ===============================
// Eventos
// ===============================
btnVolver.addEventListener("click", () => {
  window.location.href = "productos.html";
});

btnProcesar.addEventListener("click", processOrder);

// ===============================
// INIT
// ===============================
loadCartFromStorage();
renderCart();
updateTotals();
