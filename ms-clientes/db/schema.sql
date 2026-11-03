-- db/schema.sql

USE clientes_db;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS clientes;

CREATE TABLE clientes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  nit       VARCHAR(20)  NOT NULL UNIQUE,
  ciudad    VARCHAR(60)  NOT NULL,
  telefono  VARCHAR(20)  NOT NULL,
  tipo      VARCHAR(20)  NOT NULL,
  direccion VARCHAR(150) NOT NULL DEFAULT '',
  email     VARCHAR(120) NOT NULL DEFAULT ''
);

INSERT INTO clientes (nombre, nit, ciudad, telefono, tipo, direccion, email) VALUES
  ('Distribuidora El Valle', '900123456-7', 'Cali', '3001234567', 'distribuidor', 'Calle 10 # 20-30', 'compras@distribuidora.com'),
  ('Comercial Andina', '800987654-3', 'Bogotá', '3109876543', 'comercio', 'Carrera 15 # 80-12', 'ventas@andina.com');