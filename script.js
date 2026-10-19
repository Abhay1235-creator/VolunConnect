
"use strict";

/* =========================================
   1. SHARED HELPERS
========================================= */

const storage = window.VolunConnectStorage;


function showFormMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");

  element.classList.remove("success", "error");
  element.classList.add(type === "success" ? "success" : "error");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Date not set";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getCategoryClass(category) {
  const classes = {
    environment: "tag-green",
    education: "tag-purple",
    community: "tag-orange",
    healthcare: "tag-red"
  };

  return classes[String(category || "").toLowerCase()] || "tag-blue";
}

function getEventImage(category) {
  const images = {
    environment:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80",
    education:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    community:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=80",
    healthcare:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80"
  };

  return images[String(category || "").toLowerCase()] ||
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80";
}

function renderSignedInAvatars(user) {
  if (!user) return;

  document.querySelectorAll(".topbar-user .avatar").forEach(avatar => {
    avatar.replaceChildren();

    const profileImage = user.profileImage || "";

    if (/^data:image\/(jpeg|png|webp);base64,/i.test(profileImage)) {
      const image = document.createElement("img");
      image.src = profileImage;
      image.alt = `${user.name}'s profile picture`;
      avatar.appendChild(image);
    } else {
      avatar.textContent =
        user.name.trim().charAt(0).toUpperCase() || "V";
    }
  });
}

function getCurrentUser() {
  return storage.getCurrentUser();
}

function redirectToRoleDashboard(user) {
  window.location.replace(
    user.role === "admin" ? "admin.html" : "dashboard.html"
  );
}


/* =========================================
   2. HOMEPAGE MOBILE NAVIGATION
========================================= */

const homeMenuToggle = document.getElementById("menu-toggle");
const homeNavLinks = document.getElementById("nav-links");

if (homeMenuToggle && homeNavLinks) {
  function closeHomeMenu() {
    homeNavLinks.classList.remove("open");
    homeMenuToggle.setAttribute("aria-expanded", "false");
    homeMenuToggle.setAttribute("aria-label", "Open navigation");
  }

  homeMenuToggle.addEventListener("click", () => {
    const isOpen = homeNavLinks.classList.toggle("open");

    homeMenuToggle.setAttribute("aria-expanded", String(isOpen));
    homeMenuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  homeNavLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeHomeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && homeNavLinks.classList.contains("open")) {
      closeHomeMenu();
      homeMenuToggle.focus();
    }
  });
}


/* =========================================
   3. PASSWORD VISIBILITY
========================================= */

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(
      button.dataset.togglePassword
    );

    if (!input) return;

    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    button.textContent = shouldShow ? "Hide" : "Show";
    button.setAttribute(
      "aria-label",
      shouldShow ? "Hide password" : "Show password"
    );
  });
});


/* =========================================
   4. REGISTRATION
========================================= */

const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("register-message");
    const button = registerForm.querySelector('[type="submit"]');

    if (!registerForm.reportValidity()) return;

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const selectedRole = registerForm.querySelector(
      'input[name="role"]:checked'
    );

    if (password !== confirmPassword) {
      showFormMessage(message, "Your passwords do not match.");
      return;
    }

    if (!selectedRole) {
      showFormMessage(message, "Please select an account type.");
      return;
    }

    if (!document.getElementById("terms").checked) {
      showFormMessage(message, "Please accept the Terms and Conditions.");
      return;
    }

    button.disabled = true;
    button.textContent = "Creating account...";

    try {
      await window.volunConnectReady;

      await storage.registerUser({
        name,
        email,
        password,
        role: selectedRole.value
      });

      showFormMessage(
        message,
        "Account created! Redirecting to login...",
        "success"
      );

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 700);

    } catch (error) {
      showFormMessage(message, error.message || "Registration failed.");

    } finally {
      button.disabled = false;
      button.textContent = "Register";
    }
  });
}


/* =========================================
   5. LOGIN
========================================= */

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("login-message");
    const button = loginForm.querySelector('[type="submit"]');

    if (!loginForm.reportValidity()) return;

    button.disabled = true;
    button.textContent = "Logging in...";

    try {
      await window.volunConnectReady;

      const user = await storage.login(
        document.getElementById("login-email").value.trim(),
        document.getElementById("login-password").value
      );

      showFormMessage(message, "Login successful.", "success");
      redirectToRoleDashboard(user);

    } catch (error) {
      showFormMessage(message, error.message || "Login failed.");

    } finally {
      button.disabled = false;
      button.textContent = "Login";
    }
  });
}

const forgotPasswordLink = document.getElementById("forgot-password-link");

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();

    showFormMessage(
      document.getElementById("login-message"),
      "Password recovery is not implemented yet."
    );
  });
}

document.querySelectorAll("[data-demo-social]").forEach((button) => {
  button.addEventListener("click", () => {
    showFormMessage(
      document.getElementById("login-message"),
      "Social sign-in is not connected in this prototype."
    );
  });
});

document.querySelectorAll("[data-demo-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    alert("Terms and Conditions will be added later.");
  });
});


/* =========================================
   6. ROLE-BASED PAGE ACCESS
========================================= */

async function initializeProtectedPage() {
  const isAdmin = document.body.classList.contains("admin-dashboard");
  const isVolunteer = document.body.classList.contains("volunteer-dashboard");

  if (!isAdmin && !isVolunteer) return;

  await window.volunConnectReady;

  const user = storage.requireRole(
    isAdmin ? ["admin"] : ["volunteer", "organization"]
  );

  if (!user) return;
  renderSignedInAvatars(user);

  document.querySelectorAll("#volunteer-name").forEach((element) => {
    element.textContent = user.name;
  });

  const welcomeName = document.getElementById("welcome-name");
  if (welcomeName) welcomeName.textContent = user.name;

  const adminName = document.getElementById("admin-name");
  if (adminName) adminName.textContent = user.name;

  // Initialize the page-specific features only after access is checked.
  renderOpportunities();
  renderEventDetails();
  renderApplications();
  renderVolunteerDashboard();

  // Day 5: Load admin dashboard statistics
  if (isAdmin) {
  renderAdminDashboard();
  renderAdminRecentApplications();
  setupAdminApplicationReview();
  }
}

