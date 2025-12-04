(() => {
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbxYvyszKKA71dkx524GAaGVtxyZsARzx10OE_LWFlLBCMmW-3KOlyD2Mb__KThQZaUMcQ/exec";
  const ADMIN_FLAG = "dsdAdminAccess";

  const els = {
    gate: document.getElementById("adminGate"),
    content: document.getElementById("adminContent"),
    bookingList: document.getElementById("bookingList"),
    bookingEmpty: document.getElementById("bookingEmpty"),
    refreshBookingsBtn: document.getElementById("refreshBookings"),
    completeBtnTemplate: document.getElementById("bookingCompleteButtonTemplate"),
    toast: document.getElementById("toast"),
    searchForm: document.getElementById("customerLookup"),
    searchInput: document.getElementById("searchPhone"),
    searchBtn: document.getElementById("searchBtn"),
    customerResult: document.getElementById("customerResult"),
    customerFields: document.getElementById("customerFields"),
    customerPlaceholder: document.getElementById("customerPlaceholder"),
    resetBtn: document.getElementById("resetLoyaltyBtn"),
    deleteBtn: document.getElementById("deleteCustomerBtn")
  };

  let toastTimer = null;
  let currentCustomer = null;

  const showToast = (message, variant = "success") => {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.remove("visible", "error");
    if (variant === "error") {
      els.toast.classList.add("error");
    }
    // restart animation
    void els.toast.offsetWidth;
    els.toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 3200);
  };

  const ensureAdminAccess = () => {
    const fromLogin = document.referrer && document.referrer.includes("login.html");
    if (!sessionStorage.getItem(ADMIN_FLAG) && fromLogin) {
      sessionStorage.setItem(ADMIN_FLAG, "true");
    }
    const allowed = sessionStorage.getItem(ADMIN_FLAG) === "true";
    if (!allowed) {
      if (els.content) els.content.hidden = true;
      if (els.gate) els.gate.hidden = false;
    } else {
      if (els.content) els.content.hidden = false;
      if (els.gate) els.gate.hidden = true;
    }
    return allowed;
  };

  const request = async (action, payload = {}) => {
    const params = new URLSearchParams();
    params.append("action", action);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    console.log("INCOMING ACTION:", action, "PHONE:", payload.phone);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    const data = await res.json();
    if (data && data.error) {
      throw new Error(data.error);
    }
    return data;
  };

  const parseBookings = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.bookings)) return data.bookings;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const createField = (label, value) => {
    const p = document.createElement("p");
    p.className = "muted";
    p.style.margin = "4px 0";
    const labelEl = document.createElement("span");
    labelEl.textContent = `${label}: `;
    const valueEl = document.createElement("span");
    valueEl.style.color = "#fff";
    valueEl.textContent = value || "—";
    p.append(labelEl, valueEl);
    return p;
  };

  const completeBooking = (phone) => {
    if (!phone) {
      showToast("Missing phone number for this booking.", "error");
      return;
    }
    request("completeBooking", { phone })
      .then(data => {
        if (data.status === "ok") {
          showToast("Booking completed!");
          loadBookings();
        } else {
          showToast(`Error: ${data.message || "Unable to complete booking"}`, "error");
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to connect to server", "error");
      });
  };

  const renderBookings = (bookings) => {
    if (!els.bookingList) return;
    els.bookingList.innerHTML = "";
    if (!bookings.length) {
      if (els.bookingEmpty) els.bookingEmpty.textContent = "No active bookings right now.";
      return;
    }
    if (els.bookingEmpty) els.bookingEmpty.textContent = "";

    bookings.forEach((booking) => {
      const card = document.createElement("article");
      card.className = "service-card";

      const name = booking.name || booking.customer || "Guest";
      const phone = booking.phone || booking.number || booking.phoneNumber || "";
      const service = booking.service || booking.package || "Detailing Service";
      const dateValue = booking.date || booking.dateTime || booking.when || "";
      const timeValue = booking.time || booking.timeSlot || "";
      const notes = booking.notes || booking.note || "";

      const title = document.createElement("h3");
      title.style.margin = "0 0 6px";
      title.textContent = name;
      card.appendChild(title);
      card.appendChild(createField("Phone", phone));
      card.appendChild(createField("Service", service));
      card.appendChild(
        createField("Date", dateValue && timeValue ? `${dateValue} ${timeValue}` : (dateValue || timeValue))
      );

      if (notes) {
        const notesEl = createField("Notes", notes);
        notesEl.style.margin = "6px 0";
        card.appendChild(notesEl);
      }

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "10px";
      actions.style.flexWrap = "wrap";
      actions.style.marginTop = "12px";

      const completeBtn = els.completeBtnTemplate
        ? els.completeBtnTemplate.content.firstElementChild.cloneNode(true)
        : document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = completeBtn.className || "btn signin";
      completeBtn.textContent = "Complete";
      completeBtn.addEventListener("click", () => completeBooking(phone));

      actions.appendChild(completeBtn);
      card.appendChild(actions);
      els.bookingList.appendChild(card);
    });
  };

  const loadBookings = async () => {
    if (els.bookingEmpty) els.bookingEmpty.textContent = "Loading bookings...";
    if (els.bookingList) els.bookingList.innerHTML = "";
    try {
      const data = await request("getBookings");
      const bookings = parseBookings(data);
      renderBookings(bookings);
    } catch (err) {
      console.error(err);
      if (els.bookingEmpty) els.bookingEmpty.textContent = "Unable to load bookings. Try again.";
      showToast("Failed to load bookings", "error");
    }
  };

  const markCompleted = async (phone, cardEl, btn) => {
    if (!phone) {
      showToast("Missing phone number for this booking.", "error");
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Marking...";
    }
    try {
      await request("completeBooking", { phone });
      if (cardEl) cardEl.remove();
      if (els.bookingList && !els.bookingList.children.length && els.bookingEmpty) {
        els.bookingEmpty.textContent = "No active bookings right now.";
      }
      showToast("Marked as completed");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not complete booking.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Mark Completed";
      }
    }
  };

  const setSearchLoading = (isLoading) => {
    if (els.searchBtn) {
      els.searchBtn.disabled = isLoading;
      els.searchBtn.textContent = isLoading ? "Searching..." : "Search";
    }
  };

  const renderCustomer = (customer, fallbackPhone) => {
    if (!els.customerResult || !els.customerFields) return;
    const name = customer?.name || customer?.customer || "Guest";
    const phone = customer?.phone || customer?.number || customer?.phoneNumber || fallbackPhone;
    const totalVisits = customer?.totalVisits ?? customer?.visits ?? customer?.loyaltyCount ?? "—";
    const lastVisit = customer?.lastVisit || customer?.lastBooking || "—";

    currentCustomer = { ...customer, name, phone, totalVisits, lastVisit };
    els.customerResult.dataset.phone = phone || "";
    els.customerFields.innerHTML = "";
    const title = document.createElement("h3");
    title.style.margin = "0 0 6px";
    title.textContent = name;
    els.customerFields.appendChild(title);
    els.customerFields.appendChild(createField("Phone", phone));
    els.customerFields.appendChild(createField("Total Visits", totalVisits));
    els.customerFields.appendChild(createField("Last Visit", lastVisit));

    els.customerResult.style.display = "block";
    if (els.customerPlaceholder) els.customerPlaceholder.textContent = "";
  };

  const clearCustomerResult = (message) => {
    currentCustomer = null;
    if (els.customerResult) {
      els.customerResult.style.display = "none";
      els.customerResult.dataset.phone = "";
    }
    if (els.customerPlaceholder) {
      els.customerPlaceholder.textContent = message || "Search for a customer to see their profile.";
    }
  };

  const handleCustomerAction = async (action, successMessage) => {
    const phone = els.customerResult?.dataset.phone;
    if (!phone) {
      showToast("Lookup a customer first.", "error");
      return;
    }
    try {
      if (els.resetBtn) els.resetBtn.disabled = true;
      if (els.deleteBtn) els.deleteBtn.disabled = true;
      await request(action, { phone });
      showToast(successMessage);
      if (action === "deleteCustomer") {
        clearCustomerResult("Customer deleted.");
      } else if (action === "resetLoyalty") {
        currentCustomer = { ...(currentCustomer || {}), phone, totalVisits: 0 };
        renderCustomer(currentCustomer, phone);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Request failed.", "error");
    } finally {
      if (els.resetBtn) els.resetBtn.disabled = false;
      if (els.deleteBtn) els.deleteBtn.disabled = false;
    }
  };

  const attachEvents = () => {
    if (els.searchInput) {
      els.searchInput.addEventListener("input", () => {
        let v = els.searchInput.value.replace(/\D/g, "");
        if (v.length > 3 && v.length <= 6) {
          els.searchInput.value = `(${v.slice(0, 3)}) ${v.slice(3)}`;
        } else if (v.length > 6) {
          els.searchInput.value = `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
        } else {
          els.searchInput.value = v;
        }
      });
    }

    if (els.refreshBookingsBtn) {
      els.refreshBookingsBtn.addEventListener("click", loadBookings);
    }

    if (els.searchForm) {
      els.searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const phone = (els.searchInput?.value || "").trim();
        if (!phone) {
          showToast("Enter a phone number to search.", "error");
          return;
        }
        setSearchLoading(true);
        try {
          const data = await request("lookupCustomer", { phone });
          const customer = data?.customer || data?.result || data;
          if (!customer || (typeof customer === "object" && !Object.keys(customer).length)) {
            clearCustomerResult("No customer found for that phone.");
            return;
          }
          renderCustomer(customer, phone);
        } catch (err) {
          console.error(err);
          showToast(err.message || "Lookup failed.", "error");
          clearCustomerResult("Lookup failed. Try again.");
        } finally {
          setSearchLoading(false);
        }
      });
    }

    if (els.resetBtn) {
      els.resetBtn.addEventListener("click", () => handleCustomerAction("resetLoyalty", "Loyalty reset."));
    }
    if (els.deleteBtn) {
      els.deleteBtn.addEventListener("click", () => handleCustomerAction("deleteCustomer", "Customer deleted."));
    }
  };

  window.completeBooking = completeBooking;

  document.addEventListener("DOMContentLoaded", () => {
    if (!ensureAdminAccess()) return;
    attachEvents();
    loadBookings();
  });
})();
