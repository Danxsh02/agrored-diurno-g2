# ms-lotes · Microservicio de Lotes de Producción

**AgroRed S.A.** · Redes y Servicios Multimedia · UAO · Módulo 3 · Taller 2

Microservicio que gestiona la entidad **Lote** (lotes de producción), desarrollado con **Node.js**, **Express** y **MySQL**, organizado en capas y protegido con tokens **JWT**. Se relaciona con **ms-productos** por REST.

- **Responsable:** Daniel Muñoz Delgado
- **Puerto:** 3005
- **Base de datos:** `lotes_db` (usuario `lotes_user`)

## Cómo ejecutarlo

### Requisitos
- Node.js LTS 22 o superior y npm.
- MySQL 8 en ejecución.
- Para probar todas las funciones deben estar corriendo también:
  - **ms-usuarios** en el puerto 3001 (entrega los tokens).
  - **ms-productos** en el puerto 3002 (valida y compone el producto de cada lote).

### Pasos
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear la base de datos y su usuario (como `root`, en MySQL Workbench o en la consola):
   ```sql
   CREATE DATABASE lotes_db CHARACTER SET utf8mb4;
   CREATE USER 'lotes_user'@'localhost' IDENTIFIED BY '<clave>';
   GRANT ALL PRIVILEGES ON lotes_db.* TO 'lotes_user'@'localhost';
   ```
3. Crear la tabla y los datos iniciales, conectado como `lotes_user` y con `lotes_db` como base activa:
   ```bash
   mysql -u lotes_user -p lotes_db
   mysql> SOURCE db/schema.sql;
   ```
   (o abrir `db/schema.sql` en MySQL Workbench y ejecutarlo con **Run**).
4. Crear el archivo `.env` a partir del ejemplo y completar los valores:
   ```bat
   copy .env.example .env
   ```
   En Linux o macOS: `cp .env.example .env`.
5. Iniciar el servicio:
   ```bash
   npm run dev
   ```
6. Comprobar que responde: `GET http://127.0.0.1:3005/health` debe devolver `{"servicio":"ms-lotes","estado":"ok"}`.

### Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servicio | `3005` |
| `HOST` | Dirección de escucha | `127.0.0.1` |
| `DB_HOST` | Servidor MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_NAME` | Base de datos | `lotes_db` |
| `DB_USER` | Usuario de la base | `lotes_user` |
| `DB_PASSWORD` | Clave del usuario (no se sube al repositorio) | — |
| `JWT_SECRET` | Clave con la que se verifican los tokens. **Debe ser idéntica a la de ms-usuarios y a la de los demás microservicios del grupo.** | — |
| `PRODUCTOS_URL` | Dirección de ms-productos | `http://127.0.0.1:3002` |

El archivo `.env` nunca se sube al repositorio; `.env.example` contiene los mismos nombres sin valores secretos.

## Representación y atributos

```json
{
  "id": 1,
  "codigo_lote": "LOT-MAN-2026-001",
  "producto_id": 1,
  "fecha_produccion": "2026-10-20",
  "cantidad": 500,
  "resultado_calidad": "aprobado",
  "fecha_vencimiento": "2026-11-10",
  "centro_produccion": "Valle del Cauca",
  "producto": { "id": 1, "nombre": "Mango", "categoria": "fruta" }
}
```

El atributo `producto_id` es lo que se guarda en la base de datos. El objeto `producto` **no se guarda**: ms-lotes lo pide a ms-productos cada vez que responde.

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | automático | Lo genera la base de datos |
| `codigo_lote` | texto | sí | Único (409 si se repite) |
| `producto_id` | entero | sí | Entero positivo; el producto debe existir en ms-productos |
| `fecha_produccion` | fecha | sí | Formato `YYYY-MM-DD`; no puede ser futura |
| `cantidad` | número | sí | Mayor a 0 |
| `resultado_calidad` | texto | sí | `pendiente`, `aprobado` o `rechazado` |
| `fecha_vencimiento` | fecha | no | Formato `YYYY-MM-DD` |
| `centro_produccion` | texto | no | — |

## Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/lotes` | — | 200 + arreglo | 401 |
| Filtrar | GET | `/lotes?resultado_calidad=aprobado` | — | 200 + arreglo filtrado | 401 |
| Obtener | GET | `/lotes/:id` | — | 200 + objeto | 400 · 401 · 404 |
| Crear | POST | `/lotes` | JSON sin `id` | 201 + objeto + cabecera `Location` | 400 · 401 · 403 · 409 · 503 |
| Actualizar | PUT | `/lotes/:id` | JSON completo sin `id` | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 · 503 |
| Eliminar | DELETE | `/lotes/:id` | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Todas las rutas de `/lotes` exigen la cabecera `Authorization: Bearer <token>`. `/health` es pública.

