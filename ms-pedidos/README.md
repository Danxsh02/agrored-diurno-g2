# ms-pedidos · AgroRed S.A. (Módulo 3 · Taller 1)

Redes y Servicios Multimedia · UAO · Microservicio de **pedidos** con **Node.js + Express** organizado en capas.
Adaptado de la plantilla de ms-usuarios. Responsable: Edwin David Correa Cifuentes · Puerto **3004**.

Versión del Taller 1: datos en memoria y tres operaciones.

## Cómo ejecutarlo

Requisitos: Node.js LTS 22 o superior (`node -v`).

```
npm install
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev
```

Prueben en el navegador: http://localhost:3004/health y http://localhost:3004/pedidos

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/pedidos.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/pedidos.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/pedidos.service.js | Lógica de negocio | Validaciones y reglas; no conoce HTTP ni la base de datos |
| src/repositories/pedidos.repository.js | Acceso a datos | Guarda y consulta (en memoria en el Taller 1) |
| src/models/pedido.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

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
| cliente_id | entero | Sí | Entero positivo. Referencia a Cliente (se valida contra ms-clientes en el Taller 3) |
| producto_id | entero | Sí | Entero positivo. Referencia a Producto (se valida contra ms-productos en el Taller 3) |
| cantidad | entero | Sí | Mayor que 0 |
| centro_distribucion | texto | Sí | `Bogotá` o `Cali` |
| estado | texto | No (por defecto `recibido`) | `recibido`, `despachado` o `entregado` |
| fecha | texto (AAAA-MM-DD) | No (por defecto, hoy) | Fecha real |

### Cuerpo para crear un pedido

```json
{ "cliente_id": 1, "producto_id": 2, "cantidad": 10, "centro_distribucion": "Cali" }
```

### Endpoints

| Método | URI | Respuesta exitosa | Errores |
|---|---|---|---|
| GET | /health | 200 `{"servicio":"ms-pedidos","estado":"ok"}` | — |
| GET | /pedidos | 200, arreglo de pedidos | — |
| GET | /pedidos/:id | 200, el pedido | 400 id no numérico · 404 no existe |
| POST | /pedidos | 201, el pedido creado con su id + cabecera Location | 400 datos inválidos |

### Formato de los errores

```json
{ "error": "Datos inválidos", "detalles": ["cantidad es obligatoria y debe ser un entero mayor que 0"] }
```

### Relaciones (Taller 3)

Pedido guarda `cliente_id` y `producto_id`. En las lecturas, la respuesta traerá además los objetos
`cliente: {id, nombre}` y `producto: {id, nombre, precio}` (o `null` si el otro servicio no responde).
