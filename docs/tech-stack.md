# Wanderlist — Tech Stack Decision Document

> **Date:** May 18, 2026  
> **Status:** Finalized  
> **Scope:** CMPE 285 Final Exam Project

---

## 1. Architecture Overview

```
┌─────────────────────────────────────┐
│           Frontend (React/Vite)     │
│  ┌───────────┐  ┌────────────────┐  │
│  │ SwipeView │  │ ResultsView    │  │
│  │ (Cards +  │  │ (Leaderboard + │  │
│  │  Gestures)│  │  Analytics)    │  │
│  └─────┬─────┘  └───────┬────────┘  │
│        │    fetch API   │           │
└────────┼────────────────┼───────────┘
         │                │
    ─────▼────────────────▼─────
    │    FastAPI Backend       │
    │  ┌──────┐ ┌───────────┐  │
    │  │Routes│ │Pydantic   │  │
    │  │      │ │Validation │  │
    │  └──┬───┘ └───────────┘  │
    │     │                    │
    │  ┌──▼──────────────┐     │
    │  │ SQLAlchemy ORM  │     │
    │  │  + aiosqlite    │     │
    │  └──┬──────────────┘     │
    │     │                    │
    │  ┌──▼──────────────┐     │
    │  │  SQLite DB      │     │
    │  └─────────────────┘     │
    ────────────────────────────
```

The app follows a clean **client-server** split per deliverable requirements (§4.1): distinct `/frontend` and `/backend` directories.

---

## 2. Backend Stack

> **Locked in by requirements (§3.2):** FastAPI + SQLite

| Component        | Technology              | Rationale |
|------------------|-------------------------|-----------|
| **Framework**    | FastAPI                 | Required by §3.2. Async-first, auto-generates OpenAPI docs, native Pydantic integration. |
| **Database**     | SQLite                  | Required by §3.2. Zero-config, file-based, perfect for single-server academic project. |
| **ORM**          | SQLAlchemy 2.0 (async)  | Industry-standard Python ORM. Async mode via `aiosqlite` keeps the FastAPI event loop non-blocking. |
| **Validation**   | Pydantic v2             | Required by §3.2. Ships with FastAPI. Strict schema models for all request/response payloads. |
| **Auth**         | `passlib[bcrypt]` + `python-jose[cryptography]` (JWT) | Lightweight user auth — passwords hashed with bcrypt, sessions managed via JWT tokens. Supports the stretch goal of persistent user identity (§2.2). |
| **ASGI Server**  | Uvicorn                 | Standard production server for FastAPI. |
| **CORS**         | FastAPI `CORSMiddleware` | Required since frontend and backend run on separate ports during development. |

### API Endpoints (from §3.2)

| Method | Route        | Purpose |
|--------|-------------|---------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login`    | Authenticate and receive JWT |
| `GET`  | `/items`         | Fetch the deck of destinations |
| `POST` | `/vote`          | Record a vote: `{ itemId, choice, userId, decision_time_ms }` |
| `DELETE`| `/vote/undo`    | Undo the last swipe (stretch goal §2.2) |
| `GET`  | `/results`       | Global aggregated vote metrics |
| `GET`  | `/results/me`    | Current user's personal vote history |

---

## 3. Frontend Stack

| Component        | Technology              | Rationale |
|------------------|-------------------------|-----------|
| **Framework**    | React 18                | Component model maps naturally to the app's UI (SwipeCard, CardDeck, ResultsDashboard). Rich ecosystem for gestures. |
| **Build Tool**   | Vite                    | Near-instant HMR, zero-config, tiny production bundles. Far faster dev loop than CRA/Webpack. |
| **Styling**      | Vanilla CSS             | Full control over animations, gradients, glassmorphism, and premium polish needed for UX rubric (15 pts). No framework overhead. |
| **Gestures & Animation** | Framer Motion   | Single library for both drag gestures AND animations. See §3.1 below for detailed reasoning. |
| **HTTP Client**  | Native `fetch` API      | Only 3-4 endpoints; no need for axios overhead. |
| **Routing**      | None (conditional rendering) | Only 2 views (swipe + results). Tab/state-based switching keeps it simple and aligns with the vertical-slice development strategy (§6). |
| **Typography**   | Google Fonts (Inter)    | Clean, modern, highly legible on mobile viewports. |

### 3.1 Why Framer Motion (over @use-gesture + react-spring)

The requirements demand rich gesture interactions (§2.1): card tilt, color overlay, threshold indicators, and smooth exit transitions. We evaluated two options:

| Factor | Framer Motion | @use-gesture + react-spring |
|--------|--------------|----------------------------|
| **Dependencies** | 1 library | 2 libraries to coordinate |
| **Drag gestures** | Built-in (`drag="x"`) | Requires manual binding to spring values |
| **Exit animations** | `AnimatePresence` handles unmount animations natively | No equivalent — requires hacky workarounds for card fly-off |
| **Card tilt effect** | `useMotionValue` + `useTransform` (~3 lines) | Manual interpolation mapping (~15+ lines) |
| **Elastic drag feel** | `dragElastic` prop | Must configure spring tension/friction manually |
| **API style** | Declarative (JSX props) | Imperative (`api.start()` calls) |
| **Boilerplate** | Minimal | ~2x more code for equivalent result |

**Decision:** Framer Motion. The `AnimatePresence` component alone is worth it — it solves the hardest UX problem (animating cards *out* of the DOM on swipe) in one wrapper. Single dependency, less code, better result.

---

## 4. User Authentication Strategy

The requirements mention anonymous session IDs as minimum (§2.2), but we are implementing **full lightweight auth** for these reasons:

1. **Vote integrity** — Session IDs can be cleared/regenerated, allowing the same person to vote repeatedly. Username-based auth ties votes to a real identity.
2. **Data persistence** — Users can return days later and see their personal vote history, which items they've already rated, and resume where they left off.
3. **Analytics** — Per-user decision-time metrics (stretch goal §2.2) become meaningful when tied to an account.

### Auth Flow
```
Register -> POST /auth/register { username, password }
                |
