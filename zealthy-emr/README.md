## Zealthy EMR (Mini-EMR)

A minimal full-stack Electronic Medical Records (EMR) starter with a React (TypeScript) frontend and a Node.js/Express backend using Prisma + Postgres (Neon/Render friendly).

### Project Structure

```
zealthy-emr/
├── backend/           # Node.js + Express API (Prisma + Postgres, JWT-ready)
├── frontend/          # React + TypeScript app (CRA)
└── .gitignore         # Ignores node_modules, .env, DB files
```


### Backend
Tech: Express, Prisma, Postgres, CORS, dotenv, bcrypt, jsonwebtoken, date-fns

Commands (from `zealthy-emr/backend`):

```bash
npm run dev    # start with nodemon (development)
npm start      # start with node (production)
```

Environment variables (create `zealthy-emr/backend/.env`):
```env
PORT=5000
JWT_SECRET=change_me
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
FRONTEND_ORIGIN=http://localhost:3000
```

Prisma commands:
```bash
npx prisma generate
npx prisma migrate deploy        # or: npx prisma migrate dev --name init (local)
npx prisma db seed               # seeds users, appointments, prescriptions
```

### Frontend
- Tech: React, TypeScript, react-router-dom, axios, date-fns
- Scripts: CRA defaults

Commands (from `zealthy-emr/frontend`):

```bash
npm start      # start dev server
npm run build  # production build
```

### Getting Started (Local)
1) Backend
   - `cd zealthy-emr/backend`
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
   - `npx prisma db seed`
   - `npm run dev`
2) Frontend
   - `cd zealthy-emr/frontend`
   - `npm install`
   - (optional) create `.env` with `REACT_APP_API_BASE=http://localhost:5000/api`
   - `npm start`

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:3000` by default.

### Deployment
- Backend (Render): set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`; run `npm start`; use Prisma `migrate deploy` and `db seed`.
- Frontend (Netlify): set `REACT_APP_API_BASE` to your backend `/api` URL.

### Credentials (seed)
- mark@some-email-provider.net / Password123!
- lisa@some-email-provider.net / Password123!



