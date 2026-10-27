# ms-lotes · Microservicio de Lotes de Producción

**AgroRed S.A.** · Redes y Servicios Multimedia · UAO · Módulo 3

Microservicio para la gestión de lotes de producción, desarrollado con **Node.js** y **Express** y organizado mediante una arquitectura por capas.

## Encargado del Microservicio:
Daniel Muñoz Delgado

Esta versión corresponde al **Taller 1**. Implementa la consulta y creación de lotes utilizando almacenamiento en memoria. La integración con MySQL, el inicio de sesión, el cifrado de contraseñas y la autenticación mediante tokens JWT forman parte de la versión ampliada prevista para el Taller 3.

## Requisitos

- Node.js LTS 22 o superior.
- npm, incluido con Node.js.

Comprueba las versiones instaladas:

```bash
node -v
npm -v
```

## Instalación y ejecución

Ejecuta los comandos desde la carpeta raíz del proyecto `ms-lotes`.

### Windows (CMD)

```bat
npm install
copy .env.example .env
npm run dev
```

### Linux o macOS

```bash
npm install
cp .env.example .env
npm run dev
```

El archivo `.env.example` contiene la configuración inicial del servicio:

```dotenv
PORT=3005
HOST=127.0.0.1
ROLES=administrador,comercial,produccion
```

- `PORT` define el puerto en el que escucha el microservicio.
- `HOST` define la dirección de escucha. Con `127.0.0.1`, el servicio acepta conexiones desde la máquina local.
- `ROLES` contiene los nombres de los roles configurados para el proyecto. En esta versión, la variable no se utiliza para autorizar operaciones.

## Verificación del servicio

Con el servidor en ejecución, consulta las siguientes direcciones desde el navegador o mediante Thunder Client en Visual Studio Code.

| Método | URL | Descripción |
|---|---|---|
| `GET` | `http://localhost:3005/health` | Comprueba que el servicio responde. |
| `GET` | `http://localhost:3005/lotes` | Devuelve los lotes registrados. |

Respuesta de `GET /health`:

```json
{
  "servicio": "ms-lotes",
  "estado": "ok"
}
```

## Estructura del proyecto

```text
ms-lotes/
├── src/
│   ├── controllers/
│   │   └── lotes.controller.js
│   ├── models/
│   │   └── lote.js
│   ├── repositories/
│   │   └── lotes.repository.js
│   ├── routes/
│   │   └── lotes.routes.js
│   ├── services/
│   │   └── lotes.service.js
│   ├── utils/
│   │   └── http-error.js
│   ├── app.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Arquitectura por capas

El microservicio separa las responsabilidades de enrutamiento, control de solicitudes, lógica de negocio, validación y acceso a datos.

| Archivo | Capa | Responsabilidad |
|---|---|---|
| `src/index.js` | Arranque | Lee la configuración del servidor e inicia la escucha de peticiones. |
| `src/app.js` | Configuración | Configura Express, define `GET /health`, monta las rutas y centraliza el manejo de errores. |
| `src/routes/lotes.routes.js` | Rutas | Asocia los métodos HTTP y las URI con los controladores. |
| `src/controllers/lotes.controller.js` | Controladores | Recibe las solicitudes, invoca los servicios y construye las respuestas HTTP. |
| `src/services/lotes.service.js` | Servicios | Aplica las reglas de negocio y coordina las operaciones del repositorio. |
| `src/repositories/lotes.repository.js` | Repositorio | Consulta y almacena los lotes en memoria. |
| `src/models/lote.js` | Modelo | Define los campos del lote y las validaciones de entrada. |
| `src/utils/http-error.js` | Utilidad | Representa errores asociados a códigos de estado HTTP. |

El flujo general de una petición es el siguiente:

1. Express recibe la solicitud HTTP.
2. La ruta identifica el controlador correspondiente.
3. El controlador procesa los parámetros y llama al servicio.
4. El servicio aplica las validaciones y reglas de negocio.
5. El repositorio consulta o modifica los datos en memoria cuando es necesario.
6. El controlador devuelve la respuesta HTTP al cliente.

## Endpoints implementados

| Método | URI | Descripción | Respuestas HTTP |
|---|---|---|---|
| `GET` | `/health` | Verifica el estado del microservicio. | `200 OK` |
| `GET` | `/lotes` | Consulta todos los lotes registrados. | `200 OK` |
| `GET` | `/lotes/:id` | Consulta un lote por su identificador. | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/lotes` | Crea un nuevo lote de producción. | `201 Created`, `400 Bad Request`, `409 Conflict` |

