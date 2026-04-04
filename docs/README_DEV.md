# Guía de Inicio para Desarrolladores: Kinetic 🛠️

Este documento es una guía rápida para empezar a trabajar en el proyecto Kinetic Gym.

## 1. Comandos de Terminal 💻

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local (Vite). |
| `npm run build` | Compila la aplicación para producción (Directorio `dist`). |
| `firebase deploy` | Despliega los cambios a la web y actualiza las reglas de seguridad. |
| `firebase login` | Inicia sesión en la cuenta de Firebase vinculada. |

## 2. Configuración de Entorno (Environment Variables) 🔑

El archivo `.env` debe contener las siguientes claves de Firebase para que la app conecte con la base de datos:
* `VITE_FIREBASE_API_KEY`
* `VITE_FIREBASE_AUTH_DOMAIN`
* `VITE_FIREBASE_PROJECT_ID`
* `VITE_FIREBASE_STORAGE_BUCKET`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`
* `VITE_FIREBASE_APP_ID`

---

## 3. Mejores Prácticas del Proyecto 📜

1. **Estado Centralizado**: Solo modifica el estado global en `App.tsx` para evitar que las pantallas se desfasen.
2. **Estilos**: Usa las variables CSS definidas en `index.css` (ej. `var(--color-primary-container)`). No crees colores "al vuelo" en el CSS de los componentes.
3. **Tipos**: Siempre que añadas un campo a la base de datos, agrégalo primero en `src/types.ts`.
4. **Fechas**: Usa exclusivamente `src/utils/date.ts` para mostrar o guardar fechas.

---

## 4. Contacto y Mantenimiento 📞

* **Autor**: Antigravity AI
* **Versión**: 3.5 (Arquitectura Optimizada)
* **Status**: Estable / Producción
