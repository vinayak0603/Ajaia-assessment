# Ajaia - Lightweight Collaborative Editor

A lightweight, full-stack collaborative document editor inspired by Google Docs, built for speed and seamless shared work.

## 🚀 Live Product
- **Frontend**: [https://ajaia-docs-rho.vercel.app/](https://ajaia-docs-rho.vercel.app/)
- **Backend**: [https://ajaia-backend.onrender.com/](https://ajaia-backend.onrender.com/)

---

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.IO
- **Email**: Brevo API (for OTP verification)
- **Editor**: React-Quill

---

## 💻 Local Setup & Run

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Clone & Install
```bash
# Clone the repo
git clone <your-repo-url>
cd Ajaia

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables

**Backend (`/backend/.env`)**:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
BREVO_API_KEY=your_brevo_key
EMAIL_FROM=your_email@example.com
```

**Frontend (`/client/.env.development`)**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run the App

**Start Backend**:
```bash
cd backend
npm start
```

**Start Frontend**:
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧪 Testing
The backend includes a Jest test suite.
```bash
cd backend
npm test
```