El filtro `?resultado_calidad=` acepta `pendiente`, `aprobado` o `rechazado`. Ningún otro microservicio consulta a ms-lotes, por eso no tiene consulta por lotes (`?ids=`).

### Cómo obtener un token

1. Con ms-usuarios corriendo, `POST http://127.0.0.1:3001/usuarios/login` con:
   ```json
   { "email": "admin@empresa.com", "password": "Admin2026*" }
   ```
2. Copiar el valor de `token` de la respuesta.
3. Enviarlo en cada petición a ms-lotes en la cabecera `Authorization: Bearer <token>`.

Los tokens vencen (8 horas); si aparece 401, hay que iniciar sesión de nuevo.

### Ejemplo: crear un lote

`POST http://localhost:3005/lotes`

```json
{
  "codigo_lote": "LOT-MAN-2026-003",
  "producto_id": 1,
  "fecha_produccion": "2026-10-27",
  "cantidad": 250,
  "resultado_calidad": "pendiente",
  "fecha_vencimiento": "2026-11-20",
  "centro_produccion": "Valle del Cauca"
}
```

Respuesta `201 Created` (con `Location: /lotes/4`):

```json
{
  "id": 4,
  "codigo_lote": "LOT-MAN-2026-003",
  "producto_id": 1,
  "fecha_produccion": "2026-10-27",
  "cantidad": 250,
  "resultado_calidad": "pendiente",
  "fecha_vencimiento": "2026-11-20",
  "centro_produccion": "Valle del Cauca",
  "producto": { "id": 1, "nombre": "Mango", "categoria": "fruta" }
}
```

### Ejemplo: listar lotes

`GET http://localhost:3005/lotes`

Respuesta `200 OK`:

```json
[
  {
    "id": 1,
    "codigo_lote": "LOT-MAN-2026-001",
    "producto_id": 1,
    "fecha_produccion": "2026-10-20",
    "cantidad": 500,
    "resultado_calidad": "aprobado",
    "fecha_vencimiento": "2026-11-10",
    "centro_produccion": "Valle del Cauca",
    "producto": { "id": 1, "nombre": "Mango", "categoria": "fruta" }
  }
]
```

### Ejemplo: ms-productos no disponible

Si ms-productos no responde al leer, la respuesta sale igual con `producto: null` y un aviso:

```json
[
  {
    "id": 1,
    "codigo_lote": "LOT-MAN-2026-001",
    "producto_id": 1,
    "fecha_produccion": "2026-10-20",
    "cantidad": 500,
    "resultado_calidad": "aprobado",
    "fecha_vencimiento": "2026-11-10",
    "centro_produccion": "Valle del Cauca",
    "producto": null,
    "aviso": "ms-productos no disponible"
  }
]
```

### Errores

| Código | Situación | Ejemplo de respuesta |
|---|---|---|
| 400 | Datos inválidos o id no numérico | `{"error":"Datos inválidos","detalles":["cantidad debe ser un número mayor a 0"]}` |
| 400 | El producto referenciado no existe | `{"error":"No existe el producto con id 999"}` |
| 401 | Falta el token, es inválido o venció | `{"error":"Token no proporcionado o inválido"}` |
| 403 | El rol no tiene permiso para la operación | `{"error":"No tienes permiso para realizar esta acción"}` |
| 404 | El lote no existe | `{"error":"No existe el lote con id 99"}` |
| 409 | `codigo_lote` repetido | `{"error":"Ya existe un lote con el código LOT-MAN-2026-001"}` |
| 503 | ms-productos no está disponible al escribir | `{"error":"ms-productos no está disponible"}` |

## Seguridad

Cada petición lleva un token JWT firmado por ms-usuarios. ms-lotes lo verifica con `JWT_SECRET`, sin consultar a ms-usuarios, usando el middleware `src/middlewares/auth.js` (copiado sin cambios de ms-usuarios).

| Operación | Roles permitidos |
|---|---|
| Consultar (GET) | Cualquier usuario autenticado |
| Crear, actualizar, eliminar | `administrador`, `produccion` |

Sin token o con token inválido responde 401. Con un rol sin permiso responde 403.

## Relaciones

### Lo que ms-lotes consulta

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| `producto_id` | ms-productos | `GET /productos/:id` | `GET /productos?ids=…` | `id`, `nombre`, `categoria` |

