// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio Lotes)
// =====================================================================
const lotes = [
  {
    id: 1,
    codigo_lote: 'LOT-MAN-2026-001',
    producto_id: 1,
    fecha_produccion: '2026-10-20',
    cantidad: 500,
    resultado_calidad: 'aprobado',
    fecha_vencimiento: '2026-11-10',
    centro_produccion: 'Valle del Cauca'
  },
  {
    id: 2,
    codigo_lote: 'LOT-MAN-2026-002',
    producto_id: 1,
    fecha_produccion: '2026-10-25',
    cantidad: 300,
    resultado_calidad: 'pendiente',
    fecha_vencimiento: '2026-11-15',
    centro_produccion: 'Valle del Cauca'
  },
  {
    id: 3,
    codigo_lote: 'LOT-TOM-2026-001',
    producto_id: 2,
    fecha_produccion: '2026-10-26',
    cantidad: 1000,
    resultado_calidad: 'rechazado',
    fecha_vencimiento: '2026-11-05',
    centro_produccion: 'Cali'
  }
];
let siguienteId = 4;

async function findAll(filtros = {}) {
  return lotes.filter((l) => !filtros.resultado_calidad || l.resultado_calidad === filtros.resultado_calidad);
}

async function findById(id) {
  return lotes.find((l) => l.id === id) || null;
}

async function findByCodigo(codigo_lote) {
  return lotes.find((l) => l.codigo_lote === codigo_lote) || null;
}

async function create(lote) {
  const nuevo = { id: siguienteId++, ...lote };
  lotes.push(nuevo);
  return nuevo;
}

async function update(id, datos) {
  const i = lotes.findIndex((l) => l.id === id);
  if (i === -1) return null;
  lotes[i] = { id, ...datos };
  return lotes[i];
}

async function remove(id) {
  const i = lotes.findIndex((l) => l.id === id);
  if (i === -1) return false;
  lotes.splice(i, 1);
  return true;
}

module.exports = { findAll, findById, findByCodigo, create, update, remove };