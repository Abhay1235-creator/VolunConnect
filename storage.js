
"use strict";

/*
  VolunConnect demo storage layer.

  IMPORTANT:
  Browser storage is editable by the user and is not a
  secure production database or authentication service.
*/

(function () {
  const KEYS = {
    users: "volunconnect_users",
    events: "volunconnect_events",
    applications: "volunconnect_applications",
    notifications: "volunconnect_notifications",
    currentUser: "volunconnect_currentUser"
  };

  const DEMO_ADMIN_EMAIL = "admin@volunconnect.demo";
  const DEMO_ADMIN_PASSWORD = "AdminDemo2026!";

  // ---------- General storage helpers ----------

  function getData(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) return fallback;

      return JSON.parse(raw);
    } catch (error) {
      console.error("Unable to read stored data:", error);
      return fallback;
    }
  }

  function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function generateId(prefix = "item") {
    if (window.crypto && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getUsers() {
    return getData(KEYS.users, []);
  }

  function getEvents() {
    return getData(KEYS.events, []);
  }

  function getApplications() {
    return getData(KEYS.applications, []);
  }

  function getNotifications() {
    return getData(KEYS.notifications, []);
  }

  // ---------- Password hashing for the demo ----------

  function bytesToBase64(bytes) {
    let binary = "";

    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);

    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  function constantTimeEqual(a, b) {
    if (a.length !== b.length) return false;

    let difference = 0;

    for (let i = 0; i < a.length; i++) {
      difference |= a[i] ^ b[i];
    }

    return difference === 0;
  }

  async function hashPassword(password, saltBase64) {
    if (!crypto.subtle) {
      throw new Error(
        "Secure browser cryptography is unavailable. Run the site using VS Code Live Server."
      );
    }

    const salt = saltBase64
      ? base64ToBytes(saltBase64)
      : crypto.getRandomValues(new Uint8Array(16));

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 120000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return {
      salt: bytesToBase64(salt),
      hash: bytesToBase64(new Uint8Array(derivedBits))
    };
  }

  // ---------- Registration ----------

  async function registerUser({ name, email, password, role }) {
    name = String(name || "").trim();
    email = normalizeEmail(email);
    password = String(password || "");

    if (name.length < 2 || name.length > 80) {
      throw new Error("Enter a name between 2 and 80 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    if (!["volunteer", "organization"].includes(role)) {
      throw new Error("Select a valid account type.");
    }

    const users = getUsers();

    if (users.some((user) => user.email === email)) {
      throw new Error("An account with this email already exists.");
    }

    const credentials = await hashPassword(password);

    const user = {
      id: generateId("user"),
      name,
      email,
      role,
      passwordSalt: credentials.salt,
      passwordHash: credentials.hash,
      createdAt: new Date().toISOString(),
      status: "active"
    };

    users.push(user);
    saveData(KEYS.users, users);

    // Return a safe public profile, never the password hash.
    return publicUser(user);
  }

  
function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    status: user.status,
    profileImage: user.profileImage || ""
  };
}


  // ---------- Login and session ----------

  async function login(email, password) {
    email = normalizeEmail(email);

    const user = getUsers().find(
      (item) => item.email === email
    );

    if (!user || user.status !== "active") {
      throw new Error("Invalid email or password.");
    }

    const credentials = await hashPassword(
      String(password || ""),
      user.passwordSalt
    );

    const expected = base64ToBytes(user.passwordHash);
    const actual = base64ToBytes(credentials.hash);

    if (!constantTimeEqual(expected, actual)) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser = publicUser(user);

    sessionStorage.setItem(
      KEYS.currentUser,
      JSON.stringify(sessionUser)
    );

    return sessionUser;
  }

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(KEYS.currentUser);

      if (!raw) return null;

      const sessionUser = JSON.parse(raw);

      // Recheck the account in stored demo data.
      const storedUser = getUsers().find(
        (user) => user.id === sessionUser.id
      );

      if (
        !storedUser ||
        storedUser.status !== "active" ||
        storedUser.role !== sessionUser.role
      ) {
        logout();
        return null;
      }

      return publicUser(storedUser);
    } catch {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(KEYS.currentUser);
  }

  // ---------- Page access checks ----------

  function requireRole(allowedRoles) {
    const user = getCurrentUser();

    if (!user) {
      window.location.replace("login.html");
      return null;
    }

    if (!allowedRoles.includes(user.role)) {
      window.location.replace(
        user.role === "admin" ? "admin.html" : "dashboard.html"
      );

      return null;
    }

    return user;
  }

  // ---------- Seed a demo admin ----------

  async function initializeDemoAdmin() {
    const users = getUsers();

    const existingAdmin = users.find(
      (user) => user.email === DEMO_ADMIN_EMAIL
    );

    if (existingAdmin) return;

    const credentials = await hashPassword(DEMO_ADMIN_PASSWORD);

    users.push({
      id: generateId("admin"),
      name: "VolunConnect Admin",
      email: DEMO_ADMIN_EMAIL,
      role: "admin",
      passwordSalt: credentials.salt,
      passwordHash: credentials.hash,
      createdAt: new Date().toISOString(),
      status: "active"
    });

    saveData(KEYS.users, users);
  }
  
  // ---------- Admin event management ----------

  function createEvent(eventData) {
    const events = getEvents();

    const event = {
      id: generateId("event"),
      title: String(eventData.title || "").trim(),
      category: String(eventData.category || "").trim(),
      date: String(eventData.date || ""),
      location: String(eventData.location || "").trim(),
      capacity: Number(eventData.capacity),
      description: String(eventData.description || "").trim(),
      imageUrl: String(eventData.imageUrl || ""),
      status: eventData.status || "upcoming",
      createdAt: new Date().toISOString()
    };

    if (
      !event.title ||
      !event.category ||
      !event.date ||
      !event.location ||
      !event.description
    ) {
      throw new Error("Please complete all required event fields.");
    }

    if (!Number.isFinite(event.capacity) || event.capacity < 1) {
      throw new Error("Event capacity must be at least 1.");
    }

    if (!["upcoming", "completed", "cancelled"].includes(event.status)) {
      throw new Error("Invalid event status.");
    }

    events.push(event);
    saveData(KEYS.events, events);

    return event;
  }

  function updateEvent(eventId, changes) {
    const events = getEvents();
    const index = events.findIndex(event => event.id === eventId);

    if (index === -1) {
      throw new Error("Event not found.");
    }

    const current = events[index];

    const updated = {
      ...current,
      ...changes,
      id: current.id,
      title: String(changes.title ?? current.title).trim(),
      category: String(changes.category ?? current.category).trim(),
      date: String(changes.date ?? current.date),
      location: String(changes.location ?? current.location).trim(),
      description: String(
        changes.description ?? current.description
      ).trim(),
      capacity: Number(changes.capacity ?? current.capacity)
    };

    if (
      !updated.title ||
      !updated.category ||
      !updated.date ||
      !updated.location ||
      !updated.description
    ) {
      throw new Error("Please complete all required event fields.");
    }

    if (
      !Number.isFinite(updated.capacity) ||
      updated.capacity < 1
    ) {
      throw new Error("Event capacity must be at least 1.");
    }

    if (
      !["upcoming", "completed", "cancelled"].includes(updated.status)
    ) {
      throw new Error("Invalid event status.");
    }

    events[index] = updated;
    saveData(KEYS.events, events);

    return updated;
  }

  
  function deleteEvent(eventId) {
  const events = getEvents();
  const exists = events.some((event) => event.id === eventId);

  if (!exists) {
    throw new Error("Event not found.");
  }

  const relatedApplications = getApplications().filter(
    (application) => application.eventId === eventId
  );

  if (relatedApplications.length > 0) {
    throw new Error(
      "This event has applications associated with it. " +
      "Keep the event and change its status to cancelled instead."
    );
  }

  saveData(
    KEYS.events,
    events.filter((event) => event.id !== eventId)
  );
}


  // ---------- Volunteer event applications ----------

  function getEventById(eventId) {
    return getEvents().find(
      (event) => event.id === eventId
    ) || null;
  }

  function getApplicationsForUser(userId) {
    return getApplications().filter(
      (application) => application.userId === userId
    );
  }

  function applyForEvent(userId, eventId) {
    const user = getUsers().find(
      (item) => item.id === userId
    );

    if (!user || user.status !== "active") {
      throw new Error("Please log in with an active account.");
    }

    if (!["volunteer", "organization"].includes(user.role)) {
      throw new Error("This account cannot apply for events.");
    }

    const event = getEventById(eventId);

    if (!event || event.status !== "upcoming") {
      throw new Error("This event is not currently accepting applications.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(`${event.date}T00:00:00`);

    if (Number.isNaN(eventDate.getTime()) || eventDate < today) {
      throw new Error("Applications are closed for this event.");
    }

    const applications = getApplications();

    const alreadyApplied = applications.some(
      (application) =>
        application.userId === userId &&
        application.eventId === eventId
    );

    if (alreadyApplied) {
      throw new Error("You have already applied for this event.");
    }

    const application = {
      id: generateId("application"),
      userId,
      eventId,
      appliedAt: new Date().toISOString(),
      status: "pending"
    };

    applications.push(application);
    saveData(KEYS.applications, applications);

    return application;
  }
  // ---------- Admin application management ----------

function reviewApplication(applicationId, decision, adminId) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new Error("Decision must be approved or rejected.");
  }

  const applications = getApplications();

  const application = applications.find(
    (item) => item.id === applicationId
  );

  if (!application) {
    throw new Error("Application not found.");
  }

  if (application.status !== "pending") {
    throw new Error("This application has already been reviewed.");
  }

  const users = getUsers();
  const admin = users.find((user) => user.id === adminId);

  if (!admin || admin.role !== "admin") {
    throw new Error("Only an administrator can review applications.");
  }

  const event = getEventById(application.eventId);

  if (!event) {
    throw new Error("The event associated with this application was not found.");
  }

  if (decision === "approved") {
    const approvedCount = applications.filter(
      (item) =>
        item.eventId === application.eventId &&
        item.status === "approved"
    ).length;

    if (approvedCount >= Number(event.capacity)) {
      throw new Error("This event has reached its capacity.");
    }
  }

  application.status = decision;
  application.reviewedAt = new Date().toISOString();
  application.reviewedBy = adminId;

  saveData(KEYS.applications, applications);

  const notification = {
    id: generateId("notification"),
    userId: application.userId,
    title: decision === "approved"
      ? "Application approved"
      : "Application rejected",
    message: decision === "approved"
      ? `Your application for "${event.title}" has been approved.`
      : `Your application for "${event.title}" was not approved.`,
    type: decision,
    read: false,
    createdAt: new Date().toISOString()
  };

  const notifications = getNotifications();
  notifications.push(notification);
  saveData(KEYS.notifications, notifications);

  return {
    application,
    notification
  };
}
// ---------- Notification management ----------


  // ---------- Notification management ----------

  function markNotificationRead(notificationId) {
    const notifications = getNotifications();

    const updatedNotifications = notifications.map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    saveData(KEYS.notifications, updatedNotifications);

    return updatedNotifications.find(
      (notification) => notification.id === notificationId
    ) || null;
  }

  function markAllNotificationsRead() {
    const notifications = getNotifications();

    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true
    }));

    saveData(KEYS.notifications, updatedNotifications);

    return updatedNotifications;
  }

  // ---------- Seed initial sample events ----------

  function initializeDemoEvents() {
    if (localStorage.getItem(KEYS.events) !== null) return;

    const events = [
      {
        id: "event_tree",
        title: "Tree Plantation Drive",
        category: "Environment",
        date: "2026-10-25",
        location: "Hoshiarpur, Punjab",
        capacity: 20,
        description: "Help plant trees and support a greener community.",
        status: "upcoming"
      },
      {
        id: "event_teach",
        title: "Teach for Change",
        category: "Education",
        date: "2026-10-28",
        location: "Local School",
        capacity: 15,
        description: "Support children's learning and educational activities.",
        status: "upcoming"
      },
      {
        id: "event_food",
        title: "Food Distribution",
        category: "Community",
        date: "2026-11-02",
        location: "Community Center",
        capacity: 25,
        description: "Help distribute essential supplies to the community.",
        status: "upcoming"
      }
    ];

    saveData(KEYS.events, events);
  }

  async function initialize() {
    initializeDemoEvents();
    await initializeDemoAdmin();
  }

