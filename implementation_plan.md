# ⚙️ Plan de Implementación: Módulo de Entrenadores y Configuraciones de Perfil

Este plan cubrirá la creación de ambos sistemas solicitados: la personalización de usuario (avatares, nombres, opciones) y el sistema avanzado de gestión de rutinas por parte de entrenadores.

## User Review Required

> [!WARNING]
> Este cambio es masivo e involucra actualizar la estructura de la base de datos (Firestore) y las reglas de seguridad. El sistema ahora distinguirá entre usuarios normales ("Trainees") y entrenadores ("Trainers/Admins"). Inicialmente tu cuenta será Trainee, y **tendré que asignarte manualmente el rol de Admin** en la base de datos para que puedas probar el panel de entrenador.

## Proposed Changes

---

### Fase 1: Perfiles de Usuario y Ajustes (Settings)

Actualizaremos el modelo de datos para que cada usuario tenga una identidad real en la app y no solo un correo.

#### [MODIFY] `src/types.ts`
- Se actualizarán las interfaces para incluir el perfil extendido: avatar, nombre, configuraciones (sonido) y el `rol` de acceso.

#### [MODIFY] `src/services/db.ts`
- Se modificará `initializeUser` para que, al entrar por primera vez, el usuario reciba la estructura base de su perfil con el rol `trainee`.
- Se añadirán funciones para guardar ajustes de cuenta (`updateUserProfile`) y subir la foto de perfil al Storage.

#### [NEW] `src/components/Settings.tsx`
- Una nueva pantalla de preferencias donde el usuario podrá subir su avatar (usando Firebase Storage, como hicimos con las fotos de progreso), cambiar su nombre para mostrarlo en el sistema, y activar/desactivar opciones auditivas.

#### [MODIFY] `src/components/Layout.tsx` & `src/App.tsx`
- En la barra superior, donde hoy solo se ve el correo, se añadirá la foto de avatar circular y un botón con ícono de engranaje (⚙️) que lleve a esta nueva pantalla de Ajustes.

---

### Fase 2: Módulo Avanzado de Entrenadores

Crearemos la central de comando para los entrenadores.

#### [NEW] `src/components/TrainerDashboard.tsx`
- Una pantalla exclusiva para roles "Admin" o "Trainer". 
- Mostrará una lista de todos los alumnos registrados en el gimnasio.
- Permitirá hacer clic en un alumno y **asignarle una rutina personalizada** (seleccionada desde el catálogo maestro o creada a medida).

#### [MODIFY] `src/components/Home.tsx`
- El Inicio del alumno se dividirá en dos zonas: 
  1. **"Tus Pautas Asignadas"** (rutinas mandadas directamente por el entrenador).
  2. **"Catálogo Libre"** (las básicas que ya existen hoy en día).

#### [MODIFY] `firestore.rules` (file:///c:/Users/josue/Desktop/Nueva%20carpeta/GYM/kinetic/firestore.rules)
- Actualizaremos las defensas de seguridad de Google. Actualmente nadie puede ver los datos de nadie. Le enseñaremos a Firebase a reconocer a los Entrenadores (`isTrainer()`) para que ellos **sí puedan leer y escribir en los perfiles de los demás alumnos**.

---

## Verification Plan

### Manual Verification
1. Entraremos a la sección de Ajustes, subiremos tu avatar y cambiaremos tu nombre.
2. Iré a tu consola de Firebase (o lo haré yo por código) y forzaré que tu `rol` sea `admin`.
3. Verificaremos que te aparezca mágicamente la pestaña "Entrenadores", donde podrás asignarte a ti mismo una rutina forzada y verla aparecer en el inicio.
