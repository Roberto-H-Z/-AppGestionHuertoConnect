¡Hola! Con base en el código fuente de la aplicación, aquí tienes una explicación detallada de cómo es el flujo de la app, cómo se comunica con el backend y las URLs que utiliza, haciendo especial énfasis en los procesos de Registro (Register) y de Inicio de Sesión (Login).

1. URLs base para las peticiones (Backend)
La configuración de los "endpoints" se encuentra centralizada en el archivo 

environment.ts
. La aplicación detecta automáticamente la plataforma y asigna la URL base correspondiente:

Si se ejecuta en Web: Usa http://localhost:8000/api
Si se ejecuta en Móvil: Usa https://11v8700r-8000.usw3.devtunnels.ms/api (probablemente de un túnel para pruebas locales).
A esta URL base se le añaden los sufijos de los microservicios/módulos, como por ejemplo:

Autenticación: /api/auth
Huertos: /api/huertos
Plagas: /api/plagas
2. ¿Cómo se comunica con el Backend?
La aplicación utiliza la librería Axios para las peticiones HTTP y cuenta con una configuración global en el cliente 

apiClient.ts
.

Intercepción de Peticiones: Cada vez que la app envía una petición al backend, un interceptor obtiene automáticamente el Token JWT (JSON Web Token) desde el almacenamiento local y lo inyecta en las cabeceras (Authorization: Bearer <token>).
Intercepción de Errores: Si el backend responde con un error 401 Unauthorized (sesión expirada o token inválido), el cliente lo detecta globalmente, borra el token guardado del dispositivo y prepara a la app para redirigir al usuario de vuelta a la pantalla de Login.
3. Flujo de Login y Registro (Sistema de OTP)
El sistema de autenticación de tu app no devuelve un token inmediatamente con el correo y contraseña. Implementa un flujo de dos pasos basado en "Desafíos" o códigos OTP (One-Time Password) manejados por el 

authService.ts
.

Flujo de Registro (Register)
El usuario introduce sus datos (nombre, apellidos, email, password) en la pantalla de registro.
La app envía una petición POST /auth/register al backend.
El backend NO inicia sesión al instante. En su lugar, manda un correo/SMS al usuario con un código temporal y devuelve a la app un objeto llamado ChallengeResponse, el cual contiene un challengeId.
La app redirige al usuario a la pantalla de verificación OTP.
El usuario ingresa el código numérico recibido. La app lo envía junto con el challengeId a la ruta POST /auth/verify-otp.
Si el código es correcto, el backend devuelve el token de sesión definitivo (JWT) y el userId.
Flujo de Inicio de Sesión (Login)
El usuario introduce su email y password en el Login.
Se envía un POST /auth/login.
Al igual que el registro, esto parece generar un desafío y retorna un challengeId (es decir, cada inicio de sesión envía un código OTP como método de 2FA o validación).
El usuario inserta el código OTP recibido en la pantalla de verificación.
La app realiza un POST /auth/verify-otp. Si es correcto, el servidor regresa el Token de acceso JWT.
4. Inicialización de la Sesión (AuthContext)
Una vez que el usuario completó con éxito el Login o el Registro y la app obtuvo el token JWT en el paso final, entra en juego el 

AuthContext.tsx
:

signIn(): La función recibe el token recién generado, lo guarda de manera persistente en el dispositivo (tokenStorage) e inmediatamente realiza una petición extra ( GET /auth/session ) para obtener todos los detalles del perfil del usuario (nombre, rol, estado activo).
Se actualiza el estado global de la app, estableciendo isAuthenticated: true.
El enrutador principal de la app reacciona a este cambio y automáticamente desaparece las pantallas de autenticación (Login/Register) para mostrar el panel principal de la aplicación (Menú, Huertos, etc.).