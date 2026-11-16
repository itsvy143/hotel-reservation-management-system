const rooms = [
  {
    id: "STD-101",
    name: "Standard Room",
    price: 1800,
    capacity: 2,
    description: "Comfortable room · 2 guests",
    icon: "🛏️",
  },
  {
    id: "DLX-201",
    name: "Deluxe Room",
    price: 2800,
    capacity: 3,
    description: "Spacious room · 3 guests",
    icon: "🛋️",
  },
  {
    id: "STE-301",
    name: "Suite Room",
    price: 4500,
    capacity: 4,
    description: "Premium suite · 4 guests",
    icon: "🏨",
  },
  {
    id: "FAM-401",
    name: "Family Room",
    price: 5500,
    capacity: 6,
    description: "Large room · 6 guests",
    icon: "👨‍👩‍👧‍👦",
  },
];

const STORAGE_KEY = "stayease_reservations";

const form = document.getElementById("reservation-form");
const reservationIdInput = document.getElementById("reservation-id");
const guestNameInput = document.getElementById("guest-name");
const guestEmailInput = document.getElementById("guest-email");
const guestPhoneInput = document.getElementById("guest-phone");
const roomSelect = document.getElementById("room-select");
const checkInInput = document.getElementById("check-in");
const checkOutInput = document.getElementById("check-out");
const guestCountInput = document.getElementById("guest-count");
const estimatedTotal = document.getElementById("estimated-total");
const priceBreakdown = document.getElementById("price-breakdown");
const submitButton = document.getElementById("submit-button");
const clearButton = document.getElementById("clear-button");
const formHeading = document.getElementById("form-heading");
const roomList = document.getElementById("room-list");
const tableBody = document.getElementById("reservation-table-body");
const emptyMessage = document.getElementById("empty-message");
const statusFilter = document.getElementById("status-filter");

let reservations = loadReservations();

function loadReservations() {
  try {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(savedData)) {
      return [];
    }

    return savedData.filter((reservation) => {
      return (
        reservation &&
        typeof reservation.id === "string" &&
        typeof reservation.guestName === "string" &&
        rooms.some((room) => room.id === reservation.roomId) &&
        ["Pending", "Confirmed", "Cancelled"].includes(reservation.status)
      );
    });
  } catch (error) {
    console.error("Could not load reservations:", error);
    return [];
  }
}

