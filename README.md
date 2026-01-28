# R&D Inventory Management System

This is a web-based inventory management system designed for R&D teams to efficiently track and manage electronic components. The application is built with React and Firebase, providing a real-time, secure, and scalable solution.

## Features

- **Component Management:** Add, edit, and delete electronic components from the inventory.
- **Project Tracking:** Create and manage R&D projects, each with its own bill of materials (BOM).
- **BOM Management:** Easily associate components with projects and manage the required quantities.
- **Inventory Control:** Real-time updates to component stock levels as they are used in production runs.
- **Transaction Logging:** A complete history of all component movements, providing a full audit trail.
- **User Authentication:** Secure user authentication with different access levels for regular users, admins, and special users.
- **Search and Filtering:** Quickly find components and projects.
- **Data Export:** Export BOMs and other data to Excel.

## Tech Stack

- **Frontend:** React, React Router, Material-UI
- **Backend:** Firebase (Firestore, Authentication, Hosting)
- **Build Tool:** Vite
- **Languages:** JavaScript (ES6+), CSS

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm installed
- A Firebase project set up

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/your_project_name.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create a `.env` file in the root of the project and add your Firebase project configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Run the development server
   ```sh
   npm run dev
   ```

## Deployment

This project is deployed using Firebase Hosting. To deploy the application, run the following commands:

```sh
npm run build
firebase deploy
```

## Authentication

The application has three user roles:

- **Regular User:** Can view and manage projects, components, and transactions.
- **Admin:** Has all the permissions of a regular user, plus the ability to manage the component catalog.
- **Special User:** A user with the email address `pvsaikishen@gmail.com` who has restricted access to only the "Orders" and "Orders List" pages.
