// Sesión simulada (Taller 2). En el Taller 3 se llena con la respuesta de POST /usuarios/login.
const Sesion = {
  llave: 'agrored.sesion',
  iniciar(usuario) { sessionStorage.setItem(this.llave, JSON.stringify(usuario)); },
  actual() {
    try { return JSON.parse(sessionStorage.getItem(this.llave)); } catch { return null; }
  },
  token() { const s = this.actual(); return s ? s.token : null; },
  cerrar() { sessionStorage.removeItem(this.llave); location.href = 'login.html'; },
  exigir() {
    const s = this.actual();
    if (!s) { location.replace('login.html'); return null; }
    return s;
  }
};