// ===============================
// VITALPET - CONFIGURATION
// Centraliza URLs por ambiente
// ===============================

// Detectar ambiente automáticamente
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

// Construir URL base dinámicamente
const API_BASE = isProduction 
  ? `${window.location.protocol}//${window.location.hostname}/api`
  : 'http://localhost:5000/api';

console.log(`🔧 Ambiente: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log(`📡 API Base: ${API_BASE}`);

// Exportar para uso en scripts externos (que no usen módulos)
window.VITALPET = {
  API_BASE,
  isProduction
};
