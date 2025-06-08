// adminPromo.js - Código unificado para Admin_Promo.html

// Variables globales
let originalContent = {};
let currentEditingElement = null;
let currentImageElement = null;

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configuración del menú
    const menuToggle = document.querySelector('.menu-toggle');
    const closeButton = document.querySelector('#menu .close');
    const menu = document.querySelector('#menu');

    if (menuToggle && closeButton && menu) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            menu.classList.add('active');
        });

        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            menu.classList.remove('active');
        });
    }

    // Guardar contenido original
    saveOriginalContent();

    // Configurar eventos de modales
    setupModalEvents();

    // Configurar carga de imágenes
    setupImageUpload();

    // Cargar promociones
    loadPromotions();

    // Configurar formulario de nuevo paquete
    setupNewPromotionForm();

    // Configurar formulario de edición de paquete
    setupEditPromotionForm();
});

// Funciones principales
function saveOriginalContent() {
    const editableElements = document.querySelectorAll('.editable-text');
    editableElements.forEach(el => {
        const field = el.getAttribute('data-field');
        originalContent[field] = el.innerHTML;
    });
}

function setupModalEvents() {
    // Modal de edición de texto
    const editModal = document.getElementById('editModal');
    const editTextarea = document.getElementById('editTextarea');
    const editClose = editModal.querySelector('.close');

    document.querySelectorAll('.editable-text').forEach(el => {
        el.addEventListener('click', function() {
            currentEditingElement = this;
            editTextarea.value = this.innerHTML;
            editModal.style.display = 'block';
        });
    });

    editClose.addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    // Modal de imagen
    const imageModal = document.getElementById('imageModal');
    const imageClose = imageModal.querySelector('.close');

    imageClose.addEventListener('click', function() {
        imageModal.style.display = 'none';
    });

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
        if (event.target === document.getElementById('newPromotionModal')) {
            closeNewPromotionModal();
        }
        if (event.target === document.getElementById('editPromotionModal')) {
            closeEditPromotionModal();
        }
    });
}

