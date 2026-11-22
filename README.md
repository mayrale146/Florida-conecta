# Florida Conecta

Aplicación comunitaria basada en el prototipo entregado: mercado local, emprendimientos, eventos y alertas de Florida, Valle del Cauca. Interfaz React adaptable a móvil, tableta y escritorio; API Node.js con Express y datos persistentes en SQLite.

## Ejecutar

Requiere Node.js **22.22 o superior** y npm. SQLite viene incluido en Node; en Node 22 puede aparecer una advertencia experimental del módulo `node:sqlite`.

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:5173. La API escucha en http://127.0.0.1:3001. Vite redirige `/api` y `/uploads` al servidor.

Para probar la compilación completa y la PWA:

```sh
npm run build
npm start
```

Abrir http://127.0.0.1:3001. No ejecutar ambos servidores de API al mismo tiempo. `Ctrl+C` detiene los procesos. La base de datos se crea automáticamente en `data/florida.sqlite`; las fotos subidas se guardan en `data/uploads`. Ambos persisten al reiniciar y están excluidos del control de versiones.

## Recorrer la aplicación

El catálogo es público. En **Mi perfil → Iniciar sesión → cuentas de demostración** están disponibles estas cuentas ficticias. Todas usan la contraseña `Florida2026!`.

| Rol            | Correo              | Funciones                                                       |
| -------------- | ------------------- | --------------------------------------------------------------- |
| Vendedor       | mayra@florida.demo  | Publicar, editar, eliminar, ajustar stock y responder preguntas |
| Comprador      | vecino@florida.demo | Explorar, guardar favoritos, preguntar y publicar eventos       |
| Administración | admin@florida.demo  | Gestionar categorías, usuarios, contenido y avisos              |

Los teléfonos son ficticios; los enlaces de WhatsApp y llamada se construyen con el teléfono público del vendedor. Antes de usar contactos reales, actualizar el perfil. Las ventas se acuerdan directamente con el emprendedor; el prototipo no define carrito ni procesamiento de pagos.

## Funciones

- Inicio con categorías, publicaciones destacadas, próximo evento y aviso reciente.
- Catálogo con búsqueda, categoría, disponibilidad, precio máximo, orden y favoritos locales.
- Producto con fotografía, precio COP, existencias, descripción, negocio, WhatsApp, llamada y preguntas.
- Perfil del emprendimiento y sus publicaciones.
- Registro con consentimiento y rol comprador/vendedor; inicio y cierre de sesión.
- Gestión de publicaciones, fotografía JPG/PNG/WebP hasta 5 MB, borrador local, edición y eliminación con confirmación.
- Inventario: 0 unidades muestra el estado agotado automáticamente.
- Eventos por mes, creación y descarga al calendario en formato `.ics`.
- Alertas por categoría; publicación y moderación reservadas a administración.
- Perfil editable con controles independientes para teléfono y sector públicos.
- Administración de categorías, activación/desactivación de usuarios y eliminación de contenido.
- PWA con manifiesto, icono y caché versionada del código y fotografías incluidas. El catálogo público se guarda en el dispositivo tras cargarlo. Sin red se puede leer esa copia; publicar y modificar requiere conexión. Las imágenes subidas se guardan para uso sin conexión al visualizarlas. Los datos de sesión no se almacenan en localStorage ni en el service worker.

La instalación de la PWA depende del navegador y requiere HTTPS fuera de localhost. El service worker solo se registra en la compilación de producción. Las fuentes usan Google Fonts con alternativas del sistema si no hay conexión.

## Organización

```text
apps/
  web/src/
    App.jsx                  Composición, navegación y estado de la aplicación
    api.js                   Cliente HTTP y copia pública local
    features/
      auth/                  Acceso y registro
      catalog/               Productos, negocio y formulario
      community/             Eventos y avisos
      account/               Perfil e inventario
      admin/                 Administración
    shared/                  Componentes y formatos reutilizables
    styles.css               Diseño adaptable y estados de interacción
  api/src/
    domain/                  Validación y errores independientes del framework
    application/             Casos de uso y políticas de acceso a productos
    infrastructure/          SQLite, repositorio y criptografía
    interfaces/              Adaptador HTTP, validación de archivos y rutas
    server.js                Composición de dependencias y ciclo de vida
```

Los casos de uso reciben repositorio y seguridad mediante inyección de dependencias; no importan Express ni SQLite. La interfaz de React no consulta directamente la base de datos. El SQL se mantiene en el adaptador de persistencia y las consultas de los controladores HTTP. Los contratos de la aplicación están separados de las implementaciones concretas.

### Por qué SQLite

La información es relacional: usuarios, negocios, categorías, publicaciones, preguntas, eventos y sesiones. SQLite permite restricciones, transacciones y persistencia local con una instalación sencilla. Se usan claves foráneas y WAL. Es apropiado para una primera instalación de una comunidad en un único servidor con disco persistente. Para múltiples instancias o una carga alta de escrituras, migrar el adaptador a PostgreSQL; no alojar este archivo en almacenamiento efímero.

### Seguridad implementada

Contraseñas con scrypt y sal individual; tokens aleatorios guardados como SHA-256; cookies HttpOnly y SameSite Strict; expiración de sesiones; límite de intentos en autenticación; Helmet y CSP; consultas parametrizadas; roles y propiedad verificados en el servidor; rechazo de solicitudes de escritura cross-site; límites y firma binaria para archivos; privacidad aplicada a las respuestas públicas.

## Verificación

```sh
npm run check
```

Compila React y ejecuta pruebas con base SQLite en memoria. Las pruebas comprueban registro, consentimiento, sesiones, expiración, privacidad, roles, propiedad, validación, claves foráneas y los flujos HTTP de inventario, preguntas y cierre de sesión. Los tests HTTP requieren permiso de sockets de loopback en entornos restringidos.

## Configuración y publicación

Copiar `.env.example` a `.env` para personalizar puerto, host, base de datos y cookies. Este proyecto se entrega como instalación local. Para operar con usuarios reales: usar HTTPS y `COOKIE_SECURE=true`, configurar `SEED_DEMO=false` en una base nueva, crear una cuenta administrativa con un procedimiento privado, sustituir las cuentas y teléfonos de muestra y definir la política real de tratamiento de datos y el canal de soporte. Hacer copias de seguridad coherentes con SQLite (API de backup o servidor detenido) junto con `data/uploads`.

No se incluyen un proveedor de correo para recuperación de contraseña, notificaciones push, alojamiento ni pasarela de pagos. Las fotos de terceros son ilustrativas de demostración; sus fuentes se registran en [docs/imagenes.md](docs/imagenes.md). Sustituirlas por fotografías propias o con licencia confirmada antes de una publicación comercial.
