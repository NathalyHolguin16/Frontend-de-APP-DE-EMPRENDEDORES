# Mercatto Frontend

Aplicación móvil Expo/React Native para comprar en emprendimientos locales y
administrar tiendas, productos y pedidos.

## Requisitos

- Node.js 20 o superior.
- npm.
- Expo Go para pruebas en dispositivo o un emulador Android/iOS.

## Configuración

```bash
npm install
cp .env.example .env
npm start
```

La API utilizada por defecto es:

```text
https://mercatto-back.onrender.com
```

Variables disponibles:

```dotenv
EXPO_PUBLIC_MERCATTO_API_URL=https://mercatto-back.onrender.com
EXPO_PUBLIC_MERCATTO_PUBLIC_URL=
```

`EXPO_PUBLIC_MERCATTO_PUBLIC_URL` es opcional y habilita los enlaces públicos
para compartir tiendas.

## Módulos

- Autenticación y perfil.
- Catálogo de tiendas y productos.
- Carrito, checkout y pedidos.
- Direcciones con mapa y geolocalización.
- Panel emprendedor.
- Gestión de tienda, productos y pedidos.

## Verificación

```bash
npm run lint
npm test
npm run test:api
```

`npm run test:api` consulta el catálogo público sin crear ni modificar datos.
`npm run test-auth` crea una cuenta temporal y debe utilizarse únicamente cuando
se desee comprobar registro e inicio de sesión contra el backend.

## Compilación Android

El perfil `preview` de EAS genera un APK instalable:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

La configuración se encuentra en `app.json` y `eas.json`.

## Estructura

```text
App.js                 Navegación principal
services/              Cliente de la API REST
src/components/        Componentes reutilizables
src/context/           Estado global y operaciones
src/screens/auth/      Autenticación y registro
src/screens/buyer/     Experiencia del comprador
src/screens/entrepreneur/ Panel del emprendedor
src/theme/             Colores y estilos compartidos
src/utils/             Validaciones y utilidades
```
