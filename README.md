# AgroRed S.A - Microproyecto Módulo 3

**Jornada:** Diurna · **Grupo:** 6 (`agrored-diurno-g6`)

AgroRed S.A. es una empresa de agroindustria y distribución que gestiona productos, clientes, pedidos y lotes de producción. Esta aplicación está construida como un conjunto de microservicios independientes en Node.js y Express.

## Integrantes y microservicios

| Nombre | Usuario de GitHub | Rol | Microservicio a cargo |
|---|---|---|---|
| Daniel Muñoz Delgado | Danxsh02 | Integrador | `ms-lotes` |
| Valentina Montero Zapata | monterozapatavalentina-ctrl | Documentador | `ms-clientes` |
| Estefanía Del Amor Restrepo | tefDel | Arquitecto | `ms-productos` |
| Edwin David Correa Cifuentes | edwinc2010 | Coordinador / Relator | `ms-pedidos` |

## Microservicios

| Carpeta | Entidad | Responsable | Puerto | Depende de |
|---|---|---|---|---|
| `ms-productos` | Producto | Estefanía Del Amor Restrepo | 3002 | [ninguno] |
| `ms-clientes` | Cliente | Valentina Montero Zapata | 3003 | [ninguno] |
| `ms-pedidos` | Pedido | Edwin David Correa Cifuentes | 3004 | [ms-clientes, ms-productos] |
| `ms-lotes` | Lote | Daniel Muñoz Delgado | 3005 | [ms-productos] |

## Estructura del repositorio

```
agrored-diurno-g6/
├── README.md          # Este archivo
├── ms-productos/      # Microservicio de productos
├── ms-clientes/       # Microservicio de clientes
├── ms-pedidos/        # Microservicio de pedidos
├── ms-lotes/          # Microservicio de lotes
└── thunder-tests/     # Colección de pruebas de Thunder Client
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
│   ├── repositories/     # Acceso a datos (en memoria por ahora)
│   ├── models/           # Entidad y validación
│   └── utils/            # Utilidades (HttpError)
├── package.json
├── package-lock.json
└── .env.example
```

## Cómo ejecutar un microservicio

Ejemplo con 'ms-productos':

```bash
cd ms-productos
npm install
cp .env.example .env
npm run dev
```

Debe aparecer 'ms-productos escuchando en http://127.0.0.1:3002'. Para comprobar que funciona: `GET /health`.