### 1. Verificar el estado del servicio

**Método:** `GET`

```text
http://localhost:3005/health
```

Respuesta `200 OK`:

```json
{
  "servicio": "ms-lotes",
  "estado": "ok"
}
```

### 2. Listar todos los lotes

**Método:** `GET`

```text
http://localhost:3005/lotes
```

Respuesta `200 OK`:

```json
[
  {
    "id": 1,
    "codigo_lote": "LOT-MAN-2026-001",
    "producto_id": 12,
    "fecha_produccion": "2026-10-20",
    "cantidad": 500,
    "resultado_calidad": "aprobado",
    "fecha_vencimiento": "2026-11-10",
    "centro_produccion": "Valle del Cauca"
  },
  {
    "id": 2,
    "codigo_lote": "LOT-MAN-2026-002",
    "producto_id": 12,
    "fecha_produccion": "2026-10-25",
    "cantidad": 300,
    "resultado_calidad": "pendiente",
    "fecha_vencimiento": "2026-11-15",
    "centro_produccion": "Valle del Cauca"
  },
  {
    "id": 3,
    "codigo_lote": "LOT-AGU-2026-001",
    "producto_id": 15,
    "fecha_produccion": "2026-10-26",
    "cantidad": 1000,
    "resultado_calidad": "rechazado",
    "fecha_vencimiento": "2026-11-05",
    "centro_produccion": "Cali"
  }
]
```

El repositorio contiene inicialmente tres lotes de ejemplo. La respuesta es un arreglo JSON, incluso cuando se consulta la colección completa.

### 3. Consultar un lote por identificador

**Método:** `GET`

```text
http://localhost:3005/lotes/1
```

Respuesta `200 OK`:

```json
{
  "id": 1,
  "codigo_lote": "LOT-MAN-2026-001",
  "producto_id": 12,
  "fecha_produccion": "2026-10-20",
  "cantidad": 500,
  "resultado_calidad": "aprobado",
  "fecha_vencimiento": "2026-11-10",
  "centro_produccion": "Valle del Cauca"
}
```

Posibles errores:

| Código HTTP | Situación | Ejemplo de respuesta |
|---|---|---|
| `400 Bad Request` | El identificador no es un entero positivo. | `{"error":"El id debe ser un entero positivo"}` |
| `404 Not Found` | El identificador es válido, pero el lote no existe. | `{"error":"No existe el lote con id 99"}` |

Ejemplos de identificadores inválidos:

```text
http://localhost:3005/lotes/abc
http://localhost:3005/lotes/0
http://localhost:3005/lotes/-1
```

### 4. Crear un lote de producción

**Método:** `POST`

```text
http://localhost:3005/lotes
```

Encabezado:

```http
Content-Type: application/json
```

En Thunder Client, selecciona `POST`, abre la sección `Body`, elige `JSON` y envía el siguiente cuerpo:

```json
{
  "codigo_lote": "LOT-MAN-2026-003",
  "producto_id": 12,
  "fecha_produccion": "2026-10-27",
  "cantidad": 250,
  "resultado_calidad": "pendiente",
  "fecha_vencimiento": "2026-11-20",
  "centro_produccion": "Valle del Cauca"
}
```

Respuesta exitosa `201 Created`:

```json
{
  "id": 4,
  "codigo_lote": "LOT-MAN-2026-003",
  "producto_id": 12,
  "fecha_produccion": "2026-10-27",
  "cantidad": 250,
  "resultado_calidad": "pendiente",
  "fecha_vencimiento": "2026-11-20",
  "centro_produccion": "Valle del Cauca"
}
```

El identificador `4` corresponde al estado inicial del repositorio y puede variar según los lotes creados durante la ejecución. Cuando la creación es exitosa, la respuesta también incluye la cabecera `Location` con la URI del nuevo recurso, por ejemplo:

