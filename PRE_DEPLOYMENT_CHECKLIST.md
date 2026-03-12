# ✅ PRE-DEPLOYMENT CHECKLIST

Antes de subir a Hostinger, verifica que todo esté correcto:

## 🔐 SEGURIDAD

- [ ] Cambiar JWT_SECRET en `.env.production` (32+ caracteres aleatorios)
- [ ] Cambiar DB_PASSWORD en `.env.production`
- [ ] Cambiar FRONTEND_URL en `.env.production` a tu dominio real
- [ ] NO commitear `.env.production` a Git
- [ ] Verificar que `.gitignore` incluya `.env*`
- [ ] SSH keys configuradas (no usar root password)
- [ ] Firewall de Hostinger configurado (solo puertos 80, 443)

## 🔄 CÓDIGO

- [ ] `js/config.js` creado y funcional ✅
- [ ] `js/api.js` actualizado para usar config.js ✅
- [ ] `calendario.html` actualizado ✅
- [ ] `administrador.html` actualizado ✅
- [ ] `informacion.html` actualizado ✅
- [ ] `server.js` CORS dinámico ✅
- [ ] `.env.production` creado ✅
- [ ] Todos los `console.log()` son útiles (sin debug excesivo)
- [ ] Sin `localStorage` keys hardcodeadas
- [ ] URLs sin `localhost` en código de producción

## 📦 DEPENDENCIAS

- [ ] `package.json` tiene todas las dependencias
- [ ] `npm install` funciona sin errores
- [ ] Node.js >= 16.x
- [ ] MySQL >= 5.7

## 🗄️ BASE DE DATOS

- [ ] Backup de BD local realizado
- [ ] Estructura de tablas verificada
- [ ] Usuarios de prueba creados
- [ ] Contraseña root BD cambiada en Hostinger
- [ ] Character set: UTF-8

## 🌐 CONFIGURACIÓN DOMINIO

- [ ] Dominio comprado o transferido a Hostinger
- [ ] Nameservers apuntando a Hostinger
- [ ] DNS propagado (puede tomar 24h)
- [ ] Dominio accesible en navegador

## 📱 TESTING LOCAL

- [ ] Login funciona
- [ ] Compra completa funciona
- [ ] Citas se pueden agendar
- [ ] Perfil y mascotas funcionan
- [ ] Admin dashboard accesible
- [ ] Uploads de fotos funcionan
- [ ] Carrito persiste en localStorage
- [ ] Responsive en mobile

## 📊 PERFORMANCE

- [ ] Minificar CSS/JS (opcional pero recomendado)
- [ ] Comprimir imágenes > 100KB
- [ ] Lazy loading de imágenes
- [ ] Cache headers configurados en Nginx

## 📜 DOCUMENTACIÓN

- [ ] DEPLOYMENT_GUIDE.md creado ✅
- [ ] Credenciales guardadas en lugar seguro (gestor de contraseñas)
- [ ] README con instrucciones de instalación local
- [ ] Contactos de soporte documentados

---

## 🚀 DEPLOYMENT

### Antes de ejecutar:

```bash
# 1. Verificar que TODO está en Git
git status

# 2. Revisar último commit
git log -1

# 3. Crear rama de deployment (opcional)
git checkout -b production

# 4. Verificar .env.production está seguro
cat backend/.env.production
```

### Durante el deployment:

```bash
# 1. SSH a Hostinger VPS
ssh root@[IP]

# 2. Clonar repositorio
git clone https://github.com/tu-usuario/vitalpet.git

# 3. Instalar dependencias
cd vitalpet/proyecto/backend
npm install

# 4. Iniciar con PM2
NODE_ENV=production pm2 start server.js --name "vitalpet"

# 5. Configurar Nginx (ver DEPLOYMENT_GUIDE.md)
```

### Después del deployment:

- [ ] Acceder a https://tu-dominio.com
- [ ] Verificar que carga (esperar SSL)
- [ ] Probar login
- [ ] Probar compra
- [ ] Revisar logs: `pm2 logs vitalpet`
- [ ] Crear usuario admin en producción

---

## 🎯 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| "Connection refused" en BD | Verificar credenciales `.env.prod`, IP permitida en Hostinger |
| CORS error | Verificar FRONTEND_URL en `.env.prod`, debe ser HTTPS |
| 502 Bad Gateway | Reiniciar PM2, revisar logs: `pm2 logs` |
| Imagenes no cargan | Verificar permisos en `/uploads`, paths relativos |
| Timeout en citas | Aumentar PHP timeout o conexión timeout |

---

## 📞 NÚMEROS DE CONTACTO

- **Hostinger Support:** Chat en panel
- **Tu email:** [Tu email de soporte]
- **GitHub:** [Link a repo]

---

**Fecha de preparación:** [Hoy]  
**Versión:** 1.0.0  
**Estado:** ✅ Listo para production
