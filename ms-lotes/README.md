# ms-lotes · Microservicio de Lotes de Producción

**AgroRed S.A.** · Redes y Servicios Multimedia · UAO · Módulo 3 · Talleres 2 y 3

Microservicio que gestiona la entidad **Lote** (lotes de producción), desarrollado con **Node.js**, **Express** y **MySQL**, organizado en capas y protegido con tokens **JWT**. Se relaciona con **ms-productos** por REST. Desde el Taller 3 corre como servicio `systemd` en servidor2, con su base de datos en servidor1 y detrás del API Gateway de Apache.

- **Responsable:** Daniel Muñoz Delgado
- **Puerto:** 3005 (solo `127.0.0.1`)
- **Base de datos:** `lotes_db` (usuario `lotes_user`)
- **Ruta pública (gateway):** `http://app.agrored.com/api/lotes`

## Cómo ejecutarlo

Hay dos formas: en el PC para desarrollo (Taller 2) y desplegado en las VMs (Taller 3, más abajo).

### Desarrollo en el PC

#### Requisitos
- Node.js LTS 22 o superior y npm.
- MySQL 8 en ejecución.
- Para probar todas las funciones deben estar corriendo también:
  - **ms-usuarios** en el puerto 3001 (entrega los tokens).
  - **ms-productos** en el puerto 3002 (valida y compone el producto de cada lote).

#### Pasos
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

| Variable | Descripción | En el PC (Taller 2) | En servidor2 (Taller 3) |
|---|---|---|---|
| `PORT` | Puerto del servicio | `3005` | Igual |
| `HOST` | Dirección de escucha | `127.0.0.1` | Igual |
| `DB_HOST` | Servidor MySQL | `localhost` | `172.16.1.58` (servidor1) |
| `DB_PORT` | Puerto de MySQL | `3306` | Igual |
| `DB_NAME` | Base de datos | `lotes_db` | Igual |
| `DB_USER` | Usuario de la base | `lotes_user` | Igual |
| `DB_PASSWORD` | Clave del usuario (no se sube al repositorio) | La de desarrollo | La nueva de servidor1 |
| `JWT_SECRET` | Clave con la que se verifican los tokens. **Debe ser idéntica a la de ms-usuarios y a la de los demás microservicios del grupo.** | La de desarrollo | La del grupo en servidor2 |
| `PRODUCTOS_URL` | Dirección de ms-productos | `http://127.0.0.1:3002` | Igual (mismo equipo) |

El archivo `.env` nunca se sube al repositorio; `.env.example` contiene los mismos nombres sin valores secretos. El código no cambia entre el PC y el servidor: solo cambia el `.env`.

## Despliegue en el ambiente (Taller 3)

Arquitectura: el navegador llama a `http://app.agrored.com/api/lotes`; Apache (servidor2) reenvía la petición a `http://127.0.0.1:3005/lotes`; ms-lotes verifica el token y guarda sus datos en `lotes_db`, en MySQL de servidor1 (`172.16.1.58`). Para componer el producto de cada lote consulta a ms-productos directamente en `127.0.0.1:3002`, sin pasar por el gateway.

### 1. Base de datos en servidor1
Como `root` de MySQL (el usuario solo puede conectarse desde servidor2, y la contraseña es solo con letras y números):
```sql
CREATE DATABASE lotes_db CHARACTER SET utf8mb4;
CREATE USER 'lotes_user'@'172.16.1.59' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON lotes_db.* TO 'lotes_user'@'172.16.1.59';
```
El comando completo de las cinco bases está en `deploy/crear-bases-y-usuarios.sql` (sin contraseñas).

### 2. Servicio en servidor2
En `/srv/agrored/app/ms-lotes`:
```bash
npm ci --omit=dev
mysql -h 172.16.1.58 -u lotes_user -p lotes_db < db/schema.sql
cp .env.example .env && nano .env
chmod 640 .env && sudo chgrp nodeapps .env
sudo cp /srv/agrored/app/deploy/ms-lotes.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now ms-lotes
```
El archivo `deploy/ms-lotes.service` corre el servicio con el usuario `nodeapps`, con `ExecStart=/usr/bin/node --env-file=.env src/index.js` y `Restart=on-failure`.

### 3. Verificación
```bash
systemctl status ms-lotes              # active (running)
journalctl -u ms-lotes -n 20           # mensajes y errores
curl http://127.0.0.1:3005/health      # {"servicio":"ms-lotes","estado":"ok"}
sudo ss -tlnp | grep 3005              # debe escuchar en 127.0.0.1:3005
```
El puerto 3005 **no** se abre en ufw: en servidor2 solo están abiertos el 22 y el 80. Desde Windows, `curl.exe http://172.16.1.59:3005/health` debe fallar; solo se llega por el gateway.

