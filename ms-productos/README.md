# ms-productos: Microservicio de Productos

**AgroRed S.A.** 

Microservicio que gestiona la entidad **Producto**, desarrollado con **Node.js**, **Express** y **MySQL**, y organizado en capas.

- **Responsable:** Estefanía Del Amor Restrepo (`tefDel`)
- **Puerto:** 3002
- **Base de datos:** `productos_db` (usuario `productos_user`)

Es el servicio dueño del catálogo de productos. Los microservicios `ms-pedidos` y `ms-lotes` lo consultan para validar y mostrar los productos que referencian.

## Cómo ejecutarlo

### Requisitos

- Node.js LTS 22 o superior y npm.
- MySQL o MariaDB en ejecución (en desarrollo se usa el de XAMPP).

### Pasos

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Encender **MySQL** en el panel de XAMPP (puerto 3306) y crear la base de datos y su usuario, como `root`:
   ```bash
   /c/xampp/mysql/bin/mysql -u root
   ```
   ```sql
   CREATE DATABASE productos_db CHARACTER SET utf8mb4;
   CREATE USER 'productos_user'@'localhost' IDENTIFIED BY '<clave>';
   GRANT ALL PRIVILEGES ON productos_db.* TO 'productos_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
3. Crear la tabla y los datos iniciales, conectado como `productos_user` y desde la carpeta `ms-productos` (ejecutarlo **una sola vez**):
   ```bash
   /c/xampp/mysql/bin/mysql -u productos_user -p productos_db
   ```
   ```sql
   SOURCE db/schema.sql;
   SELECT * FROM productos;
   ```
   Debe mostrar Mango y Tomate. Para empezar de cero: `DROP TABLE productos;` y volver a ejecutar el `SOURCE`.
4. Crear el archivo `.env` a partir del ejemplo y completar los valores:
   ```bash
   cp .env.example .env
   ```
   En CMD de Windows: `copy .env.example .env`.
5. Iniciar el servicio:
   ```bash
   npm run dev
   ```

Debe aparecer `ms-productos escuchando en http://127.0.0.1:3002`. Para comprobarlo: `GET /health`.

### Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servicio | `3002` |
| `HOST` | Dirección de escucha | `127.0.0.1` |
| `DB_HOST` | Servidor MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_NAME` | Base de datos | `productos_db` |
| `DB_USER` | Usuario de la base | `productos_user` |
| `DB_PASSWORD` | Clave del usuario (no se sube al repositorio) | — |

El archivo `.env` nunca se sube al repositorio.

## Representación y atributos

```json
{
  "id": 3,
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200,
  "activo": true
}
```

| Atributo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | entero | automático | Lo genera la base de datos; no se envía en POST ni PUT |
| `nombre` | texto | sí | No vacío, máximo 100 caracteres. **Único**, sin distinguir mayúsculas (409 si se repite) |
| `categoria` | texto | sí | `fruta`, `hortaliza` o `procesado` |
| `unidad` | texto | sí | `kg` o `caja` |
| `precio` | número | sí | Mayor que 0 |
| `activo` | booleano | no | `true` o `false`. Por defecto `true` |

Cualquier otro campo que se envíe se ignora.

## Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/productos` | — | 200 + arreglo | — |
| Filtrar | GET | `/productos?categoria=fruta` | — | 200 + arreglo filtrado | 400 |
| Consultar por lotes | GET | `/productos?ids=1,3,8` | — | 200 + arreglo con esos registros | 400 · 404 |
| Obtener | GET | `/productos/:id` | — | 200 + objeto | 400 · 404 |
| Crear | POST | `/productos` | JSON sin `id` | 201 + objeto + cabecera `Location` | 400 · 409 |
| Actualizar | PUT | `/productos/:id` | JSON completo sin `id` | 200 + objeto actualizado | 400 · 404 · 409 |
| Eliminar | DELETE | `/productos/:id` | — | 204 sin cuerpo | 400 · 404 |

### Detalles de los filtros

- **`?categoria=`** acepta `fruta`, `hortaliza` o `procesado` (sin importar mayúsculas). Un número o un valor que no esté en la lista responde 400 indicando las categorías válidas.
- **`?ids=`** debe ser una lista de enteros positivos separados por comas; si algún valor no lo es, responde 400. Si **ninguno** de los ids existe, responde 404. Si existen solo **algunos**, responde 200 con los encontrados y agrega la cabecera `X-Ids-No-Encontrados` con los ids que faltaron.

### Ejemplo: crear un producto

`POST http://127.0.0.1:3002/productos`

```json
{
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200
}
```

Respuesta `201 Created` (con `Location: /productos/3`):

```json
{
  "id": 3,
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200,
  "activo": true
}
```

### Ejemplo: listar productos

`GET http://127.0.0.1:3002/productos`

Respuesta `200 OK`:

```json
[
  { "id": 1, "nombre": "Mango", "categoria": "fruta", "unidad": "caja", "precio": 45000, "activo": true },
  { "id": 2, "nombre": "Tomate", "categoria": "hortaliza", "unidad": "kg", "precio": 3500, "activo": true },
  { "id": 3, "nombre": "Papaya", "categoria": "fruta", "unidad": "kg", "precio": 4200, "activo": true }
]
```

