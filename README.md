# Aegis - Enterprise AI Gateway & Governance Platform

**Production-ready AI gateway with multi-provider routing, semantic caching, PII detection, and cost tracking.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multi-Provider Routing** - Unified API for OpenAI, Claude, Gemini, Grok, and Ollama
- **Semantic Caching** - Hybrid embedding + keyword matching (98.5% latency reduction)
- **PII Firewall** - Production-grade governance with Luhn validation for credit cards
- **Cost Tracking** - Real-time USD cost calculation per request
- **Team-Based Access** - RBAC with Admin/Developer/Viewer roles
- **Audit Logging** - Full request/response logging with analytics
- **BYOK** - Bring Your Own Keys (encrypted at rest)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose
- Python 3.9+ (for embedding service)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd aegis

# Start PostgreSQL + Redis
docker compose up -d

# Install backend
cd backend
npm install
cp .env.example .env

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to JWT_SECRET in .env

# Run database migration
npx prisma migrate deploy
npx prisma generate

# Start backend
npm run dev
```

### 2. Set Up Embedding Service

```bash
cd embedding-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --port 8001
```

### 3. Install Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and register an account.

---

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegis"
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="<generate-with-crypto.randomBytes(32).toString('hex')>"
JWT_EXPIRES_IN="7d"

# Embedding Service
EMBEDDING_SERVICE_URL="http://localhost:8001"

# Provider Keys (BYOK - add your own)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
XAI_API_KEY=""
OLLAMA_BASE_URL="http://localhost:11434"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Server
PORT=8080
NODE_ENV="production"
```

---

## Architecture

```
┌─────────────┐
│   Client    │
│ Application │
└──────┬──────┘
       │ x-api-key: aegis_...
       ▼
┌─────────────────────────────────────────┐
│          AEGIS GATEWAY                  │
│  ┌─────────────────────────────────┐   │
│  │  1. PII Detection & Governance  │   │
│  └──────────────┬──────────────────┘   │
│                 ▼                       │
│  ┌─────────────────────────────────┐   │
│  │  2. Semantic Cache Check        │   │
│  │     (Embedding + Keywords)      │   │
│  └──────────────┬──────────────────┘   │
│                 ▼                       │
│  ┌─────────────────────────────────┐   │
│  │  3. Provider Routing            │   │
│  │     • OpenAI (gpt-*, o1-*)      │   │
│  │     • Claude (claude-*)         │   │
│  │     • Gemini (gemini-*)         │   │
│  │     • Grok (grok-*)             │   │
│  │     • Ollama (local models)     │   │
│  └──────────────┬──────────────────┘   │
│                 ▼                       │
│  ┌─────────────────────────────────┐   │
│  │  4. Cost Tracking & Logging     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## API Reference

### Authentication

**Register:**
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "secure123",
  "organizationName": "Acme Corp"
}
```

**Login:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "secure123"
}
```

### Gateway

**Chat Completion:**
```bash
POST /v1/chat/completions
x-api-key: aegis_<your-key>
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

**Response:**
```json
{
  "model": "gpt-4o-mini",
  "provider": "OPENAI",
  "content": "Hello! How can I help you?",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 7,
    "total_tokens": 15
  },
  "latency_ms": 1408,
  "cache_hit": false,
  "cost_usd": 0.000031
}
```

---

## Governance / PII Detection

The gateway blocks requests containing:

- **Email addresses**
- **Phone numbers** (international formats)
- **Credit card numbers** (with Luhn validation)
- **SSNs** (US format: XXX-XX-XXXX)
- **Aadhaar numbers** (Indian 12-digit ID)
- **API keys** (OpenAI, Anthropic, AWS, Google, GitHub)
- **Generic secrets** (api_key=..., token=...)
- **IP addresses**

**Blocked Response:**
```json
{
  "error": "Request blocked by governance policy",
  "reason": "The prompt contains sensitive data",
  "findings": [
    {
      "type": "EMAIL",
      "label": "Email address",
      "preview": "joh***com",
      "severity": "HIGH"
    }
  ]
}
```

---

## Deployment

### Docker Production Build

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Run in production
docker compose -f docker-compose.prod.yml up -d
```

### Environment Checklist

- [ ] Generate strong `JWT_SECRET` (32+ bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Configure provider API keys (BYOK)
- [ ] Set up SSL/TLS termination (nginx/Cloudflare)
- [ ] Enable rate limiting per your needs
- [ ] Back up PostgreSQL regularly
- [ ] Monitor Redis memory usage
- [ ] Review PII detection patterns for your use case

---

## Development

```bash
# Backend
cd backend
npm run dev          # Start with nodemon
npm test             # Run tests
npx prisma studio    # DB GUI

# Frontend
cd frontend
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint

# Embedding Service
cd embedding-service
uvicorn app:app --reload --port 8001
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL 15+ |
| **Cache** | Redis 7+ |
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI + Tailwind) |
| **Embedding** | Python, sentence-transformers (BAAI/bge-base-en-v1.5) |
| **Providers** | OpenAI, Anthropic, Google Gemini, xAI (Grok), Ollama |

---

## Database Schema

```prisma
model Organization {
  id           String        @id @default(uuid())
  name         String
  users        User[]
  applications Application[]
  providerKeys ProviderKey[]
  teams        Team[]
}

model Application {
  id             String     @id @default(uuid())
  name           String
  organizationId String
  teamId         String?
  apiKeys        ApiKey[]
  auditLogs      AuditLog[]
}

model AuditLog {
  id               String        @id @default(uuid())
  applicationId    String
  provider         Provider
  model            String
  status           RequestStatus // SUCCESS, ERROR, CACHED, BLOCKED
  promptTokens     Int
  completionTokens Int
  latencyMs        Int
  costUsd          Float
  cacheHit         Boolean
  createdAt        DateTime      @default(now())
}
```

---

## Roadmap

- [x] Multi-provider routing
- [x] Semantic caching (hybrid embedding + keyword)
- [x] PII detection & governance
- [x] Team-based RBAC
- [x] Production-grade UI (shadcn/ui)
- [ ] Streaming support (SSE)
- [ ] Webhooks for events
- [ ] Budget limits & alerts
- [ ] Custom governance rules per app
- [ ] Request replay for debugging
- [ ] SDK libraries (Python, Node.js, Go)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/Suraj-Sharma001/aegis/issues)
- **Email:** surajsharma60923@gmail.com

---

**Built with ❤️ for enterprise AI teams**
