# EventHub Node.js backend

## 1) Install
```bash
npm install
```

## 2) Create `.env`
Copy `.env.example` to `.env` and update `DATABASE_URL`.

## 3) Run
```bash
npm run dev
```

## 4) Endpoints
- GET `/api/v1/health`
- GET `/api/v1/events`
- GET `/api/v1/events/:id`
- POST `/api/v1/events`
- PUT/PATCH `/api/v1/events/:id`
- DELETE `/api/v1/events/:id`
- GET `/api/v1/participants`
- GET `/api/v1/participants/:user_id`
- GET `/api/v1/participants/:user_id/events`
- POST `/api/v1/participants`
- PUT/PATCH `/api/v1/participants/:user_id`
- DELETE `/api/v1/participants/:user_id`
