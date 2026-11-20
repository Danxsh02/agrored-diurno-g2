# Microservicio: ms-clientes

Servicio de clientes para la empresa **AgroRed S.A.**, separado en capas, con persistencia en MySQL, seguridad con tokens JWT, desplegado como servicio systemd en servidor2 y expuesto a través del gateway Apache.

| | |
|---|---|
| **Responsable** | Valentina Montero Zapata |
| **Puerto** | 3003 (solo en 127.0.0.1 de servidor2) |
| **Stack** | Node.js · Express · MySQL · JWT |
| **Versión** | Taller 3 |
| **Acceso desde Windows** | `http://app.agrored.com/api/clientes` (por el gateway) |

## ¿Qué hace?

Este servicio es el único responsable de la información de los clientes de AgroRed (distribuidores y comercios). Otros microservicios, como ms-pedidos, se apoyan en él para saber qué clientes existen. Permite:

- Listar los clientes, con filtros por ciudad, por tipo y por lista de ids,
- Buscar un cliente por su id,
- Registrar un cliente nuevo, validando sus datos y evitando NIT repetidos,
- Actualizar y eliminar clientes.

Todas las rutas (menos `/health`) exigen un token JWT, y los permisos dependen del rol del usuario.

## Dónde corre

| Pieza | Equipo | Detalle |
|---|---|---|
| ms-clientes | servidor2 (172.16.1.59) | Servicio systemd `ms-clientes`, escucha solo en `127.0.0.1:3003` |
| Base de datos `clientes_db` | servidor1 (172.16.1.58) | MySQL en el puerto 3306 |
| Gateway | servidor2 | Apache reenvía `/api/clientes` a `http://127.0.0.1:3003/clientes` |

El puerto 3003 no se abre en ufw: desde Windows el servicio solo se alcanza a través del gateway.

## Despliegue en servidor2

**1. Base de datos en servidor1.** Se crean la base y el usuario `clientes_user` (restringido a la IP de servidor2) y se ejecuta `db/schema.sql`. Los comandos están en la carpeta `deploy/` del repositorio, sin contraseñas. [Confirmar contra `deploy/`]

**2. Instalar y configurar, en servidor2.** [Confirmar la ruta]

```bash
cd /ms-clientes
npm ci --omit=dev
cp .env.example .env && nano .env
chmod 640 .env && sudo chgrp nodeapps .env
```

El `.env` de servidor2 cambia respecto al de desarrollo solo en tres variables:

| Variable | En mi PC (Taller 2) | En servidor2 (Taller 3) |
|---|---|---|
| `PORT`, `HOST` | 3003, 127.0.0.1 | Igual |
| `ROLES` | administrador, comercial, produccion | Igual |
| `DB_HOST` | localhost | `172.16.1.58` (servidor1) |
| `DB_NAME`, `DB_USER` | clientes_db, clientes_user | Igual |
| `DB_PASSWORD` | La de desarrollo | La nueva de servidor1 |
| `JWT_SECRET` | La de desarrollo | Una frase nueva, la misma en todos los microservicios |

El código no cambia: solo cambia el `.env`.

