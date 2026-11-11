# ms-productos

Servicio del catálogo de productos de la empresa agroindustrial: **AgroRed S.A.**

| | |
|---|---|
| **Responsable** | Estefanía Del Amor Restrepo (`tefDel`) |
| **Puerto** | 3002 |
| **Stack** | Node.js · Express · MySQL |
| **Versión** | Taller 2 (semana 1) |

## ¿Qué hace?

Este servicio es el único responsable de la información de los productos que vende AgroRed. Otros microservicios, como ms-pedidos y ms-lotes, se apoyan en él para saber qué productos existen. En esta versión permite:

- listar el catálogo, con filtro por categoría y por lista de ids,
- buscar un producto por su id,
- registrar un producto nuevo, validando sus datos y evitando nombres repetidos,
- actualizar y eliminar productos.

La autenticación con JWT y la validación de relaciones llegan en la semana 2 del taller 2.

## Puesta en marcha

Necesitas Node.js LTS (22 o superior), npm y MySQL (en el puerto 3306).

**1. Crear la base de datos y su usuario** (como `root`, en MySQL Workbench):

```sql
CREATE DATABASE productos_db CHARACTER SET utf8mb4;
CREATE USER 'productos_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON productos_db.* TO 'productos_user'@'localhost';
FLUSH PRIVILEGES;
```

**2. Crear la tabla y los datos iniciales.** En Workbench, conectado como `productos_user`: **File → Open SQL Script**, elegir `db/schema.sql` y ejecutarlo **una sola vez**. Para comprobarlo:

```sql
SELECT * FROM productos;
```

**3. Instalar y arrancar.** Desde la carpeta `ms-productos`:

```bash
npm install
cp .env.example .env
npm run dev
```

> En CMD de Windows, el segundo comando es `copy .env.example .env`.

Edita el `.env` y pon la clave real de la base de datos en `DB_PASSWORD`:

```dotenv
PORT=3002
HOST=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_NAME=productos_db
DB_USER=productos_user
DB_PASSWORD=una-clave-segura
JWT_SECRET=la-misma-frase-del-grupo
```
`JWT_SECRET` debe ser **exactamente la misma** en todos los microservicios del grupo (la de ms-usuarios). Además, antes de `npm install` ten en cuenta que ahora se instala `jsonwebtoken`.

El archivo `.env` nunca se sube al repositorio. Si todo salió bien, la consola muestra:

```text
ms-productos escuchando en http://127.0.0.1:3002
```

`npm run dev` reinicia el servidor automáticamente cada vez que guardas un archivo.

## Contrato de la API

