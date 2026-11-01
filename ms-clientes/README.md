# Microservicio: ms-clientes

Servicio de clientes para la empresa **AgroRed S.A.**, separado en capas y realizado a partir de la plantilla ms-usuarios proporcionada.

| | |
|---|---|
| **Responsable** | Valentina Montero Zapata |
| **Puerto** | 3003 |
| **Stack** | Node.js · Express |
| **Versión** | Taller 1 |

## ¿Qué hace?

Este servicio es el único responsable de la información de los clientes de AgroRed (distribuidores y comercios). Otros microservicios, como pedidos, se apoyan en él para saber qué clientes existen. En esta versión permite:

- Consultar la lista completa de clientes,
- Buscar un cliente por su id,
- Registrar un cliente nuevo, validando sus datos y evitando NIT repetidos.

La base de datos, la autenticación con JWT y las operaciones de modificar y eliminar llegan en talleres posteriores.

## Puesta en marcha

Necesitas Node.js LTS (22 o superior) y npm. Desde la carpeta `ms-clientes`:

```bash
npm install
cp .env.example .env
npm run dev
```

> En CMD de Windows, el segundo comando es `copy .env.example .env`.

El archivo `.env` solo necesita dos valores:

```dotenv
PORT=3003
HOST=127.0.0.1
```

Si todo salió bien, la consola muestra:

```text
ms-clientes escuchando en http://127.0.0.1:3003
```

`npm run dev` reinicia el servidor automáticamente cada vez que se guarda un archivo.

### Estructura de un cliente

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

### Crear un cliente

`POST /clientes` con cuerpo JSON. El `id` lo asigna el servidor, no quien hace la petición.

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

Responde `201 Created` con el cliente guardado (con su `id` nuevo). La respuesta también trae la cabecera `Location: /clientes/3`, que indica dónde consultar el recurso creado.

## Validaciones

| Campo | Obligatorio | Qué se acepta |
|---|---|---|
| `nombre` | Sí | Texto con contenido (se recortan los espacios de los extremos) |
| `nit` | Sí | Texto con contenido; **debe ser único** |
| `ciudad` | Sí | Texto con contenido |
| `telefono` | Sí | Texto con contenido |
| `tipo` | Sí | `distribuidor` o `comercio` |
| `direccion` | No | Texto; si se omite, queda vacía |
| `email` | No | Texto con formato de correo válido; se guarda en minúsculas |

Cualquier otro campo que se envíe se ignora y no se guarda.

## Endpoints

Base: `http://127.0.0.1:3003`

| Método | Ruta | Para qué sirve | Respuestas |
|---|---|---|---|
| GET | `/health` | Confirmar que el servicio está activo | 200 |
| GET | `/clientes` | Listar todos los clientes | 200 |
| GET | `/clientes/:id` | Consultar un cliente | 200 · 400 · 404 |
| POST | `/clientes` | Registrar un cliente | 201 · 400 · 409 |

## Errores

Todos los errores salen en JSON con el campo `error`.

| Código | Cuándo | Ejemplo |
|---|---|---|
| 400 | Algún dato del POST no cumple las reglas, o el id de la URL no es un entero positivo | `El id debe ser un entero positivo` |
| 404 | El id es válido pero no hay un cliente con ese número | `No existe el cliente con id 99` |
| 409 | El `nit` enviado en el POST ya pertenece a otro cliente | `Ya existe un cliente con el NIT 900123456-7` |

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

El servicio primero valida el formato y solo después busca duplicados. Por eso un dato inválido da 400 y nunca 409.

## Datos de partida

Al arrancar, el servicio ya contiene dos clientes:

| id | nombre | nit | ciudad | tipo |
|---|---|---|---|---|
| 1 | Distribuidora El Valle | 900123456-7 | Cali | distribuidor |
| 2 | Comercial Andina | 800987654-3 | Bogotá | comercio |

Todo se guarda en un arreglo en memoria: al reiniciar el servidor se pierden los clientes creados y vuelven a quedar solo estos dos.

## Casos de prueba

Probados con Thunder Client. Los POST asumen que acabas de arrancar el servidor.

| # | Petición | Resultado esperado |
|---|---|---|
| 1 | `GET /health` | 200 · `{"servicio":"ms-clientes","estado":"ok"}` |
| 2 | `GET /clientes` | 200 · lista con los 2 clientes |
| 3 | `GET /clientes/1` | 200 · Distribuidora El Valle |
| 4 | `GET /clientes/99` | 404 |
| 5 | `GET /clientes/abc` | 400 |
| 6 | `POST /clientes` con el Supermercado La Sabana | 201 · `id: 3` |
| 7 | `POST /clientes` repitiendo el mismo JSON (mismo NIT) | 409 |
| 8 | `POST /clientes` con `{"nombre": "Solo nombre"}` | 400 · lista de errores |

## Organización del código

```text
ms-clientes/
├── src/
│   ├── controllers/
│   │   └── clientes.controller.js    # Lee la petición y arma la respuesta HTTP
│   ├── models/
│   │   └── cliente.js                # Campos válidos y validación
│   ├── repositories/
│   │   └── clientes.repository.js    # Guarda y busca los datos en memoria
│   ├── routes/
│   │   └── clientes.routes.js        # Asocia método + URL con el controlador
│   ├── services/
│   │   └── clientes.service.js       # Reglas de negocio (validar, NIT único)
│   ├── utils/
│   │   └── http-error.js             # Error con código HTTP
│   ├── app.js                        # Express, /health, montaje de rutas y errores
│   └── index.js                      # Arranca el servidor con PORT y HOST
├── .env.example
├── package.json
└── package-lock.json
```

