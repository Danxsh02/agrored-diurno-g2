# AgroRed S.A. - Microproyecto Módulo 3

**Jornada:** Diurna · **Grupo:** 6 (`agrored-diurno-g2`)

AgroRed S.A. es una empresa de agroindustria y distribución que gestiona productos, clientes, pedidos y lotes de producción. Esta aplicación está construida como un conjunto de microservicios independientes en Node.js y Express.

## Integrantes y microservicios

| Nombre | Usuario de GitHub | Rol | Microservicio a cargo |
|---|---|---|---|
| Daniel Muñoz Delgado | Danxsh02 | Integrador | `ms-lotes` |
| Estefanía Del Amor Restrepo | tefDel | Arquitecto | `ms-productos` |
| Valentina Montero | monterozapatavalentina-ctrl | Documentador | `ms-clientes` |
| Edwin David Correa Cifuentes | edwinc2010 | Coordinador / Relator | `ms-pedidos` |

## Microservicios

| Carpeta | Entidad | Responsable | Puerto | Depende de |
|---|---|---|---|---|
| `ms-usuarios` | Usuarios | Zeida Maria Solarte (Plantilla) | 3001 | [ninguno] |
| `ms-productos` | Producto | Estefanía Del Amor Restrepo | 3002 | [ninguno] |
| `ms-clientes` | Cliente | Valentina Montero| 3003 | [ninguno] |
| `ms-pedidos` | Pedido | Edwin David Correa Cifuentes | 3004 | [ms-clientes, ms-productos] |
| `ms-lotes` | Lote | Daniel Muñoz Delgado | 3005 | [ms-productos] |

## Estructura del repositorio

```
agrored-diurno-g2/
├── README.md
├── frontend/          # HTML/JS conectado a la API real (/api/...)
├── deploy/            # app.conf, archivos .service y SQL de bases (sin contraseñas)
├── ms-usuarios/       # Login y JWT (entregado por la docente)
├── ms-productos/
├── ms-clientes/
├── ms-pedidos/
└── ms-lotes/
```

## Roles del Taller 3 (despliegue)

| Rol | Integrante |
|---|---|
| Integrador de datos (servidor1) | <nombre> |
| Integrador de aplicación (servidor2) | <nombre> |
| Arquitecto (frontend) | <nombre> |
| Coordinador / Relator | <nombre> |
| Documentador | <nombre> |

## Despliegue en el ambiente (Taller 3)

**Ambiente:** servidor1 `172.16.1.58` (bind9, ufw, Squid, MySQL) y servidor2 `172.16.1.59` (Apache, ufw, Node.js, microservicios). Dominio `agrored.com`; la aplicación abre en `http://app.agrored.com`. No destruir las VMs del Módulo 2.

| Servicio | Puerto | Base de datos / usuario |
|---|---|---|
| ms-usuarios | 3001 | usuarios_db / usuarios_user |
| ms-productos | 3002 | productos_db / productos_user |
| ms-clientes | 3003 | clientes_db / clientes_user |
| ms-pedidos | 3004 | pedidos_db / pedidos_user |
| ms-lotes | 3005 | lotes_db / lotes_user |

Las contraseñas y la `JWT_SECRET` se acuerdan en el canal privado del grupo. **Nunca** se suben al repositorio (ni el `.env`).

### 1. MySQL en servidor1
1. `sudo apt update && sudo apt install -y mysql-server`
2. En `/etc/mysql/mysql.conf.d/mysqld.cnf`: `bind-address = 127.0.0.1,172.16.1.58` (sin espacio tras la coma) y `sudo systemctl restart mysql`.
3. `sudo ufw allow from 172.16.1.59 to any port 3306 proto tcp`
4. Crear las 5 bases y usuarios con `deploy/crear-bases-y-usuarios.sql`, reemplazando los marcadores `<CLAVE_...>` (contraseñas solo con letras y números). Los usuarios quedan `@'172.16.1.59'`.
5. Verificar: `sudo ss -tlnp | grep 3306` debe mostrar `172.16.1.58:3306`.

### 2. DNS en servidor1
Agregar en `/etc/bind/db.agrored.com` el registro `app IN A 172.16.1.59`, incrementar el serial, `sudo named-checkzone agrored.com /etc/bind/db.agrored.com` y `sudo systemctl restart bind9`.

