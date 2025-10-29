# Agents API

A production-ready Express.js backend API for building AI agents with RAG (Retrieval-Augmented Generation), tool calling, and streaming chat capabilities.

## ✨ Features

- 🤖 **AI Agent Management** - Create, configure, and manage multiple AI agents
- 💬 **Streaming Chat** - Real-time token-by-token streaming with Server-Sent Events (SSE)
- 📚 **RAG System** - Vector search with document embeddings using pgvector
- 🔌 **OpenAPI Integration** - Connect external APIs as AI tools
- 🔗 **MCP Support** - Model Context Protocol for advanced integrations
- 📄 **Document Processing** - Automatic chunking, embedding, and semantic search
- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 🏗️ **TypeScript** - Full type safety throughout the codebase
- 🔄 **LangChain Integration** - Agentic AI workflows with tool calling

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express.js |
| **Database** | PostgreSQL with pgvector extension |
| **ORM** | Prisma |
| **AI/ML** | OpenAI API + LangChain |
| **Auth** | JWT + bcryptjs |
| **File Processing** | Multer + pdf-parse |
| **Streaming** | Server-Sent Events (SSE) |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ with pgvector extension
- **OpenAI API Key**

### 1. Install dependencies

```bash
npm install
```

### 2. Database Setup

Start PostgreSQL with Docker

```bash
docker-compose up -d
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update `.env` with your values

### 4. Database Migrations

Run database migrations:

```bash
npm run prisma:migrate
```

### 5. Start the Server

Development mode with hot-reload:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## 📁 Project Structure

```bash
agents-api/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── config.ts             # Configuration management
│   ├── error.ts              # Error handling utilities
│   ├── types.d.ts            # TypeScript type definitions
│   │
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   │
│   ├── routers/
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── agents.ts         # Agent CRUD + chat endpoints
│   │   └── users.ts          # User management endpoints
│   │
│   ├── services/
│   │   ├── database.ts       # Prisma client singleton
│   │   └── embeddings.ts     # Vector embeddings service
│   │
│   ├── tools/
│   │   └── doc_search.ts     # RAG document search tool
│   │
│   └── utils/
│       ├── jwt.ts            # JWT token utilities
│       ├── openapi.ts        # OpenAPI parser & tools
│       └── text.ts           # Text processing utilities
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
│
├── docker-compose.yml        # PostgreSQL + pgvector
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |

### Database Management

**View database:**

```bash
npm run prisma:studio
```

**Create migration:**

```bash
npm run prisma:migrate
```

**Reset database:**

```bash
npx prisma migrate reset
```

## ⚙️ Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3001` |
| `CORS_ORIGIN` | CORS allowed origins | No | `*` |
| `JWT_SECRET` | JWT signing secret | **Yes** | - |
| `JWT_EXPIRES_IN` | Token expiration time | No | `1d` |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | - |
| `OPENAI_API_KEY` | OpenAI API key | **Yes** | - |
| `OPENAI_EMBEDDINGS_MODEL` | Embeddings model | No | `text-embedding-3-small` |
| `OPENAI_LLM_MODEL` | LLM model | No | `gpt-4o` |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### ⚠️ Important Prerequisites

**Users must already exist in the database before they can set a password or sign in.**

The authentication system assumes users are pre-created (e.g., through a separate admin process or user management system). The API only handles password creation and authentication for existing users.

### Authentication Flow

The authentication process requires a multi-step flow:

```bash
1. User exists in DB → 2. Check user → 3. Set password → 4. Sign in → 5. Use token
```

**Step-by-step process:**

1. **User Pre-exists** - User record must exist in database (with email, firstName, lastName)
2. **Check User** - Verify user exists and check if they have a password set
3. **Set Password** - If user has NO password, set one (first-time password setup)
4. **Sign In** - If user has password, validate credentials and receive JWT token
5. **Access Protected Routes** - Use the token in authenticated requests

### Auth Endpoints

**Base URL:** `http://localhost:3001/api/auth`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/check-user` | POST | Check if user exists and has password | No |
| `/create-password` | POST | Set password for existing user (without password) | No |
| `/validate-password` | POST | Sign in with email/password | No |
| `/user` | GET | Get current authenticated user info | Yes |

### Complete Authentication Flow

#### 1. Check if User Exists

First, verify the user exists in the database and check if they have a password:

```bash
curl -X POST http://localhost:3001/api/auth/check-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**

```json
{
  "hasPassword": false
}
```

> **Note:** If the user doesn't exist in the database, this endpoint will return a `404 NOT_FOUND` error.

#### 2. Set Password (First-Time Setup)

If the user exists but `hasPassword: false`, set their password:

```bash
curl -X POST http://localhost:3001/api/auth/create-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-secure-password"
  }'
```

**Requirements:**

- User must exist in database
- User must NOT already have a password
- Password must be at least 8 characters

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Important:** This endpoint does NOT create new users. It only sets a password for existing users who don't have one yet. You receive a JWT token immediately after setting the password.

#### 3. Sign In (Existing Users)

For users who already have a password, sign in with credentials:

```bash
curl -X POST http://localhost:3001/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-secure-password"
  }'
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Using the JWT Token

Include the JWT token in the `Authorization` header for all protected endpoints:

```bash
curl http://localhost:3001/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Token Configuration

- **`JWT_SECRET`** - Secret key for signing tokens (required, set in `.env`)
- **`JWT_EXPIRES_IN`** - Token expiration time (default: `1d`)
- Tokens are stateless and contain user ID and email
- All endpoints except `/api/auth/*` require valid JWT token

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Built with ❤️ using Express, TypeScript, LangChain, and OpenAI