Cada capa solo se comunica con la que tiene al lado, de modo que una petición recorre este camino:

```text
Cliente → rutas → controlador → servicio → repositorio
                                    ↓
                                 modelo (validación)
```

Esto facilita el Taller 2: para pasar de memoria a MySQL basta con reescribir el repositorio, y el resto del código queda igual.

## Próximos talleres

- **Taller 2:** `PUT /clientes/:id` para actualizar y `DELETE /clientes/:id` para eliminar.

# Microservicio: ms-clientes

Servicio de clientes para la empresa **AgroRed S.A.**, separado en capas, con persistencia en MySQL y realizado a partir de la plantilla ms-usuarios proporcionada.

| | |
|---|---|
| **Responsable** | Valentina Montero Zapata |
| **Puerto** | 3003 |
| **Stack** | Node.js · Express · MySQL |
| **Versión** | Taller 2 (semana 1) |

## ¿Qué hace?

Este servicio es el único responsable de la información de los clientes de AgroRed (distribuidores y comercios). Otros microservicios, como ms-pedidos, se apoyan en él para saber qué clientes existen. En esta versión permite:

- Listar los clientes, con filtros por ciudad, por tipo y por lista de ids,
- Buscar un cliente por su id,
- Registrar un cliente nuevo, validando sus datos y evitando NIT repetidos,
- Actualizar y eliminar clientes.

La autenticación con JWT y la validación de relaciones llegan en la semana 2.

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

> En CMD de Windows, el segundo comando es `copy .env.example .env`.

Edita el `.env` y pon la clave real de la base de datos en `DB_PASSWORD`:

```dotenv
PORT=3003
HOST=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clientes_db
DB_USER=clientes_user
DB_PASSWORD=una-clave-segura
```

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

## Endpoints

Base: `http://127.0.0.1:3003`

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/clientes` | — | 200 + arreglo | — |
| Filtrar | GET | `/clientes?ciudad=Cali` o `?tipo=comercio` | — | 200 + arreglo filtrado | — |
| Consultar por lotes | GET | `/clientes?ids=1,3,8` | — | 200 + arreglo con esos registros | 400 ids inválidos |
| Obtener | GET | `/clientes/:id` | — | 200 + objeto | 400 id inválido · 404 |
| Crear | POST | `/clientes` | JSON sin id | 201 + objeto + cabecera Location | 400 · 409 |
| Actualizar | PUT | `/clientes/:id` | JSON completo sin id | 200 + objeto actualizado | 400 · 404 · 409 |
| Eliminar | DELETE | `/clientes/:id` | — | 204 sin cuerpo | 400 · 404 |

Los filtros se pueden combinar, por ejemplo `/clientes?ciudad=Cali&tipo=distribuidor`.

### Ejemplo: crear un cliente

`POST /clientes`

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

Respuesta: `201 Created`, con la cabecera `Location: /clientes/3` y el cliente guardado:

```json
{
  "id": 3,
  "nombre": "Supermercado La Sabana",
  "nit": "901555444-2",
  "ciudad": "Bogotá",
  "telefono": "3205557788",
  "tipo": "comercio",
  "direccion": "Avenida 68 # 45-20",
  "email": "compras@lasabana.com"
}
```

### Ejemplo: listar

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

## Datos de partida

Al ejecutar `db/schema.sql`, la tabla queda con dos clientes (y se reinicia si ya existía):

| id | nombre | nit | ciudad | tipo |
|---|---|---|---|---|
| 1 | Distribuidora El Valle | 900123456-7 | Cali | distribuidor |
| 2 | Comercial Andina | 800987654-3 | Bogotá | comercio |

Los datos se guardan en MySQL, así que no se pierden al reiniciar el servicio.

## Pruebas

La colección de pruebas está en la carpeta `docs/` (formato Thunder Client y formato Postman). Tiene 13 casos:

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

Para repetir las pruebas desde cero, vuelve a ejecutar `db/schema.sql`.

## Organización del código

```text
ms-clientes/
├── db/
│   └── schema.sql                     # Tabla y datos iniciales
├── docs/                              # Colección de pruebas exportada
├── src/
│   ├── controllers/
│   │   └── clientes.controller.js     # Lee la petición y arma la respuesta HTTP
│   ├── models/
│   │   └── cliente.js                 # Campos válidos y validación
│   ├── repositories/
│   │   └── clientes.repository.js     # Consultas SQL a MySQL
│   ├── routes/
│   │   └── clientes.routes.js         # Asocia método + URL con el controlador
│   ├── services/
│   │   └── clientes.service.js        # Reglas de negocio (validar, NIT único)
│   ├── utils/
│   │   └── http-error.js              # Error con código HTTP
│   ├── app.js                         # Express, /health, montaje de rutas y errores
│   ├── db.js                          # Pool de conexiones a MySQL
│   └── index.js                       # Arranca el servidor con PORT y HOST
├── .env.example
├── package.json
└── package-lock.json
```

Cada capa solo se comunica con la que tiene al lado:

```text
Cliente → rutas → controlador → servicio → repositorio → MySQL
                                    ↓
                                 modelo (validación)
```

Para pasar de memoria a MySQL solo se reescribió el repositorio (y se agregó `db.js`); las rutas, el controlador, el servicio y el modelo quedaron iguales.

## Próximos pasos

- **Semana 2:** seguridad con tokens JWT y permisos por rol (administrador y comercial crean, modifican y eliminan; los demás roles solo consultan), y atender las consultas de ms-pedidos.

- **Taller 3:** persistencia en MySQL y verificación de JWT.