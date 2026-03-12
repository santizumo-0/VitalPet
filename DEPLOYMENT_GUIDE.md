# 🚀 GUÍA DE DEPLOYMENT - VITALPET A HOSTINGER VPS

## ✅ PREPARACIÓN COMPLETADA

El código ya ha sido actualizado para soportar **desarrolloY producción automáticamente**.

---

## 📋 PASO 1: OBTENER CREDENCIALES DE HOSTINGER

Cuando compres el VPS en Hostinger, recibirás:
```
✅ Dirección IP: XXX.XXX.XXX.XXX
✅ Usuario SSH: root o tu_usuario
✅ Contraseña SSH: [Tu password]
✅ Host MySQL: mysql.tu-dominio.com o localhost
✅ Usuario MySQL: u1234567_vitalpet
✅ Password MySQL: [Tu password]
✅ Database: u1234567_vitalpet
✅ Dominio: tu-dominio.com
```

---

## 📝 PASO 2: CONFIGURAR CREDENCIALES PRODUCTION

### En tu máquina local:

**Archivo: `backend/.env.production`**

Ya está creado. Solo debes editar con tus credenciales reales de Hostinger:

```bash
# ===== DATABASE =====
DB_HOST=mysql.tu-dominio.com          # ← CAMBIAR
DB_USER=u1234567_vitalpet             # ← CAMBIAR
DB_PASSWORD=TuPasswordMuySeguro123!   # ← CAMBIAR
DB_NAME=u1234567_vitalpet             # ← CAMBIAR
DB_PORT=3306

# ===== SERVER =====
PORT=5000
NODE_ENV=production

# ===== JWT =====
# Generar clave con:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=abc123def456ghi789jkl012mno345pqr456stu789vwx # ← CAMBIAR

# ===== CORS =====
FRONTEND_URL=https://tu-dominio.com   # ← CAMBIAR
```

---

## 🔧 PASO 3: CAMBIOS YA REALIZADOS EN EL CÓDIGO

✅ **Backend** (`server.js`):
- CORS configurado dinámicamente según NODE_ENV
- En desarrollo: acepta localhost
- En producción: acepta FRONTEND_URL desde .env

✅ **Frontend** (`js/config.js`):
- Detecta automáticamente ambiente (localhost = desarrollo)
- URL API se construye dinámicamente: `/api` en producción

✅ **Archivos actualizados**:
- `js/api.js` - Usa configuración dinámica ✅
- `calendario.html` - Usa API_URL dinámico ✅
- `administrador.html` - Usa API_URL dinámico ✅
- `informacion.html` - Usa BACKEND_URL dinámico ✅

---

## 🌐 PASO 4: DEPLOY A HOSTINGER VPS

### 4a. Conectar por SSH:

```bash
# macOS/Linux:
ssh root@XXX.XXX.XXX.XXX

# Windows (PowerShell):
ssh root@XXX.XXX.XXX.XXX
```

Introduce tu contraseña SSH cuando se pida.

### 4b. Instalar Node.js y MySQL Client:

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs npm

# Instalar MySQL client
apt install -y mysql-client

# Verificar instalación
node --version
npm --version
```

### 4c. Crear directorio y clonar código:

```bash
# Crear carpeta del proyecto
mkdir -p /home/vitalpet
cd /home/vitalpet

# Opción A: Si tienes repositorio Git
git clone https://github.com/tu-usuario/vitalpet.git .

# Opción B: Si subes por SFTP (Filezilla, etc)
# Sube los archivos manualmente a /home/vitalpet
```

### 4d. Configurar Backend:

```bash
cd /home/vitalpet/proyecto/backend

# Copiar y editar .env.production
cp .env.production .env.prod

# IMPORTANTE: Editar con tus credenciales reales
nano .env.prod

# Presiona: Ctrl+O, Enter, Ctrl+X para guardar

# Instalar dependencias
npm install

# Probar conexión a BD (opcional)
mysql -h mysql.tu-dominio.com -u u1234567_vitalpet -p < /ruta/a/script.sql
```

### 4e. Iniciar Backend con PM2 (recomendado):

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con .env.prod
NODE_ENV=production pm2 start server.js --name "vitalpet-api" --env .env.prod

# Guardar configuración PM2
pm2 save

# Configurar autostart al reiniciar VPS
pm2 startup

# Verificar que está corriendo
pm2 list
pm2 logs vitalpet-api
```

### 4f. Configurar Frontend:

```bash
cd /home/vitalpet/proyecto/frontend

# El frontend necesita ser servido por un servidor (Apache/Nginx)
# Opción recomendada: Usar Nginx como reverse proxy
```

---

## 🔗 PASO 5: CONFIGURAR NGINX COMO REVERSE PROXY

