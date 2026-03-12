// ===============================
// VITALPET - API.JS
// Centraliza todas las llamadas HTTP al backend
// ===============================

// ✅ Cargar configuración dinámica (permite desarrollo y producción)
const API_BASE = window.VITALPET?.API_BASE || "http://localhost:5000/api";

// ===============================
// TOKEN MANAGEMENT
// ===============================

function setToken(token) {
  localStorage.setItem("vitalpet_token", token);
}

function getToken() {
  return localStorage.getItem("vitalpet_token");
}

function removeToken() {
  localStorage.removeItem("vitalpet_token");
}

function isAutenticado() {
  return !!getToken();
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

async function fetcher(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  };

  // Agregar token si existe
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        mensaje: data.error || "Error en la solicitud",
        data
      };
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ===============================
// AUTH ENDPOINTS
// ===============================

const API_Auth = {
  
  async register(datosRegistro) {
    /**
     * Registrar nuevo usuario
     * @param {Object} datosRegistro - { nombre, email, telefono, contraseña }
     * @returns {Object} { mensaje, token, usuario }
     */
    return fetcher("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        nombre: datosRegistro.nombre,
        email: datosRegistro.email,
        telefono: datosRegistro.telefono,
        password: datosRegistro.contraseña  // ✅ Convertir contraseña a password
      })
    });
  },

  async login(email, contraseña) {
    /**
     * Autenticar usuario
     * @param {String} email
     * @param {String} contraseña
     * @returns {Object} { mensaje, token, usuario }
     */
    return fetcher("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: contraseña })  // ✅ Convertir contraseña a password
    });
  },

  async logout() {
    removeToken();
    return { mensaje: "Sesión cerrada" };
  }

};

// ===============================
// PRODUCTOS ENDPOINTS
// ===============================

const API_Productos = {

  async obtenerTodos(categoria = null) {
    /**
     * Obtener lista de productos
     * @param {String} categoria - Opcional: filtrar por categoría
     * @returns {Array} Lista de productos
     */
    let endpoint = "/productos";
    if (categoria) endpoint += `?categoria=${categoria}`;
    
    return fetcher(endpoint, { method: "GET" });
  },

  async obtenerPorId(productoId) {
    /**
     * Obtener detalles de un producto
     * @param {Number} productoId
     * @returns {Object} Detalles del producto
     */
    return fetcher(`/productos/${productoId}`, { method: "GET" });
  },

  async buscar(query) {
    /**
     * Buscar productos por nombre
     * @param {String} query
     * @returns {Array} Productos encontrados
     */
    return fetcher(`/productos/buscar?q=${encodeURIComponent(query)}`, { method: "GET" });
  }

};

// ===============================
// CITAS ENDPOINTS
// ===============================

const API_Citas = {

  async obtenerTodas() {
    /**
     * Obtener todas las citas
     * @returns {Array} Lista de citas
     */
    return fetcher("/citas", { method: "GET" });
  },

  async obtenerHorariosDisponibles(fecha) {
    /**
     * Obtener horarios disponibles para una fecha
     * @param {String} fecha - Formato: YYYY-MM-DD
     * @returns {Array} Horarios disponibles
     */
    return fetcher(`/citas/horarios?fecha=${fecha}`, { method: "GET" });
  },

  async crear(datosCita) {
    /**
     * Crear nueva cita
     * @param {Object} datosCita - { mascota_id, servicio_id, fecha, hora, notas }
     * @returns {Object} { mensaje, cita_id }
     * @requires Token de autenticación
     */
    return fetcher("/citas", {
      method: "POST",
      body: JSON.stringify(datosCita)
    });
  },

  async obtenerMisCitas() {
    /**
     * Obtener citas del usuario logueado
     * @returns {Array} Mis citas
     * @requires Token de autenticación
     */
    return fetcher("/citas/mis-citas", { method: "GET" });
  }

};

// ===============================
// MASCOTAS ENDPOINTS
// ===============================