Para actualizar después de un cambio: `git pull`, `npm ci --omit=dev` en `ms-lotes/` y `sudo systemctl restart ms-lotes`.

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

Las URI son las de ms-lotes (`http://127.0.0.1:3005`). Por el gateway, anteponer `/api`: por ejemplo `GET http://app.agrored.com/api/lotes/1`.

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Salud | GET | `/health` | — | 200 | — |
| Listar | GET | `/lotes` | — | 200 + arreglo | 401 |
| Filtrar | GET | `/lotes?resultado_calidad=aprobado` | — | 200 + arreglo filtrado | 401 |
| Obtener | GET | `/lotes/:id` | — | 200 + objeto | 400 · 401 · 404 |
| Crear | POST | `/lotes` | JSON sin `id` | 201 + objeto + cabecera `Location` | 400 · 401 · 403 · 409 · 503 |
| Actualizar | PUT | `/lotes/:id` | JSON completo sin `id` | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 · 503 |
| Eliminar | DELETE | `/lotes/:id` | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Todas las rutas de `/lotes` exigen la cabecera `Authorization: Bearer <token>`. `/health` es pública (y por el gateway solo se alcanza desde dentro de servidor2, porque el gateway no la expone).

El filtro `?resultado_calidad=` acepta `pendiente`, `aprobado` o `rechazado`. Ningún otro microservicio consulta a ms-lotes, por eso no tiene consulta por lotes (`?ids=`).

### Cómo obtener un token

1. Iniciar sesión por el gateway: `POST http://app.agrored.com/api/usuarios/login` con el correo y la contraseña de un usuario de la aplicación (por ejemplo `andres.castillo@agrored.com`, rol `produccion`). Las contraseñas se acuerdan en el canal privado del grupo y no se escriben en el repositorio:
   ```json
   { "email": "<correo>", "password": "<contraseña>" }
   ```
2. Copiar el valor de `token` de la respuesta.
3. Enviarlo en cada petición a ms-lotes en la cabecera `Authorization: Bearer <token>`.

El token lo firma ms-usuarios y vence según su configuración (`JWT_EXPIRA`); si aparece 401, hay que iniciar sesión de nuevo. En el PC, el login es `POST http://127.0.0.1:3001/usuarios/login`.

### Ejemplo: crear un lote

`POST http://app.agrored.com/api/lotes`

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

Respuesta `201 Created` (con `Location: /lotes/<id>`):

```json
{
  "id": 6,
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

`GET http://app.agrored.com/api/lotes`

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
| 401 | Falta el token, es inválido o venció | `{"error":"Falta el token de acceso (cabecera Authorization: Bearer <token>)"}` |
| 403 | El rol no tiene permiso para la operación | `{"error":"El rol comercial no tiene permiso para esta operación"}` |
| 404 | El lote no existe | `{"error":"No existe el lote con id 99"}` |
| 409 | `codigo_lote` repetido | `{"error":"Ya existe un lote con el código LOT-MAN-2026-001"}` |
| 503 | ms-productos no está disponible al escribir | `{"error":"ms-productos no está disponible"}` |

Si el servicio `ms-lotes` está detenido, el 503 lo genera Apache (el gateway), no el microservicio.

## Seguridad

Cada petición lleva un token JWT firmado por ms-usuarios. ms-lotes lo verifica con `JWT_SECRET`, sin consultar a ms-usuarios, usando el middleware `src/middlewares/auth.js` (copiado sin cambios de ms-usuarios).

| Operación | Roles permitidos |
|---|---|
| Consultar (GET) | Cualquier usuario autenticado |
| Crear, actualizar, eliminar | `administrador`, `produccion` |

Sin token o con token inválido responde 401. Con un rol sin permiso responde 403.

Medidas del despliegue: el servicio corre con el usuario de sistema `nodeapps` (sin privilegios); el `.env` tiene permisos 640 y grupo `nodeapps`; el puerto 3005 escucha solo en `127.0.0.1`; y `lotes_user` solo puede conectarse a MySQL desde servidor2 (`@'172.16.1.59'`), con ufw abriendo el 3306 únicamente para esa IP.

## Relaciones

### Lo que ms-lotes consulta

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| `producto_id` | ms-productos | `GET /productos/:id` | `GET /productos?ids=…` | `id`, `nombre`, `categoria` |

- Al escribir: si el producto no existe responde 400; si ms-productos no responde, 503.
- Al leer: agrega el objeto `producto` con una sola consulta por lotes. Si ms-productos no responde, la respuesta sale igual con `producto: null` y un campo `aviso`.
- En ambos casos reenvía el token recibido y espera como máximo 3 segundos.
- En servidor2 la consulta va directa a `http://127.0.0.1:3002` (variable `PRODUCTOS_URL`), no por el gateway. En `journalctl -u ms-productos -f` se ve una sola petición `GET /productos?ids=…` por cada listado.