```http
Location: /lotes/4
```

Posibles errores:

| Código HTTP | Situación | Descripción |
|---|---|---|
| `400 Bad Request` | Datos inválidos. | Uno o más campos no cumplen las validaciones. |
| `400 Bad Request` | JSON mal formado. | El cuerpo de la solicitud no contiene un JSON válido. |
| `409 Conflict` | Código de lote repetido. | Ya existe un lote con el mismo `codigo_lote`. |

Ejemplo de respuesta por código repetido:

```json
{
  "error": "Ya existe un lote con el código LOT-MAN-2026-001"
}
```

Ejemplo de respuesta por datos inválidos:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "cantidad debe ser un número mayor a 0",
    "resultado_calidad debe ser uno de: pendiente, aprobado, rechazado"
  ]
}
```

La propiedad `detalles` contiene los mensajes correspondientes a los errores de validación encontrados.

## Reglas de validación

Las reglas se definen en `src/models/lote.js` y se aplican durante la creación de un lote.

| Campo | Regla implementada |
|---|---|
| `codigo_lote` | Es obligatorio, debe ser una cadena no vacía y se eliminan los espacios al inicio y al final. |
| `producto_id` | Debe ser un entero positivo. |
| `fecha_produccion` | Es obligatoria y debe ser una cadena de texto. Se espera el formato `YYYY-MM-DD`, pero no se comprueba que la fecha sea válida. |
| `cantidad` | Debe ser un número mayor que cero. |
| `resultado_calidad` | Solo admite `pendiente`, `aprobado` o `rechazado`. |
| `fecha_vencimiento` | Es opcional. Si se proporciona, debe ser una cadena de texto. |
| `centro_produccion` | Es opcional. Si se proporciona, debe ser una cadena de texto y se eliminan los espacios al inicio y al final. |

El código de lote debe ser único. Antes de crear un registro, el servicio consulta el repositorio mediante `findByCodigo()`. Si ya existe un lote con ese código, la operación se rechaza con `409 Conflict`.

## Manejo de errores

La aplicación centraliza el manejo de errores en `src/app.js`.

- `400 Bad Request`: identificador inválido, datos que no cumplen las validaciones o JSON mal formado.
- `404 Not Found`: lote inexistente o ruta no definida.
- `409 Conflict`: código de lote duplicado.
- `500 Internal Server Error`: error interno no controlado.

Las respuestas de error se envían en formato JSON. Los errores de validación pueden incluir una propiedad `detalles` con información adicional.

## Rutas pendientes

En el Taller 1 no están implementadas las operaciones para actualizar o eliminar lotes. Las rutas `PUT /lotes/:id` y `DELETE /lotes/:id` están previstas para el Taller 2 y no forman parte de los endpoints disponibles en esta versión.

## Almacenamiento de datos

Los lotes se almacenan temporalmente en un arreglo de JavaScript definido en `src/repositories/lotes.repository.js`. El repositorio incluye las siguientes funciones:

| Función | Responsabilidad |
|---|---|
| `findAll()` | Devuelve todos los lotes almacenados. |
| `findById(id)` | Busca un lote por su identificador. |
| `findByCodigo(codigo_lote)` | Busca un lote por su código. |
| `create(lote)` | Asigna un identificador, agrega el lote al arreglo y devuelve el registro creado. |

Los cambios realizados en memoria se pierden cuando se reinicia el proceso del servidor. Esta versión no utiliza una base de datos.

## Tecnologías utilizadas

- **Node.js:** entorno de ejecución de JavaScript en el servidor.
- **Express:** framework para gestionar las rutas y las solicitudes HTTP.
- **JavaScript:** lenguaje utilizado para implementar el microservicio.
- **npm:** administrador de paquetes y scripts del proyecto.
- **Thunder Client:** extensión de Visual Studio Code para probar los endpoints HTTP.

## Contexto académico

- **Proyecto:** AgroRed S.A. — Microservicio de Lotes de Producción (`ms-lotes`).
- **Asignatura:** Redes y Servicios Multimedia.
- **Institución:** Universidad Autónoma de Occidente (UAO).
- **Módulo:** 3.
- **Entrega:** Taller 1.