initializeProtectedPage().catch((error) => {
  console.error("Page initialization failed:", error);
});


/* =========================================
   7. OPPORTUNITIES AND FILTERING
========================================= */

function renderOpportunities() {
  const grid = document.getElementById("opportunity-grid");
  if (!grid) return;

  const searchInput = document.getElementById("event-search");
  const categorySelect = document.getElementById("event-category");
  const countLabel = document.getElementById("event-count");

  function render() {
    const search = (searchInput?.value || "").trim().toLowerCase();
    const category = categorySelect?.value || "all";

    const events = storage.getEvents().filter((event) => {
      const searchableText = [
        event.title,
        event.location,
        event.description,
        event.category
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(search);
      const matchesCategory =
        category === "all" ||
        String(event.category).toLowerCase() === category;

      const eventDate = new Date(`${event.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return (
        matchesSearch &&
        matchesCategory &&
        event.status === "upcoming" &&
        !Number.isNaN(eventDate.getTime()) &&
        eventDate >= today
      );
    });

    countLabel.textContent =
      `${events.length} ${events.length === 1 ? "opportunity" : "opportunities"} found`;

    if (events.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h2>No opportunities found</h2>
          <p>Try another search or category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = events.map((event) => `
      <article class="opportunity-card">
        <img
          class="opportunity-card-image"
          src="${getEventDisplayImage(event)}"
          alt="${escapeHTML(event.category)} volunteer opportunity"
          loading="lazy"
        >

        <div class="opportunity-card-content">
          <span class="category-tag ${getCategoryClass(event.category)}">
            ${escapeHTML(event.category)}
          </span>

          <h2>${escapeHTML(event.title)}</h2>

          <p class="opportunity-description">
            ${escapeHTML(event.description)}
          </p>

          <ul class="opportunity-meta">
            <li>📅 ${escapeHTML(formatDate(event.date))}</li>
            <li>📍 ${escapeHTML(event.location)}</li>
            <li>👥 ${escapeHTML(event.capacity)} volunteer places</li>
          </ul>

          <div class="opportunity-card-actions">
            <a
              class="btn btn-outline"
              href="event-details.html?id=${encodeURIComponent(event.id)}"
            >View Details</a>

            <a
              class="btn btn-primary"
              href="event-details.html?id=${encodeURIComponent(event.id)}#apply"
            >Apply Now</a>
          </div>
        </div>
      </article>
    `).join("");
  }

  if (!grid.dataset.initialized) {
    searchInput?.addEventListener("input", render);
    categorySelect?.addEventListener("change", render);
    grid.dataset.initialized = "true";
  }

  render();
}


/* =========================================
   8. EVENT DETAILS AND APPLY NOW
========================================= */

function renderEventDetails() {
  const container = document.getElementById("event-details-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");
  const event = eventId ? storage.getEventById(eventId) : null;

  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Event not found</h2>
        <p>This event may have been removed or the link is invalid.</p>
        <a href="opportunities.html" class="btn btn-primary">
          Browse Opportunities
        </a>
      </div>
    `;
    return;
  }

  const user = getCurrentUser();
  const applications = storage.getApplicationsForUser(user.id);
  const existingApplication = applications.find(
    (application) => application.eventId === event.id
  );

  const eventDate = new Date(`${event.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOpen =
    event.status === "upcoming" &&
    !Number.isNaN(eventDate.getTime()) &&
    eventDate >= today;

  container.innerHTML = `
    <article class="event-details-card">
      <img
        class="event-details-image"
        src="${getEventDisplayImage(event)}"
        alt="${escapeHTML(event.category)} volunteer event"
      >

      <div class="event-details-content">
        <span class="category-tag ${getCategoryClass(event.category)}">
          ${escapeHTML(event.category)}
        </span>

        <h1>${escapeHTML(event.title)}</h1>

        <p class="event-details-description">
          ${escapeHTML(event.description)}
        </p>

        <div class="event-details-meta">
          <div class="event-meta-item">
            <span>Event Date</span>
            <strong>${escapeHTML(formatDate(event.date))}</strong>
          </div>

          <div class="event-meta-item">
            <span>Location</span>
            <strong>${escapeHTML(event.location)}</strong>
          </div>

          <div class="event-meta-item">
            <span>Volunteer Capacity</span>
            <strong>${escapeHTML(event.capacity)} places</strong>
          </div>

          <div class="event-meta-item">
            <span>Application Status</span>
            <strong>${existingApplication
              ? escapeHTML(existingApplication.status)
              : isOpen ? "Open" : "Closed"}</strong>
          </div>
        </div>

        <div class="event-apply-row" id="apply">
          ${
            existingApplication
              ? `<p class="event-feedback success">
                   You have already applied. Status:
                   ${escapeHTML(existingApplication.status)}.
                 </p>`
              : isOpen
                ? `<button type="button" class="btn btn-primary" id="apply-event-button">
                     Apply for this Event
                   </button>`
                : `<p class="event-feedback error">Applications are closed.</p>`
          }

          <p
            class="event-feedback"
            id="event-apply-message"
            role="status"
            aria-live="polite"
          ></p>
        </div>
      </div>
    </article>
  `;

  const applyButton = document.getElementById("apply-event-button");

  if (applyButton) {
    applyButton.addEventListener("click", () => {
      try {
        const application = storage.applyForEvent(user.id, event.id);

        showFormMessage(
          document.getElementById("event-apply-message"),
          `Application submitted successfully! Status: ${application.status}. Returning to dashboard...`,
          "success"
        );

        applyButton.disabled = true;
        applyButton.textContent = "Application Submitted";

        window.setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);

      } catch (error) {
        showFormMessage(
          document.getElementById("event-apply-message"),
          error.message || "Unable to submit application."
        );
      }
    });
  }
}


/* =========================================
   9. MY APPLICATIONS
========================================= */

function renderApplications() {
  const tbody = document.getElementById("applications-table-body");
  if (!tbody) return;

  const user = getCurrentUser();

  const applications = storage
    .getApplicationsForUser(user.id)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  const counts = {
    total: applications.length,
    pending: 0,
    approved: 0,
    rejected: 0
  };

  applications.forEach((application) => {
    if (Object.hasOwn(counts, application.status)) {
      counts[application.status]++;
    }
  });

  document.getElementById("application-total").textContent = counts.total;
  document.getElementById("application-pending").textContent = counts.pending;
  document.getElementById("application-approved").textContent = counts.approved;
  document.getElementById("application-rejected").textContent = counts.rejected;

  const emptyState = document.getElementById("applications-empty");
  emptyState.hidden = applications.length !== 0;
  tbody.closest(".table-wrapper").hidden = applications.length === 0;

  if (applications.length === 0) {
    tbody.innerHTML = "";
    return;
  }

  tbody.innerHTML = applications.map((application) => {
    const event = storage.getEventById(application.eventId);

    const statusClass = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected"
    }[application.status] || "status-pending";

    return `
      <tr>
        <td>${escapeHTML(event?.title || "Event unavailable")}</td>
        <td>${escapeHTML(event ? formatDate(event.date) : "—")}</td>
        <td>${escapeHTML(formatDateTime(application.appliedAt))}</td>
        <td>
          <span class="status ${statusClass}">
            ${escapeHTML(application.status)}
          </span>
        </td>
        <td>
          ${
            event
              ? `<a class="table-action" href="event-details.html?id=${encodeURIComponent(event.id)}">Details</a>`
              : "—"
          }
        </td>
      </tr>
    `;
  }).join("");
}


/* =========================================
   10. VOLUNTEER DASHBOARD STATISTICS
========================================= */


function renderVolunteerDashboard() {
  const grid = document.getElementById("recommended-events");
  const tbody = document.getElementById("recent-applications");

  const notificationList = document.getElementById(
    "volunteer-notifications-list"
  );
  const notificationSummary = document.getElementById(
    "volunteer-notification-summary"
  );

  if (!grid && !tbody && !notificationList) return;

  const user = storage.getCurrentUser();
  if (!user) return;

  const applications = storage
    .getApplicationsForUser(user.id)
    .slice()
    .sort(
      (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0)
    );

  const events = storage.getEvents();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getEvent = (application) =>
    storage.getEventById(application.eventId);

  const upcomingApplications = applications.filter((application) => {
    const event = getEvent(application);

    if (!event || application.status !== "approved") return false;

    const eventDate = new Date(`${event.date}T00:00:00`);

    return (
      event.status === "upcoming" &&
      !Number.isNaN(eventDate.getTime()) &&
      eventDate >= today
    );
  });

  const completedApplications = applications.filter((application) => {
    const event = getEvent(application);

    return (
      event &&
      event.status === "completed" &&
      application.status === "approved"
    );
  });

  // Update dashboard statistics using real stored data.
  const updateMetric = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  updateMetric("volunteer-total-applications", applications.length);
  updateMetric("volunteer-upcoming-events", upcomingApplications.length);
  updateMetric("volunteer-completed-events", completedApplications.length);

  // Hours are not tracked in the current data model.
  updateMetric("volunteer-hours", "—");

  // Recommend upcoming events the volunteer has not already applied for.
  if (grid) {
    const appliedEventIds = new Set(
      applications.map((application) => application.eventId)
    );

    const recommended = events
      .filter((event) => {
        const eventDate = new Date(`${event.date}T00:00:00`);

        return (
          event.status === "upcoming" &&
          !Number.isNaN(eventDate.getTime()) &&
          eventDate >= today &&
          !appliedEventIds.has(event.id)
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);

    if (recommended.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No new opportunities available</h3>
          <p>Check back later for more ways to contribute.</p>
          <a href="opportunities.html" class="btn btn-primary">
            Browse Opportunities
          </a>
        </div>
      `;
    } else {
      grid.innerHTML = recommended.map((event) => `
        <article class="dashboard-event-card">
          <img
            src="${getEventImage(event.category)}"
            alt="${escapeHTML(event.category || "Volunteer")} event"
            loading="lazy"
          >

          <div class="dashboard-event-body">
            <span class="category-tag ${getCategoryClass(event.category)}">
              ${escapeHTML(event.category || "Community")}
            </span>

            <h3>${escapeHTML(event.title)}</h3>
            <p class="event-detail">📅 ${escapeHTML(formatDate(event.date))}</p>
            <p class="event-detail">📍 ${escapeHTML(event.location || "Location not specified")}</p>

            <a
              href="event-details.html?id=${encodeURIComponent(event.id)}"
              class="btn btn-primary event-button"
            >
              View Details
            </a>
          </div>
        </article>
      `).join("");
    }
  }

  // Render the volunteer's recent applications.
  if (tbody) {
    const recent = applications.slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4">You have not applied for any events yet.</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = recent.map((application) => {
        const event = getEvent(application);

        const status = application.status || "pending";
        const statusClass = {
          pending: "status-pending",
          approved: "status-approved",
          rejected: "status-rejected"
        }[status] || "status-pending";

        return `
          <tr>
            <td>${escapeHTML(event?.title || "Event unavailable")}</td>
            <td>${escapeHTML(formatDateTime(application.appliedAt))}</td>
            <td>
              <span class="status ${statusClass}">
                ${escapeHTML(status)}
              </span>
            </td>
            <td>
              <a href="applications.html" class="table-action">
                View
              </a>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // Display only notifications belonging to the signed-in volunteer.
  if (notificationList) {
    const notifications = (storage.getNotifications() || [])
      .filter((notification) => notification.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

    const unreadCount = notifications.filter(
      (notification) => notification.read !== true
    ).length;

    if (notificationSummary) {
      notificationSummary.textContent =
        `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`;
    }

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <p>You have no notifications yet. Updates will appear here
        when your applications are reviewed.</p>
      `;
    } else {
      notificationList.innerHTML = notifications.slice(0, 5).map((notification) => {
        const isRead = notification.read === true;
        const notificationText =
          notification.message ||
          notification.title ||
          "A new notification is available.";

        return `
          <article class="notification-item"
            style="padding:16px; margin-bottom:12px; border:1px solid #ddd; border-radius:10px;">

            <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
              <strong>${escapeHTML(notificationText)}</strong>
              <span>${isRead ? "Read" : "Unread"}</span>
            </div>

            <p>${escapeHTML(
              notification.createdAt
                ? formatDateTime(notification.createdAt)
                : "Date unavailable"
            )}</p>

            ${
              isRead
                ? ""
                : `<button
                     type="button"
                     class="volunteer-mark-read"
                     data-notification-id="${escapeHTML(notification.id)}">
                     Mark as Read
                   </button>`
            }
          </article>
        `;
      }).join("");
    }

    // Attach one delegated click handler to mark individual notifications read.
    if (!notificationList.dataset.readHandlerAttached) {
      notificationList.addEventListener("click", (event) => {
        const button = event.target.closest(".volunteer-mark-read");
        if (!button) return;

        const notificationId = button.dataset.notificationId;

        // Verify that the notification belongs to this volunteer.
        const ownsNotification = (storage.getNotifications() || []).some(
          (notification) =>
            notification.id === notificationId &&
            notification.userId === user.id
        );

        if (!ownsNotification) return;

        if (typeof storage.markNotificationRead !== "function") {
          if (notificationSummary) {
            notificationSummary.textContent =
              "Mark-as-read storage support is unavailable.";
          }
          return;
        }

        storage.markNotificationRead(notificationId);
        renderVolunteerDashboard();
      });

      notificationList.dataset.readHandlerAttached = "true";
    }
  }
}


/* =========================================
   DAY 5 - ADMIN DASHBOARD STATISTICS
========================================= */


function renderAdminDashboard() {
  const adminStats = document.querySelector(".admin-stats");

  if (!adminStats) return;

  const users = storage.getUsers();
  const events = storage.getEvents();
  const applications = storage.getApplications();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);

    return (
      event.status === "upcoming" &&
      !Number.isNaN(eventDate.getTime()) &&
      eventDate >= today
    );
  }).length;

  const totalVolunteers = users.filter(
    (user) => user.role === "volunteer"
  ).length;

  const pendingApplications = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const completedEvents = events.filter(
    (event) => event.status === "completed"
  ).length;

  const updateMetric = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  updateMetric("admin-total-volunteers", totalVolunteers);
  updateMetric("admin-active-events", upcomingEvents);
  updateMetric("admin-pending-applications", pendingApplications);
  updateMetric("admin-completed-events", completedEvents);
}

  function renderAdminRecentApplications() {
  const tbody = document.getElementById(
    "admin-recent-applications"
  );

  if (!tbody) return;

  const applications = storage
    .getApplications()
    .slice()
    .sort(
      (a, b) =>
        new Date(b.appliedAt) - new Date(a.appliedAt)
    )
    .slice(0, 5);

  const users = storage.getUsers();

  if (applications.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No applications received yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = applications.map((application) => {
    const volunteer = users.find(
      (user) => user.id === application.userId
    );

    const event = storage.getEventById(
      application.eventId
    );

    const status = application.status || "pending";

    const statusClass = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected"
    }[status] || "status-pending";

    const appliedOn = formatDateTime(
      application.appliedAt
    );

    return `
      <tr>
        <td>${escapeHTML(volunteer?.name || "Unknown volunteer")}</td>
        <td>${escapeHTML(event?.title || "Event unavailable")}</td>
        <td>${escapeHTML(appliedOn)}</td>
        <td>
          <span class="status ${statusClass}">
            ${escapeHTML(status)}
          </span>
        </td>
        <td>
  ${
    status === "pending"
      ? `
        <div class="admin-review-actions">
          <button
            type="button"
            class="table-action admin-approve-btn"
            data-application-id="${escapeHTML(application.id)}"
            data-decision="approved"
          >
            Approve
          </button>

          <button
            type="button"
            class="table-action admin-reject-btn"
            data-application-id="${escapeHTML(application.id)}"
            data-decision="rejected"
          >
            Reject
          </button>
        </div>
      `
      : "Reviewed"
  }
</td>
      </tr>
    `;
  }).join("");
}
function setupAdminApplicationReview() {
  const tbody = document.getElementById(
    "admin-recent-applications"
  );

  if (!tbody || tbody.dataset.reviewHandlerReady === "true") {
    return;
  }

  tbody.dataset.reviewHandlerReady = "true";

  tbody.addEventListener("click", (event) => {
    const button = event.target.closest(
      "button[data-application-id][data-decision]"
    );

    if (!button || !tbody.contains(button)) return;

    const applicationId = button.dataset.applicationId;
    const decision = button.dataset.decision;
    const admin = getCurrentUser();

    if (!admin || admin.role !== "admin") {
      alert("Please log in as an administrator.");
      return;
    }

    const action = decision === "approved" ? "approve" : "reject";

    if (!confirm(`Are you sure you want to ${action} this application?`)) {
      return;
    }

    try {
      button.disabled = true;

      storage.reviewApplication(
        applicationId,
        decision,
        admin.id
      );

      renderAdminDashboard();
      renderAdminRecentApplications();

      alert(
        decision === "approved"
          ? "Application approved. A notification has been created."
          : "Application rejected. A notification has been created."
      );
    } catch (error) {
      alert(error.message || "Unable to review this application.");
      renderAdminRecentApplications();
    }
  });
}
/* =========================================
   11. LOGOUT
========================================= */

