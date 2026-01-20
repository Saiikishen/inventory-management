
# R&D Inventory Management System Blueprint

## 1. Overview

This document outlines the design and features of the R&D Inventory Management System. The application is a web-based tool built with React and Firebase, designed to help R&D teams track and manage electronic components efficiently.

## 2. Core Features & Design

### **Component Management**

*   **Component ID:** A unique identifier is automatically generated for each component based on its properties.
    *   **Format:** `CATEGORY-NAME-VALUE-FOOTPRINT-TOLERANCE`
    *   **Logic:** The ID is always in uppercase, with fields separated by hyphens.
*   **Fields:**
    *   Category (Required, Uppercase)
    *   Name (Required)
    *   Value
    *   Footprint
    *   Tolerance
    *   Manufacturer
    *   Quantity
    *   Stock Location
    *   Pricing
*   **Actions:**
    *   **Add:** Add new components to the inventory.
    *   **Delete:** Remove components from the inventory.
    *   **Edit:** Update the quantity and pricing of existing components.

### **Stock Location Management**

*   **Concept:** Components can be assigned to specific stock locations, representing different storage areas within the company.
*   **Inline Creation:** New stock locations can be created directly from the "Add Component" form dropdown.
*   **Inline Deletion:** Stock locations can be deleted from a UI that appears when the user selects "Remove a location..." from the dropdown.
    *   **Deletion Constraint:** A location cannot be deleted if it is currently assigned to any component.
*   **`stock_locations` Collection:** A dedicated Firestore collection to manage the list of available stock locations.

### **Styling & UI**

*   **Layout:** A clean, modern, and mobile-responsive single-page application layout.
*   **Styling:** Custom CSS for a unique and polished look and feel, including a custom color scheme, responsive tables, and interactive elements.
*   **Feedback:** A snackbar notification system provides users with clear feedback on the success or failure of their actions.

## 3. Current Implementation Plan

*   **Objective:** Add an edit button to update the quantity and pricing of a component.
*   **Steps:**
    1.  Add an "Edit" button to each row in the component list.
    2.  Create a modal or inline editing UI that appears when the "Edit" button is clicked.
    3.  Pre-fill the form with the current quantity and pricing of the component.
    4.  Update the component document in Firestore with the new values when the user saves the changes.
