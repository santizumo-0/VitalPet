// ===============================
// VITALPET - PRODUCTOS.JS
// Obtiene productos del SERVIDOR
// Muesta galería y maneja carrito
// ===============================

// ✅ Usar configuración dinámica (cargada desde config.js)
// En desarrollo: http://localhost:5000/api
// En producción: https://tu-dominio.com/api
const BACKEND_URL = window.VITALPET?.API_BASE || 'http://localhost:5000/api';

console.log('🔗 Backend URL:', BACKEND_URL);

// Helpers - usando query en lugar de $ para evitar conflictos
const query = (s) => document.querySelector(s);
const queryAll = (s) => document.querySelectorAll(s);

// UI Elements
const productosGrid = query(".products-grid");  // Buscar por clase en lugar de ID
const filtroCategoria = query("#filtroCategoria");
const btnCarrito = query("#openCartBtn");  // Botón para abrir el carrito
const alertError = null;  // No existen en este HTML
const alertSuccess = null;  // No existen en este HTML
const loadingSpinner = query("#loadingSpinner");
const countCarrito = query("#cartBadge");  // El badge del carrito es cartBadge

let productos = [];
let productosFiltrados = [];

// ===============================
// Helpers
// ===============================

function formatPrice(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}

function actualizarContadorCarrito() {
  /**
   * Actualizar el contador del carrito en la navbar
   */
  if (countCarrito) {
    let carrito = [];
    if (typeof Storage !== 'undefined' && Storage.getCarrito) {
      carrito = Storage.getCarrito();
    } else {
      const saved = localStorage.getItem("vitalpet_cart");
      carrito = saved ? JSON.parse(saved) : [];
    }

    const total = carrito.reduce((acc, item) => acc + item.qty, 0);
    countCarrito.textContent = total;
    countCarrito.style.display = total > 0 ? "block" : "none";
  }
}

function showAlert(type, msg) {
  // Como no hay elementos de alerta en el HTML, solo mostramos en consola
  if (type === "error") {
    console.error(`❌ ${msg}`);
  } else {
    console.log(`✅ ${msg}`);
  }
}

function hideAlerts() {
  // No hay alertas para ocultar
}

// ===============================
// Obtener Productos del SERVIDOR
// ===============================

