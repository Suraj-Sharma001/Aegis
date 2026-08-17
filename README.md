# Aegis — Phase 1: Foundation

This is the foundation layer: gateway skeleton, auth (dashboard JWT + gateway
API keys), multi-provider routing (OpenAI/Claude/Gemini/Ollama), and audit
logging. Caching, governance/PII detection, and the admin dashboard UI come
in later phases — this gives you a working, testable core to build on.

## Folder structure

```
aegis/
├── docker-compose.yml        # Postgres + Redis for local dev
├── backend/
│   ├── prisma/
│   │   └── schema.prisma     # DB models: User, Org, Application, ApiKey, ProviderKey, AuditLog
│   ├── src/
│   │   ├── config/           # env.js, prisma.js, redis.js
│   │   ├── lib/               # jwt.js, crypto.js (encrypt provider keys at rest)
│   │   ├── middleware/        # auth (JWT), apiKey (gateway), rateLimiter, errorHandler
│   │   ├── controllers/       # auth, application, gateway
│   │   ├── routes/            # auth, application, gateway
│   │   ├── services/providers/# openai/claude/gemini/ollama adapters + router
│   │   ├── utils/validators.js
│   │   ├── app.js             # Express app assembly
│   │   └── server.js          # Entry point
│   ├── package.json
│   └── .env.example
└── frontend/                  # (empty for now — Phase 2: Next.js dashboard)
```

## Setup — step by step

### 1. Start Postgres + Redis
```bash
cd aegis
docker compose up -d
```
Check they're running: `docker ps` — you should see `aegis-postgres` and `aegis-redis`.

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in at least one provider key to actually test completions
(e.g. `OPENAI_API_KEY`). Leave others blank for now — you'll get a clear
error only when you try to call that specific provider.

Generate a real `JWT_SECRET` instead of using the placeholder:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste that into `JWT_SECRET` in `.env`.

### 4. Run the database migration
This reads `prisma/schema.prisma` and creates the actual tables in Postgres.
```bash
npx prisma migrate dev --name init
```
You should see it create `User`, `Organization`, `Application`, `ApiKey`,
`ProviderKey`, `AuditLog` tables. This also auto-generates the Prisma client.

### 5. Start the server
```bash
npm run dev
```
You should see:
```
[Redis] Connected
[Aegis] Gateway running on http://localhost:8080
```

### 6. Test it end-to-end (use curl, Postman, or Thunder Client in VS Code)

**a) Register (creates your org + admin user, returns a JWT):**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Suraj","email":"suraj@test.com","password":"password123","organizationName":"Test Org"}'
```
Save the `token` from the response.

**b) Create an application (use the JWT as Bearer token):**
```bash
curl -X POST http://localhost:8080/applications \
  -H "Authorization: Bearer YOUR_JWT_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test App"}'
```
Save the `id` from the response — that's your `applicationId`.

**c) Issue a gateway API key for that application:**
```bash
curl -X POST http://localhost:8080/applications/APPLICATION_ID_HERE/keys \
  -H "Authorization: Bearer YOUR_JWT_HERE" \
  -H "Content-Type: application/json" \
  -d '{"label":"dev key"}'
```
**Save the `apiKey` from the response immediately — it's shown only once.**

**d) Call the gateway itself (this is the actual product):**
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "x-api-key: YOUR_GATEWAY_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hello in 5 words"}]}'
```

If that returns a completion, your foundation layer works end-to-end:
auth → app/key management → gateway routing → provider call → audit log.

### 7. Verify the audit log got written
```bash
npx prisma studio
```
This opens a GUI at `http://localhost:5555` — check the `AuditLog` table,
you should see a row for the request you just made.

## Useful commands
| Command | What it does |
|---|---|
| `npm run dev` | Start server with hot-reload |
| `npx prisma studio` | Visual DB browser |
| `npx prisma migrate dev --name X` | Create a new migration after schema changes |
| `docker compose down` | Stop Postgres/Redis |
| `docker compose down -v` | Stop AND wipe DB data (careful) |
| Embedding service | `uvicorn app:app --port 8001` | `Aegis/embedding-service/` |
