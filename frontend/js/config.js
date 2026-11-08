// =====================================================================
// CONFIGURACIÓN ÚNICA DEL FRONTEND
// En el Taller 3 solo cambian MODO y API_BASE (y el login simulado por el real).
// =====================================================================
const CONFIG = {
  MODO: 'ejemplo',                      // 'ejemplo' = datos del JSON · 'real' = microservicios
  API_BASE: 'http://127.0.0.1:3003',    // Taller 3: '/api'
  API_BASE: 'http://127.0.0.1:3003',    // Taller 3: '/api'
  DATOS_CLIENTES: 'datos/clientes.json',
  INICIO: 'clientes.html',              // página de inicio (el grupo la ajusta por rol)
  ROLES_ESCRITURA_CLIENTES: ['administrador', 'comercial'],

  ROLES: {
    administrador: { texto: 'Administrador', desc: 'Gestiona usuarios y toda la operación', icono: 'shield', usuario: 'Administrador General' },
    comercial:     { texto: 'Comercial',     desc: 'Clientes y pedidos',                   icono: 'clipboard', usuario: 'Laura Gómez' },
    produccion:    { texto: 'Producción',    desc: 'Productos y lotes',                    icono: 'layers', usuario: 'Andrés Castillo' }
  },

  MODULOS: {
    clientes:  { texto: 'Clientes',  href: 'clientes.html',  icono: 'users' },
    productos: { texto: 'Productos', href: 'productos.html', icono: 'box' },
    pedidos:   { texto: 'Pedidos',   href: 'pedidos.html',   icono: 'clipboard' },
    lotes:     { texto: 'Lotes',     href: 'lotes.html',     icono: 'layers' },
    usuarios:  { texto: 'Usuarios',  href: 'usuarios.html',  icono: 'shield' }
  },

  MENU: {
    administrador: ['clientes', 'productos', 'pedidos', 'lotes', 'usuarios'],
    comercial:     ['pedidos', 'clientes', 'productos'],
    produccion:    ['lotes', 'productos', 'clientes']
  }
};