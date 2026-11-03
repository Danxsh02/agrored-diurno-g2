SET NAMES utf8mb4;

CREATE TABLE lotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_lote VARCHAR(30) NOT NULL UNIQUE,
  producto_id INT NOT NULL,
  fecha_produccion DATE NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  resultado_calidad VARCHAR(20) NOT NULL,
  fecha_vencimiento DATE NULL,
  centro_produccion VARCHAR(50) NULL
);

INSERT INTO lotes (codigo_lote, producto_id, fecha_produccion, cantidad, resultado_calidad, fecha_vencimiento, centro_produccion) VALUES
 ('LOT-MAN-2026-001', 1, '2026-10-20', 500, 'aprobado', '2026-11-10', 'Valle del Cauca'),
 ('LOT-MAN-2026-002', 1, '2026-10-25', 300, 'pendiente', '2026-11-15', 'Valle del Cauca'),
 ('LOT-TOM-2026-001', 2, '2026-10-26', 1000, 'rechazado', '2026-11-05', 'Cali');