function updateVolunteerProfile(userId, changes) {
  const users = getUsers();
  const index = users.findIndex(user => user.id === userId);

  if (index === -1) {
    throw new Error("Volunteer account not found.");
  }

  if (users[index].role !== "volunteer") {
    throw new Error("Only volunteer profiles can be edited here.");
  }

  const name = String(changes.name || "").trim();

  if (name.length < 2 || name.length > 80) {
    throw new Error("Enter a name between 2 and 80 characters.");
  }

  const profileImage =
    changes.profileImage === undefined
      ? users[index].profileImage || ""
      : String(changes.profileImage || "");

  if (
    profileImage &&
    (
      !/^data:image\/(jpeg|png|webp);base64,/i.test(profileImage) ||
      profileImage.length > 1500000
    )
  ) {
    throw new Error("Invalid profile image or image is too large.");
  }

  users[index] = {
    ...users[index],
    name,
    profileImage
  };

  saveData(KEYS.users, users);

  const updatedUser = publicUser(users[index]);

  sessionStorage.setItem(
    KEYS.currentUser,
    JSON.stringify(updatedUser)
  );

  return updatedUser;
}



  // ---------- Shared public API ----------

  window.VolunConnectStorage = Object.freeze({
    keys: KEYS,
    getData,
    saveData,
    generateId,
    normalizeEmail,
    getUsers,
    getEvents,
    getApplications,
    getNotifications,
    markAllNotificationsRead,
    registerUser,
    login,
    getCurrentUser,
    logout,
    requireRole,
    initialize,
    getEventById,
    getApplicationsForUser,
    applyForEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    reviewApplication,
    markNotificationRead,
    markAllNotificationsRead,
    updateVolunteerProfile,
  });

  // Seed the demo data before the page uses it.
  window.volunConnectReady = initialize().catch((error) => {
    console.error("VolunConnect initialization failed:", error);
    throw error;
  });
})();
