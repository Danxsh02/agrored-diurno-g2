# AgroRed S.A. - Microproyecto Módulo 3

**Jornada:** Diurna · **Grupo:** 2 (`agrored-diurno-g2`)

AgroRed S.A. es una empresa de agroindustria y distribución que gestiona productos, clientes, pedidos y lotes de producción. La aplicación está construida como un conjunto de microservicios independientes en Node.js y Express, con MySQL, un API Gateway en Apache y un frontend en HTML/JS. Desde el Taller 3 está desplegada en las VMs del Módulo 2 y abre en `http://app.agrored.com`.

## Integrantes y microservicios

| Nombre | Usuario de GitHub | Microservicio a cargo |
|---|---|---|
| Daniel Muñoz Delgado | Danxsh02 | `ms-lotes` |
| Estefanía del Amor Restrepo | tefDel | `ms-productos` |
| Valentina Montero Zapata | monterozapatavalentina-ctrl | `ms-clientes` |
| Edwin David Correa Cifuentes | edwinc2010 | `ms-pedidos` |

Los roles de trabajo rotan cada semana; los del Taller 3 están en la sección siguiente.

## Roles del Taller 3 (despliegue)

| Rol | Integrante |
|---|---|
| Integradores (datos en servidor1 y aplicación en servidor2) | Estefanía del Amor Restrepo y Edwin David Correa Cifuentes |
| Arquitecto (frontend) | Daniel Muñoz Delgado |
| Coordinador, Relator y Documentador | Valentina Montero Zapata |

## Microservicios

| Carpeta | Entidad | Responsable | Puerto | Depende de |
|---|---|---|---|---|
| `ms-usuarios` | Usuarios | Zeida María Solarte (docente) | 3001 | [ninguno] |
| `ms-productos` | Producto | Estefanía del Amor Restrepo | 3002 | [ninguno] |
| `ms-clientes` | Cliente | Valentina Montero Zapata | 3003 | [ninguno] |
| `ms-pedidos` | Pedido | Edwin David Correa Cifuentes | 3004 | [ms-clientes, ms-productos] |
| `ms-lotes` | Lote | Daniel Muñoz Delgado | 3005 | [ms-productos] |

`ms-usuarios` emite el token JWT con el login; los demás lo verifican con la misma `JWT_SECRET`. Las llamadas entre servicios (por ejemplo, de `ms-lotes` a `ms-productos`) van directas a `127.0.0.1:300X`, no por el gateway.

Cada microservicio tiene su propio `README.md` dentro de su carpeta, con su contrato (atributos, endpoints, errores), sus relaciones y su tabla de pruebas.

## Roles de la aplicación y permisos

Hay tres roles: `administrador`, `comercial` y `produccion`. Todos los endpoints exigen token (sin token: 401). Cualquier usuario autenticado puede consultar (GET); crear, editar y eliminar requiere uno de estos roles (si no: 403):

| Entidad | Consultar | Crear, editar y eliminar |
|---|---|---|
| Usuarios | administrador | administrador |
| Productos | todos | administrador, produccion |
| Clientes | todos | administrador, comercial |
| Pedidos | todos | administrador, comercial |
| Lotes | todos | administrador, produccion |

Los permisos se validan siempre en el backend. El frontend oculta los botones solo para facilitar el uso: una petición forzada de un rol sin permiso recibe 403.

## Frontend

El frontend (`frontend/`) usa rutas relativas `/api/...` (mismo origen que el gateway, por eso no necesita CORS). Guarda la sesión en `sessionStorage` y envía `Authorization: Bearer <token>` en cada llamada. Muestra mensajes ante 400, 401, 403, 409 y 503, y avisa cuando un servicio relacionado no responde sin caerse.

Al iniciar sesión, cada rol llega al primer módulo de su menú (se define en `frontend/js/config.js`):

