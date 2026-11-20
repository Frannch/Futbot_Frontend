# Futbot_Frontend

Aplicación web desarrollada con React, Vite y Tailwind CSS.

## Requisitos previos

- Node.js 20.19 o superior (también es compatible con Node.js 22.12 o superior).
- npm, incluido con la instalación de Node.js.
- El backend ejecutándose en `http://127.0.0.1:8000`.

El frontend utiliza el backend para autenticación, clubes, ligas y conexión WebSocket. Si el backend no está disponible, algunas funcionalidades no estarán disponibles.

## Instalación

Desde PowerShell:

```powershell
cd Frontend
npm ci
```

`npm ci` instala exactamente las dependencias registradas en `package-lock.json`. Si se eliminó `node_modules` o el proyecto se acaba de descargar, no es necesario ejecutar `npm install` previamente.

Para agregar o actualizar manualmente una dependencia:

```powershell
npm install
```

## Levantar el frontend en desarrollo

Con el backend ejecutándose:

```powershell
npm run dev
```

Abrir la URL que muestre Vite en la terminal, normalmente `http://localhost:5173`.

## Otros comandos

Ejecutados desde la carpeta `Frontend`:

```powershell
npm run dev       # Servidor de desarrollo
npm run build     # Compilar para producción
npm run preview   # Previsualizar la compilación
npm run lint      # Ejecutar el linter
npm run test      # Ejecutar las pruebas
```

Ejecutar una prueba específica:

```powershell
npx vitest run src/test/websocket.test.jsx
```

Ejecutar las pruebas con cobertura:

```powershell
npx vitest run --coverage
```

## Estructura principal

- `Frontend/src/`: código fuente de la aplicación.
- `Frontend/src/components/`: componentes reutilizables.
- `Frontend/src/pages/`: páginas de la aplicación.
- `Frontend/src/services/`: servicios, incluida la conexión WebSocket.
- `Frontend/src/test/`: pruebas automatizadas.
