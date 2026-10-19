# laKasa — Villalbilla Homes (Maqueta 3D & Recorrido Virtual)

Aplicación web interactiva 3D y simulador arquitectónico fotorrealista de alta fidelidad desarrollado para la promoción **Villalbilla Homes** (Vivienda unifamiliar pareada VPPL en parcela de $7.00 \times 16.00\text{ m}$).

🌐 **Hosting en vivo:**
* [https://mercury-lakasa.web.app](https://mercury-lakasa.web.app)
* [https://lakasa-homes.web.app](https://lakasa-homes.web.app)

---

## 🏛️ Características del Proyecto Arquitectónico

* **Superficie Construida:** $147.95\text{ m²}$ útiles distribuidos en 3 plantas:
  * **Planta Baja ($62.50\text{ m²}$):** Entrada independiente ($11.42\text{ m²}$), armario de cortesía ($1.46\text{ m²}$), aseo/lavadero, cocina cerrada independiente ($8.69\text{ m²}$) con acceso directo al salón mediante puerta batiente, salón-comedor diáfano ($20.18\text{ m²}$) y gran ventanal corredero de $4.40\text{ m}$ al jardín posterior ($36.08\text{ m²}$).
  * **Planta Primera / Piso 2 ($62.50\text{ m²}$):** Distribuidor central, Master Suite principal ($14.30\text{ m²}$) con baño en suite ($5.22\text{ m²}$) y salida directa mediante puertavidriera corredera a terraza privada ($5.70\text{ m²}$), dos dormitorios dobles ($9.31\text{ m²}$ y $8.94\text{ m²}$) con panelado exterior de lamas de roble y ventanas climalit, y segundo baño completo ($3.96\text{ m²}$).
  * **Planta Buhardilla ($22.95\text{ m²}$):** Espacio polivalente diáfano bajo cubierta a 30° con vigas vistas de madera noble, zona de teletrabajo/despacho, biblioteca y claraboyas Velux.
* **Aparcamiento Delantero:** Pérgola arquitectónica bioclimática en voladizo, cancelas independientes (peatonal $1.05\text{ m}$ y vehículos $3.15\text{ m}$ con apertura batiente hacia adentro), y espacio optimizado para dos vehículos (SUV y motocicleta).
* **Vehículos Fotorrealistas Incluidos:**
  * Kia Sportage 2025 (Opposites United, ópticas DRL boomerang, techo solar panorámico, pinzas Brembo).
  * KTM 1290 Super Adventure S 2024 (chasis multitubular naranja, escape Akrapovič, maletas laterales de aluminio).

---

## 🚀 Tecnologías & Motor 3D

* **Three.js (WebGL2):** Motor 3D con sombreado PBR, texturas procedurales dinámicas sin dependencias externas (madera de roble, parquet, adoquín, piedra y pizarra).
* **Renderizado & Sombras:**
  * `THREE.PCFShadowMap` para sombras arquitectónicas nítidas, limpias y libres de dithering o ruido estocástico ("lluvia").
  * Buffer logarítmico de profundidad (`logarithmicDepthBuffer: true`) para prevenir Z-fighting y parpadeos en aristas.
  * Geometría pentagonal continua para testeros de cubierta que garantizan un cierre hermético sin penetración en el tejado.
* **Animaciones:** GSAP (GreenSock) para transiciones fluidas de cámara y vistas seccionales estratificadas (*exploded view*).
* **Despliegue:** Firebase Hosting con política de no-caché para despliegues instantáneos.

---

## 💻 Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/EduRestrepo/laKasa.git
   cd laKasa
   ```

2. Inicia un servidor web estático local:
   ```bash
   python -m http.server 8080
   ```

3. Abre en tu navegador `http://localhost:8080/`.

---

## 📦 Estructura del Repositorio

```
laKasa/
├── index.html            # Estructura principal y controles de usuario
├── style.css             # Estilos de diseño HUD moderno y responsive
├── house3d.js            # Motor 3D arquitectónico Three.js
├── app.js                # Lógica de interfaz, recorrido guiado y eventos
├── firebase.json         # Configuración multi-sitio de Firebase Hosting
├── .firebaserc           # Mapeo de entornos y proyectos Firebase
├── extracted_pages/      # Renders y planos técnicos del dossier
└── zzz/                  # Documentación PDF y planos originales
```
