// serviciosAdmin.js - Código unificado para carritoAdmin.html

// Variables globales
let services = [];
let cart = [];
let token = localStorage.getItem('token');

// Verificar autenticación al cargar
if (!token) {
    window.location.href = 'index.html';
}

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

    // Elementos del DOM
    const servicesTbody = document.getElementById('services-tbody');
    const servicesGrid = document.getElementById('services-grid');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const cartPanel = document.getElementById('cart-panel');
    const serviceFormContainer = document.getElementById('service-form-container');
    const serviceForm = document.getElementById('service-form');
    const serviceIdInput = document.getElementById('service-id');
    const serviceNameInput = document.getElementById('service-name');
    const servicePriceInput = document.getElementById('service-price');
    const serviceDescriptionInput = document.getElementById('service-description');
    const serviceImageInput = document.getElementById('service-image');
    const btnAddService = document.getElementById('btn-add-service');
    const btnCancel = document.getElementById('btn-cancel');
    const closeForm = document.getElementById('close-form');
    const clientToggle = document.getElementById('client-toggle');
    const adminToggle = document.getElementById('admin-toggle');
    const clientView = document.getElementById('client-view');
    const adminPanel = document.querySelector('.admin-panel');

    // Cargar servicios al inicio
    loadServices();

    // Configurar eventos
    setupEventListeners();

    // Mostrar vista cliente por defecto
    switchView('client');

    // Funciones principales
    async function loadServices() {
        try {
            const response = await fetch('http://localhost:3000/api/servicios');
            if (!response.ok) throw new Error('Error al cargar servicios');

            services = await response.json();
            renderServicesTable();
            renderServicesGrid();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al cargar los servicios', 'error');
        }
    }

    function renderServicesTable() {
        servicesTbody.innerHTML = '';

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.id_servicios}</td>
                <td>
                    ${service.imagen ?
                        `<img src="${service.imagen}" alt="${service.nombre}" class="service-thumb">` :
                        'Sin imagen'}
                </td>
                <td>${service.nombre}</td>
                <td class="description-cell">${service.descripcion}</td>
                <td>$${service.precio}</td>
                <td class="actions-cell">
                    <button class="btn-edit" data-id="${service.id_servicios}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" data-id="${service.id_servicios}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            servicesTbody.appendChild(row);
        });

        // Agregar event listeners a los botones de editar y eliminar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const service = services.find(s => s.id_servicios == id);
                openServiceForm(service);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                deleteService(id);
            });
        });
    }

    function renderServicesGrid() {
        servicesGrid.innerHTML = '';

        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'pizza-card';
            serviceCard.setAttribute('data-id', service.id_servicios);
            serviceCard.setAttribute('data-name', service.nombre);
            serviceCard.setAttribute('data-price', service.precio);
            serviceCard.setAttribute('data-img', service.imagen || '');

            serviceCard.innerHTML = `
                ${service.imagen ? `<img src="${service.imagen}" alt="${service.nombre}">` : ''}
                <h3>${service.nombre}</h3>
                <p>${service.descripcion}</p>
                <p class="price">$${service.precio}</p>
                <button class="add-to-cart">Agregar al carrito</button>
            `;

            servicesGrid.appendChild(serviceCard);
        });

        // Agregar event listeners para agregar al carrito
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.pizza-card');
                const id = card.dataset.id;
                const name = card.dataset.name;
                const price = parseFloat(card.dataset.price);
                const img = card.dataset.img;

                addToCart({ id, name, price, img });
            });
        });
    }

    function openServiceForm(service = null) {
        // Limpiar previews anteriores
        const existingPreviews = document.querySelectorAll('.preview-image');
        existingPreviews.forEach(preview => preview.remove());

        if (service) {
            // Modo edición
            document.getElementById('form-title').textContent = 'Editar Servicio';
            serviceIdInput.value = service.id_servicios;
            serviceNameInput.value = service.nombre;
            servicePriceInput.value = service.precio;
            serviceDescriptionInput.value = service.descripcion;

            if (service.imagen) {
                const preview = document.createElement('img');
                preview.src = service.imagen;
                preview.alt = `Preview de ${service.nombre}`;
                preview.classList.add('preview-image');
                preview.style.maxWidth = '100px';
                preview.style.marginTop = '10px';
                serviceImageInput.parentNode.appendChild(preview);
            }
        } else {
            // Modo creación
            document.getElementById('form-title').textContent = 'Agregar Nuevo Servicio';
            serviceForm.reset();
            serviceIdInput.value = '';
        }

        serviceFormContainer.style.display = 'block';
    }

    function closeServiceForm() {
        serviceFormContainer.style.display = 'none';
    }

    async function saveService(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nombre', serviceNameInput.value);
        formData.append('precio', servicePriceInput.value);
        formData.append('descripcion', serviceDescriptionInput.value);

        const imageInput = document.getElementById('service-image');
        if (imageInput.files[0]) {
            formData.append('imagen', imageInput.files[0]);
        }

        const id = serviceIdInput.value;
        const method = id ? 'PATCH' : 'POST';
        const url = id ? `http://localhost:3000/api/servicios/${id}` : 'http://localhost:3000/api/servicios';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el servicio');
            }

            // Limpiar formulario después de guardar
            serviceForm.reset();
            const existingPreview = document.querySelector('.preview-image');
            if (existingPreview) existingPreview.remove();
            serviceIdInput.value = '';

            closeServiceForm();
            loadServices();
            showNotification(`Servicio ${id ? 'actualizado' : 'creado'} correctamente`);
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al guardar el servicio: ' + error.message, 'error');
        }
    }

    async function deleteService(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;

        try {
            const response = await fetch(`http://localhost:3000/api/servicios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar el servicio');

            loadServices();
            showNotification('Servicio eliminado correctamente');
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al eliminar el servicio', 'error');
        }
    }

    function addToCart(service) {
        const existingItem = cart.find(item => item.id === service.id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...service, quantity: 1 });
        }

        updateCart();
        showNotification(`${service.name} agregado al carrito`);
        cartPanel.classList.add('active');
    }

    function updateCart() {
        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío</p>';
        }

        let total = 0;
        let count = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            count += item.quantity;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    ${item.img ? `<img src="${item.img}" alt="${item.name}">` : ''}
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}">×</button>
            `;

            cartItems.appendChild(cartItem);
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
        cartCount.textContent = count;

        // Event listeners para botones del carrito
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const itemIndex = cart.findIndex(item => item.id === id);

                if (itemIndex !== -1) {
                    if (this.classList.contains('plus')) {
                        cart[itemIndex].quantity++;
                    } else if (this.classList.contains('minus')) {
                        cart[itemIndex].quantity--;

                        if (cart[itemIndex].quantity === 0) {
                            cart.splice(itemIndex, 1);
                        }
                    }

                    updateCart();
                }
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const itemIndex = cart.findIndex(item => item.id === id);

                if (itemIndex !== -1) {
                    cart.splice(itemIndex, 1);
                    updateCart();
                }
            });
        });
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    function switchView(view) {
        if (view === 'client') {
            clientView.style.display = 'block';
            adminPanel.style.display = 'none';
            clientToggle.classList.add('active');
            adminToggle.classList.remove('active');
        } else {
            clientView.style.display = 'none';
            adminPanel.style.display = 'block';
            clientToggle.classList.remove('active');
            adminToggle.classList.add('active');
        }
    }

    function setupEventListeners() {
        // Formulario de servicio
        btnAddService.addEventListener('click', () => openServiceForm());
        btnCancel.addEventListener('click', closeServiceForm);
        closeForm.addEventListener('click', closeServiceForm);
        serviceForm.addEventListener('submit', saveService);

        // Vista cliente/administrador
        clientToggle.addEventListener('click', () => switchView('client'));
        adminToggle.addEventListener('click', () => switchView('admin'));

        // Carrito
        document.getElementById('cart-toggle').addEventListener('click', function() {
            cartPanel.classList.toggle('active');
        });

        document.querySelector('.close-cart').addEventListener('click', function() {
            cartPanel.classList.remove('active');
        });

        document.getElementById('empty-cart').addEventListener('click', function() {
            cart = [];
            updateCart();
            showNotification('Carrito vaciado');
        });

        // Preview de imagen al seleccionar archivo
        serviceImageInput.addEventListener('change', function() {
            const existingPreview = document.querySelector('.preview-image');
            if (existingPreview) existingPreview.remove();

            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.createElement('img');
                    preview.src = e.target.result;
                    preview.alt = 'Preview de imagen';
                    preview.classList.add('preview-image');
                    preview.style.maxWidth = '100px';
                    preview.style.marginTop = '10px';
                    serviceImageInput.parentNode.appendChild(preview);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});