document.querySelectorAll("[data-logout]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    storage.logout();
    window.location.replace("login.html");
  });
});


/* =========================================
   12. RESPONSIVE SIDEBAR
========================================= */

function setupSidebar(toggleId, sidebarId) {
  const toggle = document.getElementById(toggleId);
  const sidebar = document.getElementById(sidebarId);

  if (!toggle || !sidebar) return;

  function closeSidebar() {
    sidebar.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
  });
}

setupSidebar("volunteer-menu-toggle", "volunteer-sidebar");
setupSidebar("admin-menu-toggle", "admin-sidebar");


/* =========================================
   13. COPYRIGHT YEAR
========================================= */

const currentYear = document.getElementById("current-year");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* =========================================
   DAY 5 - ADMIN EVENT MANAGEMENT
========================================= */

function renderAdminEvents() {
  const tbody = document.getElementById("admin-events-table");
  if (!tbody) return;

  const events = storage.getEvents().slice().sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const emptyState = document.getElementById("admin-events-empty");
  const count = document.getElementById("admin-event-count");

  if (count) {
    count.textContent = `${events.length} event${events.length === 1 ? "" : "s"}`;
  }

  if (emptyState) {
    emptyState.hidden = events.length !== 0;
  }

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No events have been created yet.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = events.map((event) => `
    <tr>
      <td>${escapeHTML(event.title)}</td>
      <td>${escapeHTML(formatDate(event.date))}</td>
      <td>${escapeHTML(event.location)}</td>
      <td>${escapeHTML(event.capacity)}</td>
      <td>
        <span class="status ${
          event.status === "upcoming"
            ? "status-approved"
            : event.status === "completed"
              ? "status-pending"
              : "status-rejected"
        }">
          ${escapeHTML(event.status)}
        </span>
      </td>
      <td>
        <div class="admin-review-actions">
          <button
            type="button"
            class="table-action"
            data-event-action="edit"
            data-event-id="${escapeHTML(event.id)}"
          >Edit</button>

          <button
            type="button"
            class="table-action"
            data-event-action="delete"
            data-event-id="${escapeHTML(event.id)}"
          >Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

let selectedEventImage = "";

function getEventDisplayImage(event) {
  const image = event.imageUrl;

  // Accept only image data URLs of supported formats.
  if (
    typeof image === "string" &&
    /^data:image\/(jpeg|png|webp);base64,/i.test(image)
  ) {
    return image;
  }

  return getEventImage(event.category);
}

function updateEventImagePreview(imageUrl = "") {
  const preview = document.getElementById("admin-event-image-preview");
  const label = document.getElementById("admin-event-image-label");
  const removeButton = document.getElementById("admin-event-image-remove");
  const category = document.getElementById("admin-event-category").value;

  const image = imageUrl || getEventImage(category);

  preview.src = image;
  preview.hidden = !image;
  removeButton.hidden = !selectedEventImage;

  label.textContent = selectedEventImage
    ? "Custom image selected."
    : "No custom image selected. The default category image will be used.";
}


function resetAdminEventForm() {
  const form = document.getElementById("admin-event-form");
  if (!form) return;

  form.reset();

  selectedEventImage = "";

  const imageInput = document.getElementById("admin-event-image");
  if (imageInput) {
    imageInput.value = "";
  }

  document.getElementById("admin-event-id").value = "";
  document.getElementById("admin-event-capacity").value = "20";
  document.getElementById("admin-event-status").value = "upcoming";
  document.getElementById("event-form-heading").textContent = "Create a New Event";
  document.getElementById("admin-event-submit").textContent = "Create Event";
  document.getElementById("admin-event-cancel").hidden = true;

  updateEventImagePreview();
}


function editAdminEvent(eventId) {
  const event = storage.getEvents().find(
    (item) => item.id === eventId
  );

  if (!event) {
    alert("Event not found.");
    renderAdminEvents();
    return;
  }

  document.getElementById("admin-event-id").value = event.id;
  document.getElementById("admin-event-title").value = event.title;
  document.getElementById("admin-event-category").value = event.category;
  document.getElementById("admin-event-date").value = event.date;
  document.getElementById("admin-event-location").value = event.location;
  document.getElementById("admin-event-capacity").value = event.capacity;
  document.getElementById("admin-event-status").value = event.status;
  document.getElementById("admin-event-description").value = event.description;

  document.getElementById("event-form-heading").textContent = "Edit Event";
  document.getElementById("admin-event-submit").textContent = "Save Changes";
  document.getElementById("admin-event-cancel").hidden = false;

  document.getElementById("event-form-heading").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  selectedEventImage = event.imageUrl || "";
  document.getElementById("admin-event-image").value = "";
  updateEventImagePreview(selectedEventImage);
}

async function initializeAdminEventManagement() {
  const form = document.getElementById("admin-event-form");

  // Do not run on other pages.
  if (!form) return;

  try {
    await window.volunConnectReady;

    const admin = storage.requireRole(["admin"]);
    if (!admin) return;

    const adminName = document.getElementById("admin-name");
    if (adminName) adminName.textContent = admin.name;

    renderAdminEvents();
    
      const imageInput = document.getElementById("admin-event-image");
      const imageRemoveButton = document.getElementById("admin-event-image-remove");
      const categoryInput = document.getElementById("admin-event-category");

      updateEventImagePreview();

      imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
          alert("Please select a JPG, PNG, or WebP image.");
          imageInput.value = "";
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          alert("Image size must be 2 MB or less.");
          imageInput.value = "";
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          selectedEventImage = reader.result;
          updateEventImagePreview(selectedEventImage);
        };

        reader.onerror = () => {
          alert("Unable to read this image. Please try another file.");
          imageInput.value = "";
        };

        reader.readAsDataURL(file);
      });

      categoryInput.addEventListener("change", () => {
        if (!selectedEventImage) {
          updateEventImagePreview();
        }
      });

      imageRemoveButton.addEventListener("click", () => {
        selectedEventImage = "";
        imageInput.value = "";
        updateEventImagePreview();
      });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const message = document.getElementById("admin-event-message");
      const submitButton = document.getElementById("admin-event-submit");

      const eventId = document.getElementById("admin-event-id").value;

      const eventData = {
        title: document.getElementById("admin-event-title").value,
        category: document.getElementById("admin-event-category").value,
        date: document.getElementById("admin-event-date").value,
        location: document.getElementById("admin-event-location").value,
        capacity: document.getElementById("admin-event-capacity").value,
        status: document.getElementById("admin-event-status").value,
        description: document.getElementById("admin-event-description").value,
        imageUrl: selectedEventImage
      };

      try {
        submitButton.disabled = true;

        if (eventId) {
          storage.updateEvent(eventId, eventData);
          message.textContent = "Event updated successfully.";
        } else {
          storage.createEvent(eventData);
          message.textContent = "Event created successfully.";
        }

        message.className = "success";
        resetAdminEventForm();
        renderAdminEvents();
      } catch (error) {
        message.textContent = error.message || "Unable to save this event.";
        message.className = "error";
      } finally {
        submitButton.disabled = false;
      }
    });

    document.getElementById("admin-event-cancel").addEventListener(
      "click",
      () => {
        resetAdminEventForm();

        const message = document.getElementById("admin-event-message");
        message.textContent = "";
        message.className = "";
      }
    );

    document.getElementById("admin-events-table").addEventListener(
      "click",
      (event) => {
        const button = event.target.closest("[data-event-action][data-event-id]");
        if (!button) return;

        const eventId = button.dataset.eventId;
        const action = button.dataset.eventAction;

        if (action === "edit") {
          editAdminEvent(eventId);
          return;
        }

        if (action === "delete") {
          const confirmed = confirm(
            "Are you sure you want to delete this event? This action cannot be undone."
          );

          if (!confirmed) return;

          try {
            storage.deleteEvent(eventId);
            resetAdminEventForm();
            renderAdminEvents();

            const message = document.getElementById("admin-event-message");
            message.textContent = "Event deleted successfully.";
            message.className = "success";
          } catch (error) {
            alert(error.message || "Unable to delete this event.");
          }
        }
      }
    );
  } catch (error) {
    console.error("Admin event management failed to initialize:", error);

    const message = document.getElementById("admin-event-message");
    if (message) {
      message.textContent = "Unable to load event management. Please refresh the page.";
      message.className = "error";
    }
  }
}

initializeAdminEventManagement();


/* =========================================
   DAY 5 - ADMIN APPLICATION MANAGEMENT
========================================= */

function initializeAdminApplicationsPage() {
  const tbody = document.getElementById("admin-all-applications");

  // Run only on the admin applications page.
  if (!tbody) return;

  async function loadApplications() {
    await window.volunConnectReady;

    const admin = storage.requireRole(["admin"]);
    if (!admin) return;

    const nameElement = document.getElementById("admin-name");
    if (nameElement) nameElement.textContent = admin.name;

    renderAllAdminApplications();
  }

  function renderAllAdminApplications() {
    const applications = storage.getApplications().slice().sort(
      (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
    );

    const users = storage.getUsers();

    const counts = {
      total: applications.length,
      pending: applications.filter(a => a.status === "pending").length,
      approved: applications.filter(a => a.status === "approved").length,
      rejected: applications.filter(a => a.status === "rejected").length
    };

    document.getElementById("all-applications-total").textContent = counts.total;
    document.getElementById("all-applications-pending").textContent = counts.pending;
    document.getElementById("all-applications-approved").textContent = counts.approved;
    document.getElementById("all-applications-rejected").textContent = counts.rejected;

    if (applications.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">No applications have been submitted yet.</td></tr>
      `;
      return;
    }

    tbody.innerHTML = applications.map(application => {
      const volunteer = users.find(user => user.id === application.userId);
      const event = storage.getEventById(application.eventId);

      const statusClass = {
        pending: "status-pending",
        approved: "status-approved",
        rejected: "status-rejected"
      }[application.status] || "status-pending";

      const actions = application.status === "pending"
        ? `
          <button type="button" class="table-action"
            data-application-action="approved"
            data-application-id="${escapeHTML(application.id)}">
            Approve
          </button>
          <button type="button" class="table-action"
            data-application-action="rejected"
            data-application-id="${escapeHTML(application.id)}">
            Reject
          </button>
        `
        : "Reviewed";

      return `
        <tr>
          <td>${escapeHTML(volunteer?.name || "Unknown volunteer")}</td>
          <td>${escapeHTML(event?.title || "Event unavailable")}</td>
          <td>${escapeHTML(formatDateTime(application.appliedAt))}</td>
          <td>
            <span class="status ${statusClass}">
              ${escapeHTML(application.status)}
            </span>
          </td>
          <td>${actions}</td>
        </tr>
      `;
    }).join("");
  }

  tbody.addEventListener("click", event => {
    const button = event.target.closest(
      "[data-application-action][data-application-id]"
    );

    if (!button) return;

    const decision = button.dataset.applicationAction;
    const applicationId = button.dataset.applicationId;

    const confirmed = confirm(
      `Are you sure you want to ${decision} this application?`
    );

    if (!confirmed) return;

    try {
      const admin = storage.getCurrentUser();

      storage.reviewApplication(applicationId, decision, admin.id);

      renderAllAdminApplications();

      const message = document.getElementById(
        "admin-applications-message"
      );

      message.textContent = `Application ${decision} successfully.`;
      message.className = "success";
    } catch (error) {
      const message = document.getElementById(
        "admin-applications-message"
      );

      message.textContent = error.message || "Unable to review application.";
      message.className = "error";
    }
  });

  loadApplications().catch(error => {
    console.error("Unable to load admin applications:", error);
    tbody.innerHTML = `
      <tr><td colspan="5">Unable to load applications. Please refresh.</td></tr>
    `;
  });
}

