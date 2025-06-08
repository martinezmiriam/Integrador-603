// promoCliente.js - Versión unificada para el cliente

document.addEventListener("DOMContentLoaded", async () => {
    // Cargar promociones desde el backend
    try {
        await loadPromotions();
    } catch (error) {
        console.error("Error al cargar promociones:", error);
        const grid = document.getElementById("promotionsGrid") || document.getElementById("promotions-container");
        if (grid) grid.innerHTML = "<p>Error al cargar promociones. Por favor intente más tarde.</p>";
    }

    // Configurar menú de navegación
    setupMenu();

    // Configurar modal de reservas
    setupReservationModal();
});

function guardarPromo(promo) {
localStorage.setItem("promoSeleccionada", promo.id_autolavado); // ← debe ser un ID real, ej. 5
    window.location.href = "CarritoCliente.html"; // o la página del carrito
}


// Cargar promociones desde la API
async function loadPromotions() {
    const grid = document.getElementById("promotionsGrid") || document.getElementById("promotions-container");
    if (!grid) return;

    try {
        const res = await fetch("http://localhost:3000/api/autolavado");
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        
        const promotions = await res.json();
        grid.innerHTML = ""; // Limpiar contenido previo

        if (!Array.isArray(promotions)) {
            grid.innerHTML = "<p>No se encontraron promociones disponibles.</p>";
            return;
        }

        promotions.forEach(promo => {
            const card = createPromotionCard(promo);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar promociones:", error);
        grid.innerHTML = "<p>Error al cargar promociones. Por favor intente más tarde.</p>";
        throw error;
    }
}

// Crear tarjeta de promoción (versión simplificada para cliente)
function createPromotionCard(promo) {
    const id = promo.id_autolavado;
    const nombreCompleto = promo.nombre_paquete || "Paquete sin nombre";
    const tipo = promo.tipo_paquete || "default";
    const imagenUrl = promo.imagen_url || "img/Promocion/default.png";
    const descripcion = promo.descripcion || "Sin descripción";
    const precio = promo.precio !== undefined ? promo.precio : "0";
    const duracion = promo.duracion_aprox || "No especificada";

    const card = document.createElement("div");
    card.className = "promotion-card";
    card.dataset.promotion = id;
    card.dataset.tipo = tipo.toLowerCase();

    // Dividir el nombre para el formato especial
    const nombreSplit = nombreCompleto.split(" ");
    const primerPalabra = nombreSplit[0];
    const restoDelNombre = nombreSplit.slice(1).join(" ") || "";

    card.innerHTML = `
        <div class="card-content">
            <h2 class="service-title">
                <span>${primerPalabra}</span>
                <span class="highlight">${restoDelNombre}</span>${getEmoji(tipo)}<br>
            </h2>

            <div class="descripcion-precio-duracion">
                <p><strong>Descripción:</strong> ${descripcion}</p>
                <p><strong>Precio:</strong> $${precio}</p>
                <p><strong>Duración:</strong> ${duracion}</p>
            </div>

            <div class="service-images">
                ${createServiceItems(promo.servicios)}
            </div>

            <div class="car-image">
                <img src="${imagenUrl}" alt="${nombreCompleto}">
            </div>

            <div class="contact-info">
                <button class="book-btn">Reservar</button>
            </div>
        </div>
    `;

    return card;
}

// Crear items de servicios
function createServiceItems(services) {
    const icons = ["🫧", "🪟", "🌀", "🍃", "🚗", "🌟", "⚙️", "🧼", "🌈", "💧", "🛞", "🛡️"];

    if (!services || services.length === 0) {
        return `<p class="no-services">Este paquete no tiene servicios detallados</p>`;
    }

    // Si es un string separado por ; (formato antiguo)
    if (typeof services === 'string') {
        return services.split(';')
            .map((service, index) => `
                <div class="service-item">
                    <div class="service-icon">${icons[index % icons.length]}</div>
                    <span>${service.trim()}</span>
                </div>
            `)
            .join('');
    }

    // Si es un array de objetos o strings
    return services
        .map((service, index) => `
            <div class="service-item">
                <div class="service-icon">${icons[index % icons.length]}</div>
                <span>${typeof service === 'object' ? service.nombre : service}</span>
            </div>
        `)
        .join('');
}

// Emoji según tipo de paquete
function getEmoji(type) {
    const emojis = {
        "Económico": "💰",
        "BÁSICO": "⭐",
        "PREMIUM": "💎",
        "VIP": "🏆",
        "default": "✨",
    };
    return emojis[type] || emojis.default;
}

// Configurar menú de navegación
function setupMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const closeButton = document.querySelector("#menu .close");
    const menu = document.querySelector("#menu");

    if (menuToggle && closeButton && menu) {
        menuToggle.addEventListener("click", (e) => {
            e.preventDefault();
            menu.classList.add("active");
        });

        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            menu.classList.remove("active");
        });
    }
}

// Configurar modal de reservas
function setupReservationModal() {
    const modal = document.getElementById("moreServicesModal");
    const closeBtn = document.querySelector(".close-modal");
    const goToServicesBtn = document.getElementById("goToServices");
    const continueBookingBtn = document.getElementById("continueBooking");
    const grid = document.getElementById("promotionsGrid") || document.getElementById("promotions-container");

    if (!modal || !grid) return;

    // Delegar eventos en la grid
    grid.addEventListener("click", (e) => {
        const card = e.target.closest(".promotion-card");
        const bookBtn = e.target.closest(".book-btn");

        if (card && !bookBtn) {
            selectCard(card);
            setTimeout(() => {
                if (modal) modal.style.display = "block";
            }, 300);
        }

        if (bookBtn) {
            const selectedCard = bookBtn.closest(".promotion-card");
            selectCard(selectedCard);
            setTimeout(() => {
                if (modal) modal.style.display = "block";
            }, 300);
        }
    });

    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
        });
    }

    // Ir a servicios
    if (goToServicesBtn) {
        goToServicesBtn.addEventListener("click", () => {
            window.location.href = "CarritoCliente.html";
        });
    }

    // Continuar con la reserva
if (continueBookingBtn) {
    continueBookingBtn.addEventListener("click", () => {
        const selected = document.querySelector(".promotion-card.selected");
        if (selected) {
            const idPromo = selected.dataset.promotion; // id real
            const tipo = selected.dataset.tipo;         // texto: "vip", "premium", etc.

            localStorage.setItem("promoSeleccionada", idPromo);
            showNotification(`Has seleccionado el servicio: ${tipo.toUpperCase()}`);

            if (modal) modal.style.display = "none";
        }
    });
}

}

// Seleccionar tarjeta
function selectCard(card) {
    if (!card) return;
    
    document.querySelectorAll(".promotion-card")
        .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
}

// Mostrar notificación
function showNotification(message) {
    alert(message); // Puedes reemplazar esto con un sistema de notificaciones más elegante
}