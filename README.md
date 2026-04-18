# Calculador Técnico de Carpintería

Esta es una herramienta especializada para carpintería de aluminio, diseñada para convertir medidas de huecos (vano) en listas de corte precisas para ventanas correderas.

## Características

-   **Precisión de 1/16"**: Cálculos exactos basados en estándares técnicos.
-   **Interfaz Minimalista**: Diseño limpio y profesional optimizado para la producción.
-   **Lista de Corte Detallada**: Desglose automático para Marcos, Hojas y Cristales.
-   **Valores Predeterminados**: Incluye deducciones estándar para ensamblaje y traslape.

## Instalación y Desarrollo Local

Para ejecutar este proyecto en tu propia máquina:

1.  Clona el repositorio.
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
4.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel

Este proyecto está listo para ser desplegado en Vercel como una **Vite Single Page Application (SPA)**.

1.  Conecta tu repositorio de GitHub a Vercel.
2.  Vercel detectará automáticamente la configuración de Vite.
3.  Asegúrate de que el comando de construcción sea `npm run build` y el directorio de salida sea `dist`.
4.  ¡Despliega!

## Tecnologías Utilizadas

-   **React 19**
-   **Vite**
-   **Tailwind CSS** (v4)
-   **Lucide React** (Iconos)
-   **Frammer Motion** (Animaciones)

## Lógica de Cálculo

El sistema aplica las siguientes reglas:
-   **Marco Exterior**: Descuento de 7/8" en el ancho para ensamblaje.
-   **Hojas**: Descuento de 1 3/4" en altura y cálculo de ancho basado en traslape de 1 1/8".
-   **Vidrios**: Descuento perimetral de 2 1/4" respecto a la medida de la hoja.