**3. Registrar el servicio.** El archivo `.service` está en `deploy/` [confirmar el nombre]. Se activa con:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ms-clientes
systemctl status ms-clientes
```

Con `enable` el servicio arranca solo al reiniciar servidor2.

**4. Ver el registro.** Cada petición que llega se imprime con la hora, el método y la URL:

```bash
journalctl -u ms-clientes -f
```

## Puesta en marcha en el PC (desarrollo)

Necesitas Node.js LTS (22 o superior), npm y MySQL (en el puerto 3306).

```sql
CREATE DATABASE clientes_db;
CREATE USER 'clientes_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON clientes_db.* TO 'clientes_user'@'localhost';
FLUSH PRIVILEGES;
```

Luego ejecuta `db/schema.sql` conectado como `clientes_user`, y desde la carpeta `ms-clientes`:

```bash
npm install
cp .env.example .env
npm run dev
```

Edita el `.env` con la clave real de la base de datos y la frase del grupo:

```dotenv
PORT=3003
HOST=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clientes_db
DB_USER=clientes_user
DB_PASSWORD=una-clave-segura
JWT_SECRET=la-misma-frase-de-ms-usuarios
```

`JWT_SECRET` debe ser **idéntica** en todos los microservicios del grupo y en ms-usuarios: así cada servicio verifica los tokens sin consultar a ms-usuarios.

## Representación y atributos

```json
{
  "id": 1,
  "nombre": "Distribuidora El Valle",
  "nit": "900123456-7",
  "ciudad": "Cali",
  "telefono": "3001234567",
  "tipo": "distribuidor",
  "direccion": "Calle 10 # 20-30",
  "email": "compras@distribuidora.com"
}
```

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | Entero | — | Lo genera la base de datos; no se envía al crear ni al actualizar |
| `nombre` | Texto | Sí | Con contenido (se recortan los espacios de los extremos) |
| `nit` | Texto | Sí | Con contenido; **único** |
| `ciudad` | Texto | Sí | Con contenido |
| `telefono` | Texto | Sí | Con contenido |
| `tipo` | Texto | Sí | `distribuidor` o `comercio` |
| `direccion` | Texto | No | Si se omite, queda vacía |
| `email` | Texto | No | Formato de correo válido; se guarda en minúsculas |

Cualquier otro campo que se envíe se ignora y no se guarda.

## Seguridad

Todas las rutas de `/clientes` exigen un token JWT, que se obtiene en ms-usuarios (`POST /api/usuarios/login`) y se envía en cada petición:

```text
Authorization: Bearer <token>
```

Los permisos siguen la tabla de AgroRed:

| Operación | Roles permitidos |
|---|---|
| GET (listar, filtrar, por lotes, obtener) | Cualquier rol autenticado (administrador, comercial, produccion) |
| POST, PUT, DELETE | administrador y comercial |

La verificación está en `src/middlewares/auth.js` (`verificarToken` y `requiereRol`) y se aplica en `src/routes/clientes.routes.js`. `/health` es público.

Los permisos se validan siempre en el backend: aunque el frontend oculte los botones a un rol sin permiso, una petición forzada recibe 403.

## Endpoints

Base por el gateway: `http://app.agrored.com/api/clientes`. (Directamente, solo dentro de servidor2: `http://127.0.0.1:3003/clientes`.)

| Operación | Método | URI (tras `/api`) | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` (directo en servidor2) | — | 200 | — |
| Listar | GET | `/clientes` | — | 200 + arreglo | 401 |
| Filtrar | GET | `/clientes?ciudad=Cali` o `?tipo=comercio` | — | 200 + arreglo filtrado | 401 |
| Consultar por lotes | GET | `/clientes?ids=1,3,8` | — | 200 + arreglo con esos registros | 400 ids inválidos · 401 |
| Obtener | GET | `/clientes/:id` | — | 200 + objeto | 400 id inválido · 401 · 404 |
| Crear | POST | `/clientes` | JSON sin id | 201 + objeto + cabecera Location | 400 · 401 · 403 · 409 |
| Actualizar | PUT | `/clientes/:id` | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| Eliminar | DELETE | `/clientes/:id` | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Los filtros se pueden combinar, por ejemplo `/clientes?ciudad=Cali&tipo=distribuidor`.

### Ejemplo: crear un cliente

`POST http://app.agrored.com/api/clientes` (con el token de un administrador o comercial)

```json
{
  "nombre": "Supermercado La Sabana",
  "nit": "901555444-2",
  "ciudad": "Bogotá",
  "telefono": "3205557788",
  "tipo": "comercio",
  "direccion": "Avenida 68 # 45-20",
  "email": "compras@lasabana.com"
}
```

Respuesta: `201 Created`, con la cabecera `Location` y el cliente guardado (con su `id` nuevo).

### Ejemplo: listar con filtro

`GET http://app.agrored.com/api/clientes?ciudad=Cali` responde `200`:

```json
[
  {
    "id": 1,
    "nombre": "Distribuidora El Valle",
    "nit": "900123456-7",
    "ciudad": "Cali",
    "telefono": "3001234567",
    "tipo": "distribuidor",
    "direccion": "Calle 10 # 20-30",
    "email": "compras@distribuidora.com"
  }
]
```

## Reglas de negocio y errores

- **NIT único (409):** no puede haber dos clientes con el mismo NIT. Al actualizar, el NIT solo causa conflicto si pertenece a **otro** cliente.
- **Tipo dentro de la lista (400):** `tipo` solo acepta `distribuidor` o `comercio`.

Todos los errores salen en JSON con el campo `error`.

| Código | Cuándo | Ejemplo |
|---|---|---|
| 400 | Algún dato no cumple las reglas, el id no es un entero positivo, o `ids` no es una lista de enteros separados por comas | `El id debe ser un entero positivo` |
| 401 | Falta el token, es inválido o está vencido | `Token inválido o vencido` |
| 403 | El token es válido, pero el rol no puede hacer esa operación | `El rol produccion no tiene permiso para esta operación` |
| 404 | El id es válido pero no hay un cliente con ese número | `No existe el cliente con id 99` |
| 409 | El `nit` enviado ya pertenece a otro cliente | `Ya existe un cliente con el NIT 900123456-7` |

