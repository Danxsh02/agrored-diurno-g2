# Microservicio: ms-clientes

Servicio de clientes para la empresa **AgroRed S.A.**, separado en capas, con persistencia en MySQL, seguridad con tokens JWT y realizado a partir de la plantilla ms-usuarios proporcionada.

| | |
|---|---|
| **Responsable** | Valentina Montero Zapata |
| **Puerto** | 3003 |
| **Stack** | Node.js · Express · MySQL · JWT |
| **Versión** | Taller 2 (semana 2) |

## ¿Qué hace?

Este servicio es el único responsable de la información de los clientes de AgroRed (distribuidores y comercios). Otros microservicios, como ms-pedidos, se apoyan en él para saber qué clientes existen. Permite:

- Listar los clientes, con filtros por ciudad, por tipo y por lista de ids,
- Buscar un cliente por su id,
- Registrar un cliente nuevo, validando sus datos y evitando NIT repetidos,
- Actualizar y eliminar clientes.

Todas las rutas (menos `/health`) exigen un token JWT, y los permisos dependen del rol del usuario.

## Puesta en marcha

Necesitas Node.js LTS (22 o superior), npm y MySQL (en el puerto 3306).

**1. Crear la base de datos y su usuario** (como root, en MySQL Workbench o en la consola):

```sql
CREATE DATABASE clientes_db;
CREATE USER 'clientes_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON clientes_db.* TO 'clientes_user'@'localhost';
FLUSH PRIVILEGES;
```

**2. Crear la tabla y los datos iniciales.** Desde la carpeta `ms-clientes`:

```bash
mysql -u clientes_user -p clientes_db
mysql> SOURCE db/schema.sql;
```

(En Workbench: **File → Open SQL Script**, elegir `db/schema.sql`, conectado como `clientes_user`, y ejecutar.)

**3. Instalar y arrancar.** Desde la carpeta `ms-clientes`:

```bash
npm install
cp .env.example .env
npm run dev
```

Edite el `.env` y con la clave real de la base de datos en `DB_PASSWORD` y la frase del grupo en `JWT_SECRET`:

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

Si todo salió bien, la consola muestra:

```text
ms-clientes escuchando en http://127.0.0.1:3003
```

`npm run dev` reinicia el servidor automáticamente cada vez que se guarda un archivo.

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

Todas las rutas de `/clientes` exigen un token JWT, que se obtiene en ms-usuarios (`POST /usuarios/login`) y se envía en cada petición:

```text
Authorization: Bearer <token>
```

Los permisos siguen la tabla de AgroRed:

| Operación | Roles permitidos |
|---|---|
| GET (listar, filtrar, por lotes, obtener) | Cualquier rol autenticado (administrador, comercial, produccion) |
| POST, PUT, DELETE | administrador y comercial |

La verificación está en `src/middlewares/auth.js` (`verificarToken` y `requiereRol`) y se aplica en `src/routes/clientes.routes.js`. `/health` es público.

## Endpoints

Base: `http://127.0.0.1:3003`

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/clientes` | — | 200 + arreglo | 401 |
| Filtrar | GET | `/clientes?ciudad=Cali` o `?tipo=comercio` | — | 200 + arreglo filtrado | 401 |
| Consultar por lotes | GET | `/clientes?ids=1,3,8` | — | 200 + arreglo con esos registros | 400 ids inválidos · 401 |
| Obtener | GET | `/clientes/:id` | — | 200 + objeto | 400 id inválido · 401 · 404 |
| Crear | POST | `/clientes` | JSON sin id | 201 + objeto + cabecera Location | 400 · 401 · 403 · 409 |
| Actualizar | PUT | `/clientes/:id` | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| Eliminar | DELETE | `/clientes/:id` | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Los filtros se pueden combinar, por ejemplo `/clientes?ciudad=Cali&tipo=distribuidor`.

### Ejemplo: crear un cliente

`POST /clientes` (con el token de un administrador o comercial)

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

Respuesta: `201 Created`, con la cabecera `Location: /clientes/4` y el cliente guardado:

```json
{
  "id": 4,
  "nombre": "Supermercado La Sabana",
  "nit": "901555444-2",
  "ciudad": "Bogotá",
  "telefono": "3205557788",
  "tipo": "comercio",
  "direccion": "Avenida 68 # 45-20",
  "email": "compras@lasabana.com"
}
```

### Ejemplo: listar con filtro

`GET /clientes?ciudad=Cali` responde `200`:

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

- **NIT único (409):** no puede haber dos clientes con el mismo NIT. Al actualizar, el NIT solo causa conflicto si pertenece a **otro** cliente; el mismo cliente puede conservar su NIT.
- **Tipo dentro de la lista (400):** `tipo` solo acepta `distribuidor` o `comercio`.

Todos los errores salen en JSON con el campo `error`.

| Código | Cuándo | Ejemplo |
|---|---|---|
| 400 | Algún dato no cumple las reglas, el id de la URL no es un entero positivo, o `ids` no es una lista de enteros separados por comas | `El id debe ser un entero positivo` |
| 401 | Falta el token, es inválido o está vencido | `Token inválido o vencido` |
| 403 | El token es válido, pero el rol no puede hacer esa operación | `El rol produccion no tiene permiso para esta operación` |
| 404 | El id es válido pero no hay un cliente con ese número (GET, PUT o DELETE) | `No existe el cliente con id 99` |
| 409 | El `nit` enviado ya pertenece a otro cliente (POST o PUT) | `Ya existe un cliente con el NIT 900123456-7` |

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

ms-pedidos reenvía el token del usuario en la cabecera `Authorization`, y ms-clientes lo verifica con su propia `JWT_SECRET`. Cada petición recibida se registra en la consola con la hora, el método y la URL (por ejemplo, `10:32:15 GET /clientes?ids=1,2`).

## Datos de partida

Al ejecutar `db/schema.sql`, la tabla queda con tres clientes (y se reinicia si ya existía):

| id | nombre | nit | ciudad | tipo |
|---|---|---|---|---|
| 1 | Distribuidora El Valle | 900123456-7 | Cali | distribuidor |
| 2 | Comercial Andina | 800987654-3 | Bogotá | comercio |
| 3 | Agrocomercial Antioquia | 901222333-4 | Medellín | comercio |

Los datos se guardan en MySQL, así que no se pierden al reiniciar el servicio.

## Pruebas

La colección de pruebas está en la carpeta `docs/` (formato Thunder Client y formato Postman). Los casos 1 a 13 prueban el CRUD y los casos 14 a 18 la seguridad. Estos últimos requieren un token, que se obtiene con el login de ms-usuarios.

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
| 10 | Actualizar un cliente existente | 200 |
| 11 | Actualizar un id que no existe | 404 |
| 12 | Eliminar un cliente existente | 204 |
| 13 | Eliminar el mismo cliente otra vez | 404 |
| 14 | Petición sin token | 401 |
| 15 | Petición con un token modificado | 401 |
| 16 | GET con el token de un rol que solo consulta (produccion) | 200 |
| 17 | POST con el token de un rol sin permiso (produccion) | 403 |
| 18 | POST con el token de un rol con permiso (comercial) | 201 |

## Organización del código

```text
ms-clientes/
├── db/
│   └── schema.sql                     # Tabla y datos iniciales
├── docs/                              # Colección de pruebas exportada
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
Cliente → rutas (token + rol) → controlador → servicio → repositorio → MySQL
                                                  ↓
                                          modelo (validación)
```

## Próximos pasos

- **Taller 3:** despliegue en las máquinas virtuales detrás de un gateway (Apache) y conexión del frontend con los microservicios reales.