
"use strict";

async function initializeCertificatesPage() {
  await window.volunConnectReady;

  const storage = window.VolunConnectStorage;
  const user = storage.requireRole(["volunteer"]);

  if (!user) return;

  const list = document.getElementById("certificate-list");
  const message = document.getElementById("certificate-message");

  const applications = storage.getApplicationsForUser(user.id);

  const records = applications
    .map((application) => ({
      application,
      event: storage.getEventById(application.eventId)
    }))
    .filter((record) => record.event);

  const completed = records.filter(
    ({ event }) => event.status === "completed"
  );

  const eligible = completed.filter(
    ({ application }) => application.status === "approved"
  );

  document.getElementById("certificate-completed-count").textContent =
    completed.length;

  document.getElementById("certificate-eligible-count").textContent =
    eligible.length;

  if (records.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No certificate records yet</h3>
        <p>Apply for volunteer opportunities to begin your journey.</p>
        <a href="opportunities.html" class="btn btn-primary">
          Browse Opportunities
        </a>
      </div>
    `;
    return;
  }

  list.innerHTML = records.map(({ application, event }) => {
    const isEligible =
      event.status === "completed" &&
      application.status === "approved";

    return `
      <article class="certificate-record">
        <h3>${escapeHTML(event.title)}</h3>
        <p>Event date: ${escapeHTML(formatDate(event.date))}</p>
        <p>Application status: ${escapeHTML(application.status)}</p>
        <span class="certificate-status">
          ${isEligible ? "Eligible" : "Not yet eligible"}
        </span>
        ${
          isEligible
            ? `<p>
                <button
                  type="button"
                  class="btn btn-primary"
                  data-print-certificate="${escapeHTML(event.id)}">
                  View / Print Certificate
                </button>
              </p>`
            : `<p>
                A certificate becomes available when the event is marked
                completed and your application is approved.
              </p>`
        }
      </article>
    `;
  }).join("");

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-print-certificate]");
    if (!button) return;

    const eventId = button.dataset.printCertificate;

    const record = eligible.find(
      ({ event }) => event.id === eventId
    );

    if (!record) {
      message.textContent = "This certificate is not available.";
      return;
    }

    const certificateWindow = window.open("", "_blank");

    if (!certificateWindow) {
      message.textContent =
        "Please allow pop-ups to view or print your certificate.";
      return;
    }

    const volunteerName = escapeHTML(user.name);
    const eventTitle = escapeHTML(record.event.title);
    const eventDate = escapeHTML(formatDate(record.event.date));

    certificateWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Volunteering Certificate</title>
        <style>
          body {
            margin: 0;
            padding: 30px;
            font-family: Georgia, serif;
            color: #17324f;
          }
          .certificate {
            max-width: 900px;
            margin: 30px auto;
            padding: 55px 35px;
            border: 8px double #0d9488;
            text-align: center;
          }
          h1 { font-size: 38px; }
          h2 { font-size: 30px; }
          p { font-size: 18px; line-height: 1.8; }
          .name {
            font-size: 32px;
            font-weight: bold;
            border-bottom: 1px solid #0d9488;
            display: inline-block;
            padding: 10px 25px;
          }
          @media print {
            body { padding: 0; }
            .certificate { margin: 0; min-height: 80vh; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <main class="certificate">
          <h1>VolunConnect</h1>
          <h2>Certificate of Volunteering</h2>
          <p>This certificate is presented to</p>
          <div class="name">${volunteerName}</div>
          <p>
            In recognition of an approved volunteering application for
            <strong>${eventTitle}</strong>, an event recorded as completed.
          </p>
          <p>Event date: ${eventDate}</p>
          <p>Issued by VolunConnect</p>
          <button onclick="window.print()">Print / Save as PDF</button>
        </main>
      </body>
      </html>
    `);

    certificateWindow.document.close();
  });
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

initializeCertificatesPage().catch((error) => {
  console.error("Certificates page failed to load:", error);
  const list = document.getElementById("certificate-list");
  if (list) {
    list.innerHTML =
      "<p>Unable to load certificates. Please refresh the page.</p>";
  }
});