Login    -> POST /auth/login { username, password }
                | (returns JWT)
Requests -> Authorization: Bearer <token>
                |
Backend  -> Decode JWT -> extract userId -> tie votes to user
```

- Passwords hashed with **bcrypt** (never stored in plaintext)
- JWT tokens stored in **localStorage** on the client
- Token expiry set to **7 days** (reasonable for an academic project)

---

## 5. Data Layer Design

### Database Tables (SQLite)

```sql
-- Users table (auth)
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,  -- bcrypt hash
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destinations (seeded from dataset)
CREATE TABLE items (
    id          INTEGER PRIMARY KEY,
    label       TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url   TEXT NOT NULL,
    category    TEXT
);

-- Votes (one per user per item — enforced by UNIQUE constraint)
CREATE TABLE votes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    item_id         INTEGER NOT NULL REFERENCES items(id),
    choice          TEXT NOT NULL CHECK(choice IN ('yes', 'no')),
    decision_time_ms INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)  -- §3.2 idempotency: upsert, never double-count
);
```

The `UNIQUE(user_id, item_id)` constraint enforces the deduplication requirement (§3.2) at the database level. Votes use `INSERT ... ON CONFLICT REPLACE` (upsert) semantics.

---

## 6. Development Strategy

Following §6 — **Vertical Slice First**:

```
Phase 1: Single Item End-to-End
  Seed 3 items -> GET /items -> Render 1 card -> Swipe -> POST /vote -> GET /results

Phase 2: Core Completion
  Scale to 100+ items -> Full swipe deck -> Results dashboard with sort/filter

Phase 3: Auth & Stretch Goals
  User registration/login -> Personal history -> Undo mechanic -> Decision analytics

Phase 4: Polish
  Animations -> Glassmorphism -> Typography -> Mobile viewport tuning -> End-of-deck state
```

---

## 7. Project Structure

```
wanderlist/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── routes/
│   │   ├── items.py         # GET /items
│   │   ├── votes.py         # POST /vote, DELETE /vote/undo, GET /results
│   │   └── auth.py          # POST /auth/register, POST /auth/login
│   ├── seed.py              # Populate 100+ destinations into SQLite
│   ├── requirements.txt     # Python dependencies
│   └── wanderlist.db        # SQLite database file (gitignored)
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Root component + view switching
│   │   ├── components/
│   │   │   ├── SwipeCard.jsx
│   │   │   ├── CardDeck.jsx
│   │   │   ├── ResultsDashboard.jsx
│   │   │   ├── EndOfDeck.jsx
│   │   │   └── AuthForm.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── api/
│   │   │   └── client.js    # fetch wrapper with JWT headers
│   │   └── styles/
│   │       ├── index.css    # Global styles + design tokens
│   │       └── components/  # Per-component CSS files
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── requirements.md
│   ├── tech-stack.md         # This document
│   ├── AI_NOTES.md
│   └── README.md
│
└── README.md                 # Root-level quickstart
```

---

## 8. Dependency Summary

### Backend (`requirements.txt`)
```
fastapi>=0.110
uvicorn[standard]>=0.29
sqlalchemy>=2.0
aiosqlite>=0.20
pydantic>=2.0
passlib[bcrypt]>=1.7
python-jose[cryptography]>=3.3
python-multipart>=0.0.9
```

### Frontend (`package.json` dependencies)
```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "framer-motion": "^11.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0",
    "vite": "^5.0"
  }
}
```

Intentionally minimal. No state management library (React hooks suffice), no CSS framework, no HTTP client library.
