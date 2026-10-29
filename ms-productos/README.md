# Microservicio: ms-productos

Servicio de productos para la empresa de **AgroRed S.A.**, separado en capas y realizado en base al ms-usuario proporcionado
| | |
|---|---|
| **Responsable** | Estefanía Del Amor Restrepo (`tefDel`) |
| **Puerto** | 3002 |
| **Stack** | Node.js · Express |
| **Versión** | Taller 1 |

## ¿Qué hace?

Este servicio es el único responsable de la información de los productos que vende AgroRed. Otros microservicios, como pedidos y lotes, se apoyan en él para saber qué productos existen. En esta versión permite:

- Consultar el catálogo completo,
- Buscar un producto por su id,
- Registrar un producto nuevo, validando sus datos y evitando ids repetidos.

La base de datos, la autenticación con JWT y las operaciones de modificar y eliminar llegan en talleres posteriores.

## Puesta en marcha

Necesitas Node.js LTS (22 o superior) y npm. Desde la carpeta `ms-productos`:

```bash
npm install
cp .env.example .env
npm run dev
```

> En CMD de Windows, el segundo comando es `copy .env.example .env`.

El archivo `.env` solo necesita dos valores:

```dotenv
PORT=3002
HOST=127.0.0.1
```

Si todo salió bien, la consola muestra:

```text
ms-productos escuchando en http://127.0.0.1:3002
```

`npm run dev` reinicia el servidor automáticamente cada vez que se guarda un archivo.


### Estructura de un producto

```json
{
  "id": 1,
  "nombre": "Mango",
  "categoria": "fruta",
  "unidad": "caja",
  "precio": 45000.00,
  "activo": true
}
```

### Crear un producto

`POST /productos` con cuerpo JSON. El `id` lo define quien hace la petición, no el servidor.

```json
{
  "id": 3,
  "nombre": "Papaya",
  "categoria": "fruta",
  "unidad": "kg",
  "precio": 4200
}
```

Responde `201 Created` con el producto guardado. En`activo` aparece como `true` aunque no se envió, porque es su valor por defecto. La respuesta también trae la cabecera `Location: /productos/3`, que indica dónde consultar el recurso creado.

## Validaciones

| Campo | Obligatorio | Qué se acepta |
|---|---|---|
| `id` | Sí | Entero mayor que 0, que no esté ya registrado |
| `nombre` | Sí | Texto con contenido (se recortan los espacios de los extremos) |
| `categoria` | Sí | `fruta`, `hortaliza` o `procesado` |
| `unidad` | Sí | `kg` o `caja` |
| `precio` | Sí | Número mayor que 0 |
| `activo` | No | `true` o `false`; si se omite, queda en `true` |

Cualquier otro campo que se envíe se ignora y no se guarda.

## Endpoints

Base: `http://127.0.0.1:3002`

| Método | Ruta | Para qué sirve | Respuestas |
|---|---|---|---|
| GET | `/health` | Confirmar que el servicio está activo | 200 |
| GET | `/productos` | Listar todos los productos | 200 |
| GET | `/productos/:id` | Consultar un producto | 200 · 400 · 404 |
| POST | `/productos` | Registrar un producto | 201 · 400 · 409 |

## Errores

Todos los errores salen en JSON con el campo `error`.

| Código | Cuándo | Ejemplo |
|---|---|---|
| 400 | Algún dato del POST no cumple las reglas, o el id de la URL no es un entero positivo | `El id debe ser un entero positivo` |
| 404 | El id es válido pero no hay un producto con ese número | `No existe el producto con id 99` |
| 409 | El `id` enviado en el POST ya pertenece a otro producto | `Ya existe un producto con id 1` |

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

El servicio primero valida el formato y solo después busca duplicados. Por eso un id inválido da 400 y nunca 409.

## Datos de partida

Al arrancar, el servicio ya contiene dos productos:

| id | nombre | categoria | unidad | precio | activo |
|---|---|---|---|---|---|
| 1 | Mango | fruta | caja | 45000 | true |
| 2 | Tomate | hortaliza | kg | 3500 | true |

Todo se guarda en un arreglo en memoria: al reiniciar el servidor se pierden los productos creados y vuelven a quedar solo estos dos.

## Casos de prueba

Probados con Thunder Client. Los ids de los POST asumen que acabas de arrancar el servidor.

| # | Petición | Resultado esperado |
|---|---|---|
| 1 | `GET /health` | 200 · `{"servicio":"ms-productos","estado":"ok"}` |
| 2 | `GET /productos` | 200 · lista con Mango y Tomate |
| 3 | `GET /productos/1` | 200 · Mango |
| 4 | `GET /productos/99` | 404 |
| 5 | `GET /productos/abc` | 400 |
| 6 | `POST /productos` con la Papaya (`id: 3`) | 201 · `activo: true` |
| 7 | `POST /productos` con `{"nombre": "Solo nombre"}` | 400 · lista de errores |
| 8 | `POST /productos` repitiendo `id: 1` | 409 |
| 9 | `POST /productos` con `"activo": "si"` y el resto válido | 400 · `activo debe ser true o false` |

## Organización del código

```text
ms-productos/
├── src/
│   ├── controllers/
│   │   └── productos.controller.js    # Lee la petición y arma la respuesta HTTP
│   ├── models/
│   │   └── producto.js                # Campos válidos y validación
│   ├── repositories/
│   │   └── productos.repository.js    # Guarda y busca los datos en memoria
│   ├── routes/
│   │   └── productos.routes.js        # Asocia método + URL con el controlador
│   ├── services/
│   │   └── productos.service.js       # Reglas de negocio (validar, detectar duplicados)
│   ├── utils/
│   │   └── http-error.js              # Error con código HTTP
│   ├── app.js                         # Express, /health, montaje de rutas y errores
│   └── index.js                       # Arranca el servidor con PORT y HOST
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

Esto facilita el Taller 3: para pasar de memoria a MySQL basta con reescribir el repositorio, y el resto del código queda igual.

## Próximos talleres

- **Taller 2:** `PUT /productos/:id` para actualizar y `DELETE /productos/:id` para eliminar.
- **Taller 3:** persistencia en MySQL y verificación de JWT.