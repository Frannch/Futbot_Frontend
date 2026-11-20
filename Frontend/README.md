# Frontend

Aplicación web desarrollada con React, Vite y Tailwind CSS.

## Requisitos previos

Antes de levantar el proyecto, instalar:

- [Node.js](https://nodejs.org/) *20.19 o superior* (o 22.12 o superior).
- npm, incluido con Node.js.
- El backend de la aplicación, ejecutándose en http://127.0.0.1:8000.

El frontend utiliza el backend para autenticación, clubes, ligas y conexión WebSocket. Si el backend no está levantado, algunas funcionalidades no estarán disponibles.

## Instalación

Desde la carpeta Frontend del repositorio, instalar las dependencias:

bash

    $ npm install


## Levantar el frontend en desarrollo

Ejecutar:

bash

    $ npm run dev


Vite mostrará en la terminal la URL local, normalmente:

text

    $ http://localhost:5173


Abrir esa dirección en el navegador.

## Otros comandos

Construir la versión de producción:

bash

    $ npm run build


Previsualizar la versión construida:

bash

    $ npm run preview


Ejecutar el linter:

bash

    $ npm run lint


Ejecutar las pruebas:

bash

    $ npm run test
    
    $ npx vitest run archivo

    ejemplo:
    $ npx vitest run src/test/websocket.test.jsx
    

##Ejecutar coverge

    $ npx vitest run --coverage


## Estructura principal

- src/: código fuente de la aplicación.
- src/components/: componentes reutilizables.
- src/pages/: páginas de la aplicación.
- src/services/: servicios, incluyendo la conexión WebSocket.
- src/test/: pruebas automatizadas.