### Quién consulta a ms-lotes

| Me consulta | Peticiones que me hace | Campos que no puedo cambiar sin avisar |
|---|---|---|
| Ningún microservicio | — | — |
| El frontend: pantalla de Lotes y Panel general | `GET /lotes` (con token del usuario); el Panel solo cuenta los registros | La forma del arreglo y el objeto `producto` |

## Pantalla en el frontend

La pantalla `lotes.html` (con `js/api-lotes.js` y `js/lotes.js`) lista, crea, edita y elimina lotes por el gateway, con rutas relativas `/api/lotes`. Los botones de escritura solo aparecen a `administrador` y `produccion`, y si se intenta una operación sin permiso, el 403 se muestra como mensaje. Si ms-productos no responde, la lista se muestra igual con el aviso "Datos incompletos", y al crear aparece el mensaje del 503. La página de inicio del rol `produccion` es Lotes.

## Estructura del proyecto

```text
ms-lotes/
├── db/
│   └── schema.sql
├── docs/
│   └── colecciones de pruebas exportadas de Thunder Client (Taller 2 y Taller 3)
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

El archivo del servicio (`ms-lotes.service`) y el de Apache (`app.conf`) están en la carpeta `deploy/` de la raíz del repositorio.

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

Los datos se guardan en MySQL (`lotes_db`, tabla `lotes`). Solo la capa de acceso a datos (`lotes.repository.js` y `db.js`) conoce la base: las rutas, el controlador, el servicio y el modelo no cambiaron al migrar desde la versión en memoria, ni al pasar la base del PC a servidor1 (solo cambió el `.env`). Las consultas usan parámetros (`?`) para evitar la inyección SQL.

La columna `producto_id` es un entero sin `FOREIGN KEY`: la tabla de productos vive en la base de ms-productos, y su existencia se valida por REST.

## Pruebas

### Taller 2 (local, `http://127.0.0.1:3005`)

La colección `docs/thunder-collection_ms-lotes Taller 2.json` tiene los casos 1 al 24, ejecutados contra el microservicio en el PC:

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

### Taller 3 (por el gateway, `http://app.agrored.com/api`)

Tres colecciones en `docs/`, que usan el entorno de Thunder Client `gateway` con las variables `token_admin`, `token_comercial` y `token_produccion` (los tokens se obtienen por login y **no** se suben al repositorio):

**`thunder-collection_ms-lotes-gateway-t3.json`** (17 casos, se puede correr completa con *Run All* las veces que se quiera; no crea ni borra lotes):

| # | Caso | Código esperado |
|---|---|---|
| 01 | Listar todos los lotes | 200 |
| 02 | Filtrar por `resultado_calidad` | 200 |
| 03 | Obtener el lote 1 con producto compuesto | 200 |
| 04 | Obtener lote inexistente | 404 |
| 05 | Id no numérico | 400 |
| 06 | Crear sin `codigo_lote` | 400 |
| 07 | `codigo_lote` repetido | 409 |
| 08 | Fecha de producción futura | 400 |
| 09 | Crear con producto inexistente | 400 |
| 10 | Actualizar el lote 1 con sus mismos datos | 200 |
| 11 | Actualizar lote inexistente | 404 |
| 12 | Eliminar lote inexistente | 404 |
| 13 | Listar (una sola petición `?ids=` en `journalctl`) | 200 |
| 14 | Sin token | 401 |
| 15 | Comercial puede consultar | 200 |
| 16 | Comercial no puede crear | 403 |
| 17 | Comercial no puede eliminar | 403 |

**`thunder-collection_ms-lotes-ciclo-t3.json`** (3 casos, se corre una vez y a mano): crear un lote válido (201), eliminarlo (204) y eliminarlo otra vez (404). Usa el id fijo `6`, por lo que antes hay que dejar el contador de la tabla así en servidor1 (con el lote anterior ya borrado): `ALTER TABLE lotes AUTO_INCREMENT = 6;`. El `C1` debe devolver `"id": 6` antes de correr `C2`.

**`thunder-collection_ms-lotes-resiliencia-t3.json`** (2 casos, con `ms-productos` detenido: `sudo systemctl stop ms-productos`): listar da 200 con `producto: null` y crear da 503. Al terminar, `sudo systemctl start ms-productos`.

Otras comprobaciones de la prueba integral relacionadas con ms-lotes: una sola petición `?ids=` por listado en `journalctl -u ms-productos -f`, la pantalla de Lotes que avisa y no se cae con ms-productos detenido, y el servicio que vuelve solo tras reiniciar servidor2 (`sudo reboot`).

## Tecnologías

Node.js, Express, MySQL (`mysql2`), JSON Web Tokens (`jsonwebtoken`), systemd, Apache (proxy inverso) y Thunder Client para las pruebas.