function saveReservations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    return true;
  } catch (error) {
    console.error("Could not save reservations:", error);
    alert("Unable to save data. Check your browser storage settings.");
    return false;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNumberOfNights(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  return Math.round((end - start) / 86400000);
}

function getRoom(roomId) {
  return rooms.find((room) => room.id === roomId);
}

function generateReference() {
  let reference;

  do {
    reference = `SE-${Date.now().toString().slice(-7)}-${Math.floor(
      Math.random() * 900 + 100,
    )}`;
  } while (reservations.some((reservation) => reservation.id === reference));

  return reference;
}

function initializeDateFields() {
  const today = getLocalDateString();

  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  checkInInput.min = today;
  checkOutInput.min = today;
}

function renderRooms() {
  roomList.innerHTML = "";

  rooms.forEach((room) => {
    const article = document.createElement("article");
    article.className = "room-card";

    const art = document.createElement("div");
    art.className = "room-art";
    art.textContent = room.icon;

    const details = document.createElement("div");
    details.className = "room-details";

    const heading = document.createElement("h3");
    heading.textContent = room.name;

    const description = document.createElement("p");
    description.textContent = `${room.description} · Room ${room.id}`;

    const bottom = document.createElement("div");
    bottom.className = "room-bottom";

    const price = document.createElement("span");
    price.className = "room-price";
    price.textContent = formatCurrency(room.price);

    const priceLabel = document.createElement("small");
    priceLabel.textContent = " / night";
    price.appendChild(priceLabel);

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "btn-small";
    selectButton.textContent = "Select Room";
    selectButton.addEventListener("click", () => {
      roomSelect.value = room.id;
      updatePricePreview();
      document.getElementById("reservation-form").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    bottom.append(price, selectButton);
    details.append(heading, description, bottom);
    article.append(art, details);
    roomList.appendChild(article);
  });
}

function populateRoomSelect() {
  rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room.id;
    option.textContent = `${room.name} — ${formatCurrency(room.price)} / night`;
    roomSelect.appendChild(option);
  });
}

function updatePricePreview() {
  const room = getRoom(roomSelect.value);
  const checkIn = checkInInput.value;
  const checkOut = checkOutInput.value;

  if (!room || !checkIn || !checkOut) {
    estimatedTotal.textContent = formatCurrency(0);
    priceBreakdown.textContent = "Select a room and dates.";
    return;
  }

  const nights = getNumberOfNights(checkIn, checkOut);

  if (nights <= 0) {
    estimatedTotal.textContent = formatCurrency(0);
    priceBreakdown.textContent = "Check-out must be later than check-in.";
    return;
  }

  const total = room.price * nights;

  estimatedTotal.textContent = formatCurrency(total);
  priceBreakdown.textContent = `${nights} night(s) × ${formatCurrency(
    room.price,
  )} per night`;
}

function hasRoomConflict(roomId, checkIn, checkOut, excludedId = "") {
  return reservations.some((reservation) => {
    if (
      reservation.roomId !== roomId ||
      reservation.id === excludedId ||
      reservation.status === "Cancelled"
    ) {
      return false;
    }

    return checkIn < reservation.checkOut && checkOut > reservation.checkIn;
  });
}

function validateReservation(data, excludedId = "") {
  const room = getRoom(data.roomId);

  if (!room) {
    alert("Please select a valid room.");
    return false;
  }

  if (!data.guestName.trim()) {
    alert("Please enter the guest's full name.");
    return false;
  }

  if (!data.guestEmail.trim() || !data.guestPhone.trim()) {
    alert("Please provide the guest's email and phone number.");
    return false;
  }

  if (
    !Number.isInteger(data.guestCount) ||
    data.guestCount < 1 ||
    data.guestCount > room.capacity
  ) {
    alert(`This room can accommodate 1 to ${room.capacity} guests.`);
    return false;
  }

  const today = getLocalDateString();

  if (!data.checkIn || !data.checkOut) {
    alert("Please select both check-in and check-out dates.");
    return false;
  }

  if (data.checkIn < today) {
    alert("Check-in date cannot be in the past.");
    return false;
  }

  if (data.checkOut <= data.checkIn) {
    alert("Check-out must be later than check-in.");
    return false;
  }

  if (hasRoomConflict(data.roomId, data.checkIn, data.checkOut, excludedId)) {
    alert(
      "This room already has a pending or confirmed reservation during those dates. Please choose another date or room.",
    );
    return false;
  }

  return true;
}

function renderReservations() {
  tableBody.innerHTML = "";

  const selectedStatus = statusFilter.value;

  const filteredReservations = reservations
    .filter((reservation) => {
      return selectedStatus === "All" || reservation.status === selectedStatus;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  filteredReservations.forEach((reservation) => {
    const room = getRoom(reservation.roomId);
    const row = document.createElement("tr");

    const values = [
      reservation.id,
      reservation.guestName,
      room ? room.name : "Unknown room",
      formatDate(reservation.checkIn),
      formatDate(reservation.checkOut),
      String(reservation.guestCount),
      formatCurrency(reservation.total),
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 0 || index === 1) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        cell.textContent = "";
        cell.appendChild(strong);
      }

      row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status status-${reservation.status.toLowerCase()}`;
    statusBadge.textContent = reservation.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editButton = createActionButton("Edit", "action-btn edit-btn", () =>
      editReservation(reservation.id),
    );

    const confirmButton = createActionButton(
      "Confirm",
      "action-btn confirm-btn",
      () => updateReservationStatus(reservation.id, "Confirmed"),
    );
    confirmButton.disabled = reservation.status !== "Pending";

    const cancelButton = createActionButton(
      "Cancel",
      "action-btn cancel-btn",
      () => updateReservationStatus(reservation.id, "Cancelled"),
    );
    cancelButton.disabled = reservation.status === "Cancelled";

    actions.append(editButton, confirmButton, cancelButton);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  });

  emptyMessage.hidden = filteredReservations.length > 0;
}

function createActionButton(label, className, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", callback);

  return button;
}

function updateStatistics() {
  const confirmed = reservations.filter(
    (reservation) => reservation.status === "Confirmed",
  ).length;

  const pending = reservations.filter(
    (reservation) => reservation.status === "Pending",
  ).length;

  const availableRooms = rooms.length;

  document.getElementById("total-reservations").textContent =
    reservations.length;

  document.getElementById("confirmed-reservations").textContent = confirmed;

  document.getElementById("pending-reservations").textContent = pending;

  document.getElementById("available-rooms").textContent = availableRooms;
}

function refreshDashboard() {
  renderReservations();
  updateStatistics();
}

function resetForm() {
  form.reset();
  reservationIdInput.value = "";
  guestCountInput.value = "1";

  formHeading.textContent = "Create a Reservation";
  submitButton.textContent = "Create Reservation";

  initializeDateFields();
  updatePricePreview();
}

function editReservation(id) {
  const reservation = reservations.find((item) => item.id === id);

  if (!reservation) {
    alert("Reservation could not be found.");
    return;
  }

  reservationIdInput.value = reservation.id;
  guestNameInput.value = reservation.guestName;
  guestEmailInput.value = reservation.guestEmail;
  guestPhoneInput.value = reservation.guestPhone;
  roomSelect.value = reservation.roomId;
  checkInInput.value = reservation.checkIn;
  checkOutInput.value = reservation.checkOut;
  guestCountInput.value = reservation.guestCount;

  formHeading.textContent = "Edit Reservation";
  submitButton.textContent = "Save Changes";

  checkInInput.min = getLocalDateString();
  checkOutInput.min = checkInInput.value || getLocalDateString();

  updatePricePreview();

  form.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function updateReservationStatus(id, newStatus) {
  const reservation = reservations.find((item) => item.id === id);

  if (!reservation) {
    alert("Reservation could not be found.");
    return;
  }

  if (newStatus === "Confirmed" && reservation.status !== "Pending") {
    return;
  }

  if (newStatus === "Cancelled" && reservation.status === "Cancelled") {
    return;
  }

  const message =
    newStatus === "Confirmed"
      ? "Confirm this reservation?"
      : "Cancel this reservation?";

  if (!confirm(message)) {
    return;
  }

  const previousStatus = reservation.status;
  reservation.status = newStatus;

  if (!saveReservations()) {
    reservation.status = previousStatus;
    return;
  }

  refreshDashboard();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const editingId = reservationIdInput.value;

  const room = getRoom(roomSelect.value);

  if (!room) {
    alert("Please select a valid room.");
    return;
  }

  const reservationData = {
    guestName: guestNameInput.value.trim(),
    guestEmail: guestEmailInput.value.trim(),
    guestPhone: guestPhoneInput.value.trim(),
    roomId: roomSelect.value,
    checkIn: checkInInput.value,
    checkOut: checkOutInput.value,
    guestCount: Number(guestCountInput.value),
    total:
      room.price * getNumberOfNights(checkInInput.value, checkOutInput.value),
  };

  if (!validateReservation(reservationData, editingId)) {
    return;
  }

  if (editingId) {
    const reservationIndex = reservations.findIndex(
      (reservation) => reservation.id === editingId,
    );

    if (reservationIndex === -1) {
      alert("Reservation could not be found.");
      return;
    }

    const previousReservation = reservations[reservationIndex];

    reservations[reservationIndex] = {
      ...previousReservation,
      ...reservationData,
    };

    if (!saveReservations()) {
      reservations[reservationIndex] = previousReservation;
      return;
    }

    alert("Reservation updated successfully.");
  } else {
    const newReservation = {
      id: generateReference(),
      ...reservationData,
      status: "Pending",
      createdAt: Date.now(),
    };

    reservations.push(newReservation);

    if (!saveReservations()) {
      reservations = reservations.filter(
        (reservation) => reservation.id !== newReservation.id,
      );
      return;
    }

    alert(`Reservation created successfully!\nReference: ${newReservation.id}`);
  }

  resetForm();
  refreshDashboard();
});

clearButton.addEventListener("click", resetForm);

roomSelect.addEventListener("change", updatePricePreview);

checkInInput.addEventListener("change", () => {
  checkOutInput.min = checkInInput.value || getLocalDateString();

  if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
    checkOutInput.value = "";
  }

  updatePricePreview();
});

checkOutInput.addEventListener("change", updatePricePreview);

statusFilter.addEventListener("change", renderReservations);

initializeDateFields();
renderRooms();
populateRoomSelect();
resetForm();
refreshDashboard();