function setupImageUpload() {
    const imageInput = document.getElementById('imageInput');
    const previewImg = document.getElementById('previewImg');
    const imagePreview = document.getElementById('imagePreview');

    if (imageInput && previewImg && imagePreview) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

// Funciones para promociones
async function loadPromotions() {
    try {
        const response = await fetch("http://localhost:3000/api/autolavado");
        const promotions = await response.json();
        console.log("Promociones cargadas:", promotions);

        const container = document.getElementById("promotions-container");
        if (!container) {
            console.error("Contenedor de promociones no encontrado");
            return;
        }

        container.innerHTML = ""; // Limpiar contenedor

        for (const promo of promotions) {
            const promoCard = createPromotionCard(promo);
            container.appendChild(promoCard);
        }
    } catch (error) {
        console.error("Error cargando promociones:", error);
    }
}

function createPromotionCard(promo) {
    const id = promo.id_autolavado;
    const nombreCompleto = promo.nombre_paquete || "Paquete sin nombre";
    const nombreSplit = nombreCompleto.split(" ");
    const primerPalabra = nombreSplit[0];
    const restoDelNombre = nombreSplit.slice(1).join(" ") || "";
    const tipo = promo.tipo_paquete || "default";

    const imagenUrl = promo.imagen_url || "img/Promocion/default.png";
    const descripcion = promo.descripcion || "Sin descripción";
    const precio = promo.precio !== undefined ? promo.precio : "0";
    const duracion = promo.duracion_aprox || "No especificada";

    const card = document.createElement("div");
    card.className = "promotion-card";
    card.dataset.promotion = id;

    card.innerHTML = `
        <div class="admin-card-controls">
            <button class="edit-btn" onclick="openEditPromotionModal('${id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="delete-btn" onclick="deletePromotion('${id}')">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
        <div class="card-content">
            <div class="title-edit-group">
                <h2 class="service-title">
                    <span class="editable-text" data-field="${id}-title-1">${primerPalabra}</span><br>
                    <span class="highlight editable-text" data-field="${id}-title-2">${restoDelNombre}</span>${getEmoji(tipo)}<br>
                </h2>
            </div>

            <div class="descripcion-precio-duracion">
                <p><strong>Descripción:</strong> <span class="editable-text" data-field="${id}-descripcion">${descripcion}</span></p>
                <p><strong>Precio:</strong> $<span class="editable-text" data-field="${id}-precio">${precio}</span></p>
                <p><strong>Duración:</strong> <span class="editable-text" data-field="${id}-duracion">${duracion}</span></p>
            </div>

            <div class="service-images">
                ${createServiceItems(promo.servicios, id)}
            </div>

            <div class="car-image">
                <img src="${imagenUrl}" alt="${nombreCompleto}" data-promotion="${id}">
                <div class="image-overlay">
                    <button class="change-image-btn" onclick="changeImage('${id}')">
                        <i class="fas fa-camera"></i> Cambiar Imagen
                    </button>
                </div>
            </div>

            <div class="contact-info">
                <button class="book-btn">Reservar</button>
            </div>
        </div>
    `;

    return card;
}

function createServiceItems(services, promoId) {
    const icons = ["🫧", "🪟", "🌀", "🍃", "🚗", "🌟", "⚙️", "🧼", "🌈", "💧", "🛞", "🛡️"];

    if (!services || services.length === 0) {
        return `<p class="no-services">Este paquete no tiene servicios detallados</p>`;
    }

    return services
        .map(
            (service, index) => `
            <div class="service-item" data-service-index="${index}">
                <div class="service-icon">${icons[index % icons.length]}</div>
                <span>${service}</span>
            </div>
        `
        )
        .join("");
}

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

// Funciones para modales
function openNewPromotionModal() {
    document.getElementById('newPromotionModal').style.display = 'block';
    loadServiciosOptions();
}

function closeNewPromotionModal() {
    document.getElementById('newPromotionModal').style.display = 'none';
    document.getElementById('newPromotionForm').reset();
}

async function openEditPromotionModal(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/autolavado/${id}`);
        if (!res.ok) throw new Error("No se pudo obtener el paquete");

        const promo = await res.json();

        // Rellenar formulario
        document.getElementById('edit_id_autolavado').value = promo.id_autolavado;
        document.getElementById('edit_nombre_paquete').value = promo.nombre_paquete;
        document.getElementById('edit_tipo_paquete').value = promo.tipo_paquete;
        document.getElementById('edit_descripcion').value = promo.descripcion;
        document.getElementById('edit_precio').value = promo.precio;
        document.getElementById('edit_duracion_aprox').value = promo.duracion_aprox;

        // Cargar servicios
        const container = document.getElementById('edit_servicios-options');
        container.innerHTML = '';

        const allServices = await fetch('http://localhost:3000/api/servicios').then(r => r.json());

        allServices.forEach(serv => {
            const isChecked = Array.isArray(promo.servicios) ? 
                promo.servicios.some(s => s.id_servicios === serv.id_servicios || s === serv.id_servicios) : 
                false;
                
            const checkbox = `
                <label>
                    <input type="checkbox" name="servicios" value="${serv.id_servicios}" ${isChecked ? 'checked' : ''}>
                    ${serv.nombre}
                </label><br>`;
            container.innerHTML += checkbox;
        });

        // Mostrar modal
        document.getElementById('editPromotionModal').style.display = 'block';
    } catch (error) {
        console.error("Error abriendo modal de edición:", error);
        alert("No se pudo cargar el paquete para edición.");
    }
}

function closeEditPromotionModal() {
    document.getElementById('editPromotionModal').style.display = 'none';
}

// Funciones para formularios
function setupNewPromotionForm() {
    const newPromotionForm = document.getElementById('newPromotionForm');
    if (newPromotionForm) {
        newPromotionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData();

            // Campos normales
            formData.append('nombre_paquete', form.nombre_paquete.value);
            formData.append('tipo_paquete', form.tipo_paquete.value);
            formData.append('descripcion', form.descripcion.value);
            formData.append('precio', form.precio.value);
            formData.append('duracion_aprox', form.duracion_aprox.value);

            // Servicios como array de IDs
            const checked = form.querySelectorAll('input[name="servicios_ids"]:checked');
            const serviciosIds = Array.from(checked).map(ch => ch.value);
            formData.append('servicios', JSON.stringify(serviciosIds));

            // Imagen (si hay)
            if (form.imagen.files.length > 0) {
                formData.append('imagen', form.imagen.files[0]);
            }

            try {
                const res = await fetch('http://localhost:3000/api/autolavado', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Error al agregar paquete');

                showNotification('Paquete agregado exitosamente!');
                closeNewPromotionModal();
                loadPromotions();
            } catch (error) {
                console.error(error);
                showNotification('Error: ' + error.message, 'error');
            }
        });
    }
}

function setupEditPromotionForm() {
    const editPromotionForm = document.getElementById('editPromotionForm');
    if (editPromotionForm) {
        editPromotionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const form = e.target;
            const id = form.edit_id_autolavado.value;
            const formData = new FormData();

            // Campos normales
            formData.append('nombre_paquete', form.edit_nombre_paquete.value);
            formData.append('tipo_paquete', form.edit_tipo_paquete.value);
            formData.append('descripcion', form.edit_descripcion.value);
            formData.append('precio', form.edit_precio.value);
            formData.append('duracion_aprox', form.edit_duracion_aprox.value);

            // Servicios como array de IDs
            const checked = form.querySelectorAll('input[name="servicios"]:checked');
            const serviciosIds = Array.from(checked).map(ch => ch.value);
            formData.append('servicios', JSON.stringify(serviciosIds));

            // Imagen (si hay)
            if (form.edit_imagen.files.length > 0) {
                formData.append('imagen', form.edit_imagen.files[0]);
            }

            try {
                const res = await fetch(`http://localhost:3000/api/autolavado/${id}`, {
                    method: 'PATCH',
                    body: formData
                });

                if (!res.ok) throw new Error('Error al actualizar paquete');

                showNotification('Paquete actualizado exitosamente!');
                closeEditPromotionModal();
                loadPromotions();
            } catch (error) {
                console.error(error);
                showNotification('Error: ' + error.message, 'error');
            }
        });
    }
}