- Al escribir: si el producto no existe responde 400; si ms-productos no responde, 503.
- Al leer: agrega el objeto `producto` con una sola consulta por lotes. Si ms-productos no responde, la respuesta sale igual con `producto: null` y un campo `aviso`.
- En ambos casos reenvía el token recibido y espera como máximo 3 segundos.

### Quién consulta a ms-lotes

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| Ningún microservicio | — | — |

## Estructura del proyecto

```text
ms-lotes/
├── db/
│   └── schema.sql
├── docs/
│   └── colección de pruebas exportada de Thunder Client
├── src/
│   ├── clients/
│   │   └── productos.client.js
│   ├── controllers/
│   │   └── lotes.controller.js
│   ├── middlewares/
│   │   └── auth.js
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
│   ├── db.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Arquitectura por capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| `src/index.js` | Arranque | Lee la configuración e inicia el servidor |
| `src/app.js` | Configuración | Middlewares, `/health`, montaje de rutas y manejo de errores |
| `src/routes/lotes.routes.js` | Presentación | Asocia método y URI con el controlador y aplica los permisos |
| `src/controllers/lotes.controller.js` | Presentación | Lee la petición (incluido el token), llama al servicio y arma la respuesta |
| `src/middlewares/auth.js` | Seguridad | Verifica el token JWT y el rol |
| `src/services/lotes.service.js` | Lógica de negocio | Validaciones, regla del código único y composición con productos |
| `src/clients/productos.client.js` | Acceso externo | Consulta a ms-productos por REST |
| `src/repositories/lotes.repository.js` | Acceso a datos | Consultas SQL a MySQL |
| `src/db.js` | Acceso a datos | Pool de conexiones a MySQL |
| `src/models/lote.js` | Modelo | Atributos del lote y su validación |

## Regla de negocio

El `codigo_lote` identifica de forma única cada lote para poder trazarlo hasta el producto y el centro de producción. Dos lotes con el mismo código harían imposible esa trazabilidad, por eso el servicio responde `409 Conflict`; además, la columna tiene restricción `UNIQUE` en la base de datos. Otras reglas (400): `cantidad` mayor a 0, `fecha_produccion` no futura (un lote solo se registra después de producirse) y `resultado_calidad` dentro de su lista.

## Persistencia

Los datos se guardan en MySQL (`lotes_db`, tabla `lotes`). Solo la capa de acceso a datos (`lotes.repository.js` y `db.js`) conoce la base: las rutas, el controlador, el servicio y el modelo no cambiaron al migrar desde la versión en memoria. Las consultas usan parámetros (`?`) para evitar la inyección SQL.

La columna `producto_id` es un entero sin `FOREIGN KEY`: la tabla de productos vive en la base de ms-productos, y su existencia se valida por REST.

## Pruebas

La colección de Thunder Client está exportada en `docs/`. Todos los casos (1 al 24) fueron ejecutados y pasaron exitosamente:

| # | Caso | Código esperado |
|---|---|---|
| 1 | Listar todos | 200 |
| 2 | Filtrar por `resultado_calidad` | 200 |
| 4 | Obtener existente | 200 |
| 5 | Obtener inexistente | 404 |
| 6 | Id no numérico | 400 |
| 7 | Crear válido | 201 |
| 8 | Crear sin atributo obligatorio | 400 |
| 9 | Crear con `codigo_lote` repetido | 409 |
| 10 | Actualizar existente | 200 |
| 11 | Actualizar inexistente | 404 |
| 12 | Eliminar existente | 204 |
| 13 | Eliminar otra vez | 404 |
| 14 | Sin token | 401 |
| 15 | Token inventado | 401 |
| 16 | GET con rol que solo consulta | 200 |
| 17 | POST con rol sin permiso | 403 |
| 18 | POST con rol con permiso | 201 |
| 19 | Crear con producto válido | 201 |
| 20 | Crear con producto inexistente | 400 |
| 21 | Obtener por id con producto | 200 |
| 22 | Listar (una sola petición `?ids=`) | 200 |
| 23 | Listar con ms-productos detenido | 200 (`producto: null`) |
| 24 | Crear con ms-productos detenido | 503 |

El caso 3 (consulta por lotes con `?ids=`) no aplica: ningún microservicio consulta a ms-lotes.

## Tecnologías

Node.js, Express, MySQL (`mysql2`), JSON Web Tokens (`jsonwebtoken`) y Thunder Client para las pruebas.