| Página | Quién la ve | Responsable |
|---|---|---|
| `login.html` | todos | Daniel Muñoz Delgado |
| `panel.html` (Panel general: totales de cada entidad) | administrador | Daniel Muñoz Delgado |
| `usuarios.html` | administrador | Daniel Muñoz Delgado |
| `clientes.html` | todos | Valentina Montero Zapata |
| `productos.html` | todos | Estefanía del Amor Restrepo |
| `pedidos.html` | todos | Edwin David Correa Cifuentes |
| `lotes.html` | todos | Daniel Muñoz Delgado |

Páginas de inicio: administrador → Panel general, comercial → Pedidos, produccion → Lotes.

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

Cada microservicio tiene la misma estructura interna:

```
ms-xxx/
├── src/
│   ├── app.js            # Configuración de Express y registro de rutas
│   ├── index.js          # Arranque del servidor
│   ├── routes/           # Definición de endpoints
│   ├── controllers/      # Capa de presentación (HTTP)
│   ├── services/         # Lógica de negocio y validaciones
│   ├── repositories/     # Acceso a datos (MySQL)
│   ├── models/           # Entidad y validación
│   ├── middlewares/      # Verificación de token y de rol
│   └── utils/            # Utilidades (HttpError)
├── db/schema.sql         # Tablas y datos iniciales
├── docs/                 # Colecciones de pruebas de Thunder Client
├── package.json
├── package-lock.json
└── .env.example
```

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

### Firewall (ufw)

| Equipo | Puertos abiertos | Para qué |
|---|---|---|
| servidor1 | 22/tcp, 53/tcp y 53/udp, 3128/tcp, 25/tcp, 143/tcp | SSH, DNS, Squid y correo (Módulo 2) |
| servidor1 | 3306/tcp solo desde `172.16.1.59` | MySQL: únicamente servidor2 puede conectarse |
| servidor2 | 22/tcp, 80/tcp | SSH y gateway Apache |

Los puertos 3001 a 3006 de los microservicios **no** se abren: escuchan solo en `127.0.0.1` y desde Windows se llega a ellos únicamente por el gateway.

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
En el `.env` solo cambian respecto al de desarrollo: `DB_HOST=172.16.1.58`, `DB_PASSWORD` (la de servidor1) y `JWT_SECRET` (una frase nueva, la **misma** en los 5).

Variables del `.env` (el `.env.example` de cada servicio las trae todas):

| Variable | Qué es | En servidor2 |
|---|---|---|
| `PORT`, `HOST` | Puerto del servicio y `127.0.0.1` | Igual que en el PC |
| `DB_HOST`, `DB_PORT` | Servidor MySQL | `172.16.1.58`, `3306` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base y usuario propios del servicio | Nombres iguales; clave de servidor1 |
| `JWT_SECRET` | Clave con la que se verifican los tokens | La misma en los 5 servicios |
| `CLIENTES_URL` | Solo `ms-pedidos`: dónde está `ms-clientes` | `http://127.0.0.1:3003` |
| `PRODUCTOS_URL` | `ms-pedidos` y `ms-lotes`: dónde está `ms-productos` | `http://127.0.0.1:3002` |

Verificar: `systemctl status ms-<nombre>`, `curl http://127.0.0.1:300X/health` y `sudo ss -tlnp | grep 300` (deben escuchar en `127.0.0.1`). **No abrir** los puertos 3001–3006 en ufw: en servidor2 solo 22 y 80.

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

Las contraseñas están en el canal privado del grupo. Los usuarios también se pueden crear y editar desde la pantalla **Usuarios** del administrador.

### 7. Frontend
```bash
cd /srv/agrored/app && git pull
sudo cp -r frontend/* /var/www/app/
```
Debe aparecer `login.html`, `panel.html` y `usuarios.html` en `/var/www/app`.

### 8. Windows (cliente)
En PowerShell **como administrador**: `Add-DnsClientNrptRule -Namespace ".agrored.com" -NameServers "172.16.1.58"`. Verificar con `Resolve-DnsName app.agrored.com` (no con `nslookup`, que ignora esta regla). Si el navegador usa el proxy Squid, agregar `*.agrored.com` a las excepciones.

