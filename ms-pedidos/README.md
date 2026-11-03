# ms-pedidos · AgroRed S.A. (Módulo 3 · Taller 2)

Redes y Servicios Multimedia · UAO · Microservicio de **pedidos** con **Node.js + Express** organizado en capas,
con persistencia en **MySQL**.

- **Entidad que gestiona:** Pedido (un pedido de un cliente por una cantidad de un producto, que sale de un centro de distribución).
- **Responsable:** Edwin David Correa Cifuentes
- **Puerto:** 3004

## Cómo ejecutarlo

**Requisitos:** Node.js LTS 22 o superior (`node -v`) y MySQL en el PC (consola `mysql` o MySQL Workbench).

**1. Crear la base de datos y su usuario** (como administrador/root; cambie la clave por una suya):

```sql
CREATE DATABASE pedidos_db;
CREATE USER 'pedidos_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON pedidos_db.* TO 'pedidos_user'@'localhost';
```

**2. Crear la tabla y los registros iniciales** (desde la carpeta `ms-pedidos`):

```
mysql -u pedidos_user -p pedidos_db
mysql> SOURCE db/schema.sql;
```

**3. Instalar y configurar:**

```
npm install
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
```

Abra el archivo `.env` y escriba su contraseña real en `DB_PASSWORD`. Variables del `.env`:

| Variable | Significado | Valor de ejemplo |
|---|---|---|
| PORT | Puerto donde escucha el servicio | 3004 |
| HOST | Dirección donde escucha | 127.0.0.1 |
| DB_HOST | Servidor de MySQL | localhost |
| DB_PORT | Puerto de MySQL | 3306 |
| DB_NAME | Base de datos del servicio | pedidos_db |
| DB_USER | Usuario de MySQL del servicio | pedidos_user |
| DB_PASSWORD | Contraseña de ese usuario | (la suya; el `.env` no se sube al repositorio) |

**4. Arrancar:**

```
npm run dev
```

Prueben en el navegador: http://localhost:3004/health y http://localhost:3004/pedidos

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/pedidos.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/pedidos.controller.js | Presentación | Lee la petición (params, query, body), llama al servicio, arma la respuesta |
| src/services/pedidos.service.js | Lógica de negocio | Validaciones y reglas; no conoce HTTP ni la base de datos |
| src/repositories/pedidos.repository.js | Acceso a datos | Consultas SQL a MySQL |
| src/db.js | Acceso a datos | Pool de conexiones a MySQL con los datos del `.env` |
| src/models/pedido.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |
| db/schema.sql | Base de datos | Tabla `pedidos` y registros iniciales |

## Contrato de la API

### Representación de un pedido

```json
{
  "id": 1,
  "cliente_id": 1,
  "producto_id": 1,
  "cantidad": 50,
  "centro_distribucion": "Cali",
  "estado": "recibido",
  "fecha": "2026-10-20"
}
```

### Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único; el cliente nunca lo envía |
| cliente_id | entero | Sí | Entero positivo. Referencia a Cliente (ms-clientes) |
| producto_id | entero | Sí | Entero positivo. Referencia a Producto (ms-productos) |
| cantidad | entero | Sí | Entero mayor que 0 |
| centro_distribucion | texto | Sí | `Bogotá` o `Cali` |
| estado | texto | No (por defecto `recibido`) | `recibido`, `despachado` o `entregado` |
| fecha | texto (AAAA-MM-DD) | No (por defecto, hoy) | Fecha real |

`cliente_id` y `producto_id` se guardan solo como número (sin copiar los datos del cliente ni del producto).

### Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Listar | GET | /pedidos | — | 200, arreglo de pedidos | — |
| Filtrar | GET | /pedidos?estado=recibido | — | 200, arreglo de los pedidos de ese estado | — |
| Obtener | GET | /pedidos/:id | — | 200, el pedido | 400 id no numérico · 404 no existe |
| Crear | POST | /pedidos | Pedido sin `id` | 201, el pedido creado + cabecera Location | 400 datos inválidos |
| Actualizar | PUT | /pedidos/:id | Pedido completo sin `id` (reemplaza el registro) | 200, el pedido actualizado | 400 id no numérico o datos inválidos · 404 no existe |
| Eliminar | DELETE | /pedidos/:id | — | 204, sin cuerpo | 400 id no numérico · 404 no existe |

No hay consulta por lotes (`?ids=`) porque ningún otro microservicio consulta ms-pedidos.
Además: `GET /health` responde 200 `{"servicio":"ms-pedidos","estado":"ok"}`.

### Regla de negocio propia

Pedido no tiene un atributo que no se pueda repetir (varios pedidos pueden ser del mismo cliente y del mismo producto), así que no hay regla de unicidad (409). La regla está en la capa de servicio y responde 400: `cantidad` debe ser un entero mayor que 0 y `centro_distribucion` debe ser uno de los dos centros de AgroRed (Bogotá o Cali); `estado`, si viene, debe ser `recibido`, `despachado` o `entregado`.

### Ejemplo: crear un pedido

`POST /pedidos`

```json
{ "cliente_id": 1, "producto_id": 2, "cantidad": 10, "centro_distribucion": "Cali" }
```

Respuesta `201 Created` (cabecera `Location: /pedidos/4`):

```json
{
  "id": 4,
  "cliente_id": 1,
  "producto_id": 2,
  "cantidad": 10,
  "centro_distribucion": "Cali",
  "estado": "recibido",
  "fecha": "2026-11-03"
}
```

### Ejemplo: listar pedidos

`GET /pedidos?estado=entregado` → `200 OK`

```json
[
  {
    "id": 3,
    "cliente_id": 1,
    "producto_id": 3,
    "cantidad": 30,
    "centro_distribucion": "Cali",
    "estado": "entregado",
    "fecha": "2026-10-25"
  }
]
```

### Formato de los errores

```json
{ "error": "Datos inválidos", "detalles": ["cantidad es obligatoria y debe ser un entero mayor que 0"] }
```

## Relaciones

**Lado de ms-pedidos (quien guarda la referencia):** a quién consulta y para qué.

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| cliente_id | ms-clientes | GET /clientes/:id | GET /clientes?ids=… | id, nombre |
| producto_id | ms-productos | GET /productos/:id | GET /productos?ids=… | id, nombre |

**Lado de ms-pedidos (quien es consultado):** ningún microservicio consulta a ms-pedidos, por eso no hay campos que deba mantener estables para otros servicios.

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| Ninguno | — | — |