### Errores

Todos salen en JSON con el campo `error`.

| Código | Situación | Ejemplo de respuesta |
|---|---|---|
| 400 | Datos inválidos, id no numérico, o `ids` / `categoria` mal escritos | `{"error":"El id debe ser un entero positivo"}` |
| 404 | El producto no existe, o ninguno de los `ids` existe | `{"error":"No existe el producto con id 99"}` |
| 409 | Ya existe un producto con ese nombre | `{"error":"Ya existe un producto con el nombre Mango"}` |

Cuando el 400 viene de validar el cuerpo, se agrega `detalles` con todos los problemas encontrados:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "categoria debe ser una de: fruta, hortaliza, procesado",
    "unidad debe ser una de: kg, caja",
    "precio es obligatorio y debe ser un número mayor que 0"
  ]
}
```

## Relaciones

`ms-productos` **no guarda referencias** a otros microservicios y no consulta a nadie. Es un servicio consultado.

### Lo que ms-productos consulta

Ninguno.

### Quién consulta a ms-productos

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| `ms-pedidos` | `GET /productos/:id` · `GET /productos?ids=…` | `id`, `nombre`, `precio` |
| `ms-lotes` | `GET /productos/:id` · `GET /productos?ids=…` | `id`, `nombre`, `categoria` |

Si cambio el nombre o el tipo de alguno de esos atributos, aviso al grupo (rol Arquitecto) antes de subir el cambio.

## Estructura del proyecto

```text
ms-productos/
├── db/
│   └── schema.sql
├── docs/
│   └── thunder-collection_ms-productos.json
├── src/
│   ├── controllers/
│   │   └── productos.controller.js
│   ├── models/
│   │   └── producto.js
│   ├── repositories/
│   │   └── productos.repository.js
│   ├── routes/
│   │   └── productos.routes.js
│   ├── services/
│   │   └── productos.service.js
│   ├── utils/
│   │   └── http-error.js
│   ├── app.js
│   ├── db.js
│   └── index.js
├── .env.example
├── package.json
└── README.md
```

## Arquitectura por capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| `src/index.js` | Arranque | Lee la configuración e inicia el servidor |
| `src/app.js` | Configuración | Middlewares, `/health`, montaje de rutas y manejo de errores |
| `src/routes/productos.routes.js` | Presentación | Asocia método y URI con el controlador |
| `src/controllers/productos.controller.js` | Presentación | Lee la petición (id, filtros), llama al servicio y arma la respuesta |
| `src/services/productos.service.js` | Lógica de negocio | Validaciones, regla del nombre único y manejo de 404 |
| `src/repositories/productos.repository.js` | Acceso a datos | Consultas SQL a MySQL |
| `src/db.js` | Acceso a datos | Pool de conexiones a MySQL |
| `src/models/producto.js` | Modelo | Atributos del producto y su validación |
| `src/utils/http-error.js` | Utilidad | Error con código de estado HTTP |

## Regla de negocio

El `nombre` de un producto no se puede repetir (sin distinguir mayúsculas), porque el catálogo no debe tener dos entradas para el mismo producto: los pedidos y los lotes que lo referencian quedarían ambiguos. Si se intenta crear o actualizar un producto con un nombre que ya existe en otro registro, el servicio responde `409 Conflict`. Al actualizar, un producto puede conservar su propio nombre sin que cuente como repetido. Además se valida que `precio` sea mayor que 0 y que `categoria` y `unidad` estén dentro de su lista (400).

## Persistencia

Los datos se guardan en MySQL (`productos_db`, tabla `productos`). Solo la capa de acceso a datos (`productos.repository.js` y `db.js`) conoce la base: las rutas, el controlador, el servicio y el modelo no cambiaron al migrar desde la versión en memoria. Las consultas usan parámetros (`?`) para evitar la inyección SQL. La columna `nombre` lleva `UNIQUE` como segunda barrera de la regla de unicidad.

## Pruebas

La colección de Thunder Client está exportada en `docs/`. Se ejecutan en este orden, con la tabla recién creada:

| # | Caso | Código esperado |
|---|---|---|
| 1 | Listar todos | 200 |
| 2 | Filtrar por categoría | 200 |
| 3 | Consultar por lotes con `?ids=` | 200 |
| 4 | Obtener un registro existente | 200 |
| 5 | Obtener un id que no existe | 404 |
| 6 | Obtener con id no numérico | 400 |
| 7 | Crear con datos válidos | 201 |
| 8 | Crear sin atributos obligatorios | 400 |
| 9 | Crear con un nombre repetido | 409 |
| 10 | Actualizar un registro existente | 200 |
| 11 | Actualizar un id que no existe | 404 |
| 12 | Eliminar un registro existente | 204 |
| 13 | Eliminar el mismo registro otra vez | 404 |

Los casos de seguridad (14 a 18) y de relaciones se documentarán al terminar la semana 2.

## Tecnologías

Node.js, Express, MySQL (`mysql2`) y Thunder Client para las pruebas.