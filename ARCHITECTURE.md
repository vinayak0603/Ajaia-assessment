# 🏛️ Architecture Note

This document summarizes the architectural decisions and system design of the Ajaia Collaborative Editor.

## System Overview
Ajaia is a MERN-stack application (MongoDB, Express, React, Node.js) with real-time capabilities via Socket.IO. The architecture is designed to prioritize data persistence and ease of collaborative workflows.

## Key Design Decisions

### 1. Separation of Concerns
- **Backend (Node/Express)**: Handles business logic, authentication (JWT), and file processing.
- **Frontend (React/Vite)**: A Single Page Application (SPA) that manages user sessions and the rich editing experience.

### 2. Real-time Collaboration (Socket.IO)
- Real-time updates are handled using **Socket.IO** rooms. Each document exists in its own room.
- Features like **Active User Presence** give collaborators immediate feedback on who is viewing the document in real-time.

### 3. Data Integrity & Persistence
- **Auto-Save**: Implemented a debounced auto-save (1.5s delay) to reduce server load while ensuring changes are persisted automatically.
- **Version History**: Each save event creates a document snapshot (version), allowing users to view and restore previous states safely.
- **File Parsing**: We offloaded heavy `.docx` parsing to the backend using `mammoth`, ensuring a smooth frontend experience even with large document imports.

### 4. Secure Authentication
- Secured using **JWT (JSON Web Tokens)** stored in the browser's local storage.
- An additional layer of security was added through **Email OTP Verification** during registration, preventing illegitimate sign-ups.

### 5. Deployment
- **Frontend**: Hosted on Vercel with SPA routing configuration (`vercel.json`).
- **Backend**: Hosted on Render with persistent database connections.
