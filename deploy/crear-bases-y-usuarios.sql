-- Ejecutar en servidor1 con: sudo mysql
-- Reemplazar cada <CLAVE_...> por la contrasena real (solo letras y numeros).
-- No subir las contrasenas reales al repositorio.

CREATE DATABASE usuarios_db;
CREATE USER 'usuarios_user'@'172.16.1.59' IDENTIFIED BY '<CLAVE_USUARIOS>';
GRANT ALL PRIVILEGES ON usuarios_db.* TO 'usuarios_user'@'172.16.1.59';

CREATE DATABASE productos_db;
CREATE USER 'productos_user'@'172.16.1.59' IDENTIFIED BY '<CLAVE_PRODUCTOS>';
GRANT ALL PRIVILEGES ON productos_db.* TO 'productos_user'@'172.16.1.59';

CREATE DATABASE clientes_db;
CREATE USER 'clientes_user'@'172.16.1.59' IDENTIFIED BY '<CLAVE_CLIENTES>';
GRANT ALL PRIVILEGES ON clientes_db.* TO 'clientes_user'@'172.16.1.59';

CREATE DATABASE pedidos_db;
CREATE USER 'pedidos_user'@'172.16.1.59' IDENTIFIED BY '<CLAVE_PEDIDOS>';
GRANT ALL PRIVILEGES ON pedidos_db.* TO 'pedidos_user'@'172.16.1.59';

CREATE DATABASE lotes_db;
CREATE USER 'lotes_user'@'172.16.1.59' IDENTIFIED BY '<CLAVE_LOTES>';
GRANT ALL PRIVILEGES ON lotes_db.* TO 'lotes_user'@'172.16.1.59';