const API_Mascotas = {

  async obtenerMias() {
    /**
     * Obtener mascotas del usuario logueado
     * @returns {Array} Mis mascotas
     * @requires Token de autenticación
     */
    return fetcher("/mascotas/mis-mascotas", { method: "GET" });
  },

  async crear(datosMascota, archivo = null) {
    /**
     * Crear nueva mascota
     * @param {Object} datosMascota - { nombre, especie, raza, edad, peso }
     * @param {File} archivo - Foto de mascota (opcional)
     * @returns {Object} { mensaje, mascota_id }
     * @requires Token de autenticación
     */
    const formData = new FormData();
    Object.keys(datosMascota).forEach(key => {
      formData.append(key, datosMascota[key]);
    });
    
    if (archivo) {
      formData.append("foto", archivo);
    }

    const token = getToken();
    const config = {
      method: "POST",
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/mascotas`, {
      ...config,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw {
        status: response.status,
        mensaje: data.error || "Error al crear mascota",
        data
      };
    }

    return data;
  },

  async obtenerPorId(mascotaId) {
    /**
     * Obtener detalles de una mascota
     * @param {Number} mascotaId
     * @returns {Object} Detalles mascota
     */
    return fetcher(`/mascotas/${mascotaId}`, { method: "GET" });
  },

  async actualizar(mascotaId, datos) {
    /**
     * Actualizar datos de mascota
     * @param {Number} mascotaId
     * @param {Object} datos
     * @returns {Object} { mensaje }
     * @requires Token de autenticación
     */
    return fetcher(`/mascotas/${mascotaId}`, {
      method: "PUT",
      body: JSON.stringify(datos)
    });
  }

};

// ===============================
// PEDIDOS ENDPOINTS (CRÍTICO)
// ===============================

const API_Pedidos = {

  async crear(datosPedido) {
    /**
     * CREAR PEDIDO - Guarda en BD y BAJA STOCK
     * @param {Object} datosPedido - { carrito, cliente: { nombre, email... }, metodoPago }
     * @returns {Object} { mensaje, pedido_id, total, estado }
     * @requires Token de autenticación (o se puede hacer público con validación)
     */
    return fetcher("/pedidos", {
      method: "POST",
      body: JSON.stringify(datosPedido)
    });
  },

  async obtenerPorId(pedidoId) {
    /**
     * OBTENER PEDIDO - Traer datos del servidor
     * Idealmente para confirmación, el usuario puede ver su pedido
     * @param {Number} pedidoId
     * @returns {Object} Detalles del pedido
     */
    return fetcher(`/pedidos/${pedidoId}`, { method: "GET" });
  },

  async obtenerMios() {
    /**
     * Obtener pedidos del usuario logueado
     * @returns {Array} Mis pedidos
     * @requires Token de autenticación
     */
    return fetcher("/pedidos", { method: "GET" });
  }

};

// ===============================
// USUARIO ENDPOINTS
// ===============================

const API_Usuario = {

  async obtenerPerfil() {
    /**
     * Obtener perfil del usuario logueado
     * @returns {Object} Datos del usuario
     * @requires Token de autenticación
     */
    return fetcher("/usuarios/perfil", { method: "GET" });
  },

  async actualizarPerfil(datos) {
    /**
     * Actualizar datos de perfil
     * @param {Object} datos - { nombre, email, telefono }
     * @returns {Object} { mensaje }
     * @requires Token de autenticación
     */
    return fetcher("/usuarios/perfil", {
      method: "PUT",
      body: JSON.stringify(datos)
    });
  },

  async cambiarContraseña(contrasenaActual, contrasenaNueva) {
    /**
     * Cambiar contraseña
     * @param {String} contrasenaActual
     * @param {String} contrasenaNueva
     * @returns {Object} { mensaje }
     * @requires Token de autenticación
     */
    return fetcher("/usuarios/password", {
      method: "PUT",
      body: JSON.stringify({
        contrasenaActual,
        contrasenaNueva,
        confirmacion: contrasenaNueva
      })
    });
  },

  async eliminarCuenta() {
    /**
     * Eliminar cuenta (permanente)
     * @returns {Object} { mensaje }
     * @requires Token de autenticación
     */
    return fetcher("/usuarios/cuenta", {
      method: "DELETE",
      body: JSON.stringify({ confirmacion: "ELIMINAR_CUENTA" })
    });
  },

  async verificarEmailDisponible(email) {
    /**
     * Verificar si email ya existe
     * @param {String} email
     * @returns {Object} { disponible: true/false }
     */
    return fetcher(`/usuarios/verificar-email?email=${encodeURIComponent(email)}`, {
      method: "GET"
    });
  }

};

// ===============================
// ADMIN ENDPOINTS
// ===============================

const API_Admin = {

  async login(email, contraseña) {
    /**
     * Login de administrador
     * @param {String} email
     * @param {String} contraseña
     * @returns {Object} { mensaje, token, admin }
     */
    return fetcher("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, contraseña })
    });
  },

  async obtenerTodosPedidos() {
    /**
     * Obtener TODOS los pedidos (solo admin)
     * @returns {Array} Lista completa de pedidos
     * @requires Token de admin
     */
    return fetcher("/admin/pedidos", { method: "GET" });
  },

  async actualizarEstadoPedido(pedidoId, nuevoEstado) {
    /**
     * Cambiar estado de pedido (solo admin)
     * @param {Number} pedidoId
     * @param {String} nuevoEstado - "pendiente", "procesando", "enviado", "entregado"
     * @returns {Object} { mensaje }
     * @requires Token de admin
     */
    return fetcher(`/admin/pedidos/${pedidoId}`, {
      method: "PUT",
      body: JSON.stringify({ estado: nuevoEstado })
    });
  },

  async obtenerEstadisticas() {
    /**
     * Obtener stats del dashboard
     * @returns {Object} { totalVentas, pedidosPendientes, productosBajoStock }
     * @requires Token de admin
     */
    return fetcher("/admin/estadisticas", { method: "GET" });
  }

};

// ===============================
// EXPORT
// ===============================

const API = {
  setToken,
  getToken,
  removeToken,
  isAutenticado,
  Auth: API_Auth,
  Productos: API_Productos,
  Citas: API_Citas,
  Mascotas: API_Mascotas,
  Pedidos: API_Pedidos,
  Usuario: API_Usuario,
  Admin: API_Admin
};

// Para usar en HTML: <script src="js/api.js"></script>
// Luego: API.Auth.login(email, pass);