### 5a. Instalar Nginx:

```bash
apt install -y nginx
```

### 5b. Crear configuración de Nginx:

```bash
# Crear archivo de configuración
nano /etc/nginx/sites-available/vitalpet

# Copiar este contenido:
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Servir archivos estáticos (frontend)
    location / {
        root /home/vitalpet/proyecto/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servir uploads
    location /uploads/ {
        alias /home/vitalpet/proyecto/backend/uploads/;
    }
}
```

### 5c. Habilitar configuración:

```bash
# Crear symlink
ln -s /etc/nginx/sites-available/vitalpet /etc/nginx/sites-enabled/

# Probar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## 🔒 PASO 6: CONFIGURAR SSL (HTTPS)

### Instalar Let's Encrypt Certbot:

```bash
apt install -y certbot python3-certbot-nginx

# Generar certificado (automático)
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Responder preguntas:
# - Email: tu-email@gmail.com
# - Aceptar términos: Y
# - Compartir email: N (opcional)
# - Redirigir HTTP a HTTPS: 2

# Verificar renovación automática
certbot renew --dry-run
```

---

## ✅ PASO 7: VERIFICAR QUE TODO FUNCIONA

### 7a. Probar Backend:

```bash
curl https://tu-dominio.com/api

# Debería responder algo como:
# {"mensaje":"✅ Backend de VitalPet está funcionando","version":"1.0.0","estado":"activo"}
```

### 7b. Probar Frontend:

```bash
# Abrir en navegador:
https://tu-dominio.com

# Debería cargar la página de login
```

### 7c. Verificar logs:

```bash
# Logs de Node.js
pm2 logs vitalpet-api

# Logs de Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 🔄 PASO 8: CONFIGURAR BACKUPS AUTOMÁTICOS (IMPORTANTE!)

### Crear script de backup:

```bash
nano /home/vitalpet/backup.sh

# Copiar:
```

```bash
#!/bin/bash

BACKUP_DIR="/home/vitalpet/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="u1234567_vitalpet"
DB_USER="u1234567_vitalpet"
DB_HOST="mysql.tu-dominio.com"

mkdir -p $BACKUP_DIR

# Backup de BD
mysqldump -h $DB_HOST -u $DB_USER -p[TU_PASSWORD] $DB_NAME > $BACKUP_DIR/db_$TIMESTAMP.sql

# Backup de archivos (mascotas, productos)
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /home/vitalpet/proyecto/backend/uploads/

# Guardar solo últimos 7 días
find $BACKUP_DIR -type f -mtime +7 -delete

echo "✅ Backup completado: $TIMESTAMP"
```

### Hacer script ejecutable y programar:

```bash
chmod +x /home/vitalpet/backup.sh

# Agregar a cron (diariamente a las 2 AM):
crontab -e

# Agregar línea:
0 2 * * * /home/vitalpet/backup.sh
```

---

## 📊 PASO 9: MONITOREO Y MANTENIMIENTO

### Ver estado del servidor:

```bash
# Procesos Node.js
pm2 list
pm2 monit

# Uso de recursos
top
df -h

# Estado de Nginx
systemctl status nginx
```

### Limpiar logs grandes:

```bash
# Limpiar logs de Nginx (reciclarse automáticamente)
logrotate /etc/logrotate.d/nginx

# Limpiar logs de PM2
pm2 flush
```

---

## ⚠️ TROUBLESHOOTING

### Frontend no carga (error CORS):

1. Verificar FRONTEND_URL en `.env.prod`
2. Verificar que HTTPS esté activo
3. Reiniciar Node.js: `pm2 restart vitalpet-api`

### DB no conecta:

```bash
# Probar conexión manual:
mysql -h mysql.tu-dominio.com -u u1234567_vitalpet -p

# Si falla, revisar:
# - Credenciales correctas
# - IP del VPS permitida en firewall de Hostinger
# - Puerto 3306 abierto
```

### PORT 5000 ya en uso:

```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso (si es necesario)
kill -9 [PID]

# O cambiar PORT a 3000 en .env.prod y Nginx
```

---

## 🎉 ¡LISTO!

Tu VitalPet está en vivo en: **https://tu-dominio.com**

**Proximos pasos:**
1. ✅ Prueba todas las funciones (login, compra, citas, perfil)
2. ✅ Invita usuarios para testing
3. ✅ Recopila feedback
4. ✅ Presenta a posibles clientes empresariales
5. ✅ Si aprueba, cambia a plan de 12 meses

---

**Soporte Hostinger:** https://www.hostinger.com/support  
**Documentación Node.js:** https://nodejs.org/docs/  
**Documentación Nginx:** https://nginx.org/en/docs/

¿Necesitas ayuda? 📞
