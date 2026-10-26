/* ========================================================
   VILLALBILLA HOMES - APP CONTROLLER & INTERACTION LOGIC
   UI Bindings, Video Tour Automation, Video Recording & Modals
   ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize 3D Scene
    House3D.init("webgl-canvas");

    // 2. DOM Elements
    const btnFloorAll = document.getElementById("btn-floor-all");
    const btnFloorGround = document.getElementById("btn-floor-ground");
    const btnFloorFirst = document.getElementById("btn-floor-first");
    const btnFloorAttic = document.getElementById("btn-floor-attic");
    const btnFloorExploded = document.getElementById("btn-floor-exploded");
    const floorButtons = [btnFloorAll, btnFloorGround, btnFloorFirst, btnFloorAttic, btnFloorExploded];

    const btnRoomParking = document.getElementById("btn-room-parking");
    const btnRoomLiving = document.getElementById("btn-room-living");
    const btnRoomKitchen = document.getElementById("btn-room-kitchen");
    const btnRoomGarden = document.getElementById("btn-room-garden");
    const btnRoomSuite = document.getElementById("btn-room-suite");
    const btnRoomAttic = document.getElementById("btn-room-attic");
    const roomButtons = [btnRoomParking, btnRoomLiving, btnRoomKitchen, btnRoomGarden, btnRoomSuite, btnRoomAttic];

    const btnToggleRoof = document.getElementById("btn-toggle-roof");
    const btnToggleVehicles = document.getElementById("btn-toggle-vehicles");
    const btnToggleNeighbors = document.getElementById("btn-toggle-neighbors");
    const btnToggleSun = document.getElementById("btn-toggle-sun");
    const btnResetCam = document.getElementById("btn-reset-cam");
    const btnSwapVehicles = document.getElementById("btn-swap-vehicles");
    const btnSwapDock = document.getElementById("btn-swap-dock");
    const vehicleLayoutText = document.getElementById("vehicle-layout-text");
    const bayNoteText = document.getElementById("bay-note-text");

    const btnVideoTour = document.getElementById("btn-video-tour");
    const btnRecordVideo = document.getElementById("btn-record-video");
    const btnStopTour = document.getElementById("btn-stop-tour");

    const tourHud = document.getElementById("tour-hud");
    const tourCaptionTitle = document.getElementById("tour-caption-title");
    const tourCaptionText = document.getElementById("tour-caption-text");
    const tourProgressBar = document.getElementById("tour-progress-bar");

    const roomInfoCard = document.getElementById("room-info-card");
    const cardLevelTag = document.getElementById("card-level-tag");
    const cardRoomTitle = document.getElementById("card-room-title");
    const cardRoomDesc = document.getElementById("card-room-desc");
    const cardChips = document.getElementById("card-chips");
    const vehicleBayCard = document.getElementById("vehicle-bay-card");

    const btnGallery = document.getElementById("btn-gallery");
    const galleryModal = document.getElementById("gallery-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");

    const videoModal = document.getElementById("video-modal");
    const btnCloseVideoModal = document.getElementById("btn-close-video-modal");
    const recorderIndicator = document.getElementById("recorder-indicator");
    const recTimer = document.getElementById("rec-timer");

    // MediaRecorder state
    let mediaRecorder = null;
    let recordedChunks = [];
    let recInterval = null;
    let recSeconds = 0;

    // Helper: Update Active Dock Button
    function setActiveFloorBtn(activeBtn) {
        floorButtons.forEach(b => b.classList.remove("active"));
        roomButtons.forEach(b => b.classList.remove("active"));
        if (activeBtn) activeBtn.classList.add("active");
    }

    function setActiveRoomBtn(activeBtn) {
        roomButtons.forEach(b => b.classList.remove("active"));
        floorButtons.forEach(b => b.classList.remove("active"));
        if (activeBtn) activeBtn.classList.add("active");
    }

    // Helper: Update Room Info Card
    function updateInfoCard(tag, title, desc, chipsHtml, showVehicleCard = false) {
        cardLevelTag.innerText = tag;
        cardRoomTitle.innerText = title;
        cardRoomDesc.innerText = desc;
        cardChips.innerHTML = chipsHtml;

        if (showVehicleCard) {
            vehicleBayCard.classList.remove("hidden");
        } else {
            vehicleBayCard.classList.add("hidden");
        }
    }

    // Floor Button Listeners
    btnFloorAll.addEventListener("click", () => {
        setActiveFloorBtn(btnFloorAll);
        House3D.setFloorView("all");
        updateInfoCard(
            "VISTA EXTERIOR",
            "Conjunto Residencial Villalbilla Homes",
            "Vivienda unifamiliar pareada con jardín delantero de acceso, porche de aparcamiento para 2 vehículos (SUV Kia Sportage 2025 y moto KTM 1290 S 2024), 3 plantas habitables y jardín privado trasero de 36 m².",
            `<span class="chip"><i class="fa-solid fa-expand"></i> Parcela 7.00m x 16.00m</span>
             <span class="chip"><i class="fa-solid fa-shield-halved"></i> SATE + Madera</span>
             <span class="chip"><i class="fa-solid fa-temperature-arrow-down"></i> Aerotermia</span>`
        );
    });

    btnFloorGround.addEventListener("click", () => {
        setActiveFloorBtn(btnFloorGround);
        House3D.setFloorView("ground");
        updateInfoCard(
            "PLANTA BAJA (62.50 m²)",
            "Salón, Cocina, Jardín y Acceso",
            "Zona de día compuesta por vestíbulo de entrada (11.42 m²), armario (1.46 m²), cocina independiente amueblada (8.69 m²), amplio salón-comedor (20.18 m²) con conexión directa a terraza y jardín privado (36.08 m²).",
            `<span class="chip"><i class="fa-solid fa-couch"></i> Salón 20.18 m²</span>
             <span class="chip"><i class="fa-solid fa-kitchen-set"></i> Cocina 8.69 m²</span>
             <span class="chip"><i class="fa-solid fa-tree"></i> Jardín 36.08 m²</span>`
        );
    });

    btnFloorFirst.addEventListener("click", () => {
        setActiveFloorBtn(btnFloorFirst);
        House3D.setFloorView("first");
        updateInfoCard(
            "PLANTA PRIMERA (62.50 m²)",
            "3 Dormitorios, 2 Baños y Terraza Privada",
            "Zona de noche con Dormitorio Principal en Suite (14.30 m²) con baño completo incorporado (5.22 m²) y salida a terraza solárium (5.70 m²). Dos dormitorios adicionales (9.31 m² y 8.94 m²), segundo baño completo (3.96 m²) y distribuidor (5.98 m²).",
            `<span class="chip"><i class="fa-solid fa-crown"></i> Suite 14.30 m²</span>
             <span class="chip"><i class="fa-solid fa-umbrella-beach"></i> Terraza 5.70 m²</span>
             <span class="chip"><i class="fa-solid fa-bath"></i> 2 Baños completos</span>`
        );
    });

    btnFloorAttic.addEventListener("click", () => {
        setActiveFloorBtn(btnFloorAttic);
        House3D.setFloorView("attic");
        updateInfoCard(
            "PLANTA BUHARDILLA (22.95 m²)",
            "Espacio Diáfano Multifuncional",
            "Impresionante espacio diáfano bajo cubierta inclinada a 30° con ventanas Velux. Diseñado como área versátil para despacho de teletrabajo, zona de ocio, sala de lectura o cuarto de invitados.",
            `<span class="chip"><i class="fa-solid fa-maximize"></i> 22.95 m² útiles</span>
             <span class="chip"><i class="fa-solid fa-laptop"></i> Despacho / Relax</span>
             <span class="chip"><i class="fa-solid fa-sun"></i> Ventanas Cenitales</span>`
        );
    });

    btnFloorExploded.addEventListener("click", () => {
        setActiveFloorBtn(btnFloorExploded);
        House3D.setFloorView("exploded");
        updateInfoCard(
            "DESPIECE 3D ESTRATIFICADO",
            "Corte Arquitectónico Exploded View",
            "Desglose tridimensional que eleva verticalmente cada nivel constructivo: Planta Baja, Planta Primera, Buhardilla y Cubierta de pizarra. Permite analizar la relación espacial y las alturas libres de 2.70 m.",
            `<span class="chip"><i class="fa-solid fa-ruler-vertical"></i> H libre: 2.70 m</span>
             <span class="chip"><i class="fa-solid fa-arrows-up-down"></i> Altura Total 10.00 m</span>
             <span class="chip"><i class="fa-solid fa-layer-group"></i> 3 Niveles + Cubierta</span>`
        );
    });

    // Room Focus Listeners
    btnRoomParking.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomParking);
        House3D.focusRoom("parking");
        updateInfoCard(
            "ACCESO DOBLE & PÉRGOLA DE APARCAMIENTO",
            "Doble Ingreso (Vehículos + Personas) & Pérgola Diáfana",
            "Doble acceso exterior: puerta corredera de vehículos (3.50 m) y cancela peatonal independiente (1.05 m) con videoportero. En el interior, la pérgola arquitectónica sustituye al porche eliminando postes interiores, dejando paso libre y total gálibo para la SUV Kia Sportage (derecha) y la Moto KTM 1290 S (izquierda).",
            `<span class="chip"><i class="fa-solid fa-car-side"></i> Acceso Vehículos 3.50m</span>
             <span class="chip"><i class="fa-solid fa-person-walking"></i> Puerta Peatonal 1.05m</span>
             <span class="chip"><i class="fa-solid fa-cloud-sun"></i> Pérgola sin postes</span>`,
            true // Show vehicle card
        );
    });

    btnRoomLiving.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomLiving);
        House3D.focusRoom("living");
        updateInfoCard(
            "PLANTA BAJA",
            "Salón-Comedor Principal (20.18 m²)",
            "Espacio noble de la vivienda equipado con zona de estar para sofá con chaise longue, mueble multimedia y zona de comedor para 6 comensales con vistas panorámicas al jardín posterior.",
            `<span class="chip"><i class="fa-solid fa-couch"></i> 20.18 m²</span>
             <span class="chip"><i class="fa-solid fa-border-all"></i> Ventanal 4.40 m</span>
             <span class="chip"><i class="fa-solid fa-sun"></i> Luz Natural</span>`
        );
    });

    btnRoomKitchen.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomKitchen);
        House3D.focusRoom("kitchen");
        updateInfoCard(
            "PLANTA BAJA",
            "Cocina Equipada (8.69 m²)",
            "Cocina de diseño contemporáneo amueblada en 'L' con muebles blancos de gran capacidad, encimera de cuarzo compacto, electrodomésticos integrados y ventana exterior a fachada principal.",
            `<span class="chip"><i class="fa-solid fa-kitchen-set"></i> 8.69 m²</span>
             <span class="chip"><i class="fa-solid fa-sink"></i> Fregadero & Placa</span>
             <span class="chip"><i class="fa-solid fa-utensils"></i> Muebles Integrados</span>`
        );
    });

    btnRoomGarden.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomGarden);
        House3D.focusRoom("garden");
        updateInfoCard(
            "EXTERIOR POSTERIOR",
            "Jardín Privado (36.08 m²), Minihuerta & Flores",
            "Oasis privado al aire libre con pradera de césped, pérgola bioclimática con comedor exterior, minihuerta ecológica en bancales elevados de madera (con lechugas, tomateras y aromáticas) y parterres con flores de lavanda, rosas y hortensias.",
            `<span class="chip"><i class="fa-solid fa-seedling"></i> Minihuerta Urbana</span>
             <span class="chip"><i class="fa-solid fa-spa"></i> Flores & Lavanda</span>
             <span class="chip"><i class="fa-solid fa-campground"></i> Pérgola Comedor</span>`
        );
    });

    btnRoomSuite.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomSuite);
        House3D.focusRoom("suite");
        updateInfoCard(
            "PLANTA PRIMERA",
            "Dormitorio Principal Suite (14.30 m²) & Terraza (5.70 m²)",
            "Espacio de descanso de máxima calidad con cama king size, armarios modulares, baño privado en suite (5.22 m²) y acceso exclusivo a terraza solárium con barandilla de cristal sobre el jardín.",
            `<span class="chip"><i class="fa-solid fa-bed"></i> Suite 14.30 m²</span>
             <span class="chip"><i class="fa-solid fa-bath"></i> Baño en Suite 5.22 m²</span>
             <span class="chip"><i class="fa-solid fa-umbrella-beach"></i> Terraza 5.70 m²</span>`
        );
    });

    btnRoomAttic.addEventListener("click", () => {
        setActiveRoomBtn(btnRoomAttic);
        House3D.focusRoom("attic_room");
        updateInfoCard(
            "PLANTA BAJO CUBIERTA",
            "Buhardilla Acondicionada (22.95 m²)",
            "Zona de buhardilla completamente habilitada con aislamiento térmico reforzado bajo cubierta a 30°, dotada de escritorio de trabajo, librería y rincón de lectura chill-out.",
            `<span class="chip"><i class="fa-solid fa-cube"></i> 22.95 m²</span>
             <span class="chip"><i class="fa-solid fa-briefcase"></i> Despacho Teletrabajo</span>
             <span class="chip"><i class="fa-solid fa-couch"></i> Rincón Chillout</span>`
        );
    });

    // Toolbar Toggles
    btnToggleRoof.addEventListener("click", () => {
        const visible = House3D.toggleRoof();
        btnToggleRoof.classList.toggle("active", visible);
    });

    btnToggleVehicles.addEventListener("click", () => {
        const visible = House3D.toggleVehicles();
        btnToggleVehicles.classList.toggle("active", visible);
    });

    if (btnToggleNeighbors) {
        btnToggleNeighbors.addEventListener("click", () => {
            const visible = House3D.toggleNeighbors();
            btnToggleNeighbors.classList.toggle("active", !visible);
            btnToggleNeighbors.innerHTML = visible
                ? `<i class="fa-solid fa-city"></i> Vecinos`
                : `<i class="fa-solid fa-eye-slash"></i> Sin Vecinos`;
            btnToggleNeighbors.title = visible
                ? "Ocultar todas las casas vecinas"
                : "Mostrar todas las casas vecinas";
        });
    }

    btnToggleSun.addEventListener("click", () => {
        const mode = House3D.toggleSunlight();
        btnToggleSun.innerHTML = `<i class="fa-solid fa-sun"></i> ${mode.toUpperCase()}`;
    });

    btnResetCam.addEventListener("click", () => {
        House3D.resetCamera();
        setActiveFloorBtn(btnFloorAll);
    });

    // Vehicle Swap Functionality
    function handleSwapVehicles() {
        const isSwapped = House3D.swapVehicles(true);
        if (vehicleLayoutText) {
            vehicleLayoutText.innerHTML = isSwapped
                ? `<strong>Disposición actual:</strong> Moto KTM (Izquierda) | SUV Kia (Derecha)`
                : `<strong>Disposición actual:</strong> SUV Kia (Izquierda) | Moto KTM (Derecha)`;
        }
        if (bayNoteText) {
            bayNoteText.innerHTML = isSwapped
                ? `<strong>Doble acceso exterior:</strong> Cancel corredero para vehículos (3.50 m) y puerta peatonal independiente (1.05 m) con videoportero. En el interior, la nueva <strong>pérgola arquitectónica</strong> elimina postes centrales, asegurando gálibo total y maniobra sin obstáculos para la SUV y la Moto con pasillo central de 1.35 m.`
                : `<strong>Configuración alternativa:</strong> SUV Kia a la izquierda y Moto KTM a la derecha bajo la pérgola diáfana sin postes, con acceso peatonal lateral libre hacia la vivienda.`;
        }
    }

    if (btnSwapVehicles) btnSwapVehicles.addEventListener("click", handleSwapVehicles);
    if (btnSwapDock) btnSwapDock.addEventListener("click", handleSwapVehicles);

    // Video Tour Execution
    btnVideoTour.addEventListener("click", () => {
        startTour();
    });

    btnStopTour.addEventListener("click", () => {
        stopTour();
    });

    function startTour() {
        tourHud.classList.remove("hidden");
        btnVideoTour.innerHTML = `<i class="fa-solid fa-pause"></i> En Pausa`;

        House3D.startVideoTour(
            (progress) => {
                tourCaptionTitle.innerText = progress.title;
                tourCaptionText.innerText = progress.desc;
                tourProgressBar.style.width = `${progress.percent}%`;
            },
            () => {
                tourHud.classList.add("hidden");
                btnVideoTour.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Video-Tour`;
            }
        );
    }

    function stopTour() {
        House3D.stopVideoTour();
        tourHud.classList.add("hidden");
        btnVideoTour.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Video-Tour`;
    }

    // MediaRecorder: Record & Download Walkthrough Video (MP4 / WebM)
    btnRecordVideo.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            // Stop recording
            stopRecording();
        } else {
            // Start recording
            startRecording();
        }
    });

    function startRecording() {
        const canvas = House3D.getRendererCanvas();
        if (!canvas) return;

        recordedChunks = [];
        const stream = canvas.captureStream(30); // 30 FPS

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        try {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps HD
            });
        } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            clearInterval(recInterval);
            recorderIndicator.classList.add("hidden");
            btnRecordVideo.innerHTML = `<i class="fa-solid fa-video"></i> Grabar Video`;

            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            
            // Automatic Download
            const a = document.createElement("a");
            a.href = url;
            a.download = "Recorrido_3D_Villalbilla_Homes.webm";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Also open video modal with preview
            const player = document.getElementById("walkthrough-video-player");
            player.src = url;
            videoModal.classList.remove("hidden");
        };

        mediaRecorder.start();
        recorderIndicator.classList.remove("hidden");
        btnRecordVideo.innerHTML = `<i class="fa-solid fa-stop"></i> Detener Grabación`;

        recSeconds = 0;
        recInterval = setInterval(() => {
            recSeconds++;
            const mins = String(Math.floor(recSeconds / 60)).padStart(2, '0');
            const secs = String(recSeconds % 60).padStart(2, '0');
            recTimer.innerText = `${mins}:${secs}`;
        }, 1000);

        // Run the tour while recording
        startTour();
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        stopTour();
    }

    // Gallery Modal
    btnGallery.addEventListener("click", () => {
        galleryModal.classList.remove("hidden");
    });

    btnCloseModal.addEventListener("click", () => {
        galleryModal.classList.add("hidden");
    });

    galleryModal.addEventListener("click", (e) => {
        if (e.target === galleryModal) galleryModal.classList.add("hidden");
    });

    btnCloseVideoModal.addEventListener("click", () => {
        videoModal.classList.add("hidden");
        const player = document.getElementById("walkthrough-video-player");
        player.pause();
    });

    videoModal.addEventListener("click", (e) => {
        if (e.target === videoModal) {
            videoModal.classList.add("hidden");
            const player = document.getElementById("walkthrough-video-player");
            player.pause();
        }
    });
});
