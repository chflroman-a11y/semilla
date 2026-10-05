# Semilla

Caja de ahorro comunitaria que nace en un pueblo y se abre en el siguiente.

Prototipo web. No es una institución autorizada: en México, captar ahorro del público exige figura legal (SOCAP, SOFIPO o caja acompañada).

## Cómo abrirla

No necesita instalación. Abre `index.html` en el navegador, o publica el repo con GitHub Pages.

En la primera pantalla puedes abrir tu caja o entrar a la demo de San Lucas, Puebla.

## Estructura

- `index.html` — pantallas
- `css/app.css` — estilo
- `js/store.js` — reglas de ahorro, préstamo, asamblea y siembra
- `js/ui.js` — interfaz
- `js/main.js` — arranque

## Reglas

- El 20% de cada ahorro entra al fondo común.
- Un préstamo lo aprueba la asamblea y sale del fondo.
- Un pueblo nuevo se siembra si el origen junta 8 socios y $15,000, y la asamblea suelta $3,500.
- Los datos quedan en el navegador (`semilla-caja-v1`).
