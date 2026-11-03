USE pedidos_db;

SET NAMES utf8mb4;              -- para que las tildes (Bogotá) se guarden bien

DROP TABLE IF EXISTS pedidos;   -- permite volver a ejecutar el script (reinicia la tabla)

CREATE TABLE pedidos (
   id                  INT AUTO_INCREMENT PRIMARY KEY,
   cliente_id          INT NOT NULL,   -- referencia a ms-clientes (sin FOREIGN KEY)
   producto_id         INT NOT NULL,   -- referencia a ms-productos (sin FOREIGN KEY)
   cantidad            INT NOT NULL,
   centro_distribucion VARCHAR(30) NOT NULL,
   estado              VARCHAR(30) NOT NULL DEFAULT 'recibido',
   fecha               DATE NOT NULL
) DEFAULT CHARSET = utf8mb4;

INSERT INTO pedidos (cliente_id, producto_id, cantidad, centro_distribucion, estado, fecha) VALUES
  (1, 1, 50,  'Cali',   'recibido',   '2026-10-20'),
  (2, 2, 120, 'Bogotá', 'despachado', '2026-10-22'),
  (1, 3, 30,  'Cali',   'entregado',  '2026-10-25');