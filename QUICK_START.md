# ⚡ QUICK START - DEPLOYMENT EN 3 PASOS

## 🎯 Ya completamos:
✅ Configuración dinámica de URLs (desarrollo y producción)  
✅ CORS dinámico en backend  
✅ Detección automática de ambiente  
✅ Documentación completa de deployment  

## 📝 SOLO TIENES QUE HACER:

### PASO 1️⃣: Compra Hostinger VPS (1 mes - $13.99)
```
URL: https://www.hostinger.com/vps-hosting
Plan: KVM 2 (2 vCPU, 8GB RAM, 100GB SSD)
Costo: $13.99/mes (primero mes)
Recibirás:
  - IP: XXX.XXX.XXX.XXX
  - Usuario SSH: root
  - Password SSH: [Tu password]
  - BD MySQL: credenciales
  - Dominio: tu-dominio.com (gratuito 1 año)
```

### PASO 2️⃣: Edita credenciales en tu PC
```bash
# Abre: proyecto/backend/.env.production
# Edita con Notepad/VSCode:
DB_HOST=mysql.tu-dominio.com        # ← tu IP o host
DB_USER=u1234567_vitalpet           # ← de Hostinger
DB_PASSWORD=TuPassword123!           # ← de Hostinger
DB_NAME=u1234567_vitalpet           # ← de Hostinger
JWT_SECRET=[GENERAR ABAJO]
FRONTEND_URL=https://tu-dominio.com # ← tu dominio

# Para JWT_SECRET, ejecuta en terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copia el resultado aquí
```

### PASO 3️⃣: Ejecuta deployment con guía
```bash
# Abre: DEPLOYMENT_GUIDE.md
# Sigue paso a paso:
  1. SSH a Hostinger
  2. Instala Node.js
  3. Copia código
  4. Inicia backend con PM2
  5. Configura Nginx
  6. Activa SSL
  7. Testing
```

---

## 📚 ARCHIVOS CREADOS PARA TI

| Archivo | Propósito |
|---------|-----------|
| `DEPLOYMENT_GUIDE.md` | Guía completa paso a paso (9 pasos) |
| `PRE_DEPLOYMENT_CHECKLIST.md` | Checklist de verificación |
| `CHANGES_SUMMARY.md` | Resumen de qué cambió en el código |
| `backend/.env.production` | Configuración para Hostinger (editar!) |
| `backend/.env.production.example` | Ejemplo con valores reales |
| `frontend/js/config.js` | Auto-detecta localhost vs producción |

---

## ⏱️ TIEMPO ESTIMADO

| Tarea | Tiempo |
|-------|--------|
| Comprar VPS | 5 min |
| Editar .env | 5 min |
| SSH + instalación | 30 min |
| Copiar código | 10 min |
| Nginx + SSL | 30 min |
| Testing | 20 min |
| **TOTAL** | **~2 horas** |

---

## 🎉 DESPUÉS DE DEPLOY

✅ Tu app estará en: **https://tu-dominio.com**  
✅ API en: **https://tu-dominio.com/api**  
✅ Admin en: **https://tu-dominio.com/administrador.html**  

---

## 🆘 PROBLEMAS?

1. **"No conecta a BD"** → Revisar credenciales en `.env.production`
2. **"CORS error"** → Verificar FRONTEND_URL es HTTPS
3. **"502 Bad Gateway"** → Revisar que PM2 está corriendo: `pm2 list`
4. **"No abre imágenes"** → Revisar permisos en `/uploads`

Ver troubleshooting en `DEPLOYMENT_GUIDE.md` (sección 8)

---

## ✨ LO GENIAL

El código es **EXACTAMENTE IGUAL** en desarrollo y producción.  
No necesitas cambiar código, solo credenciales en `.env.production`.

```
Tu máquina:        Backend: localhost:5000
                   Frontend: usa http://localhost:5000/api

Hostinger VPS:     Backend: puerto 5000 interno
                   Nginx redirige: /api → backend:5000
                   Frontend: usa https://tu-dominio.com/api
```

**¡TODO AUTOMÁTICO!** 🚀

---

**¿Listo para comprar Hostinger?**  
Cuando tengas las credenciales, avísame y te ayudaré con el deployyment en vivo 🎯
