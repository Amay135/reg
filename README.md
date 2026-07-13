# RAG WhatsApp Chatbot

An AI-powered Retrieval-Augmented Generation (RAG) chatbot that enables users to ask questions through WhatsApp while providing accurate answers based on uploaded documents. The project also includes an Admin Dashboard for document management, monitoring, analytics, and conversation history.

---

## Features

- WhatsApp chatbot integration
- Retrieval-Augmented Generation (RAG)
- AI-powered document question answering
- PDF document upload and indexing
- Semantic document search
- Conversation history
- Admin Dashboard
- User management
- Knowledge base management
- Real-time monitoring
- Analytics dashboard
- REST API

---

## Technology Stack

### Frontend
- React
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js

### AI
- DeepSeek API
- Embedding Model
- Retrieval-Augmented Generation (RAG)

### Database
- MongoDB

### WhatsApp Gateway
- Baileys

---

## Project Structure

```
reg/
│
├── backend/
│   ├── src/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── services/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── assets/
│
├── docs/
│   ├── prd.md
│   └── design.md
│
└── README.md
```

---

## Dashboard Features

- Dashboard Overview
- User Management
- Document Management
- Chat History
- AI Monitoring
- Usage Analytics
- API Settings
- System Logs

---

## RAG Workflow

```
User (WhatsApp)
        │
        ▼
WhatsApp Gateway (Baileys)
        │
        ▼
Backend API
        │
        ▼
Embedding Search
        │
        ▼
Vector Database
        │
        ▼
Relevant Documents
        │
        ▼
DeepSeek API
        │
        ▼
Generated Response
        │
        ▼
WhatsApp User
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/Amay135/reg.git
```

Backend

```bash
cd backend
npm install
```

Frontend

```bash
cd frontend
npm install
```

Run backend

```bash
npm run dev
```

Run frontend

```bash
npm run dev
```

---

## Future Improvements

- Multi-user authentication
- Multiple knowledge bases
- Voice message support
- OCR document processing
- Image understanding
- Performance analytics
- Docker deployment
- Cloud deployment

---

## Author

**Amay**

Informatics Student

GitHub:
https://github.com/Amay135

---