### 3. Node.js y código en servidor2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git mysql-client
sudo adduser --system --group --no-create-home nodeapps
sudo mkdir -p /srv/agrored/app && sudo chown vagrant:vagrant /srv/agrored/app
git clone https://github.com/Danxsh02/agrored-diurno-g2.git /srv/agrored/app
```

### 4. Cada microservicio (empezar por ms-usuarios)
En `/srv/agrored/app/ms-<nombre>`:
```bash
npm ci --omit=dev
mysql -h 172.16.1.58 -u <usuario_bd> -p <nombre_bd> < db/schema.sql
cp .env.example .env && nano .env
chmod 640 .env && sudo chgrp nodeapps .env
sudo cp /srv/agrored/app/deploy/ms-<nombre>.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now ms-<nombre>
```
En el `.env` solo cambian: `DB_HOST=172.16.1.58`, `DB_PASSWORD` (la de servidor1) y `JWT_SECRET` (la **misma** en los 5). `ms-pedidos` y `ms-lotes` usan `CLIENTES_URL` y `PRODUCTOS_URL` apuntando a `http://127.0.0.1:300X`.

Verificar: `systemctl status ms-<nombre>`, `curl http://127.0.0.1:300X/health` y `sudo ss -tlnp | grep 300` (deben escuchar en `127.0.0.1`). **No abrir** los puertos 3001–3006 en ufw: en servidor2 solo 22 y 80.

> Si hay `ECONNREFUSED`/`ETIMEDOUT` hacia 172.16.1.58, revisar `ip route get 172.16.1.58`: debe salir por `eth1`.

### 5. Gateway Apache en servidor2
```bash
sudo a2enmod proxy proxy_http
sudo mkdir -p /var/www/app
sudo cp /srv/agrored/app/deploy/app.conf /etc/apache2/sites-available/
sudo a2ensite app.conf
sudo apache2ctl configtest        # debe decir Syntax OK
sudo systemctl reload apache2
```
Rutas: `/api/usuarios|productos|clientes|pedidos|lotes` → `http://127.0.0.1:300X/<recurso>`.

### 6. Usuarios de prueba
Con el administrador (`PUT /api/usuarios/1` con el JSON completo y `password`) se cambia la contraseña inicial y se crea un usuario por rol:

| Rol | Correo | Página de inicio |
|---|---|---|
| administrador | admin@agrored.com | Panel general |
| comercial | laura.gomez@agrored.com | Pedidos |
| produccion | andres.castillo@agrored.com | Lotes |

Las contraseñas están en el canal privado del grupo.

### 7. Frontend
```bash
cd /srv/agrored/app && git pull
sudo cp -r frontend/* /var/www/app/
```
Actualizar después de un cambio: `git pull`, `npm ci --omit=dev` en la carpeta del servicio, `sudo systemctl restart ms-<nombre>` (y recopiar `frontend/` si cambió).

### 8. Windows (cliente)
En PowerShell **como administrador**: `Add-DnsClientNrptRule -Namespace ".agrored.com" -NameServer "172.16.1.58"`. Verificar con `Resolve-DnsName app.agrored.com` (no con `nslookup`). Si el navegador usa el proxy Squid, agregar `*.agrored.com` a las excepciones.

## Prueba integral
1. `Resolve-DnsName app.agrored.com` → `172.16.1.59`.
2. Abrir `http://app.agrored.com` e iniciar sesión con un usuario de cada rol.
3. `GET /api/<recurso>` sin token → 401.
4. Comercial crea un producto → 403.
5. Colecciones de Thunder Client por el gateway (`http://app.agrored.com/api`).
6. `curl.exe http://172.16.1.59:3002/health` y `Test-NetConnection 172.16.1.58 -Port 3306` desde Windows → ambos fallan.
7. Listar Lotes con `journalctl -u ms-productos -f`: una sola petición `?ids=`.
8. `sudo systemctl stop ms-productos`: Lotes avisa y no se cae; crear un lote da 503. Luego `sudo systemctl start ms-productos`.
9. `sudo reboot` en servidor2: todo vuelve solo (`systemctl is-active ms-usuarios ms-productos ms-clientes ms-pedidos ms-lotes apache2`).

## Cómo ejecutar un microservicio (desarrollo en PC)

Ejemplo con 'ms-productos':

```bash
cd ms-productos
npm install
cp .env.example .env
npm run dev
```
Tomando de ejemplo a productos:
Debe aparecer 'ms-productos escuchando en http://127.0.0.1:3002'. Para comprobar que funciona: `GET /health`.
