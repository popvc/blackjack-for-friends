# Blackjack with Friends

Multiplayer blackjack played in real-time. Players can add contacts, send invites, and join game lobbies.

## Project Structure

```
blackjack-with-friends/
├── backend/    # Bun + Express API + Socket.IO server
└── frontend/   # React + Vite SPA
```

## Tech Stack

### Shared

| Technology | Rationale |
|---|---|
| **Bun** | Faster runtime, built-in TS support without a compile step, less configuration overhead |
| **Zod** | Validation, typings, and structured response errors |

### Backend

| Technology | Rationale |
|---|---|
| **Express 5** | Simpler than Fastify with broader ecosystem support |
| **MongoDB + Mongoose** | Minimal joins, infrequent transactions, easy horizontal scaling, schema flexibility for future features |
| **Socket.IO 4** | Convenient abstraction over raw WebSockets — handles reconnection and room management without unnecessary complexity |
| **JWT** | Stateless auth; Better Auth is a future option if scope expands |
| **bcryptjs** | Password hashing |
| **Helmet / CORS / cookie-parser** | Standard security and request handling middleware |

### Frontend

| Technology | Rationale |
|---|---|
| **React 19 + Vite** | Familiarity, library support, fast dev server |
| **TypeScript** | Full-stack type safety |
| **Tailwind CSS 4 + DaisyUI 5** | Utility-first styling with pre-built accessible components |
| **Zustand** | Lightweight global state — well-suited to auth state and socket connections |
| **Axios** | Simplifies API calls and cookie-based auth handling |
| **TanStack Router** *(planned)* | Better TypeScript integration than React Router; SPA architecture preferred for real-time use |

## Development

```bash
# Backend (watch mode)
cd backend && bun run dev

# Frontend (Vite dev server)
cd frontend && bun run dev
```
