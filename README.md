# Ajaia assessment - Lightweight Collaborative Editor

A lightweight, full-stack collaborative document editor inspired by Google Docs, designed for speed and productivity on shared work.

## Core Features
1. **Rich Document Editing**: Powered by Quill, featuring text formatting (bold, italic, lists, headers).
2. **File Imports**: Seamlessly upload and instantly parse `.txt`, `.md`, and **`.docx`** files into your workspace directly using backend parsing capabilities via `mammoth`.
3. **Collaboration & Sharing**: Share documents by simply typing a username. Real-time active presence indicators track who is actively reading the document using `socket.io`.
4. **Commenting & Versioning**: Leave document-level comments in a sidebar, and view auto-saved version history. Previous states of documents can be restored directly from the UI.
5. **Exporting Tools**: Download your live documents as native Markdown files or export them cleanly to PDF format.

## Architecture & Prioritization Notes
- **State Management & Communication**: We opted for a localized, reactive React context to maximize speed. While Operational Transformation (OT - like Y.js) is standard for raw multiplayer text manipulation, the required timebox prioritized shipping *functional* features over conflict resolution protocols. To fulfill the collaboration requirements, we utilized `Socket.IO` rooms for real-time presence awareness instead of real-time text sync, allowing users to coordinate editing.
- **Persistence**: MongoDB was chosen for flexibility. It natively supports simple array updates perfect for `versions` and `comments` lists within documents without heavily relational JOIN overheads.
- **Auto-Save Methodology**: Implemented a debounced auto-save in the Editor React component (triggering 1.5 seconds after typing). This drastically reduces the number of RESTful `PUT` calls to the Express backend compared to every keystroke, keeping the Node Event Loop lightweight.
- **File Ingress**: `.docx` reading is isolated in a separate Node endpoint leveraging `multer` + `mammoth`, keeping arbitrary and heavy XML-parsing memory off the active frontend client. 

## Run Instructions

You will need `Node.js` installed. 

### 1. Setup Backend
Open a terminal in the `/backend` directory:
```bash
cd backend
npm install
# Set up environment variables
echo "MONGO_URI=your_mongo_connection_string" > .env 
npm start
```
*Note: A sandbox MongoDB cluster might have been left running in the `.env` context for reviewability.*

### 2. Setup Client
Open a terminal in the `/client` directory:
```bash
cd client
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.

## Automated Testing
The API comes with an extensive Jest suite to validate models and routes.
Inside the `/backend` directory run:
```bash
npm run test
```
*This utilizes `mongodb-memory-server` to mock the remote database offline seamlessly.*