Base: `http://127.0.0.1:3002`

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/productos` | — | 200 + arreglo | — |
| Filtrar | GET | `/productos?categoria=fruta` | — | 200 + arreglo filtrado | 400 categoría inválida |
| Consultar por lotes | GET | `/productos?ids=1,2` | — | 200 + arreglo con esos registros | 400 ids inválidos · 404 ningún id existe |
| Obtener | GET | `/productos/:id` | — | 200 + objeto | 400 id inválido · 404 |
| Crear | POST | `/productos` | JSON sin id | 201 + objeto + cabecera `Location` | 400 · 409 |
| Actualizar | PUT | `/productos/:id` | JSON completo sin id | 200 + objeto actualizado | 400 · 404 · 409 |
| Eliminar | DELETE | `/productos/:id` | — | 204 sin cuerpo | 400 · 404 |

Las rutas que no existen responden 404 con un mensaje en JSON.

### Detalles de los filtros

- **`?categoria=`** acepta `fruta`, `hortaliza` o `procesado` (sin importar mayúsculas). Un número o un valor que no esté en la lista responde 400 indicando las categorías válidas.
- **`?ids=`** debe ser una lista de enteros positivos separados por comas; si algún valor no lo es, responde 400. Si **ninguno** de los ids existe, responde 404. Si existen solo **algunos**, responde 200 con los encontrados y agrega la cabecera `X-Ids-No-Encontrados` con los ids que faltaron.

### Estructura de un producto

```json
{
  "id": 4,
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200,
  "activo": true
}
```

### Crear un producto

`POST /productos` con cuerpo JSON. El `id` lo genera la base de datos, no quien hace la petición.

```json
{
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200
}
```

Responde `201 Created` con el producto guardado. Fíjate en que `activo` aparece como `true` aunque no se envió, porque es su valor por defecto. La respuesta también trae la cabecera `Location: /productos/4`, que indica dónde consultar el recurso creado.

### Actualizar un producto

`PUT /productos/:id` con el cuerpo completo (sin `id`). Responde `200 OK` con el producto actualizado.

```json
{
  "nombre": "Tomate Cherry",
  "categoria": "hortaliza",
  "unidad": "kg",
  "precio": 3500,
  "activo": true
}
```

### Eliminar un producto

`DELETE /productos/:id` responde `204 No Content`, sin cuerpo. Si se repite, responde 404 porque el producto ya no existe.

### Listar productos

`GET /productos` responde `200 OK`:

```json
[
  { "id": 1, "nombre": "Mango", "categoria": "fruta", "unidad": "caja", "precio": 45000, "activo": true },
  { "id": 2, "nombre": "Tomate", "categoria": "hortaliza", "unidad": "kg", "precio": 3500, "activo": true },
  { "id": 3, "nombre": "Jugo de mora", "categoria": "procesado", "unidad": "caja", "precio": 28000, "activo": true }
]
```

## Reglas de los datos

| Campo | Obligatorio | Qué se acepta |
|---|---|---|
| `id` | — | Lo genera la base de datos; no se envía al crear ni al actualizar |
| `nombre` | Sí | Texto con contenido, máximo 100 caracteres (se recortan los espacios de los extremos); **debe ser único** |
| `categoria` | Sí | `fruta`, `hortaliza` o `procesado` |
| `unidad` | Sí | `kg` o `caja` |
| `precio` | Sí | Número mayor que 0 |
| `activo` | No | `true` o `false`; si se omite, queda en `true` |

Cualquier otro campo que se envíe se ignora y no se guarda.

## Reglas de negocio y errores

- **Nombre único (409):** no puede haber dos productos con el mismo nombre, sin distinguir mayúsculas. Al actualizar, el nombre solo causa conflicto si pertenece a **otro** producto; el mismo producto puede conservar su nombre. Tiene sentido para la empresa porque los pedidos y los lotes que referencian al producto quedarían ambiguos con entradas duplicadas.
- **Datos dentro de sus listas (400):** `precio` debe ser mayor que 0, y `categoria` y `unidad` deben estar dentro de su lista.

Todos los errores salen en JSON con el campo `error`.

| Código | Cuándo | Ejemplo |
|---|---|---|
| 400 | Algún dato no cumple las reglas, el id de la URL no es un entero positivo, o `ids` / `categoria` están mal escritos | `El id debe ser un entero positivo` |
| 404 | El id es válido pero no hay un producto con ese número (GET, PUT o DELETE), o ninguno de los `ids` existe | `No existe el producto con id 99` |
| 409 | El `nombre` enviado ya pertenece a otro producto (POST o PUT) | `Ya existe un producto con el nombre Mango` |

Cuando el 400 viene de la validación del cuerpo, se agrega `detalles` con todos los problemas encontrados a la vez:

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

El servicio primero valida el formato y solo después busca duplicados. Por eso un dato inválido da 400 y nunca 409.

## Relaciones

`ms-productos` **no guarda referencias** a otros microservicios y no consulta a nadie. Es un servicio **consultado**.

### Quién me consulta

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| `ms-pedidos` | `GET /productos/:id` (validar que el producto exista al crear o actualizar un pedido) · `GET /productos?ids=…` (componer la respuesta de los pedidos) | `id`, `nombre`, `precio` |
| `ms-lotes` | `GET /productos/:id` (validar al crear o actualizar un lote) · `GET /productos?ids=…` (componer la respuesta de los lotes) | `id`, `nombre`, `categoria` |

ms-pedidos y ms-lotes deben reenviar el token del usuario en la cabecera `Authorization`; si no, ms-productos responde 401.

Si cambio el nombre o el tipo de alguno de esos atributos, aviso al grupo antes de subir el cambio.

## Datos de partida

Al ejecutar `db/schema.sql`, la tabla queda con tres productos:

| id | nombre | categoria | unidad | precio | activo |
|---|---|---|---|---|---|
| 1 | Mango | fruta | caja | 45000 | true |
| 2 | Tomate | hortaliza | kg | 3500 | true |
| 3 | Jugo de mora | procesado | caja | 28000 | true |

Los datos se guardan en MySQL, así que no se pierden al reiniciar el servicio.

## Casos de prueba

La colección de pruebas está en la carpeta `docs/` (Thunder Client). Se ejecutan en este orden, con la tabla recién creada. La Papaya recibe el id 4, así que los casos 12 y 13 usan ese id.

| # | Petición | Resultado esperado |
|---|---|---|
| 1 | `GET /productos` | 200 · lista de productos |
| 2 | `GET /productos?categoria=fruta` | 200 · solo los de categoría fruta |
| 3 | `GET /productos?ids=1,2` | 200 · Mango y Tomate |
| 4 | `GET /productos/1` | 200 · Mango |
| 5 | `GET /productos/99` | 404 |
| 6 | `GET /productos/abc` | 400 |
| 7 | `POST /productos` con la Papaya | 201 · `id: 4`, `activo: true` |
| 8 | `POST /productos` con `{"nombre": "Solo nombre"}` | 400 · lista de errores |
| 9 | `POST /productos` con `"nombre": "Mango"` y el resto válido | 409 |
| 10 | `PUT /productos/1` con el cuerpo de "Mango Tommy" | 200 |
| 11 | `PUT /productos/99` con el mismo cuerpo | 404 |
| 12 | `DELETE /productos/4` | 204 |
| 13 | `DELETE /productos/4` otra vez | 404 |

Para repetir las pruebas desde cero, ejecuta `DROP TABLE productos;` y vuelve a ejecutar `db/schema.sql`.

## Organización del código

```text
ms-productos/
├── db/
│   └── schema.sql                        # Tabla y datos iniciales
├── docs/
│   └── thunder-collection_ms-productos.json   # Colección de pruebas
├── src/
│   ├── controllers/
│   │   └── productos.controller.js       # Lee la petición y arma la respuesta HTTP
│   ├── models/
│   │   └── producto.js                   # Campos válidos y validación
│   ├── repositories/
│   │   └── productos.repository.js       # Consultas SQL a MySQL
│   ├── routes/
│   │   └── productos.routes.js           # Asocia método + URL con el controlador
│   ├── services/
│   │   └── productos.service.js          # Reglas de negocio (validar, nombre único)
│   ├── utils/
│   │   └── http-error.js                 # Error con código HTTP
│   ├── app.js                            # Express, /health, montaje de rutas y errores
│   ├── db.js                             # Pool de conexiones a MySQL
│   └── index.js                          # Arranca el servidor con PORT y HOST
├── .env.example
├── package.json
└── package-lock.json
```

Cada capa solo se comunica con la que tiene al lado, de modo que una petición recorre este camino:

```text
Cliente → rutas → controlador → servicio → repositorio → MySQL
                                    ↓
                                 modelo (validación)
