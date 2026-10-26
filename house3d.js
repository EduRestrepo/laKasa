/* ========================================================
   VILLALBILLA HOMES - HIGH-END PHOTOREALISTIC 3D ENGINE
   Three.js Architectural Engine with PBR Procedural Textures,
   Realistic Sculpted Vehicles (Kia Sportage 2025 & KTM 1290 S 2024),
   Ambient Occlusion, Soft Shadows, Architectural Lighting & Landscaping
   ======================================================== */

window.House3D = (function() {
    let scene, camera, renderer, controls;
    let houseGroup, groundFloorGroup, firstFloorGroup, atticGroup, roofGroup;
    let vehiclesGroup, exteriorGroup, dimensionMarkersGroup;
    let neighborHouses = [], neighborhoodGroup = null;
    let areNeighborsVisible = true;
    let sunLight, ambientLight, fillLight, hemiLight;
    let interiorLights = [];
    let isRoofVisible = true;
    let areVehiclesVisible = true;
    let showDimensions = true;
    let currentSunMode = 'day';
    let tourTimeline = null;
    let isTourRunning = false;
    let kiaMesh = null;
    let ktmMesh = null;
    let vehiclesSwapped = true; // Default: KTM on Left, Kia on Right (Swapped)

    let materials = {};
    let textures = {};

    /* ----------------------------------------------------
       PROCEDURAL PBR TEXTURE GENERATORS (HTML5 CANVAS)
       Provides realistic high-res textures with 0 external dependencies
       ---------------------------------------------------- */
    function generateTextures() {
        // 1. Wood Slat Facade Texture (Vertical Oak Louvers)
        const canvasWood = document.createElement("canvas");
        canvasWood.width = 512;
        canvasWood.height = 512;
        const ctxW = canvasWood.getContext("2d");
        ctxW.fillStyle = "#a87948";
        ctxW.fillRect(0, 0, 512, 512);
        // Draw individual vertical slats
        const slatW = 32;
        for (let x = 0; x < 512; x += slatW) {
            const grad = ctxW.createLinearGradient(x, 0, x + slatW, 0);
            grad.addColorStop(0, "#8a5e33");
            grad.addColorStop(0.15, "#c1925b");
            grad.addColorStop(0.85, "#b58752");
            grad.addColorStop(1, "#66421e");
            ctxW.fillStyle = grad;
            ctxW.fillRect(x + 2, 0, slatW - 4, 512);

            // Fine wood grain lines
            ctxW.fillStyle = "rgba(0,0,0,0.06)";
            for (let i = 0; i < 4; i++) {
                ctxW.fillRect(x + 4 + i * 6, 0, 1.5, 512);
            }
            // Slat shadow gap
            ctxW.fillStyle = "#261a0f";
            ctxW.fillRect(x + slatW - 2, 0, 2, 512);
        }
        textures.woodSlats = new THREE.CanvasTexture(canvasWood);
        textures.woodSlats.wrapS = THREE.RepeatWrapping;
        textures.woodSlats.wrapT = THREE.RepeatWrapping;
        textures.woodSlats.repeat.set(2, 2);

        // 2. Interior Parquet Flooring (Light Oak Planks)
        const canvasParquet = document.createElement("canvas");
        canvasParquet.width = 512;
        canvasParquet.height = 512;
        const ctxP = canvasParquet.getContext("2d");
        ctxP.fillStyle = "#cbb292";
        ctxP.fillRect(0, 0, 512, 512);
        const plankH = 42;
        const plankW = 170;
        for (let y = 0; y < 512; y += plankH) {
            const rowOffset = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
            for (let x = -plankW; x < 512 + plankW; x += plankW) {
                const posX = x + rowOffset;
                const shadeVar = Math.sin(posX * 0.1 + y * 0.2) * 12;
                ctxP.fillStyle = `rgb(${195 + shadeVar}, ${170 + shadeVar}, ${135 + shadeVar})`;
                ctxP.fillRect(posX + 1, y + 1, plankW - 2, plankH - 2);

                // Subtle plank bevel lines
                ctxP.strokeStyle = "rgba(70, 50, 30, 0.25)";
                ctxP.lineWidth = 1;
                ctxP.strokeRect(posX + 1, y + 1, plankW - 2, plankH - 2);
            }
        }
        textures.parquet = new THREE.CanvasTexture(canvasParquet);
        textures.parquet.wrapS = THREE.RepeatWrapping;
        textures.parquet.wrapT = THREE.RepeatWrapping;
        textures.parquet.repeat.set(4, 5);

        // 3. Exterior Driveway Stone Paving Tiles
        const canvasPaving = document.createElement("canvas");
        canvasPaving.width = 512;
        canvasPaving.height = 512;
        const ctxPv = canvasPaving.getContext("2d");
        ctxPv.fillStyle = "#8a94a2";
        ctxPv.fillRect(0, 0, 512, 512);
        const tileSize = 64;
        for (let y = 0; y < 512; y += tileSize) {
            for (let x = 0; x < 512; x += tileSize) {
                const noise = (Math.random() - 0.5) * 18;
                ctxPv.fillStyle = `rgb(${160 + noise}, ${168 + noise}, ${176 + noise})`;
                ctxPv.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                // Joint mortar
                ctxPv.strokeStyle = "#5a626f";
                ctxPv.lineWidth = 2;
                ctxPv.strokeRect(x, y, tileSize, tileSize);
            }
        }
        textures.paving = new THREE.CanvasTexture(canvasPaving);
        textures.paving.wrapS = THREE.RepeatWrapping;
        textures.paving.wrapT = THREE.RepeatWrapping;
        textures.paving.repeat.set(6, 6);

        // 4. Spanish Slate Roof Tile Texture
        const canvasRoof = document.createElement("canvas");
        canvasRoof.width = 512;
        canvasRoof.height = 512;
        const ctxR = canvasRoof.getContext("2d");
        ctxR.fillStyle = "#27303f";
        ctxR.fillRect(0, 0, 512, 512);
        const tileW = 48;
        const tileH = 32;
        for (let y = 0; y < 512; y += tileH) {
            const shift = (y / tileH) % 2 === 0 ? 0 : tileW / 2;
            for (let x = -tileW; x < 512 + tileW; x += tileW) {
                const posX = x + shift;
                const gradR = ctxR.createLinearGradient(posX, y, posX, y + tileH);
                gradR.addColorStop(0, "#3e4c63");
                gradR.addColorStop(0.7, "#2c3647");
                gradR.addColorStop(1, "#1e2532");
                ctxR.fillStyle = gradR;
                ctxR.fillRect(posX + 1, y + 1, tileW - 2, tileH - 2);

                ctxR.strokeStyle = "#161b24";
                ctxR.lineWidth = 1.5;
                ctxR.strokeRect(posX, y, tileW, tileH);
            }
        }
        textures.roof = new THREE.CanvasTexture(canvasRoof);
        textures.roof.wrapS = THREE.RepeatWrapping;
        textures.roof.wrapT = THREE.RepeatWrapping;
        textures.roof.repeat.set(6, 8);

        // 5. Lush Garden Lawn Grass Texture
        const canvasGrass = document.createElement("canvas");
        canvasGrass.width = 512;
        canvasGrass.height = 512;
        const ctxG = canvasGrass.getContext("2d");
        ctxG.fillStyle = "#2e6930";
        ctxG.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 8000; i++) {
            const gx = Math.random() * 512;
            const gy = Math.random() * 512;
            ctxG.fillStyle = Math.random() > 0.5 ? "#428d45" : "#245527";
            ctxG.fillRect(gx, gy, 2, 4);
        }
        textures.grass = new THREE.CanvasTexture(canvasGrass);
        textures.grass.wrapS = THREE.RepeatWrapping;
        textures.grass.wrapT = THREE.RepeatWrapping;
        textures.grass.repeat.set(5, 5);

        // 6. Stucco Bump Map for White Facade
        const canvasBump = document.createElement("canvas");
        canvasBump.width = 256;
        canvasBump.height = 256;
        const ctxB = canvasBump.getContext("2d");
        ctxB.fillStyle = "#808080";
        ctxB.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 4000; i++) {
            const bx = Math.random() * 256;
            const by = Math.random() * 256;
            ctxB.fillStyle = Math.random() > 0.5 ? "#909090" : "#707070";
            ctxB.fillRect(bx, by, 1.5, 1.5);
        }
        textures.stuccoBump = new THREE.CanvasTexture(canvasBump);
        textures.stuccoBump.wrapS = THREE.RepeatWrapping;
        textures.stuccoBump.wrapT = THREE.RepeatWrapping;
        textures.stuccoBump.repeat.set(12, 8);

        // 7. Organic Rich Compost Soil Texture
        const canvasSoil = document.createElement("canvas");
        canvasSoil.width = 512;
        canvasSoil.height = 512;
        const ctxS = canvasSoil.getContext("2d");
        ctxS.fillStyle = "#20140c";
        ctxS.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 9000; i++) {
            const sx = Math.random() * 512;
            const sy = Math.random() * 512;
            const lum = 15 + Math.random() * 25;
            ctxS.fillStyle = `rgb(${lum + 10}, ${lum + 4}, ${lum})`;
            ctxS.beginPath();
            ctxS.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctxS.fill();
        }
        textures.soil = new THREE.CanvasTexture(canvasSoil);
        textures.soil.wrapS = THREE.RepeatWrapping;
        textures.soil.wrapT = THREE.RepeatWrapping;
        textures.soil.repeat.set(3, 3);

        // 8. Cedar Timber Planks for Raised Beds
        const canvasPlank = document.createElement("canvas");
        canvasPlank.width = 512;
        canvasPlank.height = 512;
        const ctxPl = canvasPlank.getContext("2d");
        ctxPl.fillStyle = "#7c4a27";
        ctxPl.fillRect(0, 0, 512, 512);
        const bH = 64;
        for (let y = 0; y < 512; y += bH) {
            const g = ctxPl.createLinearGradient(0, y, 0, y + bH);
            g.addColorStop(0, "#9a5d32");
            g.addColorStop(0.5, "#824c27");
            g.addColorStop(1, "#663b1e");
            ctxPl.fillStyle = g;
            ctxPl.fillRect(0, y + 1, 512, bH - 2);

            ctxPl.fillStyle = "rgba(0,0,0,0.07)";
            for (let k = 0; k < 6; k++) {
                ctxPl.fillRect(0, y + 5 + k * 9, 512, 1.2);
            }
            ctxPl.fillStyle = "#2a1508";
            ctxPl.fillRect(0, y + bH - 2, 512, 2);
        }
        textures.woodPlanks = new THREE.CanvasTexture(canvasPlank);
        textures.woodPlanks.wrapS = THREE.RepeatWrapping;
        textures.woodPlanks.wrapT = THREE.RepeatWrapping;
        textures.woodPlanks.repeat.set(2, 2);
    }

    /* ----------------------------------------------------
       PROCEDURAL 360° PHYSICAL SKY DOME & ENVIRONMENT MAP
       Simulates realistic atmospheric Rayleigh/Mie scattering,
       solar glare corona, procedural cumulus/cirrus clouds,
       and horizon landscape silhouette.
       ---------------------------------------------------- */
    function createProceduralSkyTexture(mode = 'day') {
        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");

        if (mode === 'day') {
            // High Dynamic Range Mediterranean Sky Gradient
            const grad = ctx.createLinearGradient(0, 0, 0, 1024);
            grad.addColorStop(0.0, "#0c3260"); // Deep Zenith Azure
            grad.addColorStop(0.20, "#195aa0");
            grad.addColorStop(0.38, "#3e8ed8");
            grad.addColorStop(0.48, "#93c5fd");
            grad.addColorStop(0.50, "#e0f2fe"); // Bright horizon line
            grad.addColorStop(0.51, "#f8fafc"); // Solar horizon glow
            grad.addColorStop(0.53, "#94a3b8"); // Distant landscape haze
            grad.addColorStop(0.65, "#475569"); // Ground horizon
            grad.addColorStop(1.0, "#1e293b"); // Ground bounce
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 2048, 1024);

            // Radiant Sun Disc & Atmospheric Solar Corona
            const sunX = 1480;
            const sunY = 300;
            const sunGlare = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 480);
            sunGlare.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
            sunGlare.addColorStop(0.08, "rgba(255, 250, 230, 0.95)");
            sunGlare.addColorStop(0.25, "rgba(254, 240, 138, 0.45)");
            sunGlare.addColorStop(0.55, "rgba(253, 224, 71, 0.15)");
            sunGlare.addColorStop(1.0, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = sunGlare;
            ctx.fillRect(sunX - 500, sunY - 500, 1000, 1000);

            // Procedural Soft Cumulus and Cirrus Clouds
            const clouds = [
                { x: 300, y: 260, w: 420, h: 90, op: 0.55 },
                { x: 780, y: 210, w: 520, h: 110, op: 0.65 },
                { x: 1220, y: 170, w: 380, h: 80, op: 0.40 },
                { x: 1760, y: 290, w: 490, h: 95, op: 0.50 },
                { x: 140, y: 370, w: 350, h: 70, op: 0.35 },
                { x: 940, y: 340, w: 460, h: 85, op: 0.45 }
            ];

            clouds.forEach(c => {
                const numPuffs = 7;
                for (let p = 0; p < numPuffs; p++) {
                    const px = c.x + (p - numPuffs / 2) * (c.w / numPuffs) * 1.3;
                    const py = c.y + Math.sin(p * 1.2) * (c.h * 0.25);
                    const rad = (c.h * 0.6) + Math.sin(p * 2.1) * (c.h * 0.25);
                    const cloudGrad = ctx.createRadialGradient(px, py, 5, px, py, rad);
                    cloudGrad.addColorStop(0.0, `rgba(255, 255, 255, ${c.op})`);
                    cloudGrad.addColorStop(0.6, `rgba(240, 246, 255, ${c.op * 0.7})`);
                    cloudGrad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
                    ctx.fillStyle = cloudGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, rad, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Distant Spanish Landscape Silhouette on Horizon (Villalbilla / Alcalá hills)
            ctx.fillStyle = "rgba(71, 85, 105, 0.45)";
            ctx.beginPath();
            ctx.moveTo(0, 512);
            for (let x = 0; x <= 2048; x += 32) {
                const h = 502 + Math.sin(x * 0.008) * 14 + Math.sin(x * 0.02) * 6;
                ctx.lineTo(x, h);
            }
            ctx.lineTo(2048, 540);
            ctx.lineTo(0, 540);
            ctx.closePath();
            ctx.fill();

        } else if (mode === 'sunset') {
            // Dramatic Golden Hour Sunset
            const grad = ctx.createLinearGradient(0, 0, 0, 1024);
            grad.addColorStop(0.0, "#1e1b4b"); // Indigo Zenith
            grad.addColorStop(0.22, "#4c1d95");
            grad.addColorStop(0.38, "#9f1239"); // Ruby red
            grad.addColorStop(0.47, "#c2410c"); // Burnt orange
            grad.addColorStop(0.50, "#f97316"); // Fiery horizon
            grad.addColorStop(0.52, "#fbbf24"); // Amber glow
            grad.addColorStop(0.58, "#334155"); // Horizon terrain
            grad.addColorStop(1.0, "#0f172a");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 2048, 1024);

            const sunX = 1520;
            const sunY = 505;
            const sunGlare = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 520);
            sunGlare.addColorStop(0.0, "rgba(255, 255, 240, 1.0)");
            sunGlare.addColorStop(0.12, "rgba(253, 224, 71, 0.85)");
            sunGlare.addColorStop(0.35, "rgba(249, 115, 22, 0.50)");
            sunGlare.addColorStop(0.70, "rgba(190, 18, 60, 0.20)");
            sunGlare.addColorStop(1.0, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = sunGlare;
            ctx.fillRect(sunX - 550, sunY - 550, 1100, 1100);

        } else {
            // Architectural Night Scene with Stars & Moon
            const grad = ctx.createLinearGradient(0, 0, 0, 1024);
            grad.addColorStop(0.0, "#020617"); // Midnight black
            grad.addColorStop(0.35, "#0b1329");
            grad.addColorStop(0.50, "#132347"); // Deep twilight horizon
            grad.addColorStop(0.52, "#090d16");
            grad.addColorStop(1.0, "#020408");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 2048, 1024);

            // Twinkling Stars
            for (let s = 0; s < 700; s++) {
                const sx = Math.random() * 2048;
                const sy = Math.random() * 490;
                const lum = Math.random();
                ctx.fillStyle = lum > 0.8 ? "#93c5fd" : (lum > 0.4 ? "#ffffff" : "#fef08a");
                ctx.beginPath();
                ctx.arc(sx, sy, Math.random() * 1.4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Glowing Moon
            const mX = 600;
            const mY = 220;
            const moonAura = ctx.createRadialGradient(mX, mY, 20, mX, mY, 140);
            moonAura.addColorStop(0.0, "rgba(224, 242, 254, 0.95)");
            moonAura.addColorStop(0.3, "rgba(186, 230, 253, 0.35)");
            moonAura.addColorStop(1.0, "rgba(224, 242, 254, 0)");
            ctx.fillStyle = moonAura;
            ctx.beginPath();
            ctx.arc(mX, mY, 140, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.arc(mX, mY, 24, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        return tex;
    }

    function initMaterials() {
        generateTextures();

        materials = {
            facadeWhite: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                roughness: 0.76,
                metalness: 0.02
            }),
            facadeWood: new THREE.MeshStandardMaterial({
                map: textures.woodSlats,
                roughness: 0.50,
                metalness: 0.08
            }),
            partyWall: new THREE.MeshStandardMaterial({
                color: 0x1e293b, // Medianera estructural oscura (antracita profundo, define la caja arquitectónica)
                roughness: 0.85,
                metalness: 0.04
            }),
            interiorWall: new THREE.MeshStandardMaterial({
                color: 0x334155, // Paredes divisorias en tono pizarra intenso / grafito arquitectónico fuerte
                roughness: 0.82,
                metalness: 0.04
            }),
            doorFrame: new THREE.MeshStandardMaterial({
                color: 0x0f172a, // Marco y tapetas en negro grafito de alto contraste
                roughness: 0.30,
                metalness: 0.25
            }),
            doorLeaf: new THREE.MeshStandardMaterial({
                color: 0xffffff, // Hoja lacada en blanco brillante (máximo contraste contra la pared oscura)
                roughness: 0.15,
                metalness: 0.05
            }),
            floorParquet: new THREE.MeshStandardMaterial({
                map: textures.parquet,
                roughness: 0.38,
                metalness: 0.08
            }),
            floorPaving: new THREE.MeshStandardMaterial({
                map: textures.paving,
                roughness: 0.68,
                metalness: 0.12
            }),
            floorGrass: new THREE.MeshStandardMaterial({
                map: textures.grass,
                roughness: 0.92
            }),
            roofSlate: new THREE.MeshStandardMaterial({
                map: textures.roof,
                roughness: 0.60,
                metalness: 0.28
            }),
            metalAnthracite: new THREE.MeshStandardMaterial({
                color: 0x1e2632,
                roughness: 0.32,
                metalness: 0.82
            }),
            glass: new THREE.MeshPhysicalMaterial({
                color: 0xebf8ff,
                transparent: true,
                opacity: 0.35,
                roughness: 0.04,
                metalness: 0.15,
                transmission: 0.88,
                ior: 1.52,
                reflectivity: 0.85
            }),
            glassRailing: new THREE.MeshPhysicalMaterial({
                color: 0xbae6fd,
                transparent: true,
                opacity: 0.42,
                roughness: 0.04,
                transmission: 0.86,
                ior: 1.50
            }),
            furnitureWood: new THREE.MeshStandardMaterial({
                color: 0x936239,
                roughness: 0.48,
                metalness: 0.05
            }),
            furnitureFabric: new THREE.MeshStandardMaterial({
                color: 0x64748b,
                roughness: 0.90
            }),
            furnitureWhite: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.22,
                metalness: 0.05
            }),
            mirror: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.98,
                roughness: 0.04
            }),

            // VEHICLES HYPER-REALISTIC MATERIALS
            kiaPaint: new THREE.MeshPhysicalMaterial({
                color: 0x3d5049, // Authentic 2025 Jungle Green / Experience Green metallic
                metalness: 0.85,
                roughness: 0.18,
                clearcoat: 1.0,
                clearcoatRoughness: 0.06,
                reflectivity: 0.95
            }),
            ktmOrange: new THREE.MeshPhysicalMaterial({
                color: 0xff5500, // KTM Signature Electric Racing Orange
                metalness: 0.35,
                roughness: 0.22,
                clearcoat: 0.95,
                clearcoatRoughness: 0.08
            }),
            ktmBlackFairing: new THREE.MeshStandardMaterial({
                color: 0x181a1f,
                roughness: 0.35,
                metalness: 0.45
            }),
            ktmSilverFrame: new THREE.MeshStandardMaterial({
                color: 0xd1d5db,
                metalness: 0.90,
                roughness: 0.18
            }),
            tireRubber: new THREE.MeshStandardMaterial({
                color: 0x131518,
                roughness: 0.88,
                metalness: 0.04
            }),
            carAlloyRim: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                metalness: 0.94,
                roughness: 0.12
            }),
            brakeDisc: new THREE.MeshStandardMaterial({
                color: 0xa1a1aa,
                metalness: 0.96,
                roughness: 0.22
            }),
            brakeCaliperRed: new THREE.MeshPhysicalMaterial({
                color: 0xdc2626,
                roughness: 0.20,
                metalness: 0.45,
                clearcoat: 0.85
            }),
            forkGold: new THREE.MeshStandardMaterial({
                color: 0xd97706, // WP golden anodized stanchions
                metalness: 0.88,
                roughness: 0.16
            }),
            carGlassTinted: new THREE.MeshPhysicalMaterial({
                color: 0x050811,
                transparent: true,
                opacity: 0.82,
                roughness: 0.04,
                metalness: 0.65,
                transmission: 0.55
            }),
            ledEmissiveWhite: new THREE.MeshBasicMaterial({
                color: 0xffffff
            }),
            ledEmissiveRed: new THREE.MeshBasicMaterial({
                color: 0xff1e1e
            }),
            ledEmissiveCyan: new THREE.MeshBasicMaterial({
                color: 0x38bdf8
            }),
            licensePlateBg: new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                roughness: 0.35
            }),
            licensePlateEU: new THREE.MeshStandardMaterial({
                color: 0x1d4ed8,
                roughness: 0.4
            }),
            tftDisplay: new THREE.MeshBasicMaterial({
                color: 0x0284c7
            }),
            exhaustTitanium: new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.92,
                roughness: 0.25
            }),
            carbonFiber: new THREE.MeshStandardMaterial({
                color: 0x1e2124,
                roughness: 0.42,
                metalness: 0.35
            }),
            contactShadowMat: new THREE.MeshBasicMaterial({
                color: 0x05070a,
                transparent: true,
                opacity: 0.68
            }),

            // BOTANICAL & GARDEN MATERIALS
            gravelStone: new THREE.MeshStandardMaterial({
                color: 0xbaa896,
                roughness: 0.92
            }),
            soilDark: new THREE.MeshStandardMaterial({
                map: textures.soil,
                roughness: 0.95,
                metalness: 0.04
            }),
            planterWood: new THREE.MeshStandardMaterial({
                map: textures.woodPlanks,
                roughness: 0.65,
                metalness: 0.08
            }),
            leafGreen: new THREE.MeshStandardMaterial({
                color: 0x22c55e,
                roughness: 0.58,
                metalness: 0.04
            }),
            leafTenderGreen: new THREE.MeshStandardMaterial({
                color: 0x86efac,
                roughness: 0.48,
                metalness: 0.04
            }),
            leafDarkGreen: new THREE.MeshStandardMaterial({
                color: 0x14532d,
                roughness: 0.68,
                metalness: 0.04
            }),
            tomatoGreen: new THREE.MeshStandardMaterial({
                color: 0x4d7c0f,
                roughness: 0.32,
                metalness: 0.08
            }),
            tomatoOrange: new THREE.MeshStandardMaterial({
                color: 0xf97316,
                roughness: 0.22,
                metalness: 0.08
            }),
            tomatoRipeRed: new THREE.MeshPhysicalMaterial({
                color: 0xdc2626,
                roughness: 0.16,
                metalness: 0.04,
                clearcoat: 0.95,
                clearcoatRoughness: 0.08
            }),
            strawberryRed: new THREE.MeshStandardMaterial({
                color: 0xef4444,
                roughness: 0.28
            }),
            twineJute: new THREE.MeshStandardMaterial({
                color: 0xc4a47c,
                roughness: 0.95
            }),
            flowerLavenderDeep: new THREE.MeshStandardMaterial({
                color: 0x7e22ce,
                roughness: 0.75
            }),
            flowerLavenderLight: new THREE.MeshStandardMaterial({
                color: 0xa855f7,
                roughness: 0.75
            }),
            flowerRosePink: new THREE.MeshStandardMaterial({
                color: 0xf472b6,
                roughness: 0.65
            }),
            flowerYellow: new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.65
            }),
            flowerWhite: new THREE.MeshStandardMaterial({
                color: 0xfafafa,
                roughness: 0.70
            }),
            bracketIron: new THREE.MeshStandardMaterial({
                color: 0x1f242d,
                metalness: 0.88,
                roughness: 0.32
            }),
            boltSilver: new THREE.MeshStandardMaterial({
                color: 0xd1d5db,
                metalness: 0.96,
                roughness: 0.18
            })
        };
    }

    function createBox(w, h, d, mat, castShadow = true, receiveShadow = true) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        return mesh;
    }

    function createGableWall(w, hEave, hRidge, thickness, mat, castShadow = true, receiveShadow = true) {
        const halfW = w / 2;
        const shape = new THREE.Shape();
        shape.moveTo(-halfW, 0);
        shape.lineTo(halfW, 0);
        shape.lineTo(halfW, hEave);
        shape.lineTo(0, hRidge);
        shape.lineTo(-halfW, hEave);
        shape.closePath();

        const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
        geo.translate(0, 0, -thickness / 2);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        return mesh;
    }

    /* ----------------------------------------------------
       SCULPTED ULTRA-REALISTIC KIA SPORTAGE 2025 SUV
       Accurate dimensions: 4.51m length, 1.86m width, 1.65m height, wheelbase 2.68m
       Detailed Opposites United design, Boomerang DRLs, 19" Diamond-Cut Rims,
       Brembo Red Calipers, Panoramic Glass, Interior Cabin & EU License Plates
       ---------------------------------------------------- */
    function createKiaSportage2025() {
        const kia = new THREE.Group();
        kia.name = "KiaSportage2025";

        // 1. Lower Rugged Cladding Perimeter (Dark Charcoal)
        const lowerSill = createBox(1.84, 0.22, 4.46, materials.tireRubber);
        lowerSill.position.set(0, 0.26, 0);
        kia.add(lowerSill);

        // 2. Front & Rear Skid Plates (Satin Silver Bash Guards)
        const frontSkid = createBox(1.18, 0.10, 0.22, materials.carAlloyRim);
        frontSkid.position.set(0, 0.21, 2.24);
        const rearSkid = createBox(1.18, 0.10, 0.22, materials.carAlloyRim);
        rearSkid.position.set(0, 0.21, -2.24);
        kia.add(frontSkid);
        kia.add(rearSkid);

        // 3. Lower Front Bumper Air Curtain & Fog Inlets
        const lowerBumper = createBox(1.82, 0.24, 0.30, materials.metalAnthracite);
        lowerBumper.position.set(0, 0.36, 2.18);
        kia.add(lowerBumper);

        // 4. Main Sculpted Bodywork (Curved waistline & muscular haunches)
        const mainBody = createBox(1.86, 0.54, 4.40, materials.kiaPaint);
        mainBody.position.set(0, 0.60, 0);
        kia.add(mainBody);

        // Muscular Flared Fenders (Front & Rear Wheel Arches)
        const archGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 16, 1, false, 0, Math.PI);
        const archPositions = [
            [-0.93, 0.42, 1.34],
            [0.93, 0.42, 1.34],
            [-0.93, 0.42, -1.34],
            [0.93, 0.42, -1.34]
        ];
        archPositions.forEach(p => {
            const arch = new THREE.Mesh(archGeo, materials.tireRubber);
            arch.position.set(p[0], p[1], p[2]);
            arch.rotation.z = Math.PI / 2;
            arch.rotation.y = p[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
            kia.add(arch);
        });

        // 5. Hood with Sculpted Power Strakes
        const hood = createBox(1.74, 0.14, 1.38, materials.kiaPaint);
        hood.position.set(0, 0.90, 1.44);
        hood.rotation.x = 0.09;
        kia.add(hood);

        // Chrome KIA Wordmark Badge on Hood
        const kiaBadgeHood = createBox(0.18, 0.02, 0.06, materials.carAlloyRim);
        kiaBadgeHood.position.set(0, 0.97, 2.05);
        kia.add(kiaBadgeHood);

        // 6. Digital Tiger Face Grille (Gloss Black with Diamond Mesh Pattern)
        const frontGrille = createBox(1.68, 0.32, 0.08, materials.metalAnthracite);
        frontGrille.position.set(0, 0.64, 2.22);
        kia.add(frontGrille);
        const grilleAccent = createBox(1.64, 0.03, 0.02, materials.carAlloyRim);
        grilleAccent.position.set(0, 0.77, 2.26);
        kia.add(grilleAccent);

        // 7. Signature Boomerang LED Daytime Running Lights (DRL)
        // Left Boomerang DRL
        const dRL_L1 = createBox(0.04, 0.34, 0.05, materials.ledEmissiveWhite);
        dRL_L1.position.set(-0.76, 0.68, 2.23);
        dRL_L1.rotation.z = 0.28;
        const dRL_L2 = createBox(0.24, 0.04, 0.05, materials.ledEmissiveWhite);
        dRL_L2.position.set(-0.66, 0.82, 2.23);
        dRL_L2.rotation.z = -0.15;
        kia.add(dRL_L1);
        kia.add(dRL_L2);

        // Right Boomerang DRL
        const dRL_R1 = createBox(0.04, 0.34, 0.05, materials.ledEmissiveWhite);
        dRL_R1.position.set(0.76, 0.68, 2.23);
        dRL_R1.rotation.z = -0.28;
        const dRL_R2 = createBox(0.24, 0.04, 0.05, materials.ledEmissiveWhite);
        dRL_R2.position.set(0.66, 0.82, 2.23);
        dRL_R2.rotation.z = 0.15;
        kia.add(dRL_R1);
        kia.add(dRL_R2);

        // Vertical LED Matrix Projector Headlights inside the Boomerang angles
        for (let l = 0; l < 2; l++) {
            const lensL = createBox(0.06, 0.06, 0.04, materials.ledEmissiveWhite);
            lensL.position.set(-0.72, 0.62 + (l * 0.09), 2.22);
            const lensR = createBox(0.06, 0.06, 0.04, materials.ledEmissiveWhite);
            lensR.position.set(0.72, 0.62 + (l * 0.09), 2.22);
            kia.add(lensL);
            kia.add(lensR);
        }

        // 8. Front European Spanish License Plate: "2025 - VLB"
        const plateFrontBg = createBox(0.52, 0.12, 0.03, materials.licensePlateBg);
        plateFrontBg.position.set(0, 0.44, 2.27);
        const plateFrontEU = createBox(0.08, 0.12, 0.035, materials.licensePlateEU);
        plateFrontEU.position.set(-0.21, 0.44, 2.27);
        kia.add(plateFrontBg);
        kia.add(plateFrontEU);

        // 9. Greenhouse Cabin (Tapered Pillars & Roofline)
        const cabin = createBox(1.62, 0.54, 2.60, materials.kiaPaint);
        cabin.position.set(0, 1.14, -0.20);
        kia.add(cabin);

        // Interior Silhouette: Dashboard & Curved Dual Screens
        const dash = createBox(1.45, 0.22, 0.45, materials.tireRubber);
        dash.position.set(0, 1.05, 0.65);
        const dualCurvedScreen = createBox(0.95, 0.14, 0.04, materials.tftDisplay);
        dualCurvedScreen.position.set(-0.15, 1.15, 0.62);
        dualCurvedScreen.rotation.x = -0.15;
        const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16), materials.tireRubber);
        steeringWheel.position.set(-0.42, 1.15, 0.48);
        steeringWheel.rotation.x = 0.45;
        kia.add(dash);
        kia.add(dualCurvedScreen);
        kia.add(steeringWheel);

        // Front Bucket Seats
        [-0.42, 0.42].forEach(sx => {
            const seatBase = createBox(0.44, 0.14, 0.48, materials.tireRubber);
            seatBase.position.set(sx, 0.72, 0.15);
            const seatBack = createBox(0.42, 0.50, 0.12, materials.tireRubber);
            seatBack.position.set(sx, 0.98, -0.05);
            seatBack.rotation.x = -0.18;
            const headrest = createBox(0.22, 0.16, 0.10, materials.tireRubber);
            headrest.position.set(sx, 1.28, -0.12);
            kia.add(seatBase);
            kia.add(seatBack);
            kia.add(headrest);
        });

        // Panoramic Obsidian Black Glass Roof
        const panoRoof = createBox(1.46, 0.04, 2.20, materials.carGlassTinted);
        panoRoof.position.set(0, 1.43, -0.18);
        kia.add(panoRoof);

        // Satin Silver Longitudinal Roof Rails
        const railL = createBox(0.04, 0.05, 2.05, materials.carAlloyRim);
        railL.position.set(-0.73, 1.45, -0.18);
        const railR = createBox(0.04, 0.05, 2.05, materials.carAlloyRim);
        railR.position.set(0.73, 1.45, -0.18);
        kia.add(railL);
        kia.add(railR);

        // Aerodynamic Shark Fin Antenna
        const sharkFin = createBox(0.06, 0.10, 0.20, materials.metalAnthracite);
        sharkFin.position.set(0, 1.48, -1.05);
        kia.add(sharkFin);

        // Windshield (Sloped Climalit Safety Glass with Ceramic Frit)
        const windshield = createBox(1.54, 0.68, 0.05, materials.carGlassTinted);
        windshield.position.set(0, 1.14, 1.10);
        windshield.rotation.x = Math.PI / 4.4;
        kia.add(windshield);

        // Rear Tailgate Raked Window
        const rearGlass = createBox(1.48, 0.58, 0.05, materials.carGlassTinted);
        rearGlass.position.set(0, 1.16, -1.52);
        rearGlass.rotation.x = -Math.PI / 4.2;
        kia.add(rearGlass);

        // Side Privacy Glass Windows with Chrome Beltline Trim
        const sideGlassL = createBox(0.04, 0.42, 2.06, materials.carGlassTinted);
        sideGlassL.position.set(-0.82, 1.14, -0.18);
        const sideGlassR = createBox(0.04, 0.42, 2.06, materials.carGlassTinted);
        sideGlassR.position.set(0.82, 1.14, -0.18);
        const chromeTrimL = createBox(0.02, 0.02, 2.12, materials.carAlloyRim);
        chromeTrimL.position.set(-0.84, 0.92, -0.18);
        const chromeTrimR = createBox(0.02, 0.02, 2.12, materials.carAlloyRim);
        chromeTrimR.position.set(0.84, 0.92, -0.18);
        kia.add(sideGlassL);
        kia.add(sideGlassR);
        kia.add(chromeTrimL);
        kia.add(chromeTrimR);

        // Aerodynamic Wing Mirrors with Amber Indicator Strips
        const mirrorL = createBox(0.22, 0.12, 0.12, materials.kiaPaint);
        mirrorL.position.set(-0.94, 1.04, 0.92);
        const mirrorFaceL = createBox(0.02, 0.10, 0.10, materials.mirror);
        mirrorFaceL.position.set(-0.84, 1.04, 0.92);
        const mirrorIndL = createBox(0.20, 0.02, 0.02, materials.ledEmissiveWhite);
        mirrorIndL.position.set(-0.94, 1.04, 0.98);
        const mirrorR = createBox(0.22, 0.12, 0.12, materials.kiaPaint);
        mirrorR.position.set(0.94, 1.04, 0.92);
        const mirrorFaceR = createBox(0.02, 0.10, 0.10, materials.mirror);
        mirrorFaceR.position.set(0.84, 1.04, 0.92);
        const mirrorIndR = createBox(0.20, 0.02, 0.02, materials.ledEmissiveWhite);
        mirrorIndR.position.set(0.94, 1.04, 0.98);
        kia.add(mirrorL);
        kia.add(mirrorFaceL);
        kia.add(mirrorIndL);
        kia.add(mirrorR);
        kia.add(mirrorFaceR);
        kia.add(mirrorIndR);

        // Aerodynamic Rear Roof Spoiler with 3rd Brake Light
        const spoiler = createBox(1.52, 0.08, 0.36, materials.metalAnthracite);
        spoiler.position.set(0, 1.44, -1.58);
        const thirdBrakeLight = createBox(0.60, 0.025, 0.02, materials.ledEmissiveRed);
        thirdBrakeLight.position.set(0, 1.44, -1.74);
        kia.add(spoiler);
        kia.add(thirdBrakeLight);

        // 10. Connected Full-Width Razor LED Tail Lights
        const tailLightCenter = createBox(1.68, 0.08, 0.06, materials.ledEmissiveRed);
        tailLightCenter.position.set(0, 0.80, -2.21);
        const tailLightCornerL = createBox(0.08, 0.22, 0.08, materials.ledEmissiveRed);
        tailLightCornerL.position.set(-0.82, 0.76, -2.18);
        const tailLightCornerR = createBox(0.08, 0.22, 0.08, materials.ledEmissiveRed);
        tailLightCornerR.position.set(0.82, 0.76, -2.18);
        kia.add(tailLightCenter);
        kia.add(tailLightCornerL);
        kia.add(tailLightCornerR);

        // Tailgate KIA Emblem & "SPORTAGE" Wordmark
        const kiaBadgeRear = createBox(0.16, 0.02, 0.04, materials.carAlloyRim);
        kiaBadgeRear.position.set(0, 0.88, -2.22);
        const sportageWordmark = createBox(0.38, 0.02, 0.02, materials.carAlloyRim);
        sportageWordmark.position.set(0, 0.72, -2.22);
        kia.add(kiaBadgeRear);
        kia.add(sportageWordmark);

        // Rear European Spanish License Plate: "2025 - VLB"
        const plateRearBg = createBox(0.52, 0.12, 0.03, materials.licensePlateBg);
        plateRearBg.position.set(0, 0.44, -2.27);
        const plateRearEU = createBox(0.08, 0.12, 0.035, materials.licensePlateEU);
        plateRearEU.position.set(-0.21, 0.44, -2.27);
        kia.add(plateRearBg);
        kia.add(plateRearEU);

        // Dual Chrome Exhaust Finishers on Diffuser
        const exhaustL = createBox(0.18, 0.07, 0.06, materials.carAlloyRim);
        exhaustL.position.set(-0.62, 0.24, -2.25);
        const exhaustR = createBox(0.18, 0.07, 0.06, materials.carAlloyRim);
        exhaustR.position.set(0.62, 0.24, -2.25);
        kia.add(exhaustL);
        kia.add(exhaustR);

        // 11. 19" Two-Tone Diamond-Cut Alloy Wheels, Red Brembo Calipers & Michelin Tires
        const wheelCoords = [
            [-0.93, 0.36, 1.34],
            [0.93, 0.36, 1.34],
            [-0.93, 0.36, -1.34],
            [0.93, 0.36, -1.34]
        ];

        wheelCoords.forEach(pos => {
            const wheel = new THREE.Group();
            wheel.position.set(pos[0], pos[1], pos[2]);

            // Rubber Tire with deep tread siping
            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 28), materials.tireRubber);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheel.add(tire);

            // Black Inner Rim Barrel
            const innerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.27, 20), materials.metalAnthracite);
            innerBarrel.rotation.z = Math.PI / 2;
            wheel.add(innerBarrel);

            // 5-Y-Spoke Diamond-Cut Machined Face
            for (let sp = 0; sp < 5; sp++) {
                const angle = (sp / 5) * Math.PI * 2;
                const spoke = createBox(0.04, 0.22, 0.04, materials.carAlloyRim);
                spoke.position.set((pos[0] > 0 ? 0.12 : -0.12), Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
                spoke.rotation.x = -angle;
                wheel.add(spoke);
            }

            // Chrome Center Hub Cap
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 16), materials.carAlloyRim);
            hub.rotation.z = Math.PI / 2;
            wheel.add(hub);

            // Ventilated Steel Brake Rotor Disc
            const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.04, 20), materials.brakeDisc);
            rotor.rotation.z = Math.PI / 2;
            wheel.add(rotor);

            // High-Performance Red Brembo Brake Caliper
            const caliper = createBox(0.08, 0.12, 0.06, materials.brakeCaliperRed);
            caliper.position.set(pos[0] > 0 ? 0.08 : -0.08, 0.12, 0);
            wheel.add(caliper);

            kia.add(wheel);
        });

        // 12. Multi-Layer Ground Contact Shadow (Soft Ambient Occlusion)
        const chassisShadow = new THREE.Mesh(
            new THREE.PlaneGeometry(2.10, 4.60),
            materials.contactShadowMat
        );
        chassisShadow.rotation.x = -Math.PI / 2;
        chassisShadow.position.set(0, 0.02, 0);
        kia.add(chassisShadow);

        // Intense contact shadow patches under each tire
        wheelCoords.forEach(wp => {
            const tireContact = new THREE.Mesh(
                new THREE.PlaneGeometry(0.36, 0.46),
                materials.contactShadowMat
            );
            tireContact.rotation.x = -Math.PI / 2;
            tireContact.position.set(wp[0], 0.025, wp[2]);
            kia.add(tireContact);
        });

        return kia;
    }

    /* ----------------------------------------------------
       SCULPTED ULTRA-REALISTIC KTM 1290 SUPER ADVENTURE S 2024
       Accurate dimensions: 2.26m length, 0.90m width, 1.45m height, seat 0.85m
       Signature predatory split LED headlight, ACC radar box, touring screen,
       active TFT screen, orange tubular spaceframe, 1,301cc LC8 V-Twin,
       golden WP Semi-Active forks, Akrapovič carbon exhaust, Brembo Stylema
       ---------------------------------------------------- */
    function createKTM1290S2024() {
        const ktm = new THREE.Group();
        ktm.name = "KTM1290SuperAdventureS";

        // 1. Signature Powder-Coated Orange Tubular Spaceframe Trellis
        const trellis = new THREE.Group();
        const tubePositions = [
            [-0.15, 0.65, 0.05, 0.22],
            [0.15, 0.65, 0.05, -0.22],
            [-0.14, 0.72, -0.20, 0.18],
            [0.14, 0.72, -0.20, -0.18],
            [-0.16, 0.58, 0.25, 0.25],
            [0.16, 0.58, 0.25, -0.25]
        ];
        tubePositions.forEach(tp => {
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 8), materials.ktmOrange);
            tube.position.set(tp[0], tp[1], tp[2]);
            tube.rotation.z = tp[3];
            tube.rotation.x = 0.25;
            trellis.add(tube);
        });
        // Diagonal cross-brace
        const crossL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8), materials.ktmOrange);
        crossL.position.set(-0.15, 0.66, 0.08);
        crossL.rotation.x = -0.65;
        const crossR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8), materials.ktmOrange);
        crossR.position.set(0.15, 0.66, 0.08);
        crossR.rotation.x = -0.65;
        trellis.add(crossL);
        trellis.add(crossR);
        ktm.add(trellis);

        // Satin Silver Cast Aluminum Subframe beneath seat
        const subframeL = createBox(0.04, 0.06, 0.68, materials.ktmSilverFrame);
        subframeL.position.set(-0.13, 0.82, -0.55);
        subframeL.rotation.x = 0.18;
        const subframeR = createBox(0.04, 0.06, 0.68, materials.ktmSilverFrame);
        subframeR.position.set(0.13, 0.82, -0.55);
        subframeR.rotation.x = 0.18;
        ktm.add(subframeL);
        ktm.add(subframeR);

        // 2. 1,301cc 75° V-Twin LC8 Engine Block & Crankcases
        const engineBlock = createBox(0.36, 0.40, 0.58, materials.metalAnthracite);
        engineBlock.position.set(0, 0.44, 0.02);
        ktm.add(engineBlock);

        // Dual Cylinder Barrels with Cooling Fins
        const cylFront = createBox(0.24, 0.28, 0.22, materials.brakeDisc);
        cylFront.position.set(0, 0.62, 0.16);
        cylFront.rotation.x = 0.48;
        const cylRear = createBox(0.24, 0.28, 0.22, materials.brakeDisc);
        cylRear.position.set(0, 0.62, -0.16);
        cylRear.rotation.x = -0.48;
        ktm.add(cylFront);
        ktm.add(cylRear);

        // Circular Alternator & Clutch Covers
        const clutchCover = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), materials.ktmSilverFrame);
        clutchCover.position.set(0.19, 0.42, -0.06);
        clutchCover.rotation.z = Math.PI / 2;
        const altCover = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 16), materials.metalAnthracite);
        altCover.position.set(-0.19, 0.42, 0.04);
        altCover.rotation.z = Math.PI / 2;
        ktm.add(clutchCover);
        ktm.add(altCover);

        // Heavy-Duty Aluminum Skid Plate (Cubrecarter)
        const engineSkid = createBox(0.32, 0.06, 0.62, materials.ktmSilverFrame);
        engineSkid.position.set(0, 0.22, 0.02);
        ktm.add(engineSkid);

        // 3. Upswept Titanium Sport Exhaust with Real Carbon-Fiber End Cap
        // Exhaust header downpipes
        const headerPipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.62, 12), materials.exhaustTitanium);
        headerPipe1.position.set(0.14, 0.38, 0.18);
        headerPipe1.rotation.x = -0.65;
        const headerPipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.50, 12), materials.exhaustTitanium);
        headerPipe2.position.set(0.14, 0.38, -0.12);
        headerPipe2.rotation.x = -0.35;
        ktm.add(headerPipe1);
        ktm.add(headerPipe2);

        // Upswept Silencer Canister
        const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.72, 16), materials.exhaustTitanium);
        silencer.position.set(0.24, 0.64, -0.82);
        silencer.rotation.x = -Math.PI / 4.6;
        const carbonCap = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.09, 16), materials.carbonFiber);
        carbonCap.position.set(0.24, 0.88, -1.06);
        carbonCap.rotation.x = -Math.PI / 4.6;
        ktm.add(silencer);
        ktm.add(carbonCap);

        // 4. Low-Slung 23-Liter Adventure Fuel Tank & Ergonomic Shrouds
        const fuelTank = createBox(0.50, 0.42, 0.74, materials.ktmOrange);
        fuelTank.position.set(0, 0.92, 0.24);
        const tankKneeShroudsL = createBox(0.12, 0.36, 0.42, materials.ktmBlackFairing);
        tankKneeShroudsL.position.set(-0.24, 0.88, 0.12);
        const tankKneeShroudsR = createBox(0.12, 0.36, 0.42, materials.ktmBlackFairing);
        tankKneeShroudsR.position.set(0.24, 0.88, 0.12);
        const tankTopConsole = createBox(0.38, 0.12, 0.52, materials.ktmBlackFairing);
        tankTopConsole.position.set(0, 1.12, 0.26);
        ktm.add(fuelTank);
        ktm.add(tankKneeShroudsL);
        ktm.add(tankKneeShroudsR);
        ktm.add(tankTopConsole);

        // 5. Two-Piece Stepped Touring Saddle with Grip Texture
        const riderSeat = createBox(0.32, 0.12, 0.46, materials.tireRubber);
        riderSeat.position.set(0, 0.86, -0.16);
        const pillionSeat = createBox(0.30, 0.14, 0.40, materials.tireRubber);
        pillionSeat.position.set(0, 0.94, -0.56);
        ktm.add(riderSeat);
        ktm.add(pillionSeat);

        // Rear Cast Aluminum Luggage Rack & Grab Handles
        const luggageRack = createBox(0.28, 0.04, 0.34, materials.ktmSilverFrame);
        luggageRack.position.set(0, 1.02, -0.86);
        ktm.add(luggageRack);

        // 6. Iconic Predatory Split Adventure LED Headlight & Windscreen
        const headlightCluster = new THREE.Group();
        headlightCluster.position.set(0, 1.16, 0.86);

        // Fairing cowl
        const cowl = createBox(0.38, 0.36, 0.28, materials.ktmBlackFairing);
        headlightCluster.add(cowl);

        // Dual Horseshoe Split LED DRLs
        const dRL_L = createBox(0.035, 0.22, 0.04, materials.ledEmissiveWhite);
        dRL_L.position.set(-0.11, 0, 0.14);
        dRL_L.rotation.z = -0.22;
        const dRL_R = createBox(0.035, 0.22, 0.04, materials.ledEmissiveWhite);
        dRL_R.position.set(0.11, 0, 0.14);
        dRL_R.rotation.z = 0.22;
        headlightCluster.add(dRL_L);
        headlightCluster.add(dRL_R);

        // Central Radar Sensor Cube (Bosch Adaptive Cruise Control)
        const radarBox = createBox(0.09, 0.07, 0.06, materials.metalAnthracite);
        radarBox.position.set(0, -0.04, 0.15);
        headlightCluster.add(radarBox);

        // Clear Aerodynamic Touring Windscreen with Dual Vents
        const windscreen = createBox(0.36, 0.44, 0.03, materials.glass);
        windscreen.position.set(0, 0.28, 0.08);
        windscreen.rotation.x = -0.38;
        headlightCluster.add(windscreen);

        // 7" High-Resolution Color TFT Instrument Cluster Screen
        const tftCockpit = createBox(0.18, 0.12, 0.02, materials.tftDisplay);
        tftCockpit.position.set(0, 0.12, -0.08);
        tftCockpit.rotation.x = 0.52;
        headlightCluster.add(tftCockpit);

        ktm.add(headlightCluster);

        // 7. Handlebars, Handguards & Rearview Mirrors
        const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.84, 12), materials.metalAnthracite);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.position.set(0, 1.22, 0.64);
        ktm.add(handlebar);

        // Left & Right Handguards
        [-0.40, 0.40].forEach(hx => {
            const hGuard = createBox(0.16, 0.08, 0.14, materials.ktmBlackFairing);
            hGuard.position.set(hx, 1.22, 0.68);
            const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), materials.metalAnthracite);
            mirrorStem.position.set(hx * 0.78, 1.32, 0.62);
            mirrorStem.rotation.z = hx > 0 ? -0.35 : 0.35;
            const mirrorHead = createBox(0.12, 0.08, 0.03, materials.ktmBlackFairing);
            mirrorHead.position.set(hx * 0.92, 1.40, 0.60);
            const mirrorGlass = createBox(0.11, 0.07, 0.01, materials.mirror);
            mirrorGlass.position.set(hx * 0.92, 1.40, 0.58);
            ktm.add(hGuard);
            ktm.add(mirrorStem);
            ktm.add(mirrorHead);
            ktm.add(mirrorGlass);
        });

        // 8. WP Semi-Active 48mm Inverted Front Suspension Forks (Signature Gold Anodized)
        const forkGroup = new THREE.Group();
        [-0.13, 0.13].forEach(fx => {
            // Golden Upper Outer Tube (Stanchion)
            const forkStanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.52, 16), materials.forkGold);
            forkStanchion.position.set(fx, 0.86, 0.72);
            forkStanchion.rotation.x = -0.34;
            // Chrome Lower Slider Tube
            const forkSlider = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.48, 16), materials.ktmSilverFrame);
            forkSlider.position.set(fx, 0.52, 0.84);
            forkSlider.rotation.x = -0.34;
            // Orange Preload Adjuster Cap
            const forkCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), materials.ktmOrange);
            forkCap.position.set(fx, 1.08, 0.64);
            forkCap.rotation.x = -0.34;
            forkGroup.add(forkStanchion);
            forkGroup.add(forkSlider);
            forkGroup.add(forkCap);
        });
        ktm.add(forkGroup);

        // WP Semi-Active Rear Monoshock with Bright Orange Progressive Coil Spring
        const shockSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 12), materials.ktmOrange);
        shockSpring.position.set(0, 0.58, -0.32);
        shockSpring.rotation.x = 0.65;
        ktm.add(shockSpring);

        // Cast Aluminum Open-Lattice Swingarm & Chain Drive
        const swingarmL = createBox(0.04, 0.08, 0.66, materials.ktmSilverFrame);
        swingarmL.position.set(-0.12, 0.42, -0.46);
        swingarmL.rotation.x = -0.22;
        const swingarmR = createBox(0.04, 0.08, 0.66, materials.ktmSilverFrame);
        swingarmR.position.set(0.12, 0.42, -0.46);
        swingarmR.rotation.x = -0.22;
        const goldChain = createBox(0.025, 0.03, 0.58, materials.forkGold);
        goldChain.position.set(-0.14, 0.40, -0.46);
        goldChain.rotation.x = -0.22;
        ktm.add(swingarmL);
        ktm.add(swingarmR);
        ktm.add(goldChain);

        // 9. Wheels & High-Performance Brakes
        // Front 19" Adventure Wheel
        const frontWheel = new THREE.Group();
        frontWheel.position.set(0, 0.35, 0.88);
        const fTire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 24), materials.tireRubber);
        fTire.rotation.z = Math.PI / 2;
        fTire.castShadow = true;
        const fRim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.13, 20), materials.metalAnthracite);
        fRim.rotation.z = Math.PI / 2;
        frontWheel.add(fTire);
        frontWheel.add(fRim);

        // Dual Front 320mm Wave Floating Discs & Brembo Stylema Calipers
        [-0.08, 0.08].forEach(dx => {
            const fDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.015, 20), materials.brakeDisc);
            fDisc.position.set(dx, 0, 0);
            fDisc.rotation.z = Math.PI / 2;
            const fCaliper = createBox(0.05, 0.09, 0.06, materials.metalAnthracite);
            fCaliper.position.set(dx * 1.15, 0.12, 0.02);
            frontWheel.add(fDisc);
            frontWheel.add(fCaliper);
        });
        ktm.add(frontWheel);

        // Rear 17" Adventure Wheel
        const rearWheel = new THREE.Group();
        rearWheel.position.set(0, 0.33, -0.74);
        const rTire = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.17, 24), materials.tireRubber);
        rTire.rotation.z = Math.PI / 2;
        rTire.castShadow = true;
        const rRim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 20), materials.metalAnthracite);
        rRim.rotation.z = Math.PI / 2;
        const rDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 16), materials.brakeDisc);
        rDisc.position.set(0.10, 0, 0);
        rDisc.rotation.z = Math.PI / 2;
        rearWheel.add(rTire);
        rearWheel.add(rRim);
        rearWheel.add(rDisc);
        ktm.add(rearWheel);

        // 10. Spanish Motorcycle License Plate: "2024 - KTM"
        const plateMotoBg = createBox(0.24, 0.18, 0.02, materials.licensePlateBg);
        plateMotoBg.position.set(0, 0.62, -1.08);
        plateMotoBg.rotation.x = 0.25;
        const plateMotoEU = createBox(0.04, 0.18, 0.025, materials.licensePlateEU);
        plateMotoEU.position.set(-0.09, 0.62, -1.08);
        plateMotoEU.rotation.x = 0.25;
        const tailLamp = createBox(0.12, 0.04, 0.03, materials.ledEmissiveRed);
        tailLamp.position.set(0, 0.74, -1.04);
        ktm.add(plateMotoBg);
        ktm.add(plateMotoEU);
        ktm.add(tailLamp);

        // 11. Deployed Side Kickstand & Resting Lean
        const kickstand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8), materials.ktmSilverFrame);
        kickstand.position.set(-0.16, 0.18, -0.05);
        kickstand.rotation.z = 0.42;
        kickstand.rotation.x = -0.25;
        ktm.add(kickstand);
        ktm.rotation.z = -0.06; // Authentic natural kickstand rest lean angle

        // 12. Multi-Layer Contact Shadow Plane (Ground Ambient Occlusion)
        const motoShadow = new THREE.Mesh(
            new THREE.PlaneGeometry(1.20, 2.50),
            materials.contactShadowMat
        );
        motoShadow.rotation.x = -Math.PI / 2;
        motoShadow.position.set(0, 0.02, 0.05);
        ktm.add(motoShadow);

        return ktm;
    }



    /* ----------------------------------------------------
       BUILD FRONT ENTRANCE & PARKING AREA (25.64 m²)
       With Both Vehicles, Olive Tree, Gravel Bed, Gate & Porch
       ---------------------------------------------------- */
    /* ----------------------------------------------------
       ARCHITECTURAL INTERIOR DOOR CREATION HELPER
       Creates realistic lacquered doorframe, jambs, door leaf,
       hinge pivot, and chrome lever handles.
       ---------------------------------------------------- */
    function createInteriorDoor(w = 0.85, h = 2.10, frameMat = null, leafMat = null, openAngle = 0.7) {
        const doorGroup = new THREE.Group();
        const fMat = frameMat || materials.doorFrame || materials.metalAnthracite;
        const lMat = leafMat || materials.doorLeaf || materials.furnitureWhite;

        const frameThick = 0.05;
        const frameDepth = 0.14;

        // Left Jamb
        const jambL = createBox(frameThick, h, frameDepth, fMat);
        jambL.position.set(-w / 2 + frameThick / 2, h / 2, 0);
        // Right Jamb
        const jambR = createBox(frameThick, h, frameDepth, fMat);
        jambR.position.set(w / 2 - frameThick / 2, h / 2, 0);
        // Header Transom
        const header = createBox(w, frameThick, frameDepth, fMat);
        header.position.set(0, h - frameThick / 2, 0);

        doorGroup.add(jambL);
        doorGroup.add(jambR);
        doorGroup.add(header);

        // Door Leaf on Hinge Pivot
        const leafW = w - frameThick * 2;
        const leafH = h - frameThick;
        const pivot = new THREE.Group();
        pivot.position.set(-w / 2 + frameThick, 0, 0);

        const leaf = createBox(leafW, leafH, 0.04, lMat);
        leaf.position.set(leafW / 2, leafH / 2, 0);
        pivot.add(leaf);

        // Chrome Lever Handles (Front & Back)
        const handleStem1 = createBox(0.02, 0.02, 0.06, materials.boltSilver);
        handleStem1.position.set(leafW - 0.08, 1.0, 0.04);
        const handleLever1 = createBox(0.12, 0.02, 0.02, materials.boltSilver);
        handleLever1.position.set(leafW - 0.04, 1.0, 0.07);

        const handleStem2 = createBox(0.02, 0.02, 0.06, materials.boltSilver);
        handleStem2.position.set(leafW - 0.08, 1.0, -0.04);
        const handleLever2 = createBox(0.12, 0.02, 0.02, materials.boltSilver);
        handleLever2.position.set(leafW - 0.04, 1.0, -0.07);

        pivot.add(handleStem1);
        pivot.add(handleLever1);
        pivot.add(handleStem2);
        pivot.add(handleLever2);

        pivot.rotation.y = openAngle;
        doorGroup.add(pivot);

        return doorGroup;
    }

    function buildVehiclesAndEntrance() {
        const group = new THREE.Group();
        group.name = "vehiclesAndEntrance";

        // EXACT BLUEPRINT APARCAMIENTO: 6.56m Ancho Interior x 6.30m Fondo Total
        // (5.00m plaza de aparcamiento + 1.30m holgura para barrido de puertas batientes hacia adentro)
        const driveway = createBox(6.56, 0.16, 6.20, materials.floorPaving);
        driveway.position.set(0, 0.08, 7.99);
        group.add(driveway);

        // Linea de desagüe en el umbral de las cancelas
        const drain = createBox(6.56, 0.03, 0.18, materials.metalAnthracite);
        drain.position.set(0, 0.17, 11.0);
        group.add(drain);

        // Banda lateral decorativa de gravilla con vegetación
        const gravelBed = createBox(0.90, 0.18, 6.0, materials.gravelStone);
        gravelBed.position.set(-2.95, 0.09, 8.05);
        group.add(gravelBed);

        // Olivo decorativo en macetón junto a medianera
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.5, 16), materials.furnitureWood);
        pot.position.set(-2.9, 0.42, 6.2);
        const trunk = createBox(0.1, 0.7, 0.1, materials.furnitureWood);
        trunk.position.set(-2.9, 0.9, 6.2);
        const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), materials.floorGrass);
        foliage.position.set(-2.9, 1.45, 6.2);
        group.add(pot);
        group.add(trunk);
        group.add(foliage);        // ========================================================
        // CANCELAS A CALLE (Z = 11.20m): ALINEACIÓN EXACTA CON SALIDA DE VEHÍCULO
        // SIN POSTES NI TRAVESAÑOS EN EL PASO DEL COCHE!
        // - Ancho de parcela: 7.00m
        // - Izquierda: Murete ajardinado (1.85m, X = -3.50 a -1.65)
        // - Puerta Peatonal: 1.05m (X = -1.65 a -0.60)
        // - Pilastra divisoria con videoportero y buzón: 0.40m (X = -0.60 a -0.20)
        // - Cancela de Vehículos de 2 Hojas Batientes: 3.15m LIBRES (X = -0.20 a +2.95)
        //   * Totalmente diáfana, sin poste central ni larguero superior
        //   * Alineada al 100% con la trayectoria recta del Kia Sportage (X = 1.05m)
        // - Derecha: Murete de esquina (0.55m, X = +2.95 a +3.50)
        // ========================================================

        // 1. Murete izquierdo ajardinado (X = -3.50 a -1.65, ancho 1.85m)
        const wallStreetL = createBox(1.85, 1.90, 0.22, materials.facadeWhite);
        wallStreetL.position.set(-2.575, 0.95, 11.20);
        const wallCopingL = createBox(1.89, 0.05, 0.26, materials.metalAnthracite);
        wallCopingL.position.set(-2.575, 1.92, 11.20);
        group.add(wallStreetL);
        group.add(wallCopingL);

        // 2. PUERTA PEATONAL INDEPENDIENTE (X = -1.65 a -0.60, ancho 1.05m)
        // Sin poste superior, hoja batiente hacia adentro
        const pedGate = new THREE.Group();
        pedGate.name = "pedestrianGate";
        const pedPostL = createBox(0.06, 1.90, 0.06, materials.metalAnthracite);
        pedPostL.position.set(-1.62, 0.95, 11.20);
        pedGate.add(pedPostL);

        const pedPivot = new THREE.Group();
        pedPivot.position.set(-1.59, 0.10, 11.20);
        // Hoja peatonal de 0.96m con lamas de madera noble y bastidor antracita
        const pedFrame = createBox(0.96, 1.80, 0.05, materials.metalAnthracite);
        pedFrame.position.set(0.48, 0.90, 0);
        const pedWood = createBox(0.88, 1.70, 0.03, materials.facadeWood);
        pedWood.position.set(0.48, 0.90, 0);
        const pedHandle = createBox(0.04, 0.70, 0.04, materials.boltSilver);
        pedHandle.position.set(0.88, 0.95, 0.04);
        pedPivot.add(pedFrame);
        pedPivot.add(pedWood);
        pedPivot.add(pedHandle);
        pedPivot.rotation.y = 0.60; // Abierta hacia el interior
        pedGate.add(pedPivot);
        group.add(pedGate);

        // 3. PILASTRA DIVISORIA CENTRAL (X = -0.60 a -0.20, ancho 0.40m)
        const pilasterCenter = createBox(0.40, 1.95, 0.24, materials.facadeWhite);
        pilasterCenter.position.set(-0.40, 0.975, 11.20);
        const pilasterCoping = createBox(0.44, 0.05, 0.28, materials.metalAnthracite);
        pilasterCoping.position.set(-0.40, 1.975, 11.20);
        // Videoportero y buzón
        const intercom = createBox(0.16, 0.26, 0.03, materials.metalAnthracite);
        intercom.position.set(-0.40, 1.35, 11.33);
        const intercomCamera = createBox(0.04, 0.04, 0.04, materials.ledEmissiveCyan);
        intercomCamera.position.set(-0.40, 1.42, 11.34);
        const mailbox = createBox(0.24, 0.06, 0.03, materials.carAlloyRim);
        mailbox.position.set(-0.40, 1.05, 11.33);
        group.add(pilasterCenter);
        group.add(pilasterCoping);
        group.add(intercom);
        group.add(intercomCamera);
        group.add(mailbox);

        // 4. CANCELA DE VEHÍCULOS DE 2 HOJAS (3.15m DE ANCHO LIBRE: X = -0.20 a +2.95m)
        // TOTALMENTE LIBRE DE POSTES EN EL CENTRO!
        // El coche (SUV Kia) está centrado en X = 1.05m y tiene 1.86m de ancho (X = 0.12m a 1.98m).
        // Pasa con un margen holgado de 0.32m a la izquierda y 0.97m a la derecha!
        const vehicleGate = new THREE.Group();
        vehicleGate.name = "vehicleGateDoubleSwing";

        // Pilarete izquierdo de anclaje de bisagra (adosado a pilastra)
        const vHingePostL = createBox(0.06, 1.85, 0.06, materials.metalAnthracite);
        vHingePostL.position.set(-0.17, 0.925, 11.20);
        vehicleGate.add(vHingePostL);

        // Pilarete derecho de anclaje de bisagra (adosado a murete derecho)
        const vHingePostR = createBox(0.06, 1.85, 0.06, materials.metalAnthracite);
        vHingePostR.position.set(2.92, 0.925, 11.20);
        vehicleGate.add(vHingePostR);

        // HOJA 1 (IZQUIERDA, ancho 1.55m):
        // Pivote en X = -0.17m, Z = 11.20m. Abatible hacia adentro (rotación hacia -Z)
        const vLeafPivotL = new THREE.Group();
        vLeafPivotL.position.set(-0.17, 0.10, 11.20);
        // Bastidor perimetral en aluminio antracita
        const vLeafL_bottom = createBox(1.52, 0.08, 0.05, materials.metalAnthracite);
        vLeafL_bottom.position.set(0.76, 0.04, 0);
        const vLeafL_top = createBox(1.52, 0.08, 0.05, materials.metalAnthracite);
        vLeafL_top.position.set(0.76, 1.76, 0);
        const vLeafL_stileL = createBox(0.06, 1.80, 0.05, materials.metalAnthracite);
        vLeafL_stileL.position.set(0.03, 0.90, 0);
        const vLeafL_stileR = createBox(0.06, 1.80, 0.05, materials.metalAnthracite);
        vLeafL_stileR.position.set(1.49, 0.90, 0);
        vLeafPivotL.add(vLeafL_bottom);
        vLeafPivotL.add(vLeafL_top);
        vLeafPivotL.add(vLeafL_stileL);
        vLeafPivotL.add(vLeafL_stileR);
        // Lamas horizontales de diseño
        for (let s = 0; s < 7; s++) {
            const slat = createBox(1.42, 0.10, 0.03, materials.metalAnthracite);
            slat.position.set(0.76, 0.22 + s * 0.22, 0);
            vLeafPivotL.add(slat);
        }
        // Cerrojo de pie al suelo
        const boltL = createBox(0.02, 0.25, 0.02, materials.boltSilver);
        boltL.position.set(1.45, 0.15, 0.03);
        vLeafPivotL.add(boltL);

        // Ángulo de apertura hacia adentro (aparta la hoja contra la pilastra/pasillo, fuera de la vía del coche)
        vLeafPivotL.rotation.y = -1.35; // ~77 grados hacia el interior
        vehicleGate.add(vLeafPivotL);

        // HOJA 2 (DERECHA, ancho 1.55m):
        // Pivote en X = +2.92m, Z = 11.20m. Abatible hacia adentro (rotación hacia -Z)
        const vLeafPivotR = new THREE.Group();
        vLeafPivotR.position.set(2.92, 0.10, 11.20);
        const vLeafR_bottom = createBox(1.52, 0.08, 0.05, materials.metalAnthracite);
        vLeafR_bottom.position.set(-0.76, 0.04, 0);
        const vLeafR_top = createBox(1.52, 0.08, 0.05, materials.metalAnthracite);
        vLeafR_top.position.set(-0.76, 1.76, 0);
        const vLeafR_stileR = createBox(0.06, 1.80, 0.05, materials.metalAnthracite);
        vLeafR_stileR.position.set(-0.03, 0.90, 0);
        const vLeafR_stileL = createBox(0.06, 1.80, 0.05, materials.metalAnthracite);
        vLeafR_stileL.position.set(-1.49, 0.90, 0);
        vLeafPivotR.add(vLeafR_bottom);
        vLeafPivotR.add(vLeafR_top);
        vLeafPivotR.add(vLeafR_stileR);
        vLeafPivotR.add(vLeafR_stileL);
        for (let s = 0; s < 7; s++) {
            const slat = createBox(1.42, 0.10, 0.03, materials.metalAnthracite);
            slat.position.set(-0.76, 0.22 + s * 0.22, 0);
            vLeafPivotR.add(slat);
        }
        const boltR = createBox(0.02, 0.25, 0.02, materials.boltSilver);
        boltR.position.set(-1.45, 0.15, 0.03);
        vLeafPivotR.add(boltR);

        // Ángulo de apertura hacia adentro (aparta la hoja contra la pared derecha)
        vLeafPivotR.rotation.y = 1.35; // ~77 grados hacia el interior
        vehicleGate.add(vLeafPivotR);

        group.add(vehicleGate);

        // 5. Murete derecho de esquina (X = +2.95 a +3.50, ancho 0.55m)
        // Deja totalmente libre la salida del coche sin interferencias!
        const wallStreetR = createBox(0.55, 1.90, 0.22, materials.facadeWhite);
        wallStreetR.position.set(3.225, 0.95, 11.20);
        const wallCopingR = createBox(0.59, 0.05, 0.26, materials.metalAnthracite);
        wallCopingR.position.set(3.225, 1.92, 11.20);
        group.add(wallStreetR);
        group.add(wallCopingR);

        // Flores a lo largo del lateral de gravilla
        for (let fl = 0; fl < 7; fl++) {
            const zFlower = 6.2 + (fl * 0.65);
            const lavBush = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), materials.leafDarkGreen);
            lavBush.position.set(-2.95, 0.22, zFlower);
            const lavBloom = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.18, 6),
                fl % 2 === 0 ? materials.flowerLavenderDeep : materials.flowerLavenderLight
            );
            lavBloom.position.set(-2.95, 0.35, zFlower);
            group.add(lavBush);
            group.add(lavBloom);
        }

        // Muros medianeros laterales (Izquierdo y Derecho, largo 6.30m)// Muros medianeros laterales (Izquierdo y Derecho, largo 6.30m)
        const wallL = createBox(0.22, 1.90, 6.20, materials.partyWall);
        wallL.position.set(-3.39, 0.95, 7.99);
        const wallR = createBox(0.22, 1.90, 6.20, materials.partyWall);
        wallR.position.set(3.39, 0.95, 7.99);
        group.add(wallL);
        group.add(wallR);

        // ========================================================
        // MODERN ARCHITECTURAL CANTILEVERED PERGOLA (PÉRGOLA DE ACCESO)
        // Replaces the colliding porch column!
        // No columns in the vehicle trajectory or parking bay!
        // Clearance height: 2.80m (Above SUV roof with ample room)
        // ========================================================
        const pergolaGroup = new THREE.Group();
        pergolaGroup.name = "entrancePergola";

        // Longitudinal support beams in dark anthracite aluminum
        // Left beam (anchored along garden border)
        const beamL = createBox(0.14, 0.20, 3.30, materials.metalAnthracite);
        beamL.position.set(-2.20, 2.80, 6.55);
        // Right beam (anchored flush against right party wall, zero vehicle interference)
        const beamR = createBox(0.14, 0.20, 3.30, materials.metalAnthracite);
        beamR.position.set(3.35, 2.80, 6.55);
        // Front transverse header beam connecting both sides at Z = 8.10m
        const beamFront = createBox(5.69, 0.20, 0.14, materials.metalAnthracite);
        beamFront.position.set(0.575, 2.80, 8.15);
        pergolaGroup.add(beamL);
        pergolaGroup.add(beamR);
        pergolaGroup.add(beamFront);

        // Outer corner support posts strictly at perimeter party walls (ZERO interior posts!):
        // Left post flush with garden boundary wall
        const postL = createBox(0.14, 2.80, 0.14, materials.metalAnthracite);
        postL.position.set(-2.20, 1.40, 8.15);
        // Right post flush with right party wall (X = 3.35, car is at X = 1.10 -> 1.32m away!)
        const postR = createBox(0.14, 2.80, 0.14, materials.metalAnthracite);
        postR.position.set(3.35, 1.40, 8.15);
        pergolaGroup.add(postL);
        pergolaGroup.add(postR);

        // Bioclimatic / Architectural shading louvers (Lamas transversales de diseño)
        for (let l = 0; l < 10; l++) {
            const zPos = 5.15 + (l * 0.30);
            const louver = createBox(5.55, 0.06, 0.14, materials.metalAnthracite);
            louver.position.set(0.575, 2.86, zPos);
            pergolaGroup.add(louver);
        }

        // Laminated glass rain-canopy directly sheltering pedestrian entrance path
        const rainCanopy = createBox(2.20, 0.03, 1.60, materials.glass);
        rainCanopy.position.set(1.10, 2.72, 5.70);
        pergolaGroup.add(rainCanopy);

        // Integrated warm LED linear downlight on pergola beams
        const pergolaLight1 = new THREE.PointLight(0xffeedd, 1.4, 7);
        pergolaLight1.position.set(-0.5, 2.70, 6.8);
        const pergolaLight2 = new THREE.PointLight(0xffeedd, 1.4, 7);
        pergolaLight2.position.set(1.8, 2.70, 6.8);
        pergolaGroup.add(pergolaLight1);
        pergolaGroup.add(pergolaLight2);

        group.add(pergolaGroup);

        // Wall sconce light at entrance (Illumination)
        const sconce = createBox(0.1, 0.2, 0.1, materials.metalAnthracite);
        sconce.position.set(1.4, 2.1, 4.95);
        const entryLight = new THREE.PointLight(0xffedd5, 1.2, 6);
        entryLight.position.set(1.4, 2.0, 5.2);
        group.add(sconce);
        group.add(entryLight);

        // ==========================================
        // ADD KTM 1290 SUPER ADVENTURE S 2024 (Left side)
        // Positioned at X = -1.65, Z = 7.6 (alongside gravel border)
        // ==========================================
        // KTM 1290 Super Adventure S 2024 (Izquierda, X = -1.65m)
        ktmMesh = createKTM1290S2024();
        ktmMesh.position.set(-1.50, 0, 7.40);
        group.add(ktmMesh);

        // KIA Sportage 2025 (Derecha, X = +0.95m)
        // En los 5.00m de plaza: deja 1.55m libres tras el maletero para el giro de 1.30m de las puertas batientes
        kiaMesh = createKiaSportage2025();
        kiaMesh.position.set(1.05, 0, 7.40);
        group.add(kiaMesh);

        return group;
    }

    /* ----------------------------------------------------
       BUILD GROUND FLOOR (Planta Baja - 62.50 m²)
       Salón (20.18m²), Cocina (8.69m²), Entrada (11.42m²),
       Armario (1.46m²), Jardín Trasero (36.08m²)
       ---------------------------------------------------- */
    /* ----------------------------------------------------
       AUTHENTIC ARCHITECTURAL TWO-FLIGHT WINDER STAIRCASE
       Escalera de dos tramos con peldaños compensados en abanico
       100% FIEL A LOS PLANOS DEL DOSSIER (A4_plan_page_01.png):
       - Tramo 1 (Norte, Z = +0.46m): Sube de X = 0.88m hacia la medianera derecha (X = 2.38m)
       - Meseta en abanico (Este, X = 2.38m a 3.28m): 4 peldaños girando 180° adosados a la medianera
       - Tramo 2 (Sur, Z = -0.46m): Sube de X = 2.38m hacia el oeste hasta X = 0.88m
         y desembarca exactamente a Y = yBase + 3.00m en el DISTRIBUIDOR central!
       - Huella: 0.25m, Contrahuella: 0.1875m (16 peldaños x 0.1875m = 3.00m exactos)
       - Ancho de paso: 0.88m por tramo. Libre de cualquier pared u obstáculo.
       ---------------------------------------------------- */
    function createArchitecturalStaircase(yBase = 0) {
        const stairGroup = new THREE.Group();
        stairGroup.name = 'architecturalStaircase_' + yBase;

        const treadMat = materials.facadeWood;
        const riserMat = materials.interiorWall;
        const railMat = materials.metalAnthracite;
        const glassMat = materials.glassRailing;

        const stepW = 0.88;    // Ancho útil de cada tramo
        const zNorth = 0.46;   // Eje Tramo 1 (subida desde entrada/distribuidor hacia medianera)
        const zSouth = -0.46;  // Eje Tramo 2 (subida hacia desembarque en distribuidor)

        // TRAMO 1: 6 peldaños rectos subiendo hacia el Este (+X)
        for (let i = 0; i < 6; i++) {
            const x = 1.00 + (i * 0.25);
            const y = yBase + 0.10 + (i + 1) * 0.1875;
            const tread = createBox(0.26, 0.04, stepW, treadMat);
            tread.position.set(x, y, zNorth);
            const riser = createBox(0.03, 0.1875, stepW, riserMat);
            riser.position.set(x - 0.115, y - 0.08, zNorth);
            stairGroup.add(tread);
            stairGroup.add(riser);
        }

        // MESETA EN ABANICO (4 peldaños girando 180° adosados a la medianera derecha X = 3.28m)
        // Peldaño 7 (Sector noreste, llegada del tramo 1)
        const w7 = createBox(0.90, 0.04, 0.48, treadMat);
        w7.position.set(2.83, yBase + 0.10 + 7 * 0.1875, 0.68);
        const r7 = createBox(0.90, 0.1875, 0.03, riserMat);
        r7.position.set(2.83, yBase + 0.10 + 6.5 * 0.1875, 0.45);
        stairGroup.add(w7);
        stairGroup.add(r7);

        // Peldaño 8 (Sector este-norte)
        const w8 = createBox(0.90, 0.04, 0.45, treadMat);
        w8.position.set(2.83, yBase + 0.10 + 8 * 0.1875, 0.23);
        stairGroup.add(w8);

        // Peldaño 9 (Sector este-sur)
        const w9 = createBox(0.90, 0.04, 0.45, treadMat);
        w9.position.set(2.83, yBase + 0.10 + 9 * 0.1875, -0.23);
        stairGroup.add(w9);

        // Peldaño 10 (Sector sureste, arranque del tramo 2)
        const w10 = createBox(0.90, 0.04, 0.48, treadMat);
        w10.position.set(2.83, yBase + 0.10 + 10 * 0.1875, -0.68);
        stairGroup.add(w10);

        // TRAMO 2: 6 peldaños rectos subiendo hacia el Oeste (-X) hacia el Distribuidor
        for (let i = 0; i < 6; i++) {
            const x = 2.25 - (i * 0.25);
            const y = yBase + 0.10 + (11 + i) * 0.1875;
            const tread = createBox(0.26, 0.04, stepW, treadMat);
            tread.position.set(x, y, zSouth);
            const riser = createBox(0.03, 0.1875, stepW, riserMat);
            riser.position.set(x + 0.115, y - 0.08, zSouth);
            stairGroup.add(tread);
            stairGroup.add(riser);
        }

        // BARANDILLA CENTRAL (Ojo de escalera en Z = 0.00m)
        const centerRailGlass = createBox(1.50, 0.90, 0.03, glassMat);
        centerRailGlass.position.set(1.63, yBase + 1.55, 0.00);
        const centerHandrail = createBox(1.52, 0.05, 0.05, railMat);
        centerHandrail.position.set(1.63, yBase + 2.02, 0.00);
        stairGroup.add(centerRailGlass);
        stairGroup.add(centerHandrail);

        // Zanca / viga perimetral de soporte adosada a la medianera (X = 3.26m)
        const wallStringer = createBox(0.04, 0.28, 1.84, railMat);
        wallStringer.position.set(3.26, yBase + 1.50, 0.00);
        stairGroup.add(wallStringer);

        return stairGroup;
    }

    function buildGroundFloor() {
        const group = new THREE.Group();
        group.name = "groundFloor";

        // Parquet floor slab
        const slab = createBox(6.56, 0.20, 9.78, materials.floorParquet);
        slab.position.set(0, 0.10, 0);
        group.add(slab);

        // Party Walls (Left & Right) - Altura exacta 3.00m para cerrar forjados sin holguras
        const leftWall = createBox(0.22, 3.00, 10.0, materials.partyWall);
        leftWall.position.set(-3.39, 1.50, 0);
        const rightWall = createBox(0.22, 3.00, 10.0, materials.partyWall);
        rightWall.position.set(3.39, 1.50, 0);
        group.add(leftWall);
        group.add(rightWall);

        // Fachada frontal ajustada al milímetro entre medianeras (X = -3.28m a +3.28m, CERO solape en vértices)
        // Murete izquierdo: X = -3.28m a -0.10m (ancho 3.18m, centro X = -1.69m)
        const frontWallL = createBox(3.18, 3.00, 0.22, materials.facadeWhite);
        frontWallL.position.set(-1.69, 1.50, 4.89);
        // Murete derecho: X = +1.30m a +3.28m (ancho 1.98m, centro X = +2.29m)
        const frontWallR = createBox(1.98, 3.00, 0.22, materials.facadeWhite);
        frontWallR.position.set(2.29, 1.50, 4.89);
        group.add(frontWallL);
        group.add(frontWallR);

        // Front Door & Wood Surround
        const doorWoodNiche = createBox(1.4, 2.5, 0.06, materials.facadeWood);
        doorWoodNiche.position.set(0.6, 1.35, 4.92);
        const frontDoor = createBox(1.0, 2.3, 0.08, materials.metalAnthracite);
        frontDoor.position.set(0.6, 1.25, 4.96);
        group.add(doorWoodNiche);
        group.add(frontDoor);

        // Kitchen Window (PVC Anthracite Double Glazing)
        const winKitchen = createBox(1.4, 1.2, 0.08, materials.glass);
        winKitchen.position.set(-1.8, 1.6, 4.92);
        const frameKitchen = createBox(1.48, 1.28, 0.12, materials.metalAnthracite);
        frameKitchen.position.set(-1.8, 1.6, 4.9);
        group.add(winKitchen);
        group.add(frameKitchen);

        // Fachada trasera ajustada entre medianeras (X = -3.28m a +3.28m, CERO solape en esquinas)
        // Puertavidriera corredera en X = -2.20m a +2.20m (4.40m)
        // Murete izquierdo: X = -3.28m a -2.20m (ancho 1.08m, centro X = -2.74m)
        const rearWallL = createBox(1.08, 3.00, 0.22, materials.facadeWhite);
        rearWallL.position.set(-2.74, 1.50, -4.89);
        // Murete derecho: X = +2.20m a +3.28m (ancho 1.08m, centro X = +2.74m)
        const rearWallR = createBox(1.08, 3.00, 0.22, materials.facadeWhite);
        rearWallR.position.set(2.74, 1.50, -4.89);
        // Dintel superior de fachada blanca (cierra el muro hasta forjado superior Y = 3.00m)
        const rearHeaderGround = createBox(4.40, 0.51, 0.22, materials.facadeWhite);
        rearHeaderGround.position.set(0, 2.745, -4.89);
        group.add(rearWallL);
        group.add(rearWallR);
        group.add(rearHeaderGround);

        // PUERTAVIDRIERA CORREDERA PANORÁMICA DE 4.40m AL JARDÍN
        // 100% TRANSPARENTE CON PERFILERÍA MINIMALISTA EN ALUMINIO ANTRACITA
        const slidingDoorGroup = new THREE.Group();
        slidingDoorGroup.name = "panoramicGardenGlassDoor";

        // Cerco perimetral exterior
        const sFrameTop = createBox(4.40, 0.08, 0.12, materials.metalAnthracite);
        sFrameTop.position.set(0, 2.45, -4.89);
        const sFrameBottom = createBox(4.40, 0.04, 0.12, materials.metalAnthracite);
        sFrameBottom.position.set(0, 0.12, -4.89);
        const sFrameJambL = createBox(0.08, 2.37, 0.12, materials.metalAnthracite);
        sFrameJambL.position.set(-2.16, 1.30, -4.89);
        const sFrameJambR = createBox(0.08, 2.37, 0.12, materials.metalAnthracite);
        sFrameJambR.position.set(2.16, 1.30, -4.89);
        slidingDoorGroup.add(sFrameTop);
        slidingDoorGroup.add(sFrameBottom);
        slidingDoorGroup.add(sFrameJambL);
        slidingDoorGroup.add(sFrameJambR);

        // Hoja corredera 1 (Izquierda, carril interior Z = -4.86m)
        const leaf1Glass = createBox(2.16, 2.22, 0.02, materials.glass);
        leaf1Glass.position.set(-1.08, 1.30, -4.86);
        const leaf1StileL = createBox(0.05, 2.26, 0.04, materials.metalAnthracite);
        leaf1StileL.position.set(-2.13, 1.30, -4.86);
        const leaf1StileR = createBox(0.05, 2.26, 0.04, materials.metalAnthracite);
        leaf1StileR.position.set(-0.03, 1.30, -4.86);
        const leaf1RailT = createBox(2.16, 0.05, 0.04, materials.metalAnthracite);
        leaf1RailT.position.set(-1.08, 2.41, -4.86);
        const leaf1RailB = createBox(2.16, 0.05, 0.04, materials.metalAnthracite);
        leaf1RailB.position.set(-1.08, 0.18, -4.86);
        const handle1 = createBox(0.03, 0.60, 0.03, materials.boltSilver);
        handle1.position.set(-0.08, 1.15, -4.82);
        slidingDoorGroup.add(leaf1Glass);
        slidingDoorGroup.add(leaf1StileL);
        slidingDoorGroup.add(leaf1StileR);
        slidingDoorGroup.add(leaf1RailT);
        slidingDoorGroup.add(leaf1RailB);
        slidingDoorGroup.add(handle1);

        // Hoja corredera 2 (Derecha, carril exterior Z = -4.92m)
        const leaf2Glass = createBox(2.16, 2.22, 0.02, materials.glass);
        leaf2Glass.position.set(1.08, 1.30, -4.92);
        const leaf2StileL = createBox(0.05, 2.26, 0.04, materials.metalAnthracite);
        leaf2StileL.position.set(0.03, 1.30, -4.92);
        const leaf2StileR = createBox(0.05, 2.26, 0.04, materials.metalAnthracite);
        leaf2StileR.position.set(2.13, 1.30, -4.92);
        const leaf2RailT = createBox(2.16, 0.05, 0.04, materials.metalAnthracite);
        leaf2RailT.position.set(1.08, 2.41, -4.92);
        const leaf2RailB = createBox(2.16, 0.05, 0.04, materials.metalAnthracite);
        leaf2RailB.position.set(1.08, 0.18, -4.92);
        const handle2 = createBox(0.03, 0.60, 0.03, materials.boltSilver);
        handle2.position.set(0.08, 1.15, -4.96);
        slidingDoorGroup.add(leaf2Glass);
        slidingDoorGroup.add(leaf2StileL);
        slidingDoorGroup.add(leaf2StileR);
        slidingDoorGroup.add(leaf2RailT);
        slidingDoorGroup.add(leaf2RailB);
        slidingDoorGroup.add(handle2);

        group.add(slidingDoorGroup);

        // ========================================================
        // TABIQUERÍA DE COCINA Y ENTRADA SEGÚN PLANO ORIGINAL:
        // - Pared entre Cocina y Entrada: CONTINUA Y CIEGA (sin puerta)
        // - PUERTA DE COCINA (enmarcada en rojo por el usuario):
        //   Comunica directamente Cocina (8.69 m²) con Salón (20.18 m²),
        //   con hoja abatible hacia el interior de la cocina.
        // ========================================================
        // Pared divisoria continua entre Cocina y Entrada (X = -0.50m, Z = 1.60m a 4.89m, largo 3.29m)
        const kitchenHallWall = createBox(0.12, 2.70, 3.29, materials.interiorWall);
        kitchenHallWall.position.set(-0.50, 1.45, 3.245);
        group.add(kitchenHallWall);

        // Pared divisoria entre Cocina y Salón (Z = 1.60m) con hueco de puerta:
        // Tramo izquierdo (desde medianera X = -3.28m hasta jamba X = -1.55m, ancho 1.73m)
        const kitchenBackWallL = createBox(1.73, 2.70, 0.12, materials.interiorWall);
        kitchenBackBackL = kitchenBackWallL;
        kitchenBackWallL.position.set(-2.415, 1.45, 1.60);
        // Dintel sobre puerta de cocina (ancho 0.85m, alto 0.60m)
        const kitchenDoorHeader = createBox(0.85, 0.60, 0.12, materials.interiorWall);
        kitchenDoorHeader.position.set(-1.125, 2.40, 1.60);
        // Murete derecho junto a paso de entrada (desde X = -0.70m hasta X = -0.50m, ancho 0.20m)
        const kitchenBackWallR = createBox(0.20, 2.70, 0.12, materials.interiorWall);
        kitchenBackWallR.position.set(-0.60, 1.45, 1.60);
        group.add(kitchenBackWallL);
        group.add(kitchenDoorHeader);
        group.add(kitchenBackWallR);

        // PUERTA DE COCINA (SEÑALADA EN ROJO):
        // Hueco entre X = -1.55m y X = -0.70m en pared Z = 1.60m
        // Bisagra en la jamba derecha (X = -0.70m), abatiendo hacia el interior de la cocina (+Z)
        const kitchenDoor = createInteriorDoor(0.85, 2.10, materials.doorFrame, materials.doorLeaf, 0.85);
        kitchenDoor.position.set(-1.125, 0.10, 1.60);
        kitchenDoor.rotation.y = Math.PI; // Hacia el interior de la cocina
        group.add(kitchenDoor);

        // ========================================================
        // ARMARIO DE ENTRADA (1.46 m²) Y ESCALERA A PLANTA PRIMERA
        // EXACTO A LOS PLANOS: TOTALMENTE SEPARADOS, CERO COLISIÓN
        // ESCALERA PEGADA 100% A LA MEDIANERA DERECHA (X = 3.28m)
        // ========================================================

        // 1. ARMARIO 1.46 m² (Recinto cerrado con puerta abatible a la Entrada)
        // Situado al norte de la escalera (Z = 0.95m a 2.15m, X = 1.85m a 3.28m)
        // Completamente independiente de la escalera, separado por tabique ciego.
        const closetFrontWall = createBox(1.43, 2.70, 0.10, materials.interiorWall);
        closetFrontWall.position.set(2.565, 1.45, 2.15); // Fachada frontal hacia entrada
        const closetBackWall = createBox(1.43, 2.70, 0.10, materials.interiorWall);
        closetBackWall.position.set(2.565, 1.45, 0.95);  // Separa el armario del arranque de la escalera
        const closetSideWall = createBox(0.10, 2.70, 1.20, materials.interiorWall);
        closetSideWall.position.set(1.85, 1.45, 1.55);
        group.add(closetFrontWall);
        group.add(closetBackWall);
        group.add(closetSideWall);

        // Puerta de paso del armario (0.75m ancho, abatiendo hacia la Entrada en Z = 2.15m)
        const closetDoor = createInteriorDoor(0.75, 2.10, materials.doorFrame, materials.doorLeaf, 0.75);
        closetDoor.position.set(2.35, 0.10, 2.15);
        closetDoor.rotation.y = Math.PI; // Abre hacia el vestíbulo de entrada
        group.add(closetDoor);

        // Módulo interior del armario (estantes y barra perchero)
        const closetBody = createBox(1.20, 2.20, 0.65, materials.furnitureWhite);
        closetBody.position.set(2.565, 1.20, 1.55);
        group.add(closetBody);

        // 2. ESCALERA DE DOS TRAMOS SEGÚN PLANOS ORIGINALES
        // Arranca en el distribuidor de entrada (X = 0.88m, Z = +0.46m) subiendo al Este,
        // gira 180° en abanico y desembarca a Y = 3.00m en el Distribuidor de Planta Primera.
        const stairGroundToFirst = createArchitecturalStaircase(0);
        group.add(stairGroundToFirst);

        // LIVING ROOM (Salón-Comedor 20.18 m²)
        // Designer Chaise Longue Sofa (Light Grey Nordic fabric)
        const sofaBase = createBox(2.6, 0.45, 1.8, materials.furnitureFabric);
        sofaBase.position.set(0.8, 0.35, -2.4);
        const sofaBack = createBox(2.6, 0.48, 0.32, materials.furnitureFabric);
        sofaBack.position.set(0.8, 0.65, -3.2);
        const sofaCushion1 = createBox(0.6, 0.35, 0.12, materials.facadeWood);
        sofaCushion1.position.set(0.2, 0.7, -3.0);
        group.add(sofaBase);
        group.add(sofaBack);
        group.add(sofaCushion1);

        // Minimalist Coffee Table & Large Rug
        const rug = createBox(3.0, 0.02, 2.4, materials.furnitureWhite);
        rug.position.set(0.8, 0.21, -2.2);
        const coffeeTable = createBox(1.2, 0.38, 0.7, materials.furnitureWood);
        coffeeTable.position.set(0.8, 0.4, -2.0);
        group.add(rug);
        group.add(coffeeTable);

        // Wall TV Unit & 65" Ultra HD OLED TV
        const tvUnit = createBox(2.4, 0.4, 0.42, materials.metalAnthracite);
        tvUnit.position.set(2.95, 0.38, -2.2);
        const tvScreen = createBox(0.06, 0.9, 1.55, materials.metalAnthracite);
        tvScreen.position.set(3.22, 1.3, -2.2);
        group.add(tvUnit);
        group.add(tvScreen);

        // Dining Table with 6 Nordic Chairs
        const tableTop = createBox(1.9, 0.06, 0.95, materials.furnitureWood);
        tableTop.position.set(-1.8, 0.75, -2.5);
        const tableLegL = createBox(0.08, 0.72, 0.85, materials.metalAnthracite);
        tableLegL.position.set(-2.6, 0.38, -2.5);
        const tableLegR = createBox(0.08, 0.72, 0.85, materials.metalAnthracite);
        tableLegR.position.set(-1.0, 0.38, -2.5);
        group.add(tableTop);
        group.add(tableLegL);
        group.add(tableLegR);

        for (let x = -2.3; x <= -1.3; x += 0.5) {
            const chair1 = createBox(0.42, 0.82, 0.42, materials.furnitureFabric);
            chair1.position.set(x, 0.5, -1.8);
            const chair2 = createBox(0.42, 0.82, 0.42, materials.furnitureFabric);
            chair2.position.set(x, 0.5, -3.2);
            group.add(chair1);
            group.add(chair2);
        }

        // KITCHEN (8.69 m² - Distribución ergonómica según plano original)
        // Bancada principal lineal a lo largo de la medianera (X = -2.95m, fondo 0.65m)
        const kitchenCounterL = createBox(0.65, 0.92, 2.65, materials.furnitureWhite);
        kitchenCounterL.position.set(-2.95, 0.66, 3.425);
        const quartzTop = createBox(0.68, 0.06, 2.70, materials.furnitureWhite);
        quartzTop.position.set(-2.95, 1.15, 3.425);
        group.add(kitchenCounterL);
        group.add(quartzTop);

        // Retorno bajo ventana frontal (X = -1.85m, Z = 4.55m, fondo 0.65m)
        const kitchenCounterFront = createBox(1.50, 0.92, 0.65, materials.furnitureWhite);
        kitchenCounterFront.position.set(-1.85, 0.66, 4.55);
        const quartzFront = createBox(1.52, 0.06, 0.68, materials.furnitureWhite);
        quartzFront.position.set(-1.85, 1.15, 4.55);
        group.add(kitchenCounterFront);
        group.add(quartzFront);

        // Columna Frigorífico combi en esquina ciega (X = -2.95m, Z = 1.95m)
        const fridgeColumn = createBox(0.65, 2.10, 0.65, materials.metalAnthracite);
        fridgeColumn.position.set(-2.95, 1.15, 1.95);
        const fridgeHandle = createBox(0.03, 0.70, 0.03, materials.boltSilver);
        fridgeHandle.position.set(-2.61, 1.25, 2.10);
        group.add(fridgeColumn);
        group.add(fridgeHandle);

        // Placa de Inducción y Campana Extractora de Acero Inoxidable
        const hob = createBox(0.55, 0.02, 0.60, materials.metalAnthracite);
        hob.position.set(-2.95, 1.19, 3.20);
        const hood = createBox(0.60, 0.40, 0.50, materials.metalAnthracite);
        hood.position.set(-2.95, 2.20, 3.20);
        group.add(hob);
        group.add(hood);

        // Fregadero bajo encimera con grifo de caño alto
        const sink = createBox(0.48, 0.02, 0.55, materials.carAlloyRim);
        sink.position.set(-2.95, 1.185, 4.10);
        const faucet = createBox(0.04, 0.28, 0.12, materials.boltSilver);
        faucet.position.set(-3.15, 1.32, 4.10);
        group.add(sink);
        group.add(faucet);

        // REAR PRIVATE GARDEN (36.08 m² - Z = -5.0m to -11.0m)
        const lawn = createBox(7.0, 0.16, 6.0, materials.floorGrass);
        lawn.position.set(0, 0.08, -8.0);
        group.add(lawn);

        // Paved dining terrace
        const gardenTerrace = createBox(6.56, 0.19, 2.40, materials.floorPaving);
        gardenTerrace.position.set(0, 0.10, -6.09);
        group.add(gardenTerrace);

        // Modern Anthracite Bioclimatic Pergola (as in dossier)
        const pergolaRoof = createBox(4.4, 0.12, 2.4, materials.metalAnthracite);
        pergolaRoof.position.set(0.6, 2.65, -6.1);
        const post1 = createBox(0.14, 2.65, 0.14, materials.metalAnthracite);
        post1.position.set(-1.5, 1.32, -7.2);
        const post2 = createBox(0.14, 2.65, 0.14, materials.metalAnthracite);
        post2.position.set(2.7, 1.32, -7.2);
        group.add(pergolaRoof);
        group.add(post1);
        group.add(post2);

        // Outdoor dining set under pergola
        const outdoorTable = createBox(1.8, 0.75, 0.9, materials.furnitureWood);
        outdoorTable.position.set(0.6, 0.55, -6.1);
        group.add(outdoorTable);

        // Perimeter garden walls
        const wallBack = createBox(7.00, 1.85, 0.22, materials.partyWall);
        wallBack.position.set(0, 0.92, -11.0);
        wallBack.name = "gardenWallBack";
        const wallSideL = createBox(0.22, 1.85, 6.0, materials.partyWall);
        wallSideL.position.set(-3.39, 0.92, -8.0);
        wallSideL.name = "gardenWallSideL";
        const wallSideR = createBox(0.22, 1.85, 6.0, materials.partyWall);
        wallSideR.position.set(3.39, 0.92, -8.0);
        wallSideR.name = "gardenWallSideR";
        group.add(wallBack);
        group.add(wallSideL);
        group.add(wallSideR);

        // MINIHUERTA URBANA & PARTERRES DE FLORES (Jardín Privado 36 m²)
        const floraGroup = buildGardenFloraAndVeggiePatch();
        group.add(floraGroup);

        return group;
    }

    /* ----------------------------------------------------
       BUILD HYPER-REALISTIC GARDEN FLORA & MINIHUERTA ECOLÓGICA
       Multi-tiered raised beds, natural lettuces, tomato vines with clusters,
       strawberries, herbs, watering can, tool accessories, lavender & flower hedges
       ---------------------------------------------------- */
    function buildGardenFloraAndVeggiePatch() {
        const flora = new THREE.Group();
        flora.name = "gardenFloraAndVeggiePatch";

        // 0. SLATE STEPPING STONES PATHWAY THROUGH LAWN
        for (let s = 0; s < 6; s++) {
            const stone = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.26, 0.04, 8),
                materials.floorPaving
            );
            stone.position.set(-1.0 + Math.sin(s * 0.8) * 0.25, 0.11, -6.8 - (s * 0.65));
            stone.rotation.y = s * 0.5;
            flora.add(stone);
        }

        // Helper: Create a hyper-realistic wooden raised bed with iron corner brackets & bolts
        function createRealisticRaisedBed(w, h, d, x, y, z) {
            const bedGroup = new THREE.Group();

            // Main timber box
            const box = createBox(w, h, d, materials.planterWood);
            box.position.set(x, y, z);
            bedGroup.add(box);

            // Stacked plank horizontal groove line
            const groove = createBox(w + 0.01, 0.02, d + 0.01, materials.bracketIron);
            groove.position.set(x, y, z);
            bedGroup.add(groove);

            // Top rim capping
            const topRim = createBox(w + 0.06, 0.04, d + 0.06, materials.planterWood);
            topRim.position.set(x, y + h / 2 + 0.02, z);
            bedGroup.add(topRim);

            // Rich dark organic soil with slight elevation
            const soil = createBox(w - 0.08, h - 0.04, d - 0.08, materials.soilDark);
            soil.position.set(x, y + 0.02, z);
            bedGroup.add(soil);

            // 4 Iron L-Corner Brackets with silver bolts
            const hw = w / 2;
            const hd = d / 2;
            const corners = [
                [x - hw, z - hd],
                [x + hw, z - hd],
                [x - hw, z + hd],
                [x + hw, z + hd]
            ];
            corners.forEach(([cx, cz]) => {
                const bracket = createBox(0.06, h * 0.88, 0.06, materials.bracketIron);
                bracket.position.set(cx, y, cz);
                bedGroup.add(bracket);

                for (let b = 0; b < 2; b++) {
                    const bolt = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6),
                        materials.boltSilver
                    );
                    bolt.rotation.x = Math.PI / 2;
                    bolt.position.set(cx, y - 0.1 + b * 0.2, cz + 0.035);
                    bedGroup.add(bolt);
                }
            });

            return bedGroup;
        }

        // Helper: Create a hyper-realistic Batavia / Oakleaf ruffled lettuce head
        function createRealisticLettuce(x, y, z, scale = 1.0) {
            const lg = new THREE.Group();
            lg.position.set(x, y, z);
            lg.scale.set(scale, scale * 0.75, scale);

            // Tier 1: Outer ruffled dark green leaves
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2;
                const leaf = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 7, 7, 0, Math.PI),
                    materials.leafDarkGreen
                );
                leaf.rotation.x = Math.PI / 2.3;
                leaf.rotation.z = angle;
                leaf.position.set(Math.cos(angle) * 0.08, 0.02, Math.sin(angle) * 0.08);
                leaf.scale.set(0.9, 1.3, 0.5);
                lg.add(leaf);
            }

            // Tier 2: Mid-layer crisp vibrant green leaves
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2 + 0.4;
                const leaf = new THREE.Mesh(
                    new THREE.SphereGeometry(0.10, 7, 7, 0, Math.PI),
                    materials.leafGreen
                );
                leaf.rotation.x = Math.PI / 2.6;
                leaf.rotation.z = angle;
                leaf.position.set(Math.cos(angle) * 0.05, 0.05, Math.sin(angle) * 0.05);
                leaf.scale.set(0.85, 1.2, 0.6);
                lg.add(leaf);
            }

            // Tier 3: Inner tender heart (lime green rosette)
            for (let k = 0; k < 4; k++) {
                const angle = (k / 4) * Math.PI * 2 + 0.8;
                const heart = new THREE.Mesh(
                    new THREE.SphereGeometry(0.07, 6, 6, 0, Math.PI),
                    materials.leafTenderGreen
                );
                heart.rotation.x = Math.PI / 3.0;
                heart.rotation.z = angle;
                heart.position.set(Math.cos(angle) * 0.03, 0.08, Math.sin(angle) * 0.03);
                heart.scale.set(0.8, 1.1, 0.7);
                lg.add(heart);
            }

            return lg;
        }

        // Helper: Create a strawberry plant with leaves, white flowers and red berries
        function createStrawberryPlant(x, y, z) {
            const sg = new THREE.Group();
            sg.position.set(x, y, z);

            // Leaves (Trifoliate clusters)
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0), materials.leafGreen);
                leaf.scale.set(1.4, 0.4, 1.0);
                leaf.position.set(Math.cos(angle) * 0.1, 0.04, Math.sin(angle) * 0.1);
                leaf.rotation.y = angle;
                sg.add(leaf);
            }

            // White 5-petal flower with gold center
            const flCenter = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), materials.flowerYellow);
            flCenter.position.set(0.04, 0.08, 0.04);
            sg.add(flCenter);
            for (let p = 0; p < 5; p++) {
                const pAngle = (p / 5) * Math.PI * 2;
                const petal = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 5), materials.flowerWhite);
                petal.position.set(0.04 + Math.cos(pAngle) * 0.03, 0.08, 0.04 + Math.sin(pAngle) * 0.03);
                petal.scale.set(0.9, 0.3, 0.9);
                sg.add(petal);
            }

            // Ripe red strawberry fruit
            const berry = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.065, 7), materials.strawberryRed);
            berry.rotation.x = Math.PI - 0.2;
            berry.position.set(-0.06, 0.05, -0.04);
            sg.add(berry);

            return sg;
        }

        // ==========================================
        // 1. MINIHUERTA BANCAL 1: HORTALIZAS & FRESAS
        // ==========================================
        flora.add(createRealisticRaisedBed(1.9, 0.40, 0.9, -2.2, 0.28, -8.5));

        // Rows of Batavia & Oakleaf lettuces
        for (let col = 0; col < 4; col++) {
            const lx = -2.8 + col * 0.38;
            flora.add(createRealisticLettuce(lx, 0.48, -8.7, 0.95 + (col % 2) * 0.15));
            flora.add(createRealisticLettuce(lx + 0.18, 0.48, -8.32, 0.9 + (col % 3) * 0.1));
        }

        // Interspersed strawberry clusters
        flora.add(createStrawberryPlant(-1.55, 0.48, -8.65));
        flora.add(createStrawberryPlant(-1.55, 0.48, -8.35));

        // ==========================================
        // 2. MINIHUERTA BANCAL 2: TOMATERAS & AROMÁTICAS
        // ==========================================
        flora.add(createRealisticRaisedBed(1.9, 0.40, 0.9, -2.2, 0.28, -9.8));

        // Bamboo A-Frame Trellis Structure with Jute Twine ties
        for (let t = 0; t < 4; t++) {
            const bx = -2.85 + (t * 0.42);

            // Left & Right cane forming A-frame
            const caneL = createBox(0.026, 1.25, 0.026, materials.furnitureWood);
            caneL.position.set(bx, 0.90, -9.95);
            caneL.rotation.z = 0.08;
            const caneR = createBox(0.026, 1.25, 0.026, materials.furnitureWood);
            caneR.position.set(bx, 0.90, -9.65);
            caneR.rotation.z = -0.08;
            flora.add(caneL);
            flora.add(caneR);

            // Twine wrap knot at top apex
            const twine = createBox(0.06, 0.04, 0.06, materials.twineJute);
            twine.position.set(bx, 1.35, -9.80);
            flora.add(twine);

            // Lush Climbing Tomato Vine
            for (let v = 0; v < 4; v++) {
                const vy = 0.6 + (v * 0.22);
                const leafCluster = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.14, 0),
                    materials.leafDarkGreen
                );
                leafCluster.scale.set(1.4, 0.6, 1.2);
                leafCluster.position.set(bx + (v % 2 === 0 ? 0.06 : -0.06), vy, -9.80 + (v % 2 === 0 ? 0.05 : -0.05));
                flora.add(leafCluster);
            }

            // Tomato Fruit Clusters in multi-stages of ripeness!
            // 1. Green baby tomatoes
            const gTom = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), materials.tomatoGreen);
            gTom.position.set(bx + 0.08, 1.05, -9.75);
            flora.add(gTom);

            // 2. Orange transitioning tomato
            const oTom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.tomatoOrange);
            oTom.position.set(bx - 0.07, 0.88, -9.76);
            flora.add(oTom);

            // 3. Ripe, glossy red tomatoes with green calyx star
            for (let r = 0; r < 2; r++) {
                const redTom = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), materials.tomatoRipeRed);
                redTom.position.set(bx + (r === 0 ? -0.06 : 0.07), 0.68 + (r * 0.12), -9.82 + (r * 0.08));

                // 5-point green star calyx on top
                const calyx = new THREE.Mesh(new THREE.DodecahedronGeometry(0.025, 0), materials.leafGreen);
                calyx.scale.set(1.2, 0.3, 1.2);
                calyx.position.set(redTom.position.x, redTom.position.y + 0.045, redTom.position.z);
                flora.add(redTom);
                flora.add(calyx);
            }

            // Yellow star-shaped blossom
            const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.02, 0), materials.flowerYellow);
            blossom.position.set(bx, 1.18, -9.74);
            flora.add(blossom);
        }

        // Top Horizontal Bamboo Connecting Rail across all 4 A-frames
        const topRail = createBox(1.7, 0.028, 0.028, materials.furnitureWood);
        topRail.position.set(-2.2, 1.34, -9.80);
        flora.add(topRail);

        // Aromatic Herbs Corner in Bed 2 (Romero, Albahaca, Menta)
        // Romero (Rosemary Bush)
        for (let rm = 0; rm < 3; rm++) {
            const rosemary = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 7), materials.leafDarkGreen);
            rosemary.position.set(-1.48, 0.62, -9.5 - (rm * 0.24));
            flora.add(rosemary);
        }
        // Albahaca (Sweet Basil)
        for (let b = 0; b < 2; b++) {
            const basil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 7), materials.leafGreen);
            basil.scale.set(1.2, 0.8, 1.2);
            basil.position.set(-1.48, 0.54, -9.85 - (b * 0.22));
            flora.add(basil);
        }

        // ==========================================
        // 3. GARDEN ACCESORIES & PROPS
        // ==========================================
        // Engraved Wooden Sign "Huerto Ecológico"
        const signPost = createBox(0.04, 0.65, 0.04, materials.planterWood);
        signPost.position.set(-1.10, 0.40, -8.45);
        const signBoard = createBox(0.36, 0.20, 0.025, materials.planterWood);
        signBoard.position.set(-1.10, 0.62, -8.45);
        flora.add(signPost);
        flora.add(signBoard);

        // Weathered Zinc & Brass Watering Can (Regadera tradicional)
        const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.26, 12), materials.bracketIron);
        canBody.position.set(-1.12, 0.22, -9.35);
        const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.024, 0.24, 8), materials.bracketIron);
        canSpout.position.set(-1.12, 0.26, -9.20);
        canSpout.rotation.x = -0.7;
        const canRose = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.03, 8), materials.twineJute);
        canRose.position.set(-1.12, 0.34, -9.10);
        canRose.rotation.x = -0.7;
        const canHandle = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.012, 6, 12, Math.PI), materials.bracketIron);
        canHandle.position.set(-1.12, 0.36, -9.35);
        canHandle.rotation.z = Math.PI;
        flora.add(canBody);
        flora.add(canSpout);
        flora.add(canRose);
        flora.add(canHandle);

        // Garden hand trowel (Palita de jardinería) resting on bed 1
        const trowelHandle = createBox(0.02, 0.02, 0.12, materials.furnitureWood);
        trowelHandle.position.set(-1.3, 0.52, -8.85);
        const trowelBlade = createBox(0.05, 0.01, 0.10, materials.bracketIron);
        trowelBlade.position.set(-1.3, 0.51, -8.74);
        flora.add(trowelHandle);
        flora.add(trowelBlade);

        // ==========================================
        // 4. PARTERRES DE FLORES: LAVANDAS, HORTENSIAS & ROSALES
        // ==========================================
        // Parterre posterior a lo largo del muro (Z = -10.65m)
        const flowerBedBack = createBox(4.6, 0.20, 0.65, materials.soilDark);
        flowerBedBack.position.set(0.9, 0.15, -10.65);
        flora.add(flowerBedBack);

        // Macizos de Lavanda Realista con espigas a dos tonos
        for (let l = 0; l < 9; l++) {
            const lx = -1.1 + (l * 0.48);
            // Foliage base
            const lavMound = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 8), materials.leafDarkGreen);
            lavMound.scale.set(1.2, 0.8, 1.2);
            lavMound.position.set(lx, 0.32, -10.65);
            flora.add(lavMound);

            // Clustered purple flower spikes
            for (let sp = 0; sp < 6; sp++) {
                const spAngle = (sp / 6) * Math.PI * 2;
                const spHeight = 0.24 + (sp % 3) * 0.06;
                const spike = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.022, spHeight, 6),
                    sp % 2 === 0 ? materials.flowerLavenderDeep : materials.flowerLavenderLight
                );
                spike.position.set(
                    lx + Math.cos(spAngle) * 0.10,
                    0.46 + spHeight / 2,
                    -10.65 + Math.sin(spAngle) * 0.10
                );
                spike.rotation.z = (Math.random() - 0.5) * 0.2;
                flora.add(spike);
            }
        }

        // Parterre lateral derecho (X = 3.15m) con Hortensias y Rosales
        const flowerBedRight = createBox(0.65, 0.20, 3.8, materials.soilDark);
        flowerBedRight.position.set(3.12, 0.15, -8.7);
        flora.add(flowerBedRight);

        for (let f = 0; f < 10; f++) {
            const fz = -7.0 - (f * 0.38);
            // Foliage base
            const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), materials.leafGreen);
            shrub.position.set(3.12, 0.34, fz);
            flora.add(shrub);

            // Multicolored Flower Heads (Hortensias & Rosas)
            const fType = f % 3;
            const fMat = fType === 0 ? materials.flowerRosePink : (fType === 1 ? materials.flowerWhite : materials.flowerYellow);
            
            // Domed flower cluster
            for (let petal = 0; petal < 5; petal++) {
                const pAngle = (petal / 5) * Math.PI * 2;
                const flCluster = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), fMat);
                flCluster.position.set(
                    3.12 + Math.cos(pAngle) * 0.06,
                    0.48 + (petal % 2) * 0.03,
                    fz + Math.sin(pAngle) * 0.06
                );
                flora.add(flCluster);
            }
        }

        // ==========================================
        // 5. ENREDADERA FLORAL EN EL MURO MEDIANERO (Jazmín / Buganvilla)
        // ==========================================
        for (let w = 0; w < 12; w++) {
            const wx = -0.8 + (w * 0.36);
            const vineLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), materials.leafDarkGreen);
            vineLeaf.scale.set(1.2, 1.4, 0.4);
            vineLeaf.position.set(wx, 0.8 + (w % 3) * 0.35, -10.85);
            flora.add(vineLeaf);

            // Delicate star-blossoms
            const star = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.03, 0),
                w % 2 === 0 ? materials.flowerRosePink : materials.flowerWhite
            );
            star.position.set(wx + 0.05, 0.85 + (w % 3) * 0.35, -10.82);
            flora.add(star);
        }

        // ==========================================
        // 6. SOLAR LED GARDEN BOLLARD LIGHTS
        // ==========================================
        for (let bl = 0; bl < 3; bl++) {
            const bz = -7.5 - (bl * 1.2);
            const bollardPost = createBox(0.05, 0.35, 0.05, materials.bracketIron);
            bollardPost.position.set(-0.6, 0.22, bz);
            const bollardHead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), materials.ledEmissiveWhite);
            bollardHead.position.set(-0.6, 0.40, bz);
            const bLight = new THREE.PointLight(0xffeedd, 0.4, 2.5);
            bLight.position.set(-0.6, 0.42, bz);
            flora.add(bollardPost);
            flora.add(bollardHead);
            flora.add(bLight);
        }

        return flora;
    }

    /* ----------------------------------------------------
       BUILD FIRST FLOOR (Planta Primera / Piso 2 - 62.50 m²)
       DISTRIBUCIÓN 100% FIEL A LOS PLANOS (A4_plan_page_01.png):
       - Master Suite (14.30m²) con Baño En-Suite (5.22m²) y Terraza Privada (5.70m²)
       - Dormitorio 2 (9.31m²) frontal izquierdo
       - Dormitorio 3 (8.94m²) frontal derecho (al norte de la escalera, SIN solapes)
       - Baño 2 (3.96m²) en distribuidor, totalmente equipado
       - Distribuidor Central (5.98m²) que conecta todas las habitaciones y escaleras
       - Desembarque de escalera de Planta Baja y arranque de escalera a Buhardilla
       ---------------------------------------------------- */
    function buildFirstFloor() {
        const group = new THREE.Group();
        group.name = 'firstFloor';
        const yOffset = 3.0;

        // ========================================================
        // 1. FORJADO CON HUECO DE ESCALERA EXACTO
        // Hueco libre: X = 0.88m a 3.28m, Z = -0.95m a +0.95m
        // ========================================================
        // A) Lado izquierdo completo (X = -3.28m a +0.88m, fondo 9.78m)
        const slabLeft = createBox(4.16, 0.20, 9.78, materials.floorParquet);
        slabLeft.position.set(-1.20, yOffset + 0.10, 0);
        // B) Lado derecho trasero (bajo Master Suite, Z = -4.89m a -0.95m, fondo 3.94m)
        const slabRightRear = createBox(2.40, 0.20, 3.94, materials.floorParquet);
        slabRightRear.position.set(2.08, yOffset + 0.10, -2.92);
        // C) Lado derecho delantero (bajo Dormitorio 3, Z = +0.95m a +4.89m, fondo 3.94m)
        const slabRightFront = createBox(2.40, 0.20, 3.94, materials.floorParquet);
        slabRightFront.position.set(2.08, yOffset + 0.10, 2.92);
        group.add(slabLeft);
        group.add(slabRightRear);
        group.add(slabRightFront);

        // ========================================================
        // 2. MUROS PERIMETRALES Y FACHADAS CON VENTANAS REALES (PISO 2)
        // 100% FIEL AL PLANO (first_floor_front_windows.png) Y DOSSIER:
        // - Ventana Dormitorio 2 (Izquierda, ancho 1.12m, alto 1.60m)
        // - Ventana Dormitorio 3 (Derecha, ancho 1.12m, alto 1.60m)
        // - Panel arquitectónico de lamas de roble natural junto a cada ventana
        // - CERO colisión en vértices: ancho total 6.56m (entre X = -3.28m y +3.28m)
        // - Altura 3.00m: cierra de forjado a forjado sin rendijas
        // ========================================================
        // Medianeras estructurales en grafito arquitectónico oscuro
        const leftWall = createBox(0.22, 3.00, 10.0, materials.partyWall);
        leftWall.position.set(-3.39, yOffset + 1.50, 0);
        const rightWall = createBox(0.22, 3.00, 10.0, materials.partyWall);
        rightWall.position.set(3.39, yOffset + 1.50, 0);
        group.add(leftWall);
        group.add(rightWall);

        // --- FACHADA FRONTAL DE PLANTA PRIMERA CON HUECOS DE VENTANA ---
        // 1. Muro macizo izquierdo (esquina Dormitorio 2): X = -3.28m a -2.20m (ancho 1.08m, centro X = -2.74m)
        const ffWallL = createBox(1.08, 3.00, 0.22, materials.facadeWhite);
        ffWallL.position.set(-2.74, yOffset + 1.50, 4.89);
        group.add(ffWallL);

        // 2. Muro macizo central (entre Dormitorios 2 y 3): X = -1.08m a +1.08m (ancho 2.16m, centro X = 0.00m)
        const ffWallCenter = createBox(2.16, 3.00, 0.22, materials.facadeWhite);
        ffWallCenter.position.set(0.00, yOffset + 1.50, 4.89);
        group.add(ffWallCenter);

        // 3. Muro macizo derecho (esquina Dormitorio 3): X = +2.20m a +3.28m (ancho 1.08m, centro X = +2.74m)
        const ffWallR = createBox(1.08, 3.00, 0.22, materials.facadeWhite);
        ffWallR.position.set(2.74, yOffset + 1.50, 4.89);
        group.add(ffWallR);

        // --- HUECO Y VENTANA DORMITORIO 2 (X = -2.20m a -1.08m, ancho 1.12m, centro X = -1.64m) ---
        // A) Antepecho inferior (altura 0.90m, desde Y = yOffset a yOffset + 0.90m)
        const sillWallBed2 = createBox(1.12, 0.90, 0.22, materials.facadeWhite);
        sillWallBed2.position.set(-1.64, yOffset + 0.45, 4.89);
        // B) Dintel superior (altura 0.50m, desde Y = yOffset + 2.50m a yOffset + 3.00m)
        const headerWallBed2 = createBox(1.12, 0.50, 0.22, materials.facadeWhite);
        headerWallBed2.position.set(-1.64, yOffset + 2.75, 4.89);
        group.add(sillWallBed2);
        group.add(headerWallBed2);

        // C) Ventana climalit de Dormitorio 2 con marco de aluminio antracita y panel de roble
        const winGroup2 = new THREE.Group();
        winGroup2.name = "windowDormitorio2";

        // Marco perimetral hueco en aluminio antracita (CERO solape con el vidrio)
        const winFrameTop2 = createBox(1.10, 0.05, 0.08, materials.metalAnthracite);
        winFrameTop2.position.set(-1.64, yOffset + 2.465, 4.89);
        const winFrameBot2 = createBox(1.10, 0.05, 0.08, materials.metalAnthracite);
        winFrameBot2.position.set(-1.64, yOffset + 0.935, 4.89);
        const winJambL2 = createBox(0.05, 1.48, 0.08, materials.metalAnthracite);
        winJambL2.position.set(-2.165, yOffset + 1.70, 4.89);
        const winJambR2 = createBox(0.05, 1.48, 0.08, materials.metalAnthracite);
        winJambR2.position.set(-1.115, yOffset + 1.70, 4.89);
        const winMullion2 = createBox(0.04, 1.48, 0.08, materials.metalAnthracite);
        winMullion2.position.set(-1.48, yOffset + 1.70, 4.89);

        // Vidrio doble acristalamiento 100% transparente en su hueco libre (sin fondo metalico)
        const winGlass2 = createBox(0.64, 1.48, 0.02, materials.glass);
        winGlass2.position.set(-1.82, yOffset + 1.70, 4.89);

        // Panel arquitectonico de lamas de madera noble (diseno exterior del dossier)
        const woodAccent2 = createBox(0.32, 1.48, 0.04, materials.facadeWood);
        woodAccent2.position.set(-1.30, yOffset + 1.70, 4.89);

        // Vierteaguas exterior en aluminio antracita
        const sillDrip2 = createBox(1.16, 0.04, 0.28, materials.metalAnthracite);
        sillDrip2.position.set(-1.64, yOffset + 0.91, 4.93);

        winGroup2.add(winFrameTop2);
        winGroup2.add(winFrameBot2);
        winGroup2.add(winJambL2);
        winGroup2.add(winJambR2);
        winGroup2.add(winMullion2);
        winGroup2.add(winGlass2);
        winGroup2.add(woodAccent2);
        winGroup2.add(sillDrip2);
        group.add(winGroup2);

        // --- HUECO Y VENTANA DORMITORIO 3 (X = +1.08m a +2.20m, ancho 1.12m, centro X = +1.64m) ---
        // A) Antepecho inferior
        const sillWallBed3 = createBox(1.12, 0.90, 0.22, materials.facadeWhite);
        sillWallBed3.position.set(1.64, yOffset + 0.45, 4.89);
        // B) Dintel superior
        const headerWallBed3 = createBox(1.12, 0.50, 0.22, materials.facadeWhite);
        headerWallBed3.position.set(1.64, yOffset + 2.75, 4.89);
        group.add(sillWallBed3);
        group.add(headerWallBed3);

        // C) Ventana climalit de Dormitorio 3 con marco antracita y panel de roble
        const winGroup3 = new THREE.Group();
        winGroup3.name = "windowDormitorio3";

        const winFrameTop3 = createBox(1.10, 0.05, 0.08, materials.metalAnthracite);
        winFrameTop3.position.set(1.64, yOffset + 2.465, 4.89);
        const winFrameBot3 = createBox(1.10, 0.05, 0.08, materials.metalAnthracite);
        winFrameBot3.position.set(1.64, yOffset + 0.935, 4.89);
        const winJambL3 = createBox(0.05, 1.48, 0.08, materials.metalAnthracite);
        winJambL3.position.set(1.115, yOffset + 1.70, 4.89);
        const winJambR3 = createBox(0.05, 1.48, 0.08, materials.metalAnthracite);
        winJambR3.position.set(2.165, yOffset + 1.70, 4.89);
        const winMullion3 = createBox(0.04, 1.48, 0.08, materials.metalAnthracite);
        winMullion3.position.set(1.48, yOffset + 1.70, 4.89);

        const woodAccent3 = createBox(0.32, 1.48, 0.04, materials.facadeWood);
        woodAccent3.position.set(1.30, yOffset + 1.70, 4.89);

        const winGlass3 = createBox(0.64, 1.48, 0.02, materials.glass);
        winGlass3.position.set(1.82, yOffset + 1.70, 4.89);

        const sillDrip3 = createBox(1.16, 0.04, 0.28, materials.metalAnthracite);
        sillDrip3.position.set(1.64, yOffset + 0.91, 4.93);

        winGroup3.add(winFrameTop3);
        winGroup3.add(winFrameBot3);
        winGroup3.add(winJambL3);
        winGroup3.add(winJambR3);
        winGroup3.add(winMullion3);
        winGroup3.add(woodAccent3);
        winGroup3.add(winGlass3);
        winGroup3.add(sillDrip3);
        group.add(winGroup3);

        // --- FACHADA TRASERA CON SALIDA A TERRAZA SUITE ---
        // Puerta corredera en X = -1.10m a +2.30m (ancho 3.40m, centro X = +0.60m)
        // Murete izquierdo: X = -3.28m a -1.10m (ancho 2.18m, centro X = -2.19m)
        const rearWallL = createBox(2.18, 3.00, 0.22, materials.facadeWhite);
        rearWallL.position.set(-2.19, yOffset + 1.50, -4.89);
        // Murete derecho: X = +2.30m a +3.28m (ancho 0.98m, centro X = +2.79m)
        const rearWallR = createBox(0.98, 3.00, 0.22, materials.facadeWhite);
        rearWallR.position.set(2.79, yOffset + 1.50, -4.89);
        // Dintel superior de fachada blanca (cierra el muro hasta forjado superior Y = 6.00m)
        const rearHeaderFirst = createBox(3.40, 0.55, 0.22, materials.facadeWhite);
        rearHeaderFirst.position.set(0.60, yOffset + 2.725, -4.89);
        group.add(rearWallL);
        group.add(rearWallR);
        group.add(rearHeaderFirst);

        // PUERTAVIDRIERA CORREDERA DE ACCESO A TERRAZA PRIVADA SUITE (3.40m)
        // 100% TRANSPARENTE CON PERFILERIA SLIM EN ALUMINIO ANTRACITA Y TIRADORES DE ACERO
        const suiteSlidingDoorGroup = new THREE.Group();
        suiteSlidingDoorGroup.name = "suiteTerraceGlassDoor";

        // Cerco perimetral exterior
        const sFrameTop = createBox(3.40, 0.08, 0.12, materials.metalAnthracite);
        sFrameTop.position.set(0.60, yOffset + 2.41, -4.89);
        const sFrameBottom = createBox(3.40, 0.04, 0.12, materials.metalAnthracite);
        sFrameBottom.position.set(0.60, yOffset + 0.12, -4.89);
        const sFrameJambL = createBox(0.08, 2.25, 0.12, materials.metalAnthracite);
        sFrameJambL.position.set(-1.06, yOffset + 1.265, -4.89);
        const sFrameJambR = createBox(0.08, 2.25, 0.12, materials.metalAnthracite);
        sFrameJambR.position.set(2.26, yOffset + 1.265, -4.89);
        suiteSlidingDoorGroup.add(sFrameTop);
        suiteSlidingDoorGroup.add(sFrameBottom);
        suiteSlidingDoorGroup.add(sFrameJambL);
        suiteSlidingDoorGroup.add(sFrameJambR);

        // Vierteaguas inferior de aluminio
        const suiteSill = createBox(3.44, 0.03, 0.28, materials.metalAnthracite);
        suiteSill.position.set(0.60, yOffset + 0.10, -4.89);
        suiteSlidingDoorGroup.add(suiteSill);

        // Hoja corredera 1 (Izquierda, carril interior Z = -4.86m)
        // Ancho 1.65m (desde X = -1.02m hasta +0.63m, centro X = -0.195m)
        const leaf1Glass = createBox(1.55, 2.15, 0.02, materials.glass);
        leaf1Glass.position.set(-0.195, yOffset + 1.265, -4.86);
        const leaf1StileL = createBox(0.05, 2.25, 0.04, materials.metalAnthracite);
        leaf1StileL.position.set(-0.995, yOffset + 1.265, -4.86);
        const leaf1StileR = createBox(0.05, 2.25, 0.04, materials.metalAnthracite);
        leaf1StileR.position.set(0.605, yOffset + 1.265, -4.86);
        const leaf1RailT = createBox(1.55, 0.05, 0.04, materials.metalAnthracite);
        leaf1RailT.position.set(-0.195, yOffset + 2.365, -4.86);
        const leaf1RailB = createBox(1.55, 0.05, 0.04, materials.metalAnthracite);
        leaf1RailB.position.set(-0.195, yOffset + 0.165, -4.86);
        const handle1 = createBox(0.03, 0.50, 0.03, materials.boltSilver);
        handle1.position.set(0.55, yOffset + 1.15, -4.82);
        suiteSlidingDoorGroup.add(leaf1Glass);
        suiteSlidingDoorGroup.add(leaf1StileL);
        suiteSlidingDoorGroup.add(leaf1StileR);
        suiteSlidingDoorGroup.add(leaf1RailT);
        suiteSlidingDoorGroup.add(leaf1RailB);
        suiteSlidingDoorGroup.add(handle1);

        // Hoja corredera 2 (Derecha, carril exterior Z = -4.92m)
        // Ancho 1.65m (desde X = +0.57m hasta +2.22m, centro X = +1.395m)
        const leaf2Glass = createBox(1.55, 2.15, 0.02, materials.glass);
        leaf2Glass.position.set(1.395, yOffset + 1.265, -4.92);
        const leaf2StileL = createBox(0.05, 2.25, 0.04, materials.metalAnthracite);
        leaf2StileL.position.set(0.595, yOffset + 1.265, -4.92);
        const leaf2StileR = createBox(0.05, 2.25, 0.04, materials.metalAnthracite);
        leaf2StileR.position.set(2.195, yOffset + 1.265, -4.92);
        const leaf2RailT = createBox(1.55, 0.05, 0.04, materials.metalAnthracite);
        leaf2RailT.position.set(1.395, yOffset + 2.365, -4.92);
        const leaf2RailB = createBox(1.55, 0.05, 0.04, materials.metalAnthracite);
        leaf2RailB.position.set(1.395, yOffset + 0.165, -4.92);
        const handle2 = createBox(0.03, 0.50, 0.03, materials.boltSilver);
        handle2.position.set(0.65, yOffset + 1.15, -4.96);
        suiteSlidingDoorGroup.add(leaf2Glass);
        suiteSlidingDoorGroup.add(leaf2StileL);
        suiteSlidingDoorGroup.add(leaf2StileR);
        suiteSlidingDoorGroup.add(leaf2RailT);
        suiteSlidingDoorGroup.add(leaf2RailB);
        suiteSlidingDoorGroup.add(handle2);

        group.add(suiteSlidingDoorGroup);

        // Terraza privada de la Suite (5.70 m2)
        const terraceSlab = createBox(4.40, 0.18, 1.80, materials.floorPaving);
        terraceSlab.position.set(0.60, yOffset + 0.10, -5.80);
        const railFront = createBox(4.40, 1.05, 0.04, materials.glassRailing);
        railFront.position.set(0.60, yOffset + 0.68, -6.68);
        const railL = createBox(0.04, 1.05, 1.80, materials.glassRailing);
        railL.position.set(-1.58, yOffset + 0.68, -5.80);
        const railR = createBox(0.04, 1.05, 1.80, materials.glassRailing);
        railR.position.set(2.78, yOffset + 0.68, -5.80);

        // Pasamanos perimetrales de seguridad en aluminio antracita
        const railCapFront = createBox(4.44, 0.05, 0.06, materials.metalAnthracite);
        railCapFront.position.set(0.60, yOffset + 1.22, -6.68);
        const railCapL = createBox(0.06, 0.05, 1.82, materials.metalAnthracite);
        railCapL.position.set(-1.58, yOffset + 1.22, -5.80);
        const railCapR = createBox(0.06, 0.05, 1.82, materials.metalAnthracite);
        railCapR.position.set(2.78, yOffset + 1.22, -5.80);

        group.add(terraceSlab);
        group.add(railFront);
        group.add(railL);
        group.add(railR);
        group.add(railCapFront);
        group.add(railCapL);
        group.add(railCapR);

        // ========================================================
        // 3. TABIQUERÍA INTERIOR RIGUROSAMENTE EXACTA AL PLANO
        // Paredes en Slate Oscuro (0x334155) de gran contraste visual
        // ========================================================

        // A) PARED FRONTAL DE ZONA NOCHE (Z = +0.95m):
        // Separa Dormitorio 2 y 3 del Distribuidor y de la Escalera.
        // - Tramo izquierdo (tras Baño 2): X = -3.28m a -0.90m (largo 2.38m)
        const wallBedL = createBox(2.38, 2.70, 0.12, materials.interiorWall);
        wallBedL.position.set(-2.09, yOffset + 1.45, 0.95);
        // - Dintel sobre puertas de Dormitorios 2 y 3 (X = -0.90m a +0.88m, alto 0.60m)
        const headerBeds = createBox(1.78, 0.60, 0.12, materials.interiorWall);
        headerBeds.position.set(-0.01, yOffset + 2.40, 0.95);
        // - Tramo derecho (SEPARA DORMITORIO 3 DE LA ESCALERA):
        //   X = 0.88m a 3.28m (largo 2.40m en Z = +0.95m). ¡0% contacto con peldaños!
        const wallBed3Stairs = createBox(2.40, 2.70, 0.12, materials.interiorWall);
        wallBed3Stairs.position.set(2.08, yOffset + 1.45, 0.95);
        group.add(wallBedL);
        group.add(headerBeds);
        group.add(wallBed3Stairs);

        // B) PARED DIVISORIA ENTRE DORMITORIO 2 Y DORMITORIO 3:
        // X = 0.00m, desde Z = +0.95m hasta Z = +4.89m (largo 3.94m)
        const wallBetweenBeds = createBox(0.12, 2.70, 3.94, materials.interiorWall);
        wallBetweenBeds.position.set(0.00, yOffset + 1.45, 2.92);
        group.add(wallBetweenBeds);

        // C) PARED TRASERA DE ZONA NOCHE (Z = -0.95m):
        // Separa la Master Suite del Distribuidor y de la Escalera.
        // - Tramo izquierdo (tras Baño Suite): X = -3.28m a -0.60m (largo 2.68m)
        const wallSuiteL = createBox(2.68, 2.70, 0.12, materials.interiorWall);
        wallSuiteL.position.set(-1.94, yOffset + 1.45, -0.95);
        // - Dintel sobre puerta de la Master Suite (X = 0.00m a +0.88m, alto 0.60m)
        const headerSuite = createBox(0.88, 0.60, 0.12, materials.interiorWall);
        headerSuite.position.set(0.44, yOffset + 2.40, -0.95);
        // - Tramo derecho (SEPARA MASTER SUITE DE LA ESCALERA):
        //   X = 0.88m a 3.28m (largo 2.40m en Z = -0.95m)
        const wallSuiteStairs = createBox(2.40, 2.70, 0.12, materials.interiorWall);
        wallSuiteStairs.position.set(2.08, yOffset + 1.45, -0.95);
        group.add(wallSuiteL);
        group.add(headerSuite);
        group.add(wallSuiteStairs);

        // D) PARED LATERAL DE BAÑO 2 HACIA EL DISTRIBUIDOR (X = -0.60m):
        // Desde Z = -0.95m hasta Z = +0.95m (fondo 1.90m) con hueco de puerta
        const wallBath2S = createBox(0.12, 2.70, 0.50, materials.interiorWall);
        wallBath2S.position.set(-0.60, yOffset + 1.45, -0.70);
        const wallBath2N = createBox(0.12, 2.70, 0.55, materials.interiorWall);
        wallBath2N.position.set(-0.60, yOffset + 1.45, 0.675);
        const headerBath2 = createBox(0.12, 0.60, 0.85, materials.interiorWall);
        headerBath2.position.set(-0.60, yOffset + 2.40, -0.025);
        group.add(wallBath2S);
        group.add(wallBath2N);
        group.add(headerBath2);

        // E) PARED DIVISORIA ENTRE MASTER SUITE Y BAÑO EN-SUITE:
        // X = -1.20m, desde Z = -0.95m hasta Z = -4.89m (largo 3.94m con paso)
        const wallSuiteBath = createBox(0.12, 2.70, 3.00, materials.interiorWall);
        wallSuiteBath.position.set(-1.20, yOffset + 1.45, -3.39);
        group.add(wallSuiteBath);

        // ========================================================
        // 4. PUERTAS DE TODAS LAS ESTANCIAS (BLANCAS CON MARCO ANTRACITA)
        // ========================================================
        // 1. Puerta Dormitorio 2 (9.31 m²) en pared Z = +0.95m
        const doorBed2 = createInteriorDoor(0.85, 2.10, materials.doorFrame, materials.doorLeaf, 0.75);
        doorBed2.position.set(-0.45, yOffset + 0.10, 0.95);
        group.add(doorBed2);

        // 2. Puerta Dormitorio 3 (8.94 m²) en pared Z = +0.95m
        const doorBed3 = createInteriorDoor(0.85, 2.10, materials.doorFrame, materials.doorLeaf, -0.75);
        doorBed3.position.set(0.44, yOffset + 0.10, 0.95);
        group.add(doorBed3);

        // 3. Puerta Baño 2 (3.96 m²) en pared X = -0.60m
        const doorBath2 = createInteriorDoor(0.75, 2.10, materials.doorFrame, materials.doorLeaf, -0.75);
        doorBath2.position.set(-0.60, yOffset + 0.10, -0.025);
        doorBath2.rotation.y = Math.PI / 2; // Abre hacia el interior de Baño 2
        group.add(doorBath2);

        // 4. Puerta Master Suite (14.30 m²) en pared Z = -0.95m
        const doorSuite = createInteriorDoor(0.85, 2.10, materials.doorFrame, materials.doorLeaf, 0.75);
        doorSuite.position.set(0.44, yOffset + 0.10, -0.95);
        doorSuite.rotation.y = Math.PI; // Abre hacia el interior de la Suite
        group.add(doorSuite);

        // 5. Puerta Baño En-Suite (5.22 m²)
        const doorMasterBath = createInteriorDoor(0.75, 2.10, materials.doorFrame, materials.doorLeaf, 0.70);
        doorMasterBath.position.set(-1.20, yOffset + 0.10, -1.45);
        doorMasterBath.rotation.y = -Math.PI / 2;
        group.add(doorMasterBath);

        // ========================================================
        // 5. ESCALERAS EN PLANTA PRIMERA
        // A) Barandilla de seguridad del hueco de la escalera en Distribuidor
        // B) ESCALERA A LA BUHARDILLA (Segunda tirada de 2 tramos con abanico)
        // ========================================================
        // Barandilla de cristal de seguridad a lo largo del hueco de desembarque (X = 0.88m)
        // Protege el lateral entre Z = -0.02m y Z = +0.02m y tramo inferior
        const voidRailGlass = createBox(0.03, 0.95, 0.92, materials.glassRailing);
        voidRailGlass.position.set(0.88, yOffset + 0.58, 0.46);
        const voidRailHand = createBox(0.05, 0.05, 0.94, materials.metalAnthracite);
        voidRailHand.position.set(0.88, yOffset + 1.05, 0.46);
        group.add(voidRailGlass);
        group.add(voidRailHand);

        // ESCALERA A LA BUHARDILLA:
        // Arranca en el Distribuidor a Y = 3.00m (X = 0.88m, Z = +0.46m) y sube exactamente
        // hasta desembarcar a Y = 6.00m en la BUHARDILLA (3ª planta).
        const stairFirstToAttic = createArchitecturalStaircase(3.0);
        group.add(stairFirstToAttic);

        // ========================================================
        // 6. EQUIPAMIENTO INTEGRAL DE BAÑOS Y DORMITORIOS
        // ========================================================
        // BAÑO 2 (3.96 m² - Baño del distribuidor completamente equipado)
        // Suelo cerámico antideslizante claro
        const bath2Floor = createBox(2.56, 0.02, 1.78, materials.floorPaving);
        bath2Floor.position.set(-1.94, yOffset + 0.205, 0.00);
        group.add(bath2Floor);

        // Ducha italiana con plato extraplano y mampara de cristal templado
        const bath2ShowerTray = createBox(1.20, 0.04, 0.80, materials.furnitureWhite);
        bath2ShowerTray.position.set(-2.58, yOffset + 0.13, 0.48);
        const bath2ShowerScreen = createBox(0.03, 2.00, 0.80, materials.glass);
        bath2ShowerScreen.position.set(-1.98, yOffset + 1.12, 0.48);
        const showerCol = createBox(0.08, 1.20, 0.05, materials.boltSilver);
        showerCol.position.set(-3.15, yOffset + 1.40, 0.48);
        group.add(bath2ShowerTray);
        group.add(bath2ShowerScreen);
        group.add(showerCol);

        // Inodoro suspendido de diseño
        const bath2Toilet = createBox(0.38, 0.42, 0.55, materials.furnitureWhite);
        bath2Toilet.position.set(-2.40, yOffset + 0.32, -0.60);
        const bath2Flush = createBox(0.20, 0.12, 0.02, materials.boltSilver);
        bath2Flush.position.set(-2.40, yOffset + 0.80, -0.88);
        group.add(bath2Toilet);
        group.add(bath2Flush);

        // Mueble de lavabo suspendido con espejo retroiluminado LED
        const bath2Vanity = createBox(0.80, 0.55, 0.45, materials.furnitureWood);
        bath2Vanity.position.set(-1.20, yOffset + 0.60, -0.65);
        const bath2Basin = createBox(0.50, 0.12, 0.38, materials.furnitureWhite);
        bath2Basin.position.set(-1.20, yOffset + 0.90, -0.65);
        const bath2Faucet = createBox(0.04, 0.20, 0.08, materials.boltSilver);
        bath2Faucet.position.set(-1.20, yOffset + 1.05, -0.80);
        const bath2Mirror = createBox(0.80, 0.85, 0.03, materials.mirror);
        bath2Mirror.position.set(-1.20, yOffset + 1.65, -0.88);
        group.add(bath2Vanity);
        group.add(bath2Basin);
        group.add(bath2Faucet);
        group.add(bath2Mirror);

        // BAÑO MASTER SUITE (5.22 m² - Equipamiento completo)
        const suiteShower = createBox(1.60, 0.05, 0.90, materials.furnitureWhite);
        suiteShower.position.set(-2.45, yOffset + 0.13, -4.30);
        const suiteShowerGlass = createBox(1.60, 2.05, 0.03, materials.glass);
        suiteShowerGlass.position.set(-2.45, yOffset + 1.15, -3.85);
        const suiteVanity = createBox(1.40, 0.55, 0.50, materials.furnitureWood);
        suiteVanity.position.set(-2.45, yOffset + 0.60, -2.40);
        const suiteMirror = createBox(1.30, 0.90, 0.03, materials.mirror);
        suiteMirror.position.set(-2.45, yOffset + 1.60, -2.15);
        const suiteToilet = createBox(0.38, 0.40, 0.55, materials.furnitureWhite);
        suiteToilet.position.set(-1.60, yOffset + 0.30, -1.30);
        group.add(suiteShower);
        group.add(suiteShowerGlass);
        group.add(suiteVanity);
        group.add(suiteMirror);
        group.add(suiteToilet);

        // MOBILIARIO DE DORMITORIOS
        // Master Suite (Cama King-Size 1.80m x 2.00m con cabecero y mesillas)
        const kingBed = createBox(1.80, 0.50, 2.00, materials.furnitureFabric);
        kingBed.position.set(1.0, yOffset + 0.35, -2.80);
        const kingHeadboard = createBox(2.40, 1.10, 0.08, materials.facadeWood);
        kingHeadboard.position.set(1.0, yOffset + 0.70, -1.80);
        const nightstandL = createBox(0.45, 0.40, 0.40, materials.furnitureWood);
        nightstandL.position.set(-0.25, yOffset + 0.30, -1.80);
        const nightstandR = createBox(0.45, 0.40, 0.40, materials.furnitureWood);
        nightstandR.position.set(2.25, yOffset + 0.30, -1.80);
        group.add(kingBed);
        group.add(kingHeadboard);
        group.add(nightstandL);
        group.add(nightstandR);

        // Dormitorio 2 (9.31 m²): Cama individual, mesilla, armario y escritorio
        const bed2 = createBox(1.05, 0.45, 1.95, materials.furnitureFabric);
        bed2.position.set(-2.55, yOffset + 0.32, 2.70);
        const desk2 = createBox(1.20, 0.75, 0.55, materials.furnitureWood);
        desk2.position.set(-2.55, yOffset + 0.48, 4.30);
        const wardrobe2 = createBox(1.20, 2.20, 0.60, materials.furnitureWhite);
        wardrobe2.position.set(-1.20, yOffset + 1.20, 1.35);
        group.add(bed2);
        group.add(desk2);
        group.add(wardrobe2);

        // Dormitorio 3 (8.94 m²): Cama individual, mesilla, armario y escritorio
        const bed3 = createBox(1.05, 0.45, 1.95, materials.furnitureFabric);
        bed3.position.set(2.55, yOffset + 0.32, 2.70);
        const desk3 = createBox(1.20, 0.75, 0.55, materials.furnitureWood);
        desk3.position.set(2.55, yOffset + 0.48, 4.30);
        const wardrobe3 = createBox(1.20, 2.20, 0.60, materials.furnitureWhite);
        wardrobe3.position.set(1.20, yOffset + 1.20, 1.35);
        group.add(bed3);
        group.add(desk3);
        group.add(wardrobe3);

        return group;
    }

    /* ----------------------------------------------------
       BUILD ATTIC (Planta Buhardilla - 22.95 m² - 3ª Planta)
       Llegada de escalera desde 1ª planta a Y = 6.00m (X = 0.88m, Z = -0.46m)
       Hueco protegido por barandilla de cristal y espacio diáfano.
       ---------------------------------------------------- */
    function buildAttic() {
        const group = new THREE.Group();
        group.name = 'atticFloor';
        const yOffset = 6.0;

        // Forjado con hueco de escalera idéntico al de planta primera
        // Hueco libre: X = 0.88m a 3.28m, Z = -0.95m a +0.95m
        const slabL = createBox(4.16, 0.20, 9.78, materials.floorParquet);
        slabL.position.set(-1.20, yOffset + 0.10, 0);
        const slabRRear = createBox(2.40, 0.20, 3.94, materials.floorParquet);
        slabRRear.position.set(2.08, yOffset + 0.10, -2.92);
        const slabRFront = createBox(2.40, 0.20, 3.94, materials.floorParquet);
        slabRFront.position.set(2.08, yOffset + 0.10, 2.92);
        group.add(slabL);
        group.add(slabRRear);
        group.add(slabRFront);

        // Barandilla de cristal perimetral de seguridad en el hueco de llegada
        // Protege el lado Norte (Z = +0.95m) y el lado Oeste (X = 0.88m, Z = 0 a +0.95m)
        const aVoidRailN = createBox(2.40, 0.95, 0.03, materials.glassRailing);
        aVoidRailN.position.set(2.08, yOffset + 0.58, 0.95);
        const aVoidRailW = createBox(0.03, 0.95, 0.95, materials.glassRailing);
        aVoidRailW.position.set(0.88, yOffset + 0.58, 0.48);
        const aHandrailN = createBox(2.42, 0.05, 0.05, materials.metalAnthracite);
        aHandrailN.position.set(2.08, yOffset + 1.05, 0.95);
        const aHandrailW = createBox(0.05, 0.05, 0.97, materials.metalAnthracite);
        aHandrailW.position.set(0.88, yOffset + 1.05, 0.48);
        group.add(aVoidRailN);
        group.add(aVoidRailW);
        group.add(aHandrailN);
        group.add(aHandrailW);

        // Muros perimetrales de medianera (altura 2.00m)
        // Muros perimetrales de medianera en buhardilla (altura 1.55m, apoyan exactamente bajo el faldon a 30 grados con alero continuo)
        const wallL = createBox(0.22, 1.55, 9.78, materials.partyWall);
        wallL.position.set(-3.39, yOffset + 0.775, 0);
        const wallR = createBox(0.22, 1.55, 9.78, materials.partyWall);
        wallR.position.set(3.39, yOffset + 0.775, 0);
        group.add(wallL);
        group.add(wallR);

        // Testeros triangulares/pentagonales a 30 grados con inclinacion identica a la cubierta (CERO atravesar tejado)
        // hEave = 1.72m, hRidge = 3.61m, ancho 6.56m
        const gableF = createGableWall(6.56, 1.72, 3.61, 0.22, materials.facadeWhite);
        gableF.position.set(0, yOffset, 4.89);
        const gableR = createGableWall(6.56, 1.72, 3.61, 0.22, materials.facadeWhite);
        gableR.position.set(0, yOffset, -4.89);
        group.add(gableF);
        group.add(gableR);

        // Vigas de madera vistas bajo cubierta
        for (let z = -4.0; z <= 4.0; z += 2.0) {
            const beam = createBox(0.16, 0.22, 0.16, materials.furnitureWood);
            beam.position.set(0, yOffset + 3.40, z);
            group.add(beam);
        }

        // Mobiliario de estudio y zona de descanso
        const desk = createBox(1.90, 0.76, 0.85, materials.furnitureWood);
        desk.position.set(-1.20, yOffset + 0.50, 1.50);
        const chair = createBox(0.60, 0.90, 0.60, materials.metalAnthracite);
        chair.position.set(-1.20, yOffset + 0.60, 2.20);
        const library = createBox(2.20, 1.80, 0.35, materials.furnitureWhite);
        library.position.set(-1.20, yOffset + 1.00, 4.60);
        group.add(desk);
        group.add(chair);
        group.add(library);

        return group;
    }

    /* ----------------------------------------------------
       BUILD ROOF (Cubierta a 30° con Tejas de Pizarra & Velux)
       ---------------------------------------------------- */
    function buildRoof() {
        const group = new THREE.Group();
        group.name = "roofStructure";
        const yOffset = 6.0;

        // Pitched Roof Slopes (30° gable)
        const roofL = createBox(4.4, 0.16, 10.4, materials.roofSlate);
        roofL.position.set(-1.8, yOffset + 2.7, 0);
        roofL.rotation.z = Math.PI / 6;
        const roofR = createBox(4.4, 0.16, 10.4, materials.roofSlate);
        roofR.position.set(1.8, yOffset + 2.7, 0);
        roofR.rotation.z = -Math.PI / 6;
        group.add(roofL);
        group.add(roofR);

        // Ridge Cap (Caballete)
        const ridge = createBox(0.3, 0.12, 10.5, materials.metalAnthracite);
        ridge.position.set(0, yOffset + 3.82, 0);
        group.add(ridge);

        // 2 Velux Skylights
        const velux1 = createBox(1.1, 0.08, 1.4, materials.glass);
        velux1.position.set(-1.8, yOffset + 2.8, -1.5);
        velux1.rotation.z = Math.PI / 6;
        const velux2 = createBox(1.1, 0.08, 1.4, materials.glass);
        velux2.position.set(-1.8, yOffset + 2.8, 1.5);
        velux2.rotation.z = Math.PI / 6;
        group.add(velux1);
        group.add(velux2);

        // Solar Thermal Panels (Aerotermia)
        const solarPanel1 = createBox(1.6, 0.06, 2.2, materials.metalAnthracite);
        solarPanel1.position.set(1.9, yOffset + 2.82, -1.5);
        solarPanel1.rotation.z = -Math.PI / 6;
        const solarPanel2 = createBox(1.6, 0.06, 2.2, materials.metalAnthracite);
        solarPanel2.position.set(1.9, yOffset + 2.82, 1.5);
        solarPanel2.rotation.z = -Math.PI / 6;
        group.add(solarPanel1);
        group.add(solarPanel2);

        // White Stucco Chimney with Anthracite Hood
        const chimney = createBox(0.7, 1.3, 0.7, materials.facadeWhite);
        chimney.position.set(-1.2, yOffset + 3.6, 3.0);
        const chimneyCap = createBox(0.85, 0.08, 0.85, materials.metalAnthracite);
        chimneyCap.position.set(-1.2, yOffset + 4.3, 3.0);
        group.add(chimney);
        group.add(chimneyCap);

        return group;
    }

    /* ----------------------------------------------------
       BUILD STREET & NEIGHBORHOOD ENVIRONMENT
       Expanded for the entire block of 12 houses & Public Park
       ---------------------------------------------------- */
    function buildExteriorEnvironment() {
        const group = new THREE.Group();
        group.name = "exteriorEnvironment";

        // Base ground slab beneath the entire urban development and park
        const siteGround = createBox(116.0, 0.06, 130.0, new THREE.MeshStandardMaterial({
            color: 0xc8d2dc,
            roughness: 0.95
        }));
        siteGround.position.set(10.5, -0.04, 14.0);
        group.add(siteGround);

        // FRONT STREET & SIDEWALK (ALINEACIÓN CALLE PRINCIPAL - C. SIERRA DE URBIÓN)
        // Sidewalk along the front row entrance gates (Z = 11.20m)
        const sidewalkFront = createBox(86.0, 0.12, 2.4, new THREE.MeshStandardMaterial({
            color: 0x8a94a2,
            roughness: 0.82
        }));
        sidewalkFront.position.set(10.5, 0.04, 12.45);
        const streetFront = createBox(86.0, 0.10, 8.0, new THREE.MeshStandardMaterial({
            color: 0x242a35,
            roughness: 0.90
        }));
        streetFront.position.set(10.5, 0.02, 17.65);
        group.add(sidewalkFront);
        group.add(streetFront);

        // BACK STREET & SIDEWALK (ALINEACIÓN CALLE POSTERIOR - VECINOS DEL FONDO)
        // Sidewalk along the back row entrance gates (Z = -33.20m)
        const sidewalkBack = createBox(86.0, 0.12, 2.4, new THREE.MeshStandardMaterial({
            color: 0x8a94a2,
            roughness: 0.82
        }));
        sidewalkBack.position.set(10.5, 0.04, -34.45);
        const streetBack = createBox(86.0, 0.10, 8.0, new THREE.MeshStandardMaterial({
            color: 0x242a35,
            roughness: 0.90
        }));
        streetBack.position.set(10.5, 0.02, -39.65);
        group.add(sidewalkBack);
        group.add(streetBack);

        // STREET TREES (Árboles jóvenes de acera con alcorque según Dossier Villalbilla Homes)
        function createStreetTree(x, z) {
            const tree = new THREE.Group();
            // Tree pit (alcorque con marco antracita)
            const pit = createBox(0.95, 0.02, 0.95, materials.metalAnthracite);
            pit.position.set(x, 0.11, z);
            const soil = createBox(0.85, 0.03, 0.85, materials.gravelStone);
            soil.position.set(x, 0.11, z);
            // Trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.09, 2.4, 8),
                materials.furnitureWood
            );
            trunk.position.set(x, 1.3, z);
            // Stakes (tutores)
            const stake1 = createBox(0.03, 1.6, 0.03, materials.furnitureWood);
            stake1.position.set(x - 0.12, 0.9, z);
            const stake2 = createBox(0.03, 1.6, 0.03, materials.furnitureWood);
            stake2.position.set(x + 0.12, 0.9, z);
            // Canopy
            const crown1 = new THREE.Mesh(
                new THREE.SphereGeometry(0.85, 10, 10),
                materials.floorGrass
            );
            crown1.position.set(x, 2.9, z);
            crown1.scale.set(0.9, 1.3, 0.9);
            const crown2 = new THREE.Mesh(
                new THREE.SphereGeometry(0.65, 8, 8),
                materials.floorGrass
            );
            crown2.position.set(x + 0.15, 3.4, z - 0.1);

            tree.add(pit);
            tree.add(soil);
            tree.add(trunk);
            tree.add(stake1);
            tree.add(stake2);
            tree.add(crown1);
            tree.add(crown2);
            return tree;
        }

        const treeXs = [-7.0, 0.0, 7.0, 14.0, 21.0, 28.0];
        treeXs.forEach(tx => {
            // Front sidewalk trees
            group.add(createStreetTree(tx - 2.8, 12.8));
            // Back sidewalk trees
            group.add(createStreetTree(tx + 2.8, -34.8));
        });

        // PARQUE PÚBLICO FRENTE A LAS CASAS (C. SIERRA DE URBIÓN, VILLALBILLA)
        group.add(buildParkAcrossTheStreet());

        return group;
    }

    /* ----------------------------------------------------
       PARQUE PÚBLICO FRENTE A LAS VIVIENDAS (C. SIERRA DE URBIÓN, VILLALBILLA)
       Recreación fiel del entorno real de Google Street View:
       - Acera opuesta de C. Sierra de Urbión con bordillo de granito
       - Terreno natural de parque mediterráneo con césped rústico
       - Sendero peatonal de zahorra / albero compactado serpenteante
       - Ciruelos de Japón (Prunus cerasifera 'Nigra') con follaje rojo púrpura oscuro
       - Fresnos / chopos caducifolios de porte alto y verde luminoso
       - Píceas / coníferas piramidales jóvenes
       - Parterres de lavanda aromática, romero y arbustos berberis púrpura
       - Mobiliario urbano oficial de Villalbilla: bancos de madera y acero, farolas LED y papeleras
       ---------------------------------------------------- */
    function buildParkAcrossTheStreet() {
        const park = new THREE.Group();
        park.name = "publicParkSierraDeUrbion";

        const pMat = {
            grass: new THREE.MeshStandardMaterial({ color: 0x8a9b6c, roughness: 0.95 }),
            moundGrass: new THREE.MeshStandardMaterial({ color: 0x7e8f60, roughness: 0.96 }),
            path: new THREE.MeshStandardMaterial({ color: 0xd4c6a8, roughness: 0.92 }),
            curb: new THREE.MeshStandardMaterial({ color: 0x828d9c, roughness: 0.85 }),
            sidewalk: new THREE.MeshStandardMaterial({ color: 0x8e98a5, roughness: 0.80 }),
            plumDark: new THREE.MeshStandardMaterial({ color: 0x361625, roughness: 0.75 }),
            plumLight: new THREE.MeshStandardMaterial({ color: 0x4d1e34, roughness: 0.70 }),
            greenPoplar1: new THREE.MeshStandardMaterial({ color: 0x4e7728, roughness: 0.76 }),
            greenPoplar2: new THREE.MeshStandardMaterial({ color: 0x6a9c34, roughness: 0.72 }),
            conifer: new THREE.MeshStandardMaterial({ color: 0x244738, roughness: 0.82 }),
            lavenderFlower: new THREE.MeshStandardMaterial({ color: 0x6d5088, roughness: 0.85 }),
            lavenderFoliage: new THREE.MeshStandardMaterial({ color: 0x586b5b, roughness: 0.85 }),
            shrubDarkGreen: new THREE.MeshStandardMaterial({ color: 0x2d522e, roughness: 0.80 }),
            woodBench: new THREE.MeshStandardMaterial({ color: 0xb3763f, roughness: 0.65 }),
            steelLantern: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 }),
            lanternLed: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
            distantHills: new THREE.MeshStandardMaterial({ color: 0x9ba888, roughness: 0.98 })
        };

        // 1. Acera opuesta de la calle (Z = 21.65m a 24.15m)
        const curbOpposite = createBox(96.0, 0.14, 0.20, pMat.curb);
        curbOpposite.position.set(10.5, 0.07, 21.75);
        const sidewalkOpposite = createBox(96.0, 0.12, 2.30, pMat.sidewalk);
        sidewalkOpposite.position.set(10.5, 0.05, 23.00);
        park.add(curbOpposite);
        park.add(sidewalkOpposite);

        // 2. Terreno principal del parque (Z = 24.15m a 70.0m)
        const parkGround = createBox(102.0, 0.08, 46.0, pMat.grass);
        parkGround.position.set(10.5, 0.03, 47.15);
        park.add(parkGround);

        // Lomas suaves del parque (Mounds) para dar topografía natural como en la foto
        const moundsData = [
            { x: -5, z: 32, rx: 8, rz: 6, h: 0.45 },
            { x: 12, z: 36, rx: 11, rz: 8, h: 0.55 },
            { x: 26, z: 42, rx: 9, rz: 7, h: 0.40 },
            { x: -16, z: 45, rx: 12, rz: 9, h: 0.50 },
            { x: 5, z: 54, rx: 15, rz: 10, h: 0.60 },
            { x: 32, z: 50, rx: 14, rz: 9, h: 0.50 }
        ];
        moundsData.forEach(m => {
            const moundGeo = new THREE.SphereGeometry(1, 12, 8);
            const moundMesh = new THREE.Mesh(moundGeo, pMat.moundGrass);
            moundMesh.scale.set(m.rx, m.h, m.rz);
            moundMesh.position.set(m.x, 0.02, m.z);
            park.add(moundMesh);
        });

        // 3. Sendero peatonal serpenteante de zahorra / albero (curving path)
        const pathSegments = [
            { x: -8, z: 24.2, w: 2.3, l: 3.5, rot: 0.15 },
            { x: -6.5, z: 27.5, w: 2.3, l: 4.0, rot: 0.35 },
            { x: -4.0, z: 31.0, w: 2.3, l: 4.2, rot: 0.50 },
            { x: -0.5, z: 33.5, w: 2.3, l: 4.5, rot: 0.40 },
            { x: 3.5, z: 35.0, w: 2.4, l: 4.5, rot: 0.15 },
            { x: 8.0, z: 35.5, w: 2.4, l: 5.0, rot: -0.10 },
            { x: 13.0, z: 35.0, w: 2.4, l: 5.2, rot: -0.25 },
            { x: 18.0, z: 33.5, w: 2.4, l: 5.0, rot: -0.35 },
            { x: 22.5, z: 31.0, w: 2.3, l: 4.5, rot: -0.40 },
            { x: 26.0, z: 27.5, w: 2.3, l: 4.2, rot: -0.25 },
            { x: 28.0, z: 24.2, w: 2.3, l: 3.5, rot: 0 },
            // Ramal interior del parque
            { x: 5.0, z: 39.0, w: 2.2, l: 5.0, rot: 0.70 },
            { x: 8.5, z: 43.5, w: 2.2, l: 5.5, rot: 0.60 },
            { x: 13.0, z: 47.5, w: 2.2, l: 6.0, rot: 0.40 },
            { x: 18.5, z: 50.5, w: 2.2, l: 6.0, rot: 0.10 },
            { x: 24.5, z: 51.5, w: 2.2, l: 6.5, rot: -0.20 },
            { x: 30.5, z: 50.0, w: 2.2, l: 6.0, rot: -0.45 },
            { x: 35.0, z: 46.5, w: 2.2, l: 5.5, rot: -0.60 },
            { x: 37.5, z: 41.5, w: 2.2, l: 5.0, rot: -0.80 }
        ];
        pathSegments.forEach(ps => {
            const pMesh = createBox(ps.w, 0.03, ps.l, pMat.path);
            pMesh.position.set(ps.x, 0.08, ps.z);
            pMesh.rotation.y = ps.rot;
            park.add(pMesh);
        });

        // 4. GENERADORES DE VEGETACIÓN SEGÚN GOOGLE STREET VIEW

        // A) Ciruelo de Japón / Púrpura (Prunus cerasifera 'Nigra')
        function createPrunusTree(x, z, scale = 1.0) {
            const tree = new THREE.Group();
            tree.position.set(x, 0.07, z);

            const trunkMat = materials.furnitureWood;
            const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 1.6 * scale, 7), trunkMat);
            trunk1.position.set(0, 0.8 * scale, 0);
            trunk1.rotation.z = 0.08;
            tree.add(trunk1);

            const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.09 * scale, 1.4 * scale, 6), trunkMat);
            trunk2.position.set(0.12 * scale, 0.9 * scale, 0.05 * scale);
            trunk2.rotation.z = -0.18;
            tree.add(trunk2);

            const crown1 = new THREE.Mesh(new THREE.SphereGeometry(1.05 * scale, 9, 8), pMat.plumDark);
            crown1.position.set(0, 2.1 * scale, 0);
            crown1.scale.set(0.95, 1.25, 0.95);
            tree.add(crown1);

            const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.85 * scale, 8, 7), pMat.plumLight);
            crown2.position.set(0.3 * scale, 2.6 * scale, -0.15 * scale);
            crown2.scale.set(0.9, 1.15, 0.9);
            tree.add(crown2);

            const crown3 = new THREE.Mesh(new THREE.SphereGeometry(0.75 * scale, 7, 7), pMat.plumDark);
            crown3.position.set(-0.25 * scale, 2.3 * scale, 0.2 * scale);
            crown3.scale.set(1.0, 1.1, 1.0);
            tree.add(crown3);

            return tree;
        }

        // B) Árbol caducifolio verde de porte medio-alto (Fresnos / Álamos / Chopos)
        function createGreenDeciduousTree(x, z, scale = 1.0) {
            const tree = new THREE.Group();
            tree.position.set(x, 0.07, z);

            const trunkMat = materials.furnitureWood;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 2.8 * scale, 8), trunkMat);
            trunk.position.set(0, 1.4 * scale, 0);
            tree.add(trunk);

            const crownMain = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 10, 8), pMat.greenPoplar1);
            crownMain.position.set(0, 3.6 * scale, 0);
            crownMain.scale.set(1.0, 1.3, 1.0);
            tree.add(crownMain);

            const crownTop = new THREE.Mesh(new THREE.SphereGeometry(1.1 * scale, 8, 7), pMat.greenPoplar2);
            crownTop.position.set(0.2 * scale, 4.6 * scale, -0.1 * scale);
            crownTop.scale.set(0.9, 1.2, 0.9);
            tree.add(crownTop);

            const crownSub = new THREE.Mesh(new THREE.SphereGeometry(1.0 * scale, 8, 7), pMat.greenPoplar1);
            crownSub.position.set(-0.35 * scale, 3.2 * scale, 0.25 * scale);
            tree.add(crownSub);

            return tree;
        }

        // C) Conífera piramidal perenne (Pícea / Cedro / Ciprés joven)
        function createConiferTree(x, z, scale = 1.0) {
            const tree = new THREE.Group();
            tree.position.set(x, 0.07, z);

            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 1.2 * scale, 6), materials.furnitureWood);
            trunk.position.set(0, 0.6 * scale, 0);
            tree.add(trunk);

            for (let tier = 0; tier < 4; tier++) {
                const rBottom = (0.95 - tier * 0.18) * scale;
                const hTier = (1.1 - tier * 0.12) * scale;
                const cone = new THREE.Mesh(new THREE.ConeGeometry(rBottom, hTier, 7), pMat.conifer);
                cone.position.set(0, (1.2 + tier * 0.75) * scale, 0);
                tree.add(cone);
            }

            return tree;
        }

        // D) Mata de arbustos bajos aromáticos (Lavanda, Romero, Berberis púrpura)
        function createShrubClump(x, z, type = 'lavender', r = 0.5) {
            const shrub = new THREE.Group();
            shrub.position.set(x, 0.08, z);

            if (type === 'lavender') {
                const baseFoliage = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), pMat.lavenderFoliage);
                baseFoliage.scale.set(1.2, 0.7, 1.2);
                baseFoliage.position.set(0, r * 0.5, 0);
                shrub.add(baseFoliage);

                for (let i = 0; i < 5; i++) {
                    const ang = (i / 5) * Math.PI * 2;
                    const flower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.25, 5), pMat.lavenderFlower);
                    flower.position.set(Math.cos(ang) * (r * 0.65), r * 0.85, Math.sin(ang) * (r * 0.65));
                    flower.rotation.z = (Math.random() - 0.5) * 0.3;
                    shrub.add(flower);
                }
            } else if (type === 'plumBush') {
                const bush = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), pMat.plumDark);
                bush.scale.set(1.3, 0.85, 1.1);
                bush.position.set(0, r * 0.6, 0);
                shrub.add(bush);
            } else {
                const bush = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), pMat.shrubDarkGreen);
                bush.scale.set(1.15, 0.75, 1.15);
                bush.position.set(0, r * 0.55, 0);
                shrub.add(bush);
            }

            return shrub;
        }

        // E) Banco de parque oficial (Lamas de madera + soporte antracita)
        function createParkBench(x, z, rotY = 0) {
            const bench = new THREE.Group();
            bench.position.set(x, 0.08, z);
            bench.rotation.y = rotY;

            const legL = createBox(0.08, 0.52, 0.58, pMat.steelLantern);
            legL.position.set(-0.75, 0.26, 0);
            const legR = createBox(0.08, 0.52, 0.58, pMat.steelLantern);
            legR.position.set(0.75, 0.26, 0);
            bench.add(legL);
            bench.add(legR);

            for (let sl = 0; sl < 3; sl++) {
                const slat = createBox(1.70, 0.04, 0.12, pMat.woodBench);
                slat.position.set(0, 0.44, -0.15 + (sl * 0.14));
                bench.add(slat);
            }

            for (let bk = 0; bk < 2; bk++) {
                const slatBack = createBox(1.70, 0.12, 0.04, pMat.woodBench);
                slatBack.position.set(0, 0.66 + (bk * 0.14), -0.22);
                bench.add(slatBack);
            }

            return bench;
        }

        // F) Farola de parque cilíndrica (Park Streetlight)
        function createParkLantern(x, z) {
            const lantern = new THREE.Group();
            lantern.position.set(x, 0.08, z);

            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), pMat.steelLantern);
            base.position.set(0, 0.22, 0);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.8, 8), pMat.steelLantern);
            pole.position.set(0, 2.0, 0);
            const arm = createBox(0.06, 0.06, 0.60, pMat.steelLantern);
            arm.position.set(0, 3.85, 0.25);
            const head = createBox(0.16, 0.08, 0.40, pMat.steelLantern);
            head.position.set(0, 3.82, 0.45);
            const led = createBox(0.12, 0.02, 0.32, pMat.lanternLed);
            led.position.set(0, 3.77, 0.45);

            lantern.add(base);
            lantern.add(pole);
            lantern.add(arm);
            lantern.add(head);
            lantern.add(led);
            return lantern;
        }

        // 5. DISTRIBUCIÓN DE ÁRBOLES Y VEGETACIÓN SEGÚN LA FOTO EXACTA
        // Ciruelos de flor roja (Prunus cerasifera 'Nigra') - Idénticos a la foto
        park.add(createPrunusTree(-2.5, 28.5, 1.15));
        park.add(createPrunusTree(4.8, 28.2, 1.30));
        park.add(createPrunusTree(11.5, 29.0, 1.05));
        park.add(createPrunusTree(18.2, 29.5, 1.20));
        park.add(createPrunusTree(-10.5, 31.0, 1.0));
        park.add(createPrunusTree(25.5, 33.0, 1.10));
        park.add(createPrunusTree(1.5, 41.0, 1.25));
        park.add(createPrunusTree(16.0, 44.0, 1.15));

        // Árboles verdes caducifolios altos (Chopos / Fresnos del fondo)
        park.add(createGreenDeciduousTree(-13.0, 38.0, 1.35));
        park.add(createGreenDeciduousTree(0.0, 47.0, 1.45));
        park.add(createGreenDeciduousTree(9.0, 52.0, 1.55));
        park.add(createGreenDeciduousTree(22.0, 48.0, 1.40));
        park.add(createGreenDeciduousTree(33.0, 42.0, 1.30));
        park.add(createGreenDeciduousTree(-22.0, 42.0, 1.40));
        park.add(createGreenDeciduousTree(15.0, 58.0, 1.60));

        // Coníferas piramidales (Cipreses / Píceas del margen izquierdo de la foto)
        park.add(createConiferTree(-18.5, 29.0, 1.10));
        park.add(createConiferTree(-7.5, 35.0, 1.25));
        park.add(createConiferTree(29.0, 31.5, 1.15));
        park.add(createConiferTree(-15.0, 50.0, 1.30));
        park.add(createConiferTree(35.0, 54.0, 1.35));

        // Parterres de arbustos (Lavanda, Berberis púrpura, Romero) a lo largo del sendero
        const shrubsData = [
            // Primer plano frente a las casas
            { x: -4.8, z: 27.0, type: 'plumBush', r: 0.70 },
            { x: -0.8, z: 26.5, type: 'lavender', r: 0.55 },
            { x: 2.2, z: 27.2, type: 'rosemary', r: 0.50 },
            { x: 8.5, z: 27.8, type: 'plumBush', r: 0.65 },
            { x: 14.5, z: 28.0, type: 'lavender', r: 0.60 },
            { x: 21.0, z: 27.5, type: 'rosemary', r: 0.50 },
            // Bordes del sendero
            { x: -3.0, z: 34.2, type: 'lavender', r: 0.55 },
            { x: 4.5, z: 36.8, type: 'rosemary', r: 0.50 },
            { x: 10.5, z: 36.8, type: 'plumBush', r: 0.60 },
            { x: 16.0, z: 34.5, type: 'lavender', r: 0.55 },
            { x: 21.5, z: 32.2, type: 'rosemary', r: 0.50 },
            { x: 11.5, z: 46.5, type: 'lavender', r: 0.60 },
            { x: 20.0, z: 51.0, type: 'plumBush', r: 0.65 }
        ];
        shrubsData.forEach(s => {
            park.add(createShrubClump(s.x, s.z, s.type, s.r));
        });

        // 6. MOBILIARIO URBANO DE VILLALBILLA (Bancos y Farolas)
        // Bancos junto al sendero
        park.add(createParkBench(-1.5, 35.2, 0.40));
        park.add(createParkBench(11.0, 37.0, -0.20));
        park.add(createParkBench(24.5, 33.2, -0.65));
        park.add(createParkBench(15.5, 49.0, 0.30));

        // Farolas cilíndricas del parque (como la que se ve en la foto)
        park.add(createParkLantern(-5.5, 28.5));
        park.add(createParkLantern(7.5, 29.0));
        park.add(createParkLantern(19.5, 30.0));
        park.add(createParkLantern(31.0, 31.5));
        park.add(createParkLantern(12.5, 42.0));

        // 7. Colinas del fondo en el horizonte (paisaje campestre de Villalbilla)
        const hill1 = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), pMat.distantHills);
        hill1.scale.set(45, 3.5, 20);
        hill1.position.set(-15, -1.0, 78);
        park.add(hill1);

        const hill2 = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), pMat.distantHills);
        hill2.scale.set(55, 4.2, 22);
        hill2.position.set(30, -1.0, 82);
        park.add(hill2);

        return park;
    }

    /* ----------------------------------------------------
       BUILD COMPLETE NEIGHBORHOOD COMPLEX
       - 1 house to the left (X = -7.0m)
       - Main interactive house at center (X = 0.0m)
       - 4 houses to the right (X = +7.0m, +14.0m, +21.0m, +28.0m)
       - Mirrored back row with touching rear gardens at Z = -11.0m (X = -7.0, 0, 7, 14, 21, 28 at Z = -22.0m, rot Y = PI)
       ---------------------------------------------------- */
    function buildNeighborhood() {
        if (neighborhoodGroup) {
            scene.remove(neighborhoodGroup);
        }
        neighborhoodGroup = new THREE.Group();
        neighborhoodGroup.name = "neighborhoodGroup";
        neighborHouses = [];

        // Definition of the 11 neighbor houses:
        // Front Row: 1 to the left (x = -7), 4 to the right (x = 7, 14, 21, 28)
        // Back Row: 6 houses directly behind (x = -7, 0, 7, 14, 21, 28) at z = -22, rotated Math.PI (gardens meet at z = -11)
        const houseConfigs = [
            // FILA DELANTERA (Z = 0.0m, Fachada hacia calle principal Z > 0)
            // Casa 1 (Izquierda, X = -7.0m): Sin moto
            { x: -7.0, z: 0.0, mirrored: false, carColor: 0x64748b, hasCar: true, hasBike: false, label: "Casa 1 (Izquierda)" },
            // Casa 2 (Principal/Central, X = 0.0m): CONTIENE LA MOTO KTM 1290 S ORIGINAL
            // Casa 3 (Derecha 1, X = +7.0m): Sin moto
            { x:  7.0, z: 0.0, mirrored: false, carColor: 0x334155, hasCar: true, hasBike: false, label: "Casa 3 (Derecha +1)" },
            // Casa 4 (Derecha 2, X = +14.0m): Sin moto
            { x: 14.0, z: 0.0, mirrored: false, carColor: 0x18181b, hasCar: true, hasBike: false, label: "Casa 4 (Derecha +2)" },
            // Casa 5 (Derecha 3, X = +21.0m): Sin moto
            { x: 21.0, z: 0.0, mirrored: false, carColor: 0x991b1b, hasCar: true, hasBike: false, label: "Casa 5 (Derecha +3)" },
            // Casa 6 (Derecha 4, X = +28.0m): Sin moto
            { x: 28.0, z: 0.0, mirrored: false, carColor: 0x94a3b8, hasCar: true, hasBike: false, label: "Casa 6 (Derecha +4)" },

            // FILA TRASERA EN ESPEJO (Z = -22.0m, rotY = PI) - Sin motos
            { x: -7.0, z: -22.0, mirrored: true, carColor: 0x1e3a8a, hasCar: true, hasBike: false, label: "Vecino Posterior (-1)" },
            { x:  0.0, z: -22.0, mirrored: true, carColor: 0xf8fafc, hasCar: true, hasBike: false, label: "Vecino Posterior Central (0)" },
            { x:  7.0, z: -22.0, mirrored: true, carColor: 0x475569, hasCar: true, hasBike: false, label: "Vecino Posterior (+1)" },
            { x: 14.0, z: -22.0, mirrored: true, carColor: 0x334155, hasCar: true, hasBike: false, label: "Vecino Posterior (+2)" },
            { x: 21.0, z: -22.0, mirrored: true, carColor: 0xffffff, hasCar: true, hasBike: false, label: "Vecino Posterior (+3)" },
            { x: 28.0, z: -22.0, mirrored: true, carColor: 0x111827, hasCar: true, hasBike: false, label: "Vecino Posterior (+4)" }
        ];

        houseConfigs.forEach(cfg => {
            const clone = houseGroup.clone(true);
            clone.position.set(cfg.x, 0, cfg.z);
            if (cfg.mirrored) {
                clone.rotation.y = Math.PI;
            }

            // 1. Quitar luces puntuales dinámicas en clones para respetar el límite de luces de WebGL
            const lightsToRemove = [];
            clone.traverse(child => {
                if (child.isLight) lightsToRemove.push(child);
            });
            lightsToRemove.forEach(l => {
                if (l.parent) l.parent.remove(l);
            });

            // 2. Fila trasera en espejo: eliminar el muro trasero para compartir el muro de la fila delantera y evitar Z-fighting
            if (cfg.mirrored) {
                const backWall = clone.getObjectByName("gardenWallBack");
                if (backWall && backWall.parent) {
                    backWall.parent.remove(backWall);
                }
            }

            // 3. Optimización de rendimiento: eliminar microdetalles de interior no visibles desde el exterior
            const heavyItems = [
                "gardenFloraAndVeggiePatch",
                "architecturalStaircase_0",
                "architecturalStaircase_3"
            ];
            heavyItems.forEach(name => {
                const item = clone.getObjectByName(name);
                if (item && item.parent) item.parent.remove(item);
            });

            // 4. Personalización y variedad de vehículos en aparcamientos
            const kia = clone.getObjectByName("KiaSportage2025");
            const ktm = clone.getObjectByName("KTM1290SuperAdventureS");

            if (!cfg.hasCar && kia && kia.parent) {
                kia.parent.remove(kia);
            } else if (kia && cfg.carColor) {
                const paintMat = new THREE.MeshPhysicalMaterial({
                    color: cfg.carColor,
                    roughness: 0.18,
                    metalness: 0.82,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.08
                });
                kia.traverse(child => {
                    if (child.isMesh && child.material === materials.kiaPaint) {
                        child.material = paintMat;
                    }
                });
            }

            if (!cfg.hasBike && ktm && ktm.parent) {
                ktm.parent.remove(ktm);
            }

            neighborhoodGroup.add(clone);
            neighborHouses.push(clone);
        });

        neighborhoodGroup.visible = areNeighborsVisible;
        scene.add(neighborhoodGroup);
    }

    /* ----------------------------------------------------
       3D DIMENSIONAL MEASUREMENT LINES & COTAS
       Shows exact 7.00m frontage, 1.25m pedestrian clearance, etc.
       ---------------------------------------------------- */
    function buildDimensionMarkers() {
        const group = new THREE.Group();
        group.name = "dimensionMarkers";

        // Line helper
        function makeDimLine(start, end, text) {
            const g = new THREE.Group();
            const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
            g.add(line);

            // Ticks at ends
            const tick1 = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(start[0], start[1] - 0.15, start[2]),
                    new THREE.Vector3(start[0], start[1] + 0.15, start[2])
                ]),
                new THREE.LineBasicMaterial({ color: 0x38bdf8 })
            );
            const tick2 = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(end[0], end[1] - 0.15, end[2]),
                    new THREE.Vector3(end[0], end[1] + 0.15, end[2])
                ]),
                new THREE.LineBasicMaterial({ color: 0x38bdf8 })
            );
            g.add(tick1);
            g.add(tick2);
            return g;
        }

        // Ancho total parcela (7.00 m) y ancho libre aparcamiento (6.56 m)
        group.add(makeDimLine([-3.28, 0.3, 11.4], [3.28, 0.3, 11.4], "Ancho libre 6.56 m"));
        // Cota plaza de aparcamiento (5.00 m)
        group.add(makeDimLine([3.55, 0.3, 4.9], [3.55, 0.3, 9.9], "Plaza 5.00 m"));
        // Cota holgura puertas batientes hacia adentro (1.30 m)
        group.add(makeDimLine([3.55, 0.3, 9.9], [3.55, 0.3, 11.2], "Barrido Batientes 1.30 m"));
        // Pasillo central entre SUV y moto
        group.add(makeDimLine([-1.1, 0.3, 7.4], [0.05, 0.3, 7.4], "Pasillo 1.15 m"));

        return group;
    }

    /* ----------------------------------------------------
       INITIALIZE SCENE, HIGH-END LIGHTING & RENDERER
       ---------------------------------------------------- */
    function init(canvasId) {
        const canvas = document.getElementById(canvasId);
        const container = document.getElementById("viewport-container");

        scene = new THREE.Scene();
        const skyTexture = createProceduralSkyTexture('day');
        scene.background = skyTexture;
        scene.environment = skyTexture;
        scene.fog = new THREE.FogExp2(0xcfdbe8, 0.0075);

        camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.3, 350);
        camera.position.set(16.5, 12.0, 24.5);

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        // Environment Map already set to procedural sky dome above

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.minDistance = 2;
        controls.maxDistance = 160;
        controls.target.set(3.5, 2.6, 1.0);

        // LIGHTING RIG
        hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.58);
        scene.add(hemiLight);

        ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
        scene.add(ambientLight);

        sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
        sunLight.position.set(22, 32, 24);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 165;
        sunLight.shadow.camera.left = -45;
        sunLight.shadow.camera.right = 65;
        sunLight.shadow.camera.top = 55;
        sunLight.shadow.camera.bottom = -60;
        sunLight.shadow.normalBias = 0.02;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.radius = 1.0;
        scene.add(sunLight);

        fillLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
        fillLight.position.set(-16, 12, -16);
        scene.add(fillLight);

        // Build Scene
        initMaterials();

        houseGroup = new THREE.Group();
        groundFloorGroup = buildGroundFloor();
        firstFloorGroup = buildFirstFloor();
        atticGroup = buildAttic();
        roofGroup = buildRoof();
        vehiclesGroup = buildVehiclesAndEntrance();
        exteriorGroup = buildExteriorEnvironment();
        dimensionMarkersGroup = buildDimensionMarkers();

        houseGroup.add(groundFloorGroup);
        houseGroup.add(firstFloorGroup);
        houseGroup.add(atticGroup);
        houseGroup.add(roofGroup);
        houseGroup.add(vehiclesGroup);
        scene.add(houseGroup);
        scene.add(exteriorGroup);
        scene.add(dimensionMarkersGroup);

        buildNeighborhood();

        window.addEventListener("resize", onWindowResize);
        animate();
    }

    function onWindowResize() {
        const container = document.getElementById("viewport-container");
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    /* ----------------------------------------------------
       FLOOR & EXPLODED VIEW SWITCHER
       ---------------------------------------------------- */
    function setFloorView(floorName) {
        if (tourTimeline) tourTimeline.kill();

        if (floorName === "all") {
            gsap.to(groundFloorGroup.position, { y: 0, duration: 0.8, ease: "power2.out" });
            gsap.to(firstFloorGroup.position, { y: 0, duration: 0.8, ease: "power2.out" });
            gsap.to(atticGroup.position, { y: 0, duration: 0.8, ease: "power2.out" });
            gsap.to(roofGroup.position, { y: 0, duration: 0.8, ease: "power2.out" });

            groundFloorGroup.visible = true;
            firstFloorGroup.visible = true;
            atticGroup.visible = true;
            roofGroup.visible = isRoofVisible;

            const camX = areNeighborsVisible ? 16.5 : 13.5;
            const camZ = areNeighborsVisible ? 24.5 : 19.5;
            const targetX = areNeighborsVisible ? 3.5 : 0;
            const targetZ = areNeighborsVisible ? 1.0 : 2.5;
            gsap.to(camera.position, { x: camX, y: 12.0, z: camZ, duration: 1.2, ease: "power2.inOut" });
            controls.target.set(targetX, 2.6, targetZ);
        } else if (floorName === "ground") {
            groundFloorGroup.visible = true;
            firstFloorGroup.visible = false;
            atticGroup.visible = false;
            roofGroup.visible = false;

            gsap.to(groundFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(firstFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(atticGroup.position, { y: 0, duration: 0.5 });
            gsap.to(camera.position, { x: 0.2, y: 15.0, z: 3.8, duration: 1.2, ease: "power2.inOut" });
            controls.target.set(0, 0.5, 0.2);
        } else if (floorName === "first") {
            // Mantiene planta baja de base y muestra planta primera a su altura natural (Y = 3.0m)
            groundFloorGroup.visible = true;
            firstFloorGroup.visible = true;
            atticGroup.visible = false;
            roofGroup.visible = false;

            gsap.to(groundFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(firstFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(atticGroup.position, { y: 0, duration: 0.5 });
            // Cámara enfocando directamente a la planta primera (Y = 3.0m a 5.7m)
            gsap.to(camera.position, { x: 4.8, y: 13.5, z: 7.2, duration: 1.2, ease: "power2.inOut" });
            controls.target.set(0, 3.8, 0);
        } else if (floorName === "attic") {
            // Muestra el edificio completo con planta baja y primera como base, y la BUHARDILLA EN EL 3º PISO (Y = 6.0m)!
            // Tejado retirado para ver el interior del desván sin bajar el dibujo al suelo!
            groundFloorGroup.visible = true;
            firstFloorGroup.visible = true;
            atticGroup.visible = true;
            roofGroup.visible = false;

            gsap.to(groundFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(firstFloorGroup.position, { y: 0, duration: 0.5 });
            gsap.to(atticGroup.position, { y: 0, duration: 0.5 });
            // Cámara enfocando el 3º piso (Buhardilla, Y = 6.0m a 8.9m)
            gsap.to(camera.position, { x: 0.2, y: 21.0, z: 5.5, duration: 1.2, ease: "power2.inOut" });
            controls.target.set(0, 6.8, 0.2);
        } else if (floorName === "exploded") {
            groundFloorGroup.visible = true;
            firstFloorGroup.visible = true;
            atticGroup.visible = true;
            roofGroup.visible = true;

            gsap.to(groundFloorGroup.position, { y: 0, duration: 1.2, ease: "back.out(1.2)" });
            gsap.to(firstFloorGroup.position, { y: 3.8, duration: 1.2, ease: "back.out(1.2)" });
            gsap.to(atticGroup.position, { y: 7.6, duration: 1.2, ease: "back.out(1.2)" });
            gsap.to(roofGroup.position, { y: 11.4, duration: 1.2, ease: "back.out(1.2)" });

            gsap.to(camera.position, { x: 19, y: 14, z: 22, duration: 1.5, ease: "power2.inOut" });
            controls.target.set(0, 6.0, 1);
        }
    }

    function focusRoom(roomName) {
        if (tourTimeline) tourTimeline.kill();

        groundFloorGroup.visible = true;
        firstFloorGroup.visible = true;
        atticGroup.visible = true;
        roofGroup.visible = isRoofVisible;
        gsap.to(groundFloorGroup.position, { y: 0, duration: 0.4 });
        gsap.to(firstFloorGroup.position, { y: 0, duration: 0.4 });
        gsap.to(atticGroup.position, { y: 0, duration: 0.4 });
        gsap.to(roofGroup.position, { y: 0, duration: 0.4 });

        if (roomName === "parking") {
            // Perspectiva elevada del aparcamiento (ancho 6.56m, largo 5.00m + 1.30m batientes)
            gsap.to(camera.position, { x: 3.2, y: 5.4, z: 15.2, duration: 1.4, ease: "power2.inOut" });
            controls.target.set(0, 1.4, 7.5);
        } else if (roomName === "living") {
            roofGroup.visible = false;
            firstFloorGroup.visible = false;
            atticGroup.visible = false;
            gsap.to(camera.position, { x: 1.8, y: 3.2, z: 2.2, duration: 1.4, ease: "power2.inOut" });
            controls.target.set(0.6, 1.2, -2.4);
        } else if (roomName === "kitchen") {
            roofGroup.visible = false;
            firstFloorGroup.visible = false;
            atticGroup.visible = false;
            // Elevated view from salon looking into kitchen through the door
            gsap.to(camera.position, { x: -0.2, y: 3.2, z: -0.8, duration: 1.4, ease: "power2.inOut" });
            controls.target.set(-1.8, 1.2, 3.0);
        } else if (roomName === "garden") {
            roofGroup.visible = true;
            firstFloorGroup.visible = true;
            atticGroup.visible = true;
            gsap.to(camera.position, { x: 4.5, y: 3.8, z: -12.5, duration: 1.5, ease: "power2.inOut" });
            controls.target.set(-0.8, 1.2, -7.5);
        } else if (roomName === "suite") {
            roofGroup.visible = false;
            atticGroup.visible = false;
            firstFloorGroup.visible = true;
            groundFloorGroup.visible = true;
            gsap.to(camera.position, { x: 3.6, y: 5.8, z: -4.5, duration: 1.4, ease: "power2.inOut" });
            controls.target.set(0.6, 4.2, -2.8);
        } else if (roomName === "attic_room") {
            roofGroup.visible = false;
            atticGroup.visible = true;
            firstFloorGroup.visible = true;
            groundFloorGroup.visible = true;
            gsap.to(camera.position, { x: 2.5, y: 8.8, z: 3.5, duration: 1.4, ease: "power2.inOut" });
            controls.target.set(0, 7.2, 0.5);
        }
    }

    function startVideoTour(onProgress, onComplete) {
        if (tourTimeline) tourTimeline.kill();
        isTourRunning = true;
        setFloorView("all");

        const waypoints = [
            {
                title: "1. Fachada Principal & Acceso Privado",
                desc: "Arquitectura contemporánea con acabado SATE blanco, celosías de roble natural y cubierta de pizarra antracita.",
                cam: { x: 13.5, y: 9.2, z: 19.5 },
                target: { x: 0, y: 2.6, z: 2.5 },
                duration: 4.5,
                setup: () => {
                    groundFloorGroup.visible = true;
                    firstFloorGroup.visible = true;
                    atticGroup.visible = true;
                    roofGroup.visible = true;
                }
            },
            {
                title: "2. Doble Acceso & Pérgola de Aparcamiento (KTM + Kia)",
                desc: "Doble entrada exterior: cancel de vehículos (3.50 m) y puerta peatonal independiente (1.05 m). La nueva pérgola bioclimática elimina postes interiores y libera todo el gálibo.",
                cam: { x: 3.4, y: 5.2, z: 15.0 },
                target: { x: 0, y: 1.4, z: 7.5 },
                duration: 5.5,
                setup: () => {}
            },
            {
                title: "3. Planta Baja: Salón-Comedor (20.18 m²)",
                desc: "Zona de día amplia y luminosa con gran ventanal corredero de 4.40 metros que une el salón con la terraza del jardín privado.",
                cam: { x: 1.6, y: 2.4, z: 1.8 },
                target: { x: 0.5, y: 1.1, z: -2.5 },
                duration: 5.0,
                setup: () => {
                    firstFloorGroup.visible = false;
                    atticGroup.visible = false;
                    roofGroup.visible = false;
                }
            },
            {
                title: "4. Jardín Privado Posterior (36.08 m²)",
                desc: "Pradera de césped natural, pérgola bioclimática antracita, comedor exterior y cerramiento perimetral de privacidad.",
                cam: { x: -3.8, y: 3.2, z: -11.5 },
                target: { x: 0.2, y: 1.5, z: -5.5 },
                duration: 5.0,
                setup: () => {
                    firstFloorGroup.visible = true;
                    atticGroup.visible = true;
                    roofGroup.visible = true;
                }
            },
            {
                title: "5. Planta Primera: Master Suite (14.30 m²) & Terraza",
                desc: "Dormitorio principal con cama king size, baño en suite completo con plato de ducha y salida a terraza privada con barandilla de cristal.",
                cam: { x: 3.2, y: 5.4, z: -4.2 },
                target: { x: 0.6, y: 4.1, z: -2.8 },
                duration: 5.0,
                setup: () => {
                    roofGroup.visible = false;
                    atticGroup.visible = false;
                }
            },
            {
                title: "6. Planta Buhardilla (22.95 m²)",
                desc: "Espacio polivalente diáfano bajo cubierta a 30° con vigas de madera vistas, ventanas Velux, despacho de teletrabajo y zona de lectura.",
                cam: { x: 2.2, y: 8.5, z: 3.2 },
                target: { x: 0, y: 7.1, z: 0.5 },
                duration: 5.0,
                setup: () => {
                    roofGroup.visible = false;
                    atticGroup.visible = true;
                }
            },
            {
                title: "7. Vista Seccional / Despiece 3D",
                desc: "Despiece estratificado de todas las plantas para comprender las alturas libres de 2.70 m y la armonía constructiva del proyecto.",
                cam: { x: 18, y: 14, z: 22 },
                target: { x: 0, y: 6.0, z: 1 },
                duration: 5.0,
                setup: () => {
                    setFloorView("exploded");
                }
            }
        ];

        let currentIndex = 0;

        function runWaypoint(index) {
            if (!isTourRunning || index >= waypoints.length) {
                isTourRunning = false;
                if (onComplete) onComplete();
                return;
            }

            const wp = waypoints[index];
            wp.setup();

            if (onProgress) {
                onProgress({
                    index: index + 1,
                    total: waypoints.length,
                    title: wp.title,
                    desc: wp.desc,
                    percent: ((index + 1) / waypoints.length) * 100
                });
            }

            gsap.to(camera.position, {
                x: wp.cam.x,
                y: wp.cam.y,
                z: wp.cam.z,
                duration: wp.duration,
                ease: "power2.inOut"
            });

            gsap.to(controls.target, {
                x: wp.target.x,
                y: wp.target.y,
                z: wp.target.z,
                duration: wp.duration,
                ease: "power2.inOut",
                onComplete: () => {
                    setTimeout(() => {
                        runWaypoint(index + 1);
                    }, 800);
                }
            });
        }

        runWaypoint(0);
    }

    function stopVideoTour() {
        isTourRunning = false;
        if (tourTimeline) tourTimeline.kill();
        setFloorView("all");
    }

    function toggleRoof() {
        isRoofVisible = !isRoofVisible;
        roofGroup.visible = isRoofVisible;
        return isRoofVisible;
    }

    function toggleVehicles() {
        areVehiclesVisible = !areVehiclesVisible;
        vehiclesGroup.visible = areVehiclesVisible;
        neighborHouses.forEach(nh => {
            const v = nh.getObjectByName("vehiclesAndEntrance");
            if (v) {
                const kia = v.getObjectByName("KiaSportage2025");
                const ktm = v.getObjectByName("KTM1290SuperAdventureS");
                if (kia) kia.visible = areVehiclesVisible;
                if (ktm) ktm.visible = areVehiclesVisible;
            }
        });
        return areVehiclesVisible;
    }

    function toggleNeighbors() {
        areNeighborsVisible = !areNeighborsVisible;
        if (neighborhoodGroup) {
            neighborhoodGroup.visible = areNeighborsVisible;
        }
        return areNeighborsVisible;
    }

    function areNeighborsShown() {
        return areNeighborsVisible;
    }

    function toggleSunlight() {
        if (currentSunMode === "day") {
            currentSunMode = "sunset";
            const sunsetTex = createProceduralSkyTexture('sunset');
            scene.background = sunsetTex;
            scene.environment = sunsetTex;
            sunLight.color.setHex(0xf97316);
            sunLight.intensity = 2.8;
            sunLight.position.set(-22, 9, 12);
            hemiLight.color.setHex(0xfb923c);
            hemiLight.groundColor.setHex(0x431407);
            hemiLight.intensity = 0.85;
            scene.fog.color.setHex(0x9a3412);
            scene.fog.density = 0.009;
        } else if (currentSunMode === "sunset") {
            currentSunMode = "night";
            const nightTex = createProceduralSkyTexture('night');
            scene.background = nightTex;
            scene.environment = nightTex;
            sunLight.color.setHex(0x38bdf8);
            sunLight.intensity = 0.35;
            sunLight.position.set(10, 20, -10);
            hemiLight.color.setHex(0x1e293b);
            hemiLight.groundColor.setHex(0x020617);
            hemiLight.intensity = 0.35;
            scene.fog.color.setHex(0x090d16);
            scene.fog.density = 0.012;
        } else {
            currentSunMode = "day";
            const dayTex = createProceduralSkyTexture('day');
            scene.background = dayTex;
            scene.environment = dayTex;
            sunLight.color.setHex(0xfffaed);
            sunLight.intensity = 2.6;
            sunLight.position.set(16, 26, 18);
            hemiLight.color.setHex(0xdbeafe);
            hemiLight.groundColor.setHex(0x1e293b);
            hemiLight.intensity = 0.80;
            scene.fog.color.setHex(0xcfdbe8);
            scene.fog.density = 0.0075;
        }
        return currentSunMode;
    }

    function resetCamera() {
        setFloorView("all");
    }

    function swapVehicles(animate = true) {
        vehiclesSwapped = !vehiclesSwapped;
        // vehiclesSwapped: true = KTM Left (-1.65), Kia Right (+1.10)
        // vehiclesSwapped: false = Kia Left (-1.15), KTM Right (+1.15)
        const targetKtm = vehiclesSwapped ? { x: -1.65, z: 7.40 } : { x: 0.95, z: 7.40 };
        const targetKia = vehiclesSwapped ? { x: 0.95, z: 7.40 } : { x: -1.65, z: 7.40 };

        if (animate && window.gsap && ktmMesh && kiaMesh) {
            gsap.to(ktmMesh.position, { x: targetKtm.x, z: targetKtm.z, duration: 0.9, ease: "power2.inOut" });
            gsap.to(kiaMesh.position, { x: targetKia.x, z: targetKia.z, duration: 0.9, ease: "power2.inOut" });
        } else {
            if (ktmMesh) ktmMesh.position.set(-1.50, 0, 7.40);
            if (kiaMesh) kiaMesh.position.set(1.05, 0, 7.40);
        }
        return vehiclesSwapped;
    }

    function isVehiclesSwapped() {
        return vehiclesSwapped;
    }

    function getRendererCanvas() {
        return renderer ? renderer.domElement : null;
    }

    return {
        init: init,
        setFloorView: setFloorView,
        focusRoom: focusRoom,
        startVideoTour: startVideoTour,
        stopVideoTour: stopVideoTour,
        toggleRoof: toggleRoof,
        toggleVehicles: toggleVehicles,
        toggleNeighbors: toggleNeighbors,
        areNeighborsShown: areNeighborsShown,
        toggleSunlight: toggleSunlight,
        swapVehicles: swapVehicles,
        isVehiclesSwapped: isVehiclesSwapped,
        resetCamera: resetCamera,
        getRendererCanvas: getRendererCanvas,
        getCamera: () => camera,
        getControls: () => controls
    };
})();
