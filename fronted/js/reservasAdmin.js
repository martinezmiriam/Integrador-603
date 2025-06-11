document.addEventListener("DOMContentLoaded", function () {
  // Verificar autenticación
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
  }

  // Configuración inicial
  const API_BASE_URL = "http://localhost:3000/api";
  let currentPage = 1;
  const itemsPerPage = 10;
  let allReservations = [];
  let filteredReservations = [];

  // Elementos del DOM
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const resetSearch = document.getElementById("reset-search");
  const serviceFilter = document.getElementById("service-filter");
  const paymentFilter = document.getElementById("payment-filter");
  const prevPageButton = document.getElementById("prev-page");
  const nextPageButton = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const clientTableBody = document.getElementById("client-table-body");

  // Menu toggle
  document
    .querySelector('a[href="#menu"]')
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("menu").classList.toggle("active");
    });

  document
    .querySelector("#menu .close")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("menu").classList.remove("active");
    });

  // Event listeners
  searchButton.addEventListener("click", applyFilters);
  resetSearch.addEventListener("click", resetFilters);
  serviceFilter.addEventListener("change", applyFilters);
  paymentFilter.addEventListener("change", applyFilters);
  prevPageButton.addEventListener("click", goToPreviousPage);
  nextPageButton.addEventListener("click", goToNextPage);

  // Debounce para la búsqueda
  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 500);
  });

  // Cargar datos iniciales
  loadInitialData();

  // Actualizar cada 30 segundos
  setInterval(loadInitialData, 30000);

  // Funciones principales
  async function loadInitialData() {
    try {
      const now = new Date();
      const hoy = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      // Cargar contadores de estacionamiento
      const parkingResponse = await fetch(
        `${API_BASE_URL}/reservas/conteo?fecha=${hoy}`
      );
      if (!parkingResponse.ok)
        throw new Error("Error al obtener conteo de estacionamiento");
      const parkingData = await parkingResponse.json();
      console.log("fecha", hoy);
      updateParkingCounters(parkingData);

      // Cargar todas las reservas
      const reservationsResponse = await fetch(`${API_BASE_URL}/reservas`);
      if (!reservationsResponse.ok)
        throw new Error("Error al obtener reservas");
      const reservationsData = await reservationsResponse.json();

      allReservations = reservationsData.reservas || [];
      applyFilters();

      // Cargar contadores adicionales
      await loadAdditionalCounters();
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      alert("Error al cargar datos. Por favor recarga la página.");
    }
  }

  function updateParkingCounters(data) {
    document.getElementById("parking-count").textContent = data.ocupados;
    document.getElementById("parking-availability").textContent =
      data.disponibles;

    const porcentaje = (data.ocupados / data.capacidad_total) * 100;
    document.getElementById(
      "parking-capacity-fill"
    ).style.width = `${porcentaje}%`;

    // Notificación si quedan pocos espacios
    if (data.disponibles < 5) {
      showNotification(
        `¡Atención! Solo quedan ${data.disponibles} espacios disponibles`
      );
    }
  }

  async function loadAdditionalCounters() {
    try {
      // Contador de autolavado
      const carwashResponse = await fetch(`${API_BASE_URL}/autolavado`);
      if (carwashResponse.ok) {
        const carwashData = await carwashResponse.json();
        document.getElementById("carwash-count").textContent =
          carwashData.length;
      }

      // Contador total de servicios
      const servicesResponse = await fetch(`${API_BASE_URL}/servicios`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        document.getElementById("total-count").textContent =
          servicesData.length;
      }
    } catch (error) {
      console.error("Error al cargar contadores adicionales:", error);
    }
  }

  function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const serviceType = serviceFilter.value;
    const paymentStatus = paymentFilter.value;

    filteredReservations = allReservations.filter((reservation) => {
      // Filtrar por término de búsqueda
      const matchesSearch =
        searchTerm === "" ||
        reservation.nombre.toLowerCase().includes(searchTerm) ||
        reservation.id_reserva.toString().includes(searchTerm);

      // Filtrar por tipo de servicio
      let matchesService = true;
      if (serviceType === "carwash") {
        matchesService = reservation.tipo_vehiculo !== null;
      } else if (serviceType === "parking") {
        matchesService = reservation.duracion_estimada !== null;
      } else if (serviceType === "both") {
        matchesService =
          reservation.tipo_vehiculo !== null &&
          reservation.duracion_estimada !== null;
      }

      // Filtrar por estado de pago
      let matchesPayment = true;
      if (paymentStatus === "paid") {
        matchesPayment = reservation.estado_pago === "completado";
      } else if (paymentStatus === "unpaid") {
        matchesPayment =
          !reservation.estado_pago || reservation.estado_pago !== "completado";
      }

      return matchesSearch && matchesService && matchesPayment;
    });

    currentPage = 1;
    updateTable();
    updatePagination();
  }

  function resetFilters() {
    searchInput.value = "";
    serviceFilter.value = "all";
    paymentFilter.value = "all";
    applyFilters();
  }

  function updateTable() {
    clientTableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReservations = filteredReservations.slice(
      startIndex,
      endIndex
    );

    if (paginatedReservations.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="7" class="no-results">No se encontraron reservas</td>`;
      clientTableBody.appendChild(row);
      return;
    }

    paginatedReservations.forEach((reservation) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${reservation.nombre}</td>
                <td>${reservation.tipo_vehiculo || "N/A"}</td>
                <td>${reservation.duracion_estimada ? "Sí" : "No"}</td>
                <td>
                   <span class="payment-status ${
                     reservation.estado === "completado" ? "paid" : "unpaid"
                   }">
  ${reservation.estado === "completado" ? "Pagado" : "Pendiente"}
</span>

                </td>
                <td>${formatDate(reservation.fecha_solicitada)} ${
        reservation.hora_llegada
      }</td>
                <td>
  ${
    reservation.estado_pago !== "completado"
      ? `<button class="btn-action edit" data-id="${reservation.id_reserva}">

            <i class="fas fa-edit"></i>
         </button>`
      : `<span class="btn-action done"><i class="fas fa-check-circle" title="Pagado"></i></span>`
  }
  <button class="btn-action delete" data-id="${reservation.id_reserva}">
    <i class="fas fa-trash"></i>
  </button>
</td>

            `;
      clientTableBody.appendChild(row);
    });

    // Agregar event listeners a los botones
    document.querySelectorAll(".btn-action.edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;

        if (id) {
          editReservation(id);
        } else {
          console.error("No se pudo obtener el ID de la reserva");
        }
      });
    });

    document.querySelectorAll(".btn-action.delete").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        deleteReservation(e.target.closest("button").dataset.id)
      );
    });
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
      updateTable();
      updatePagination();
    }
  }

  function goToNextPage() {
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      updateTable();
      updatePagination();
    }
  }

function formatDate(dateString) {
  // Crear fecha en formato local (sin huso horario)
  const [year, month, day] = dateString.split("-"); // separa YYYY-MM-DD
  const date = new Date(year, month - 1, day); // mes es 0-indexed
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("es-ES", options);
}


  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  async function deleteReservation(reservationId) {
    if (confirm("¿Estás seguro de que deseas eliminar esta reserva?")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/reservas/${reservationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          showNotification("Reserva eliminada correctamente");
          loadInitialData(); // Recargar datos
        } else {
          throw new Error("Error al eliminar reserva");
        }
      } catch (error) {
        console.error("Error al eliminar reserva:", error);
        alert("Error al eliminar la reserva");
      }
    }
  }

  async function editReservation(reservationId) {
    if (confirm("¿Deseas marcar esta reserva como pagada?")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/reservas/${reservationId}/pago`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          showNotification("Estado de pago actualizado correctamente");
          loadInitialData();
        } else {
          const err = await response.json();
          throw new Error(err.error || "Error al actualizar el estado de pago");
        }
      } catch (error) {
        console.error("Error en actualización:", error);
        alert("Hubo un problema al actualizar el estado de pago");
      }
    }
  }
});
