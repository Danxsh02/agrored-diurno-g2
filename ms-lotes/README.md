# ms-lotes · Microservicio de Lotes de Producción

**AgroRed S.A.** · Redes y Servicios Multimedia · UAO · Módulo 3
Microservicio para la gestión de lotes de producción de la planta, construido con **Node.js + Express** y organizado en capas.

Esta es la versión del **Taller 1**: datos en memoria y tres operaciones (listar, obtener, crear). La persistencia en base de datos (MySQL) se implementará en el Taller 2.

## Cómo ejecutarlo

Requisitos: Node.js LTS 22 o superior (`node -v`).

```bash
npm install                 # descarga Express en node_modules
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev                 # inicia el servicio en el puerto 3005 y se reinicia solo al guardar