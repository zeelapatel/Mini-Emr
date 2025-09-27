## Zealthy EMR (Mini-EMR)

A minimal full-stack Electronic Medical Records (EMR) starter with a React (TypeScript) frontend and a Node.js/Express backend using SQLite.

### Project Structure

```
zealthy-emr/
├── backend/           # Node.js + Express API (SQLite, JWT-ready)
├── frontend/          # React + TypeScript app (CRA)
└── .gitignore         # Ignores node_modules, .env, DB files
```


Commands (from `zealthy-emr/backend`):

```bash
npm run dev    # start with nodemon (development)
npm start      # start with node (production)
```

Environment variables (create `zealthy-emr/backend/.env`):
```env
PORT=4000
JWT_SECRET=
DATABASE_URL=./database.sqlite
```

### Frontend
- Tech: React, TypeScript, react-router-dom, axios, date-fns
- Scripts: CRA defaults

Commands (from `zealthy-emr/frontend`):

```bash
npm start      # start dev server
npm run build  # production build
```

### Getting Started
1. Backend
   - `cd zealthy-emr/backend`
   - `npm install` 
   - `npm run dev`
2. Frontend
   - `cd zealthy-emr/frontend`
   - `npm install` 
   - `npm start`

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:3000` by default.



