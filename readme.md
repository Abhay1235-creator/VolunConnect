# VolunConnect — Volunteer Management System

## 1. Project Overview

VolunConnect is a web-based volunteer management platform designed to connect volunteers with community events and opportunities. It provides a central interface for volunteers to explore opportunities, submit applications, track application statuses, manage their profiles, and view eligible certificates.

Administrators can manage events, review applications, oversee volunteer information, view notifications, and access reports.

## 2. Objectives

- Simplify volunteer registration and login.
- Help volunteers discover and apply for opportunities.
- Enable administrators to manage events and applications.
- Provide application status tracking and notifications.
- Display dashboard statistics and administrative reports.
- Support certificate eligibility checks for completed events.

## 3. Technology Stack

- **HTML5:** Page structure and content.
- **CSS3:** Styling and responsive layouts.
- **JavaScript:** Client-side functionality and application logic.
- **localStorage:** Persistent browser-side application data.
- **sessionStorage:** Current-session information.

## 4. Main Features

### Volunteer
- Register and log in.
- Browse volunteer opportunities.
- View event details and apply.
- Track applications.
- View and update profile information.
- Read notifications.
- Check certificate eligibility and print eligible certificates.

### Administrator
- View administrative dashboard statistics.
- Create and manage events.
- Review and update application statuses.
- Manage volunteer information.
- View notifications.
- Review reports and application analytics.

## 5. Project Structure

The project includes HTML pages for the home page, authentication, volunteer dashboard, opportunities, applications, event details, profile, certificates, administration, event management, volunteer management, notifications, and reports.

Supporting files include:

- `css/style.css`
- `css/dashboard.css`
- `css/admin.css`
- `css/volunteer.css`
- `storage.js`
- `script.js`
- `profile.js`
- `certificates.js`

The exact files present in the project folder determine the final structure.

## 6. How to Run

1. Open the project folder in Visual Studio Code.
2. Install the Live Server extension if it is not already installed.
3. Open `index.html`.
4. Select **Open with Live Server**.
5. Use the website navigation to explore the application.

Use the application's registration and login flow to test volunteer features. Use a designated administrator account to test administrative features.

## 7. Testing

Test the following workflows before submission:

1. Volunteer registration and login.
2. Profile updates and persistence after refresh.
3. Browsing opportunities and submitting applications.
4. Administrative approval or rejection of applications.
5. Notification display and read status.
6. Dashboard statistics and report calculations.
7. Certificate eligibility for approved applications associated with completed events.
8. Navigation, responsive layouts, and browser-console errors.

Record any remaining defects and fix them before presenting the project.

## 8. Limitations

This version uses browser-side storage and JavaScript-based role checks. It is a prototype rather than a production-secure multi-user application.

- Data is not synchronised across different users' devices.
- Browser storage can be cleared or modified.
- Client-side authentication and authorization can be bypassed.
- A production deployment would require a secure backend, server-side authorization, appropriate password hashing, database storage, and further security testing.

## 9. Future Enhancements

- Integrate a backend API and central database.
- Implement secure authentication and server-side role permissions.
- Add email notifications.
- Improve certificate generation and verification.
- Add advanced event filtering and analytics.
- Deploy the application to a production hosting platform.

## 10. Conclusion

VolunConnect demonstrates a volunteer management workflow using web technologies. It combines volunteer-facing features with administrative tools and provides a foundation for future development into a secure, database-backed platform.