## Actualizar un ambiente ya desplegado

Después de un `git pull` en el PC, en servidor2 como `vagrant`:

```bash
cd /srv/agrored/app && git pull
sudo cp -r frontend/* /var/www/app/
git diff --name-only ORIG_HEAD HEAD
```

Si el último comando lista archivos de un `ms-<nombre>/`, en esa carpeta: `npm ci --omit=dev` y `sudo systemctl restart ms-<nombre>`. Si solo lista `frontend/`, `deploy/`, `README.md` o `docs/`, no hay que reiniciar nada. En el navegador, recargar con Ctrl+F5.

Los usuarios y los datos viven en MySQL de servidor1 y **no** viajan con Git: se igualan desde la pantalla Usuarios o copiando las bases con `mysqldump` (el volcado lleva los hashes de las contraseñas, así que no se sube al repositorio).

## Prueba integral
1. `Resolve-DnsName app.agrored.com` → `172.16.1.59`.
2. Abrir `http://app.agrored.com` e iniciar sesión con un usuario de cada rol; cada uno llega a la página de su rol.
3. `GET /api/<recurso>` sin token → 401.
4. Comercial crea un producto → 403.
5. Colecciones de Thunder Client por el gateway (`http://app.agrored.com/api`), con el entorno `gateway` (`token_admin`, `token_comercial`, `token_produccion`).
6. `curl.exe http://172.16.1.59:3002/health` y `Test-NetConnection 172.16.1.58 -Port 3306` desde Windows → ambos fallan.
7. Listar Lotes con `journalctl -u ms-productos -f`: una sola petición `?ids=`.
8. `sudo systemctl stop ms-productos`: Lotes avisa y no se cae; crear un lote da 503. Luego `sudo systemctl start ms-productos`.
9. `sudo reboot` en servidor2: todo vuelve solo (`systemctl is-active ms-usuarios ms-productos ms-clientes ms-pedidos ms-lotes apache2`).

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| El navegador muestra "Index of /" | `/var/www/app` está vacío: copiar `frontend/*` (paso 7) |
| Cambios del frontend que no se ven | Caché del navegador: Ctrl+F5, o F12 → Red → "Deshabilitar caché" |
| `Resolve-DnsName` no encuentra `app.agrored.com` | Falta la regla NRPT (paso 8) o servidor1 está apagada |
| `curl` o el navegador no resuelven pero `nslookup` sí | `nslookup` pregunta directo a servidor1; el navegador usa el resolvedor de Windows: aplicar la regla NRPT (paso 8) |
| "Acceso denegado" al ejecutar `Add-DnsClientNrptRule` o `Set-DnsClientServerAddress` | PowerShell sin permisos: abrirla con clic derecho → Ejecutar como administrador |
| `ECONNREFUSED 127.0.0.1:3306` al arrancar un servicio | `DB_HOST` mal puesto en el `.env` |
| `ECONNREFUSED`/`ETIMEDOUT` hacia `172.16.1.58` | Revisar `ip route get 172.16.1.58`: debe salir por `eth1` |
| 401 en todas las peticiones tras cambiar claves | `JWT_SECRET` distinta entre microservicios |
| 403 aunque el botón aparece en pantalla | Es lo esperado: el backend valida el rol del token, sin importar lo que muestre el frontend |
| 503 en `/api/<recurso>` | El servicio está detenido: `systemctl status ms-<nombre>` |

## Cómo ejecutar un microservicio (desarrollo en PC)

Ejemplo con `ms-productos` (requiere MySQL local con las tablas de `db/schema.sql` y el `.env` con `DB_HOST=localhost`):

```bash
cd ms-productos
npm install
cp .env.example .env
npm run dev
```

Debe aparecer `ms-productos escuchando en http://127.0.0.1:3002`. Para comprobar que funciona: `GET /health`.