initializeAdminApplicationsPage();


/* =========================================
   DAY 5 - MANAGE VOLUNTEERS
========================================= */


function initializeAdminVolunteersPage() {
  const tbody = document.getElementById("admin-volunteers-table");
  if (!tbody) return;

  const searchInput = document.getElementById("volunteer-search");
  const summary = document.getElementById("volunteer-table-summary");
  const totalElement = document.getElementById("volunteer-count");
  const activeElement = document.getElementById("volunteer-active-count");
  const inactiveElement = document.getElementById("volunteer-inactive-count");

  async function initialize() {
    try {
      // Wait until browser storage and demo data are ready.
      await window.volunConnectReady;

      const admin = storage.requireRole(["admin"]);
      if (!admin) return;

      const nameElement = document.getElementById("admin-name");
      if (nameElement) nameElement.textContent = admin.name;

      renderVolunteers();

      if (searchInput) {
        searchInput.addEventListener("input", renderVolunteers);
      }
    } catch (error) {
      console.error("Manage Volunteers initialization failed:", error);

      if (summary) {
        summary.textContent = "Unable to load volunteer data.";
      }

      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            Unable to load volunteers. Check the browser console for details.
          </td>
        </tr>
      `;
    }
  }

  function renderVolunteers() {
    try {
      const allUsers = storage.getUsers();

      if (!Array.isArray(allUsers)) {
        throw new Error("Stored user data is not in the expected format.");
      }

      const volunteers = allUsers.filter(
        user => user && user.role === "volunteer"
      );

      const query = (searchInput?.value || "").trim().toLowerCase();

      const filtered = volunteers.filter(user =>
        String(user.name || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query)
      );

      const activeCount = volunteers.filter(
        user => user.status === "active"
      ).length;

      if (totalElement) totalElement.textContent = volunteers.length;
      if (activeElement) activeElement.textContent = activeCount;

      if (inactiveElement) {
        inactiveElement.textContent = volunteers.length - activeCount;
      }

      if (summary) {
        summary.textContent =
          `Showing ${filtered.length} of ${volunteers.length} volunteers`;
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4">
              ${
                volunteers.length === 0
                  ? "No volunteer accounts found. Register a volunteer account first."
                  : "No volunteers match your search."
              }
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(user => {
        const isActive = user.status === "active";

        let registeredDate = "—";

        if (user.createdAt) {
          const date = new Date(user.createdAt);

          if (!Number.isNaN(date.getTime())) {
            registeredDate = date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
          }
        }

        return `
          <tr>
            <td>${escapeHTML(user.name || "Unnamed volunteer")}</td>
            <td>${escapeHTML(user.email || "No email")}</td>
            <td>${escapeHTML(registeredDate)}</td>
            <td>
              <span class="status ${
                isActive ? "status-approved" : "status-rejected"
              }">
                ${escapeHTML(user.status || "unknown")}
              </span>
            </td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      console.error("Unable to render volunteers:", error);

      if (summary) summary.textContent = "Error loading volunteer data.";

      tbody.innerHTML = `
        <tr>
          <td colspan="4">
            An error occurred while displaying volunteers.
            Check the browser console.
          </td>
        </tr>
      `;
    }
  }

  initialize();
}

