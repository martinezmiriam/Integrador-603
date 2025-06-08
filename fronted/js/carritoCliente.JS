// carritoCliente.js - Código unificado para el carrito del cliente

// Variables globales
let cart = [];
const MAX_QUANTITY_PER_PRODUCT = 5;
let services = [];
const token = localStorage.getItem("token");


// Inicialización cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", function () {


    
const decoded = parseJwt(token);
const userId = decoded?.id;
if (!userId) {
  console.log("Token inválido o no tiene id");
  // window.location.href = 'index.html';
}
console.log("UserId obtenido del token:", userId);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// Verificar autenticación al cargar
if (!token) {
  window.location.href = "index.html";
}
  // Configuración del menú
  const menuToggle = document.querySelector(".menu-toggle");
  const closeButton = document.querySelector("#menu .close");
  const menu = document.querySelector("#menu");

  if (menuToggle && closeButton && menu) {
    menuToggle.addEventListener("click", function (e) {
      e.preventDefault();
      menu.classList.add("active");
    });

    closeButton.addEventListener("click", function (e) {
      e.preventDefault();
      menu.classList.remove("active");
    });
  }

  // Elementos del DOM
  const cartToggle = document.getElementById("cart-toggle");
  const cartPanel = document.getElementById("cart-panel");
  const closeCart = document.querySelector(".close-cart");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const emptyCartBtn = document.getElementById("empty-cart");
  const confirmPurchaseBtn = document.getElementById("confirm-purchase");
  const servicesContainer = document.getElementById("services-container");

  // Cargar servicios y promoción seleccionada al inicio
  loadServices();
  loadSelectedPromotion();

  // Configurar eventos
  setupEventListeners();

  // Funciones principales
  async function loadServices() {
    try {
      const response = await fetch("http://localhost:3000/api/servicios");
      if (!response.ok) throw new Error("Error al cargar servicios");

      services = await response.json();
      renderServices();
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al cargar los servicios", "error");
    }
  }

  function loadSelectedPromotion() {
    const selectedPromo = localStorage.getItem("promoSeleccionada");
    ///OBTENER LA ID
    ///UN LOG DE LA ID :

    if (selectedPromo) {
      // Obtener los detalles de la promoción de la API
      fetch(`http://localhost:3000/api/autolavado/${selectedPromo}`)
        .then((res) => res.json())
        .then((promo) => {
          console.log("PROMO:", promo); // <--- Agregá esto
          if (promo) {
            addToCart({
              id: `promo-${promo.id_autolavado}`,
              name: promo.nombre_paquete,
              price: promo.precio,
              img: promo.imagen_url || "img/Promocion/default.png",
              isPromo: true,
            });
            showNotification(
              `Promoción "${promo.nombre_paquete}" agregada automáticamente`
            );
          }
        })

        .catch((error) => {
          console.error("Error al cargar promoción:", error);
        });
    }
  }

  function renderServices() {
    servicesContainer.innerHTML = "";

    services.forEach((service) => {
      const serviceCard = document.createElement("div");
      serviceCard.className = "pizza-card";
      serviceCard.dataset.id = service.id_servicios;
      serviceCard.dataset.name = service.nombre;
      serviceCard.dataset.price = service.precio;
      serviceCard.dataset.img = service.imagen || "";

      serviceCard.innerHTML = `
                ${
                  service.imagen
                    ? `<img src="${service.imagen}" alt="${service.nombre}">`
                    : ""
                }
                <h3>${service.nombre}</h3>
                <p>${service.descripcion}</p>
                <p class="price">$${service.precio}</p>
                <button class="add-to-cart">Agregar al carrito</button>
            `;

      servicesContainer.appendChild(serviceCard);
    });

    // Agregar event listeners para los botones de agregar al carrito
    document.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", function () {
        const card = this.closest(".pizza-card");
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const img = card.dataset.img;

        addToCart({ id, name, price, img });
      });
    });
  }

  function addToCart(item) {
    // Verificar si es una promoción (no permitir modificar cantidad)
    if (item.isPromo) {
      // Verificar si ya está en el carrito
      const existingPromo = cart.find((i) => i.isPromo);
      if (existingPromo) {
        showNotification("Ya tienes una promoción en el carrito", "info");
        return;
      }

      // Agregar la promoción con cantidad fija 1
      cart.push({ ...item, quantity: 1 });
      updateCart();
      showNotification(`${item.name} agregado al carrito`, "success");
      return;
    }

    // Para productos normales
    const existingItem = cart.find((i) => i.id === item.id && !i.isPromo);

    if (existingItem) {
      if (existingItem.quantity >= MAX_QUANTITY_PER_PRODUCT) {
        showNotification(
          `Límite alcanzado: máximo ${MAX_QUANTITY_PER_PRODUCT} unidades de ${item.name}`,
          "error"
        );
        return;
      }
      existingItem.quantity++;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    updateCart();
    showNotification(`${item.name} agregado al carrito`, "success");
    cartPanel.classList.add("active");
  }

  function updateCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
      cartItems.innerHTML =
        '<p class="empty-cart-message">Tu carrito está vacío</p>';
    }

    let total = 0;
    let count = 0;

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      count += item.quantity;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      if (item.isPromo) cartItem.classList.add("promo-item");

      cartItem.innerHTML = `
                <div class="cart-item-image">
                    ${
                      item.img
                        ? `<img src="${item.img}" alt="${item.name}">`
                        : ""
                    }
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price}</p>
                    ${
                      !item.isPromo
                        ? `
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <small class="quantity-limit">Máx: ${MAX_QUANTITY_PER_PRODUCT}</small>
                    `
                        : '<p class="promo-label">Promoción</p>'
                    }
                </div>
                ${
                  !item.isPromo
                    ? `<button class="remove-item" data-id="${item.id}">×</button>`
                    : ""
                }
            `;

      cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartCount.textContent = count;

    // Guardar el carrito en localStorage para persistencia
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log(localStorage.getItem("cart"));

    // Configurar eventos para los controles del carrito
    setupCartItemEvents();
  }

  function setupCartItemEvents() {
    // Botones de cantidad
    document.querySelectorAll(".quantity-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const itemIndex = cart.findIndex((item) => item.id === id);

        if (itemIndex !== -1) {
          if (this.classList.contains("plus")) {
            if (cart[itemIndex].quantity >= MAX_QUANTITY_PER_PRODUCT) {
              showNotification(
                `Límite alcanzado: máximo ${MAX_QUANTITY_PER_PRODUCT} unidades`,
                "error"
              );
              return;
            }
            cart[itemIndex].quantity++;
          } else if (this.classList.contains("minus")) {
            cart[itemIndex].quantity--;

            if (cart[itemIndex].quantity === 0) {
              cart.splice(itemIndex, 1);
            }
          }

          updateCart();
        }
      });
    });

    // Botones de eliminar
    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const itemIndex = cart.findIndex((item) => item.id === id);
        localStorage.removeItem("promoSeleccionada")

        if (itemIndex !== -1) {
          cart.splice(itemIndex, 1);
          updateCart();
          showNotification("Producto eliminado del carrito", "info");
        }
      });
    });
  }

  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 100);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }

  function setupEventListeners() {
    // Carrito
    cartToggle.addEventListener("click", () => {
      cartPanel.classList.toggle("active");
    });

    closeCart.addEventListener("click", () => {
      cartPanel.classList.remove("active");
    });

    // Vaciar carrito
    emptyCartBtn.addEventListener("click", () => {
      // Mantener la promoción si existe
      const promo = cart.find((item) => item.isPromo);
      cart = promo ? [promo] : [];
      updateCart();
      showNotification("Carrito vaciado (excepto promoción)", "info");
    });

    // Confirmar compra - VERSIÓN ACTUALIZADA
    confirmPurchaseBtn.addEventListener("click", async () => {
      if (cart.length === 0) {
        showNotification("El carrito está vacío", "error");
        return;
      }

      // Obtener userId del localStorage
      if (!userId) {
        showNotification("No se encontró información de usuario", "error");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/compras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carrito: cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              isPromo: item.isPromo || false,
            })),
            metodoPago: "efectivo",
            direccionEntrega: "",
            userId: userId, // Enviamos el userId directamente
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al procesar la compra");
        }

        const data = await response.json();

        showNotification("¡Compra realizada con éxito!", "success");
        // Vaciar completamente el carrito después de la compra
        cart = [];
        updateCart();
      } catch (error) {
        console.error("Error en la compra:", error);
        showNotification(`Error: ${error.message}`, "error");
      }
    });
  }
});
