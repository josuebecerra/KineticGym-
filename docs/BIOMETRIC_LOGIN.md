# Plan de Integración: Login por Huella Dactilar (USB)

Este documento detalla la estrategia técnica para implementar el inicio de sesión con lector de huella USB en la versión Web de Kinetic Gym.

## 1. Visión General
El objetivo es permitir que los administradores o entrenadores inicien sesión en la PC de recepción simplemente colocando su dedo en un lector USB compatible, sin necesidad de escribir correos o contraseñas.

## 2. Requerimientos de Hardware
*   **Lector de Huella:** Cualquier lector USB compatible con **Windows Hello** o **FIDO2**.
*   **Navegador:** Chrome, Edge o Safari (versiones actuales).

## 3. Arquitectura Técnica
Utilizaremos el estándar de la industria **WebAuthn (Passkeys)**.

### Flujo de Registro (Configuración inicial)
1.  El usuario inicia sesión normalmente con Email/Contraseña.
2.  En el apartado de "Ajustes de Seguridad", hace clic en **"Vincular Huella Dactilar"**.
3.  La aplicación usa `navigator.credentials.create()` para solicitar un desafío biométrico.
4.  El usuario toca el lector USB.
5.  Se genera una llave pública que se guarda en la colección `users/{uid}/credentials` de Firestore.

### Flujo de Login (Uso diario)
1.  En la pantalla de Login, aparece un botón: **"Entrar con Huella"**.
2.  Al presionarlo, se activa `navigator.credentials.get()`.
3.  El navegador solicita la huella al lector USB.
4.  La firma digital se envía a una **Firebase Cloud Function** para validar la identidad.
5.  Si es correcta, la función genera un `CustomToken` de Firebase para iniciar la sesión.

## 4. Pasos para la Implementación (Tareas Futuras)
- [ ] **Fase 1: Preparación**
    - Actualizar a Firebase Blaze Plan (requerido para Cloud Functions).
    - Instalar `firebase-admin` y librerías de validación WebAuthn (`@simplewebauthn/server`).
- [ ] **Fase 2: Backend**
    - Crear Cloud Function `generateRegistrationOptions`.
    - Crear Cloud Function `verifyRegistration`.
    - Crear Cloud Function `verifyAuthentication`.
- [ ] **Fase 3: Frontend**
    - Crear componente `BiometricManager` en Ajustes.
    - Actualizar componente `Login` para incluir el botón de acceso biométrico.

## 5. Notas de Seguridad
*   La huella dactilar **NUNCA** viaja por internet ni se guarda en nuestros servidores. Solo se guarda una "llave matemática" (Hash) imposible de revertir.
*   El lector USB debe estar configurado previamente en Windows/macOS como método de acceso.

---
*Guardado por Antigravity para ejecución futura.*
