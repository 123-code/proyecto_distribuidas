# Proyecto de Aplicación Distribuida

Este proyecto es una aplicación distribuida que consta de varios servicios (módulo de IA, metodologías de estudio, gestor de contenido y frontend) orquestados con Docker Compose y expuestos a través de Nginx.

## Estructura del Proyecto

```
.
├── docker-compose.yml
├── nginx.conf
├── ai_module/
│   ├── Dockerfile
│   └── main.py
├── aplicacion-aprendizaje/ (Contiene el código fuente original de los módulos)
│   ├── ai_module/
│   │   └── requirements.txt
│   ├── backend/
│   │   ├── index.ts
│   │   ├── package-lock.json
│   │   └── package.json
│   ├── content_manager/
│   │   ├── package-lock.json
│   │   └── package.json
│   ├── frontend/
│   │   ├── package-lock.json
│   │   └── package.json
│   └── study_methodologies/
│       ├── package-lock.json
│       └── package.json
├── backend/ (Servicio de backend)
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── content_manager/ (Servicio de gestor de contenido)
│   ├── Dockerfile
│   ├── index.ts
│   └── tsconfig.json
├── frontend/ (Aplicación frontend Next.js)
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── perfil/
│   │   │       └── page.tsx
│   │   └── components/
│   │       ├── Dashboard.tsx
│   │       ├── Login.tsx
│   │       ├── Perfil.tsx
│   │       └── __tests__/
│   │           └── Login.test.tsx
│   └── tailwind.config.js
└── study_methodologies/ (Servicio de metodologías de estudio)
    ├── Dockerfile
    ├── index.ts
    └── tsconfig.json
```

## Cómo Ejecutar el Proyecto

Sigue estos pasos para poner en marcha la aplicación en tu máquina.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

*   **Docker:** [Instrucciones de instalación de Docker](https://docs.docker.com/get-docker/)
*   **Docker Compose:** Generalmente viene incluido con las instalaciones de Docker Desktop.

### Pasos

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/123-code/validaci-n-proyecto.git
    cd validaci-n-proyecto
    ```

2.  **Preparar Archivos para Docker:**
    Los `package.json`, `package-lock.json` y `requirements.txt` están en subdirectorios dentro de `aplicacion-aprendizaje/`. Para que Docker pueda encontrarlos durante la construcción, necesitamos copiarlos a los directorios raíz de cada servicio.

    ```bash
    cp aplicacion-aprendizaje/ai_module/requirements.txt ai_module/
    cp aplicacion-aprendizaje/study_methodologies/package*.json study_methodologies/
    cp aplicacion-aprendizaje/content_manager/package*.json content_manager/
    cp aplicacion-aprendizaje/backend/package*.json backend/
    ```

3.  **Construir y Ejecutar los Contenedores Docker:**
    Este comando construirá las imágenes de Docker para cada servicio y los iniciará en segundo plano.

    ```bash
    docker-compose up -d --build
    ```

    **Nota:** Si encuentras un error relacionado con el puerto 5000 ya en uso (común en macOS debido a AirPlay Receiver), deberás deshabilitar el "AirPlay Receiver" en la configuración de tu sistema (Preferencias del Sistema > Compartir en macOS Monterey o Ajustes del Sistema > General > AirDrop y Handoff en macOS Ventura/Sonoma).

4.  **Acceder a la Aplicación:**
    Una vez que todos los servicios estén en funcionamiento, puedes acceder a la aplicación frontend a través de tu navegador web:

    ```
    http://localhost
    ```

5.  **Crear una Cuenta:**
    Dado que no hay credenciales predeterminadas, deberás registrar una nueva cuenta. Navega a:

    ```
    http://localhost/register
    ```
    Completa el formulario de registro para crear tu usuario.

6.  **Iniciar Sesión:**
    Después de registrarte, puedes iniciar sesión con las credenciales que acabas de crear en la página de inicio de sesión:

    ```
    http://localhost/login
    ```

¡Eso es todo! La aplicación debería estar funcionando y lista para usar.