```

Para pasar de memoria a MySQL solo se reescribió el repositorio (y se agregó `db.js`); las rutas, el controlador, el servicio y el modelo no cambiaron por la migración. Las consultas usan parámetros (`?`) para evitar la inyección SQL, y la columna `nombre` lleva `UNIQUE` como segunda barrera de la regla de unicidad.

## Próximos pasos

| **Versión** | Taller 2 (semana 2) |
Ahora, todas las rutas exigen un token JWT emitido por ms-usuarios y los permisos dependen del rol.

## Seguridad

Todas las rutas de `/productos` exigen la cabecera `Authorization: Bearer <token>`. El token lo entrega `POST /usuarios/login` de ms-usuarios y se verifica con `JWT_SECRET`. `/health` es público.

| Operación | Roles permitidos |
|---|---|
| Consultar (`GET /productos`, `GET /productos?ids=…`, `GET /productos/:id`) | administrador, comercial, produccion |
| Crear, modificar y eliminar (`POST`, `PUT`, `DELETE`) | administrador |

| Código | Cuándo |
|---|---|
| 401 | Falta el token, está modificado o venció |
| 403 | El token es válido, pero el rol no tiene permiso para esa operación |

## Casos de prueba
Desde el caso 14, cada petición lleva un token (Auth, luego Bearer). Hay que crear en ms-usuarios un usuario de cada rol y hacer login con cada uno.

| 14 | `GET /productos` sin token | 401 |
| 15 | `GET /productos` con un token modificado | 401 |
| 16 | `GET /productos` con el token de comercial | 200 |
| 17 | `POST /productos` con el token de comercial | 403 |
| 18 | `POST /productos` con el token de administrador | 201 |


- **Taller 3:** despliegue en el ambiente.