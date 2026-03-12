// ===============================
// VITALPET - STORAGE.JS
// Helpers para localStorage (carrito, datos checkout, etc)
// ===============================

const Storage = {

  // ===============================
  // AUTENTICACIÓN
  // ===============================

  setToken(token) {
    /**
     * Guardar JWT token
     * @param {String} token
     */
    localStorage.setItem("vitalpet_token", token);
  },

  getToken() {
    /**
     * Obtener JWT token
     * @returns {String|null}
     */
    return localStorage.getItem("vitalpet_token");
  },

  setAdminToken(token) {
    /**
     * Guardar JWT token admin
     * @param {String} token
     */
    localStorage.setItem("vitalpet_admin_token", token);
  },

  getAdminToken() {
    /**
     * Obtener JWT token admin
     * @returns {String|null}
     */
    return localStorage.getItem("vitalpet_admin_token");
  },

  setUsuario(usuario) {
    /**
     * Guardar datos del usuario logueado
     * @param {Object} usuario - { id, nombre, email, telefono }
     */
    localStorage.setItem("vitalpet_usuario", JSON.stringify(usuario));
  },

  getUsuario() {
    /**
     * Obtener datos del usuario logueado
     * @returns {Object|null}
     */
    const data = localStorage.getItem("vitalpet_usuario");
    return data ? JSON.parse(data) : null;
  },

  clearAuth() {
    /**
     * Limpiar toda la autenticación
     */
    localStorage.removeItem("vitalpet_token");
    localStorage.removeItem("vitalpet_admin_token");
    localStorage.removeItem("vitalpet_usuario");
  },

  // ===============================
  // CARRITO
  // ===============================

  getCarrito() {
    /**
     * Obtener carrito desde localStorage
     * @returns {Array} Array de productos o []
     */
    const data = localStorage.getItem("vitalpet_cart");
    return data ? JSON.parse(data) : [];
  },

  setCarrito(carrito) {
    /**
     * Guardar carrito en localStorage
     * @param {Array} carrito
     */
    localStorage.setItem("vitalpet_cart", JSON.stringify(carrito));
  },

  limpiarCarrito() {
    /**
     * Vaciar carrito
     */
    localStorage.removeItem("vitalpet_cart");
  },

  agregarAlCarrito(producto) {
    /**
     * Agregar o incrementar cantidad de producto al carrito
     * @param {Object} producto - { id, name, price, image, qty: 1 }
     */
    let carrito = this.getCarrito();
    
    const existe = carrito.find(p => p.id === producto.id);
    
    if (existe) {
      existe.qty += (producto.qty || 1);
    } else {
      carrito.push({ ...producto, qty: producto.qty || 1 });
    }
    
    this.setCarrito(carrito);
  },

  removerDelCarrito(productoId) {
    /**
     * Remover producto del carrito
     * @param {Number} productoId
     */
    let carrito = this.getCarrito();
    carrito = carrito.filter(p => p.id !== productoId);
    this.setCarrito(carrito);
  },

  actualizarCantidad(productoId, nuevaCantidad) {
    /**
     * Actualizar cantidad de un producto en carrito
     * @param {Number} productoId
     * @param {Number} nuevaCantidad
     */
    let carrito = this.getCarrito();
    const producto = carrito.find(p => p.id === productoId);
    
    if (producto) {
      if (nuevaCantidad <= 0) {
        this.removerDelCarrito(productoId);
      } else {
        producto.qty = nuevaCantidad;
        this.setCarrito(carrito);
      }
    }
  },

  getSubtotal() {
    /**
     * Calcular subtotal del carrito
     * @returns {Number} Subtotal
     */
    const carrito = this.getCarrito();
    return carrito.reduce((acc, item) => acc + (item.price * item.qty), 0);
  },

  getTotal(conEnvio = true) {
    /**
     * Calcular total con envío
     * @param {Boolean} conEnvio - Incluir costo de envío
     * @returns {Number} Total
     */
    const subtotal = this.getSubtotal();
    const envio = this.getEnvio(subtotal);
    return conEnvio ? subtotal + envio : subtotal;
  },

  getEnvio(subtotal = null) {
    /**
     * Calcular costo de envío
     * @param {Number} subtotal - Si es null, calcula del carrito actual
     * @returns {Number} Costo envío
     */
    if (subtotal === null) {
      subtotal = this.getSubtotal();
    }
    
    if (subtotal === 0) return 0;
    if (subtotal >= 50000) return 0; // Envío gratis
    return 8000; // Envío: $8.000
  },

  // ===============================
  // CHECKOUT DATA
  // ===============================

  getCheckoutData() {
    /**
     * Obtener datos del último checkout
     * @returns {Object|null}
     */
    const data = localStorage.getItem("vitalpet_checkout_data");
    return data ? JSON.parse(data) : null;
  },

  setCheckoutData(datos) {
    /**
     * Guardar datos de checkout
     * @param {Object} datos
     */
    localStorage.setItem("vitalpet_checkout_data", JSON.stringify(datos));
  },

  limpiarCheckoutData() {
    /**
     * Remover datos de checkout
     */
    localStorage.removeItem("vitalpet_checkout_data");
  },

  // ===============================
  // PEDIDO CONFIRMADO
  // ===============================

  getPedidoConfirmado() {
    /**
     * Obtener ID del pedido confirmado
     * @returns {Number|null}
     */
    const pedidoId = localStorage.getItem("vitalpet_pedido_id");
    return pedidoId ? parseInt(pedidoId) : null;
  },

  setPedidoConfirmado(pedidoId) {
    /**
     * Guardar ID del pedido confirmado
     * @param {Number} pedidoId
     */
    localStorage.setItem("vitalpet_pedido_id", pedidoId.toString());
  },

  limpiarPedidoConfirmado() {
    /**
     * Remover ID del pedido
     */
    localStorage.removeItem("vitalpet_pedido_id");
  },

  // ===============================
  // USUARIO LOGUEADO
  // ===============================

  getUsuarioLogueado() {
    /**
     * Obtener datos del usuario logueado
     * @returns {Object|null}
     */
    const data = localStorage.getItem("vitalpet_usuario");
    return data ? JSON.parse(data) : null;
  },

  setUsuarioLogueado(usuario) {
    /**
     * Guardar datos del usuario logueado
     * @param {Object} usuario - { id, nombre, email, telefono, rol }
     */
    localStorage.setItem("vitalpet_usuario", JSON.stringify(usuario));
  },

  limpiarUsuarioLogueado() {
    /**
     * Remover datos del usuario
     */
    localStorage.removeItem("vitalpet_usuario");
  },

  // ===============================
  // PREFERENCIAS
  // ===============================

  getTema() {
    /**
     * Obtener tema guardado (light/dark)
     * @returns {String} "light" o "dark"
     */
    return localStorage.getItem("vitalpet_tema") || "light";
  },

  setTema(tema) {
    /**
     * Guardar preferencia de tema
     * @param {String} tema - "light" o "dark"
     */
    localStorage.setItem("vitalpet_tema", tema);
  },

  // ===============================
  // LIMPIAR TODO
  // ===============================

  limpiarSesion() {
    /**
     * Limpiar datos de sesión (logout)
     */
    localStorage.removeItem("vitalpet_token");
    localStorage.removeItem("vitalpet_admin_token");
    localStorage.removeItem("vitalpet_usuario");
    this.limpiarCarrito();
    this.limpiarCheckoutData();
    this.limpiarPedidoConfirmado();
    this.limpiarUsuarioLogueado();
  },

  // ===============================
  // DEBUG
  // ===============================

  mostrarTodo() {
    /**
     * Debug - Mostrar todo lo guardado en localStorage
     */
    console.log("=== VITALPET STORAGE ===");
    console.log("Token:", this.getToken() ? "✓ Existe" : "✗ No existe");
    console.log("Usuario:", this.getUsuario());
    console.log("Carrito:", this.getCarrito());
    console.log("Subtotal:", "$" + this.getSubtotal().toLocaleString("es-CO"));
    console.log("Envío:", "$" + this.getEnvio().toLocaleString("es-CO"));
    console.log("Total:", "$" + this.getTotal().toLocaleString("es-CO"));
    console.log("Pedido Confirmado:", this.getPedidoConfirmado());
    console.log("======================");
  }

};

// Para usar en HTML: <script src="js/storage.js"></script>
// Luego: Storage.getCarrito();
