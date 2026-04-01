# 🛡️ Análisis de Seguridad y Vulnerabilidades: Kinetic Gym

A continuación se detalla un análisis profundo de la estructura actual de la plataforma y su interacción con los servicios de la nube (Firebase). El informe destaca las vulnerabilidades presentes o potenciales y las estrategias de mitigación recomendadas.

## 1. Reglas de Seguridad de Firestore (Crítico)

> [!CAUTION]
> Actualmente la aplicación interactúa con Firestore directamente desde el cliente (navegador) a través de `services/db.ts`. Si las reglas de seguridad de Firestore en la consola de Firebase están en modo "prueba" (abiertas al público), **cualquier persona** podría leer, modificar o eliminar los datos de entrenamiento y progreso de *todos* los usuarios.

**Problema:**
La aplicación asume que solo el usuario autenticado modificará su documento en `users/{uid}`. Sin embargo, un atacante malicioso podría interceptar la conexión y sobrescribir el ID de usuario si las reglas de la base de datos lo permiten.

**Solución Inmediata:**
Debes configurar las Reglas de Firestore para garantizar que los usuarios **solo puedan leer y escribir en su propio documento**. En tu consola de Firebase (Firestore Database > Rules), el código debe lucir así:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Solo el dueño del documento puede leerlo o escribir en él
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Límite de Tamaño de Documentos (Almacenamiento de Fotos en Base64)

> [!WARNING]
> En la sección de "Progreso", las fotos subidas por el usuario se están convirtiendo a texto `Base64` y guardadas directamente dentro del documento del usuario en Firestore.

**Problema:**
Firestore tiene un **límite máximo estricto de 1 MB por documento**. Convertir una sola fotografía moderna tomada con un celular moderno a Base64 puede pesar entre 3 MB y 5 MB. 
Si el usuario sube una sola foto grande, la aplicación fallará al guardar el progreso y la funcionalidad quedará permanentemente inhabilitada para ese usuario debido a la restricción de tamaño.

**Solución Recomendada:**
1. Habilitar **Firebase Storage** para guardar archivos.
2. Modificar la función subir foto para guardar el archivo (`File`) en Storage, obtener la "URL de Descarga" pública, y guardar únicamente esa URL de texto (que pesa unos cuantos bytes) en Firestore.
3. Asegurar Storage con sus propias reglas para que solo usuarios autenticados suban imágenes.

## 3. Exposición de Claves API en el Cliente (`.env`)

> [!NOTE]
> Es completamente normal que las variables `VITE_FIREBASE_API_KEY` o `VITE_FIREBASE_PROJECT_ID` sean públicas en una aplicación de React/Vite. Firebase está diseñado para funcionar con llaves públicas en el frontend.

**Problema:**
A pesar de ser público, si no restringes tu `API_KEY` en la consola de Google Cloud, cualquier persona podría tomar esas llaves publicadas en tu código fuente y montar un clon de tu aplicación en su propio dominio, o lanzar ataques DDoS masivos desde otras IPs consumiendo tu capa gratuita ("Billing Abuse").

**Solución Recomendada:**
1. Ve a **Google Cloud Console** > APIs & Services > Credentials.
2. Localiza tu API Key de Firebase.
3. Añade una **"Restricción de Sitio Web (HTTP referrer)"** y permite únicamente tu dominio oficial: `https://kinetic-647bb.web.app/*` y `localhost:*` (para tu desarrollo).
4. Activar **Firebase App Check** (recomendable a largo plazo) usando reCAPTCHA Enterprise. Esto asegura que solo peticiones provenientes de un navegador real usando tu aplicación web legítima puedan comunicarse con Firestore.

## 4. Validación de Integridad de Datos Cliente-Servidor

> [!TIP]
> Actualmente confías ciegamente en que la estructura de la rutina o log de progreso que manda el cliente es válida.

**Problema:**
Dado que TypeScript solo existe en tu computadora y desaparece cuando la página compila a Javascript estándar, si un usuario manipula el código de la página, podría intentar enviar un Objeto JSON malformado a Firestore (por ejemplo, guardar texto en el campo `weight` o enviar un número negativo de repeticiones).

**Solución Recomendada:**
Además de restringir los permisos por usuario (`request.auth.uid == userId`), las reglas avanzadas de Firestore permiten validar la forma de la data. Por ejemplo:
```javascript
allow write: if request.resource.data.weight is number 
             && request.resource.data.weight > 0;
```
Esto actúa como tu muro final de defensa, rechazando de tajo cualquier inyección de información sin sentido a tu base de datos.
