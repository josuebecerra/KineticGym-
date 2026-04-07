# 🚀 Guía de Despliegue - KINETIC GYM

Este documento contiene los comandos necesarios para compilar y desplegar la aplicación en todas las plataformas (Web, Android e iOS).

---

## 🌐 1. Despliegue Web (Firebase Hosting)

Para subir los últimos cambios a la web oficial de Kinetic Gym:

```bash
# 1. Generar la versión de producción
npm run build

# 2. Desplegar a Firebase Hosting
npx firebase deploy --only hosting
```

---

## 📱 2. Preparación Móvil (Android e iOS)

Antes de abrir las herramientas nativas, siempre sincroniza los cambios de la web:

```bash
# 1. Sincronizar activos y plugins (Actualiza las carpetas nativas)
npx cap sync
```

### 🤖 Android
Para generar el APK o Bundle de producción:
1. Abre Android Studio: `npx cap open android`.
2. Ve a **Build > Generate Signed Bundle / APK**.
3. Sigue los pasos para firmar la app.

### 🍎 iOS (iPhone)
Para subir a la App Store / TestFlight:
1. Abre Xcode: `npx cap open ios`.
2. Asegúrate de tener seleccionado **Any iOS Device (arm64)** como target.
3. Ve a **Product > Archive**.
4. Una vez terminado, usa el **Distribute App** en el Organizer.

---

## 🛠️ Comandos de Desarrollo Rápidos

- **Ver logs de Android**: `npx cap run android` (con dispositivo conectado).
- **Ver logs de iOS**: `npx cap run ios` (con dispositivo conectado).
- **Limpiar cache**: `npm run clean`.

> [!TIP]
> Recuerda siempre ejecutar `npm run build` antes de `npx cap sync` para que los cambios en el código React se reflejen en la app móvil.