async function cargarProductos() {
  /**
   * OBTENER productos desde API backend
   * GET /api/productos
   */
  try {
    if (loadingSpinner) loadingSpinner.style.display = "block";

    console.log('📦 Iniciando carga de productos...');
    
    // ⭐ Llamar a API
    const respuesta = await API.Productos.obtenerTodos();
    
    console.log('📡 Respuesta bruta de API:', respuesta);
    
    // respuesta debería ser { total, productos: [...] }
    let productosArray = [];
    
    if (Array.isArray(respuesta)) {
      productosArray = respuesta;
    } else if (respuesta && respuesta.productos && Array.isArray(respuesta.productos)) {
      productosArray = respuesta.productos;
    } else if (respuesta && respuesta.producto) {
      // Si viene un solo producto, lo convertimos a array
      productosArray = [respuesta.producto];
    } else {
      console.warn('⚠️ Estructura inesperada de respuesta:', respuesta);
      productosArray = [];
    }
    
    productos = productosArray;
    
    console.log(`✅ ${productos.length} productos cargados`);

    if (loadingSpinner) loadingSpinner.style.display = "none";

    if (productos.length === 0) {
      if (productosGrid) {
        productosGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <h3>No hay productos disponibles 😢</h3>
            <p>Vuelve más tarde</p>
          </div>
        `;
      }
      return;
    }

    // Mostrar productos
    mostrarProductos(productos);
    showAlert("success", `✅ ${productos.length} productos cargados`);

  } catch (error) {
    if (loadingSpinner) loadingSpinner.style.display = "none";
    
    console.error("❌ Error al cargar productos:", error);
    showAlert("error", "Error al cargar productos. Intenta recargar la página.");
  }
}

// ===============================
// Mostrar Productos en Grid - MEJORADO
// ===============================

function mostrarProductos(lista) {
  /**
   * Renderizar productos en TODOS los grids categorizados
   * @param {Array} lista - Productos a mostrar
   */
  
  // Obtener todos los grids (hay 6: Perros comida, accesorios, medicamentos; Gatos comida, accesorios, medicamentos)
  const allGrids = queryAll(".products-grid");
  
  if (allGrids.length === 0) {
    console.warn('⚠️ No se encontraron grids con clase .products-grid');
    return;
  }

  console.log(`📊 ${allGrids.length} grids encontrados, ${lista.length} productos a distribuir`);

  // Limpiar todos los grids primero
  allGrids.forEach(grid => {
    grid.innerHTML = '';
  });

  // Mapeo de grids por sección
  // El HTML tiene este orden: Perros-comida (grid 0), Perros-accesorios (grid 1), Perros-medicamentos (grid 2), 
  // Gatos-comida (grid 3), Gatos-accesorios (grid 4), Gatos-medicamentos (grid 5)
  
  const categoriasMap = {
    1: 'comida',
    2: 'accesorios',
    3: 'medicamentos'
  };

  // Función para crear HTML de producto
  function crearProductoHTML(producto) {
    let imagenUrl = producto.imagen;
    if (imagenUrl && imagenUrl.startsWith('/uploads/')) {
      imagenUrl = `${BACKEND_URL}${imagenUrl}`;
    }
    
    return `
      <div class="product-card">
        <img 
          class="product-image" 
          src="${imagenUrl || ''}" 
          alt="${producto.nombre}"
          onerror="this.style.backgroundColor='#f0f0f0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center';"
          style="width: 100%; height: 180px; object-fit: contain; margin-bottom: 15px; background: #f5f5f5;"
        >
        
        <div style="padding: 0;">
          <h3 style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin-bottom: 10px; min-height: 40px;">
            ${producto.nombre}
          </h3>
          
          <p style="color: #666; font-size: 12px; margin-bottom: 10px; line-height: 1.3;">
            ${(producto.descripcion || '').substring(0, 60)}...
          </p>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="color: #1e3a5f; font-size: 16px; font-weight: 700;">
              $${Number(producto.precio).toLocaleString('es-CO')}
            </span>
            
            <span style="font-size: 11px; color: ${producto.stock > 0 ? '#4caf50' : '#f44336'}; font-weight: 600;">
              ${producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock'}
            </span>
          </div>

          <button 
            class="btn-agregar-carrito"
            onclick="agregarAlCarrito(${producto.id})"
            ${producto.stock <= 0 ? 'disabled' : ''}
            style="width: 100%; padding: 8px; background-color: ${producto.stock > 0 ? '#1e3a5f' : '#ccc'}; color: white; border: none; border-radius: 6px; cursor: ${producto.stock > 0 ? 'pointer' : 'not-allowed'}; font-weight: 600; font-size: 12px; transition: 0.2s;"
          >
            ${producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          </button>
        </div>
      </div>
    `;
  }

  // Distribuir productos en cada grid según categoría y animal
  lista.forEach(producto => {
    // Determinar qué grid le corresponde
    let gridIndex = null;
    const categoriaNombre = categoriasMap[producto.categoria_id];
    const esPerro = producto.para_animal === 'perros' || producto.para_animal === 'ambos';
    const esGato = producto.para_animal === 'gatos' || producto.para_animal === 'ambos';

    // Perros
    if (esPerro) {
      if (categoriaNombre === 'comida') gridIndex = 0;
      else if (categoriaNombre === 'accesorios') gridIndex = 1;
      else if (categoriaNombre === 'medicamentos') gridIndex = 2;
    }
    
    // Si también es para gatos O solo gatos
    if (esGato && producto.para_animal !== 'perros') {
      if (categoriaNombre === 'comida') gridIndex = 3;
      else if (categoriaNombre === 'accesorios') gridIndex = 4;
      else if (categoriaNombre === 'medicamentos') gridIndex = 5;
    }

    // Si es "ambos" y aún no hemos asignado, agregar a gatos también
    if (producto.para_animal === 'ambos' && gridIndex !== null) {
      // Ya lo pusimos en perros, ahora agregarlo a gatos
      if (categoriaNombre === 'comida' && allGrids[3]) {
        allGrids[3].innerHTML += crearProductoHTML(producto);
      } else if (categoriaNombre === 'accesorios' && allGrids[4]) {
        allGrids[4].innerHTML += crearProductoHTML(producto);
      } else if (categoriaNombre === 'medicamentos' && allGrids[5]) {
        allGrids[5].innerHTML += crearProductoHTML(producto);
      }
    }

    // Añadir al grid correspondiente
    if (gridIndex !== null && allGrids[gridIndex]) {
      allGrids[gridIndex].innerHTML += crearProductoHTML(producto);
    }
  });

  // Verificar si algún grid está vacío y mostrar mensaje
  allGrids.forEach((grid, index) => {
    const labels = ['Perros - Comida', 'Perros - Accesorios', 'Perros - Medicamentos', 'Gatos - Comida', 'Gatos - Accesorios', 'Gatos - Medicamentos'];
    if (grid.innerHTML === '') {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #999;">Sin productos disponibles</div>`;
    }
  });

  console.log('✅ Productos distribuidos en todos los grids');
}

// ===============================
// Carrito
// ===============================

function agregarAlCarrito(productoId) {
  /**
   * Agregar producto al carrito
   * @param {Number} productoId
   */
  const producto = productos.find(p => p.id === productoId);
  
  if (!producto) {
    showAlert("error", "Producto no encontrado");
    return;
  }

  if (producto.stock <= 0) {
    showAlert("warning", "Este producto no tiene stock disponible");
    return;
  }

  // Preparar objeto para carrito
  let imagenUrl = producto.imagen || '';
  // Convertir ruta relativa a URL absoluta
  if (imagenUrl && imagenUrl.startsWith('/uploads/')) {
    imagenUrl = `${BACKEND_URL}${imagenUrl}`;
  }
  
  const itemCarrito = {
    id: producto.id,
    name: producto.nombre,
    description: producto.descripcion,
    price: producto.precio,
    image: imagenUrl,
    stock: producto.stock,
    qty: 1
  };

  // Agregar a localStorage
  if (typeof Storage !== 'undefined' && Storage.agregarAlCarrito) {
    Storage.agregarAlCarrito(itemCarrito);
  } else {
    let carrito = localStorage.getItem("vitalpet_cart");
    carrito = carrito ? JSON.parse(carrito) : [];
    
    const existe = carrito.find(p => p.id === producto.id);
    if (existe) {
      existe.qty += 1;
    } else {
      carrito.push(itemCarrito);
    }
    
    localStorage.setItem("vitalpet_cart", JSON.stringify(carrito));
  }

  actualizarContadorCarrito();
  showAlert("success", `✅ ${producto.nombre} agregado al carrito`);
  
  // Disparar evento para actualizar el carrito en tiempo real
  window.dispatchEvent(new CustomEvent('carritoActualizado', { 
    detail: { productoId: producto.id, nombre: producto.nombre } 
  }));
  
  // Abrir el carrito automáticamente
  openCart();
}

// ===============================
// Filtros
// ===============================

function filtrarPorCategoria(categoria) {
  /**
   * Filtrar productos por categoría
   * @param {String} categoria
   */
  if (categoria === "todos") {
    mostrarProductos(productos);
  } else {
    const filtrados = productos.filter(p => p.categoria_id == categoria);
    mostrarProductos(filtrados);
  }
}

// ===============================
// Eventos
// ===============================

if (filtroCategoria) {
  filtroCategoria.addEventListener("change", (e) => {
    filtrarPorCategoria(e.target.value);
  });
}

// El botón de carrito ya tiene evento en el HTML que abre el sidebar
// No sobrescribimos aquí

// ===============================
// ESCUCHAR CAMBIOS DE PRODUCTOS
// ===============================

// ✅ Escuchar evento personalizado (para la misma pestaña - INMEDIATO)
window.addEventListener('productoAgregado', (evento) => {
  console.log('🎉 EVENTO: Producto agregado (misma pestaña)');
  console.log('Datos del evento:', evento.detail);
  
  setTimeout(() => {
    cargarProductos();
  }, 500);
});


// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  console.log('🚀 Inicializando página de productos...');
  actualizarContadorCarrito();
  cargarProductos();
});
