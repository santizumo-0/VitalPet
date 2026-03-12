// ===================================
// VALIDACIONES - UTILITARIO GLOBAL
// ===================================

const Validar = {
  // Validar email
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Validar teléfono (Colombia)
  telefono: (telefono) => {
    const regex = /^(\d{7,10}|3\d{9})$/;
    return regex.test(telefono.replace(/[^\d]/g, ''));
  },

  // Validar contraseña (mínimo 6 caracteres)
  contrasena: (password) => {
    return password && password.length >= 6;
  },

  // Validar nombre (al menos 3 caracteres)
  nombre: (nombre) => {
    return nombre && nombre.trim().length >= 3;
  },

  // Validar número positivo
  numero: (valor, minimo = 0) => {
    const num = parseFloat(valor);
    return !isNaN(num) && num >= minimo;
  },

  // Validar cantidad entera positiva
  entero: (valor, minimo = 1) => {
    const num = parseInt(valor);
    return !isNaN(num) && num >= minimo;
  },

  // Validar fecha no sea pasada
  fecha: (fecha) => {
    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaIngresada >= hoy;
  },

  // Validar rango de fecha
  rango: (fechaInicio, fechaFin) => {
    return new Date(fechaInicio) <= new Date(fechaFin);
  }
};

// ===================================
// FUNCIONES DE UTILIDAD UI
// ===================================

const UI = {
  // Mostrar error en campo
  mostrarError: (input, mensaje) => {
    input.classList.add('input-error');
    input.title = mensaje;
    
    const existente = input.nextElementSibling;
    if (existente && existente.className === 'error-message') {
      existente.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `⚠️ ${mensaje}`;
    errorDiv.style.cssText = `
      color: #f44336;
      font-size: 12px;
      margin-top: 5px;
      margin-bottom: 10px;
    `;
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  },

  // Limpiar error en campo
  limpiarError: (input) => {
    input.classList.remove('input-error');
    input.title = '';
    
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.className === 'error-message') {
      errorDiv.remove();
    }
  },

  // Mostrar alerta sweetalert style
  alerta: (titulo, mensaje, tipo = 'info') => {
    const iconos = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    const colores = {
      'success': '#4caf50',
      'error': '#f44336',
      'warning': '#ff9800',
      'info': '#2196f3'
    };

    alert(`${iconos[tipo]} ${titulo}\n\n${mensaje}`);
  },

  // Mostrar loading
  mostrarLoading: (boton, texto = 'Cargando...') => {
    boton.disabled = true;
    boton.dataset.textOriginal = boton.textContent;
    boton.textContent = `⏳ ${texto}`;
  },

  // Ocultar loading
  ocultarLoading: (boton) => {
    boton.disabled = false;
    boton.textContent = boton.dataset.textOriginal || 'Enviar';
  },

  // Confirmar acción
  confirmar: (mensaje) => {
    return confirm(`❓ ${mensaje}`);
  }
};

// ===================================
// ESTILOS PARA ERRORES
// ===================================
const estilosErrores = document.createElement('style');
estilosErrores.textContent = `
  input.input-error,
  textarea.input-error,
  select.input-error {
    border-color: #f44336 !important;
    background-color: #ffebee !important;
  }

  .error-message {
    color: #f44336;
    font-size: 12px;
    margin-top: 5px;
    margin-bottom: 10px;
    font-weight: 600;
  }

  .form-grupo {
    margin-bottom: 15px;
  }

  input.input-error:focus,
  textarea.input-error:focus,
  select.input-error:focus {
    outline: none;
    box-shadow: 0 0 5px rgba(244, 67, 54, 0.5);
  }
`;
document.head.appendChild(estilosErrores);

// ===================================
// EXPORTAR
// ===================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Validar, UI };
}