Cuando el 400 viene de la validación del cuerpo, se agrega `detalles` con todos los problemas encontrados a la vez:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "nit es obligatorio",
    "ciudad es obligatoria",
    "tipo debe ser uno de: distribuidor, comercio"
  ]
}
```

El servicio primero valida el formato y solo después busca duplicados, por eso un dato inválido da 400 y nunca 409.

## Relaciones

ms-clientes **no guarda referencias** a otros microservicios. Es un servicio **consultado**:

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| ms-pedidos | `GET /clientes/:id` (validar que el cliente exista al crear o actualizar un pedido) · `GET /clientes?ids=…` (componer la respuesta de los pedidos) | `id`, `nombre` |

ms-pedidos reenvía el token del usuario en la cabecera `Authorization`, y ms-clientes lo verifica con su propia `JWT_SECRET`. En servidor2, ms-pedidos llama a `http://127.0.0.1:3003`, sin pasar por el gateway. Cada petición recibida se registra con la hora, el método y la URL, y se ve con `journalctl -u ms-clientes -f`.

## Datos de partida

Al ejecutar `db/schema.sql`, la tabla queda con tres clientes (y se reinicia si ya existía):

| id | nombre | nit | ciudad | tipo |
|---|---|---|---|---|
| 1 | Distribuidora El Valle | 900123456-7 | Cali | distribuidor |
| 2 | Comercial Andina | 800987654-3 | Bogotá | comercio |
| 3 | Agrocomercial Antioquia | 901222333-4 | Medellín | comercio |

## Pruebas

Las colecciones están en `docs/`. La del Taller 3 (`thunder-collection_ms-clientes-gateway-t3.json`) ejecuta los mismos casos a través del gateway, con la base `http://app.agrored.com/api` y tres variables con los tokens: `token_admin`, `token_comercial` y `token_produccion`. Se obtienen con el login de ms-usuarios.

| # | Caso | Código esperado |
|---|---|---|
| 1 | Listar todos | 200 |
| 2 | Filtrar por ciudad | 200 |
| 3 | Consultar por lotes (`?ids=1,2`) | 200 |
| 4 | Obtener un cliente existente | 200 |
| 5 | Obtener un id que no existe | 404 |
| 6 | Obtener con id no numérico (`/clientes/abc`) | 400 |
| 7 | Crear con datos válidos | 201 |
| 8 | Crear sin un atributo obligatorio | 400 |
| 9 | Crear con un NIT repetido | 409 |
| 10 | Actualizar un id que no existe | 404 |
| 11 | Actualizar un cliente existente | 200 |
| 12 | Eliminar un cliente existente | 204 |
| 13 | Eliminar el mismo cliente otra vez | 404 |
| 14 | Petición sin token | 401 |
| 15 | Petición con un token modificado | 401 |
| 16 | GET con el token de un rol que solo consulta (produccion) | 200 |
| 17 | POST con el token de un rol sin permiso (produccion) | 403 |
| 18 | POST con el token de un rol con permiso (comercial) | 201 |
| 19 | Limpieza: eliminar el cliente creado en el caso 18 | 204 |

## Organización del código

```text
ms-clientes/
├── db/
│   └── schema.sql                     # Tabla y datos iniciales
├── docs/                              # Colecciones de pruebas exportadas
├── src/
│   ├── controllers/
│   │   └── clientes.controller.js     # Lee la petición y arma la respuesta HTTP
│   ├── middlewares/
│   │   └── auth.js                    # Verifica el token JWT y los roles
│   ├── models/
│   │   └── cliente.js                 # Campos válidos y validación
│   ├── repositories/
│   │   └── clientes.repository.js     # Consultas SQL a MySQL
│   ├── routes/
│   │   └── clientes.routes.js         # Rutas protegidas con token y permisos por rol
│   ├── services/
│   │   └── clientes.service.js        # Reglas de negocio (validar, NIT único)
│   ├── utils/
│   │   └── http-error.js              # Error con código HTTP
│   ├── app.js                         # Express, registro de peticiones, /health y errores
│   ├── db.js                          # Pool de conexiones a MySQL
│   └── index.js                       # Arranca el servidor con PORT y HOST
├── .env.example
├── package.json
└── package-lock.json
```

Cada capa solo se comunica con la que tiene al lado:

```text
Cliente → gateway → rutas (token + rol) → controlador → servicio → repositorio → MySQL
                                                           ↓
                                                   modelo (validación)
```