# Activar el acceso de usuarios

La web ya incluye registro, inicio de sesión y protección de perfiles. Antes de publicarla, completa esta configuración en Firebase.

1. En **Firebase Authentication > Sign-in method**, activa **Correo electrónico/contraseña** y **Google**.
2. En **Authentication > Settings > Authorized domains**, añade el dominio de GitHub Pages, por ejemplo: `tuusuario.github.io`.
3. En **Realtime Database > Rules**, sustituye las reglas por el contenido de `firebase-rules.json` y pulsa **Publicar**.

`diegoasti13@gmail.com` está configurado como administrador. Esta cuenta puede editar o borrar cualquier perfil y sus shinies. Cada otra cuenta únicamente puede crear y modificar su propio perfil, identificado por su UID de Firebase. Los datos de Showcase también exigen una sesión iniciada para leerse.

Las cuentas anteriores de la base de datos se muestran como perfiles heredados. El administrador puede gestionarlas; los usuarios no pueden reclamar esos perfiles automáticamente.