initializeAdminVolunteersPage();


/* =========================================
   DAY 5 - REPORTS AND ANALYTICS
========================================= */

function initializeAdminReportsPage() {
  const statusTable = document.getElementById("report-status-table");
  if (!statusTable) return;

  async function initialize() {
    await window.volunConnectReady;

    const admin = storage.requireRole(["admin"]);
    if (!admin) return;

    const name = document.getElementById("admin-name");
    if (name) name.textContent = admin.name;

    const users = storage.getUsers().filter(
      user => user.role === "volunteer"
    );
    const events = storage.getEvents();
    const applications = storage.getApplications();

    const approved = applications.filter(
      application => application.status === "approved"
    ).length;

    const update = (id, value) => {
      document.getElementById(id).textContent = value;
    };

    update("report-volunteers", users.length);
    update("report-events", events.length);
    update("report-applications", applications.length);

    // Approval rate is approved applications divided by all reviewed applications.
    
    const reviewed = applications.filter(
      (application) =>
        ["approved", "rejected"].includes(application.status)
    );

    const approvalRate = reviewed.length
      ? Math.round(
          (reviewed.filter(
            (application) => application.status === "approved"
          ).length / reviewed.length) * 100
        )
      : null;

    update(
      "report-approval-rate",
      approvalRate === null ? "—" : `${approvalRate}%`
    );


    const statuses = ["pending", "approved", "rejected"];
    
const chart = document.getElementById("report-status-chart");

if (chart) {
  const total = applications.length;

  const chartColors = {
    pending: "#D97706",
    approved: "#16A34A",
    rejected: "#DC2626"
  };

  chart.innerHTML = statuses.map((status) => {
    const count = applications.filter(
      (application) => application.status === status
    ).length;

    const percentage = total
      ? Math.round((count / total) * 100)
      : 0;

    return `
      <div style="margin: 18px 0;">
        <div style="
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        ">
          <strong>${status.charAt(0).toUpperCase() + status.slice(1)}</strong>
          <span>${count} (${percentage}%)</span>
        </div>

        <div
          style="
            width: 100%;
            height: 12px;
            background: #E5E7EB;
            border-radius: 999px;
            overflow: hidden;
          "
          role="progressbar"
          aria-label="${status} applications"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${percentage}"
        >
          <div style="
            width: ${percentage}%;
            height: 100%;
            background: ${chartColors[status]};
            border-radius: 999px;
          "></div>
        </div>
      </div>
    `;
  }).join("");
}

    statusTable.innerHTML = statuses.map(status => {
      const count = applications.filter(
        application => application.status === status
      ).length;

      const share = applications.length
        ? Math.round((count / applications.length) * 100)
        : 0;

      return `
        <tr>
          <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
          <td>${count}</td>
          <td>${share}%</td>
        </tr>
      `;
    }).join("");

    const categoryTable = document.getElementById("report-category-table");
    const categories = {};

    events.forEach(event => {
      const category = event.category || "Uncategorized";
      categories[category] = (categories[category] || 0) + 1;
    });

    const categoryNames = Object.keys(categories).sort();

    categoryTable.innerHTML = categoryNames.length
      ? categoryNames.map(category => `
          <tr>
            <td>${escapeHTML(category)}</td>
            <td>${categories[category]}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="2">No events available yet.</td></tr>`;
  }

  initialize().catch(error => {
    console.error("Reports failed to load:", error);
    statusTable.innerHTML =
      `<tr><td colspan="3">Unable to load reports. Please refresh.</td></tr>`;
  });
}

initializeAdminReportsPage();

/* =========================================
   DAY 5 - ADMIN NOTIFICATIONS
========================================= */

function initializeAdminNotificationsPage() {
  const list = document.getElementById("admin-notifications-list");
  if (!list) return;

  /* ---------- Helpers ---------- */

  function getNotificationText(notification) {
    return (
      notification.message ||
      notification.text ||
      notification.title ||
      "A new notification is available."
    );
  }

  function getRawDate(notification) {
    return notification.createdAt || notification.timestamp || notification.date;
  }

  function getNotificationDate(notification) {
    const value = getRawDate(notification);
    if (!value) return "Date unavailable";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : formatDateTime(date);
  }

  function getTimestamp(notification) {
    const time = new Date(getRawDate(notification) || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function isRead(notification) {
    return (
      notification.read === true ||
      notification.isRead === true ||
      notification.status === "read"
    );
  }

  /* ---------- Main ---------- */

  async function initialize() {
    await window.volunConnectReady;

    const admin = storage.requireRole(["admin"]);
    if (!admin) return;

    const adminName = document.getElementById("admin-name");
    const message = document.getElementById("notifications-message");
    const count = document.getElementById("notification-count");
    const markAllButton = document.getElementById("mark-all-read-btn");

    if (adminName) adminName.textContent = admin.name;

    
function renderNotifications() {
  const notifications = storage.getNotifications() || [];

  const sorted = [...notifications].sort(
    (a, b) => getTimestamp(b) - getTimestamp(a)
  );

  const unreadCount = sorted.filter(
    (notification) => !isRead(notification)
  ).length;

  if (count) {
    count.textContent =
      `${sorted.length} notification${sorted.length === 1 ? "" : "s"} · ` +
      `${unreadCount} unread`;
  }

  if (!sorted.length) {
    list.innerHTML = "<p>No notifications yet.</p>";
    return;
  }

  list.innerHTML = sorted.map((notification) => {
    const read = isRead(notification);

    return `
      <article class="notification-item"
        style="padding:16px; margin-bottom:12px; border:1px solid #ddd; border-radius:10px;">

        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <strong>${escapeHTML(getNotificationText(notification))}</strong>
          <span>${read ? "Read" : "Unread"}</span>
        </div>

        <p>${escapeHTML(getNotificationDate(notification))}</p>

        ${
          read
            ? ""
            : `<button type="button"
                 class="mark-notification-read"
                 data-notification-id="${escapeHTML(notification.id)}">
                 Mark as Read
               </button>`
        }
      </article>
    `;
  }).join("");
}


    renderNotifications();

    
    if (markAllButton) {
      markAllButton.addEventListener("click", () => {
        storage.markAllNotificationsRead();
        renderNotifications();

        if (message) {
          message.textContent = "All notifications marked as read.";
        }
      });
    }

    list.addEventListener("click", (event) => {
      const button = event.target.closest(".mark-notification-read");

      if (!button) return;

      const notificationId = button.dataset.notificationId;

      if (!notificationId) return;

      storage.markNotificationRead(notificationId);
      renderNotifications();

      if (message) {
        message.textContent = "Notification marked as read.";
      }
    });



    // Render the notifications when initialization is complete.
    renderNotifications();
  }

  // Handle initialization errors.
  initialize().catch((error) => {
    console.error("Admin notifications failed to initialize:", error);
    list.innerHTML =
      "<p>Unable to load notifications. Please refresh the page.</p>";
  });
}

// Run once the DOM is ready.
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdminNotificationsPage
  );
} else {
  initializeAdminNotificationsPage();
}