async function loadServiciosOptions() {
    try {
        const res = await fetch('http://localhost:3000/api/servicios');
        const servicios = await res.json();
        
        // Para el modal de nuevo paquete
        const newContainer = document.getElementById('servicios-options');
        if (newContainer) {
            newContainer.innerHTML = '';
            servicios.forEach(s => {
                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="checkbox" name="servicios_ids" value="${s.id_servicios}">
                    ${s.nombre}
                `;
                newContainer.appendChild(label);
            });
        }
        
        // Para el modal de edición (si existe)
        const editContainer = document.getElementById('edit_servicios-options');
        if (editContainer && editContainer.innerHTML.trim() === '') {
            editContainer.innerHTML = '';
            servicios.forEach(s => {
                const label = document.createElement('label');
                label.innerHTML = `
                    <input type="checkbox" name="servicios" value="${s.id_servicios}">
                    ${s.nombre}
                `;
                editContainer.appendChild(label);
            });
        }
    } catch (e) {
        console.error('Error cargando servicios:', e);
    }
}

// Funciones para imágenes
function changeImage(promoId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('imagen', file);

        try {
            const res = await fetch(`http://localhost:3000/api/autolavado/${promoId}`, {
                method: 'PATCH',
                body: formData,
            });

            if (!res.ok) throw new Error('Error al subir imagen');

            showNotification('Imagen actualizada con éxito');
            loadPromotions();
        } catch (err) {
            console.error(err);
            showNotification('Error al subir imagen', 'error');
        }
    };

    fileInput.click();
}

// Funciones para eliminar
async function deletePromotion(promoId) {
    if (!confirm('¿Estás seguro de eliminar este paquete? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/autolavado/${promoId}`, {
            method: 'DELETE',
        });

        if (!res.ok) throw new Error('Error al eliminar el paquete');

        showNotification('Paquete eliminado correctamente');
        loadPromotions();
    } catch (error) {
        console.error(error);
        showNotification('No se pudo eliminar el paquete', 'error');
    }
}

// Funciones de utilidad
function showNotification(message, type = 'success') {
    const notification = document.getElementById('saveNotification');
    if (!notification) return;

    notification.querySelector('span').textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function saveTextEdit() {
    if (currentEditingElement) {
        currentEditingElement.innerHTML = document.getElementById('editTextarea').value;
        document.getElementById('editModal').style.display = 'none';
        showNotification('Texto actualizado correctamente');
    }
}

function cancelEdit() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingElement = null;
}

function saveImageChange() {
    const fileInput = document.getElementById('imageInput');
    if (fileInput.files.length > 0 && currentImageElement) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageElement.src = e.target.result;
            document.getElementById('imageModal').style.display = 'none';
            showNotification('Imagen actualizada correctamente');
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function cancelImageEdit() {
    document.getElementById('imageModal').style.display = 'none';
    currentImageElement = null;
}

function togglePreview() {
    document.body.classList.toggle('preview-mode');
    const btn = document.querySelector('.btn-preview');
    if (document.body.classList.contains('preview-mode')) {
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Salir Vista Previa';
    } else {
        btn.innerHTML = '<i class="fas fa-eye"></i> Vista Previa';
    }
}

function resetChanges() {
    if (confirm('¿Estás seguro de que deseas resetear todos los cambios?')) {
        const editableElements = document.querySelectorAll('.editable-text');
        editableElements.forEach(el => {
            const field = el.getAttribute('data-field');
            if (originalContent[field]) {
                el.innerHTML = originalContent[field];
            }
        });
        showNotification('Cambios reseteados correctamente');
    }
}

function saveChanges() {
    showNotification('Cambios guardados exitosamente');
    // Aquí podrías agregar lógica para guardar en el servidor si es necesario
}