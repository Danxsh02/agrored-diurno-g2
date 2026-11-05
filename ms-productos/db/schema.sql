-- db/schema.sql
SET NAMES utf8mb4; -- para que las tildes y la ñ se guarden bien

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(30) NOT NULL,
  unidad VARCHAR(10) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO productos (nombre, categoria, unidad, precio, activo) VALUES
  ('Mango', 'fruta', 'caja', 45000, TRUE),
  ('Tomate', 'hortaliza', 'kg', 3500, TRUE),
  ('Jugo de mora', 'procesado', 'caja', 28000, TRUE);