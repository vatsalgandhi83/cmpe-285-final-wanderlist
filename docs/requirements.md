# CMPE 285 Final Exam Project: Wanderlist

## 1. Project Overview
**Wanderlist** is a mobile-first, AI-assisted travel consensus web application. Users swipe through a curated deck of global destinations to cast binary "yes" (want to visit) or "no" (skip) votes. The app aggregates these raw micro-interactions into global crowd-sourced analytics, generating a definitive community travel leaderboard.

---

## 2. Functional Requirements

### 2.1 Core (Must Have)
*   **Theme:** Global Travel Destinations (Wanderlist).
*   **Dataset:** At least 100 distinct travel items to vote on. Every item must contain a stable ID, a display label, a short description, and a high-quality, responsive public image URL (via Unsplash).
*   **Swipe-Card UI:**
    *   Swipe Right (or tap a prominent "Yes" button) records a positive vote.
    *   Swipe Left (or tap a prominent "No" button) records a negative vote.
    *   **Visual Feedback:** Real-time feedback during gestures (card tilt, color overlay tint hint, and clear threshold indicators).
    *   **Transitions:** Smooth, fluid animations moving to the next card instantly after a vote is registered.
*   **Results View:** Reachable via a downward swipe gesture or a clearly visible interactive tab/button.
    *   Must display aggregate yes/no vote metrics across all user sessions for every item.
    *   Must feature at least one meaningful sort/filter paradigm: **Most Loved** (Highest Yes %) or **Most Divisive** (Closest to a 50/50 split).
*   **Backend Persistence:** All votes must persist to a real backend server data layer. LocalStorage may only serve as a cache or local session tracker—the server remains the absolute source of truth.
*   **End-of-Deck State:** Handle the completion of the deck gracefully with a polished UI state (e.g., *"You've rated all destinations! Explore how the world voted below"*), redirecting or anchoring the user to the analytics results.

### 2.2 Stretch Goals (Nice to Have)
*   **User Identity:** Track users via an anonymous session ID at minimum (or a lightweight username/sign-in) to remember individual votes across browser reloads.
*   **Undo Last Swipe:** A mechanical stack allowing the user to reverse their immediate last decision, updating the backend state dynamically.
*   **Basic Performance Analytics:** Track metrics such as total swipes, session lengths, and average user decision time per item.

### 2.3 Out of Scope
*   Native iOS/Android binaries (Target is strictly mobile-optimized web app).
*   Production pipelines, custom domains, or CI/CD workflows.
*   Full account recovery options, payment processing, or admin content-moderation modules.

---

## 3. Technical Requirements

### 3.1 Frontend Framework & UX
*   **Target Device Viewport:** Must look pixel-perfect and operate flawlessly on an iPhone-class screen (**390 × 844 viewport**) at minimum.
*   **Layout Safety:** Zero layout shifts (CLS), no horizontal page overflow, and no broken asset image states.
*   **Interaction Model:** Touch gestures must work naturally on mobile devices; mouse drag simulations must function seamlessly on desktop browsers for testing/grading.

### 3.2 Backend & Data Layer
*   **Stack Integration:** FastAPI (Python) backend using an SQLite database layer.
*   **Core API Routing Requirements:**
    *   `GET /items` — Fetches the collection of available destinations.
    *   `POST /vote` — Registers an individual interaction payload: `{ itemId, choice, sessionId, decision_time_ms }`.
    *   `GET /results` — Compiles and serves global aggregated vote metrics.
*   **Idempotency & Deduplication:** The backend must handle de-duplication natively. If an identical `sessionId` submits a vote for an identical `itemId`, the transaction must update the existing record rather than double-counting the vote.
*   **Validation:** Strict input data validation utilizing schema models (Pydantic); do not blindly trust arbitrary client-side payloads.

---

## 4. Deliverables
1.  **Source Code:** A clean repository containing distinct `/backend` and `/frontend` configurations.
2.  **Documentation:** 
    *   `README.md` breaking down architecture choices, installation steps, and implemented scope.
    *   `AI_NOTES.md` documenting specific AI coordination patterns, engineering adjustments, and oversight.

---

## 5. Grading Rubric (100 Points Total — 20% of Final Exam)

| Criterion | Points | Evaluation Guardrails |
| :--- | :--- | :--- |
| **Core Functionality** | 35 | 100+ items, functional dual-direction swipe gestures, robust results dashboard, connected backend server engine, verified data persistence. |
| **Backend & Data Design** | 15 | Idempotent route shapes, native vote deduplication handling, sound persistence architecture choice, lack of data race conditions. |
| **UX & Visual Polish** | 15 | Correct target mobile viewport framing, organic gesture physics, clean analytics readability, intentional design identity. |
| **Code Quality** | 10 | Structured, readable files; modular code blocks; meaningful atomic git commit histories; clean execution from fresh initialization. |
| **AI Collaboration** | 15 | Candid documentation of AI steering, showing clear instances of engineering oversight rather than passive block copy-pasting. |
| **Stretch Goals** | 10 | Value-add implementation of features (Session management, Undo mechanics, Session speed analytics). |

---

## 6. Development Strategy Guidelines
*   **Vertical Slice First:** Get a single item executing end-to-end (Seed database -> Backend fetch -> UI swipe gesture -> Backend write -> Results aggregation) before building out massive UI wrappers or scaling the item seed count.
*   **Aggressive Stubbing:** Use minimalist code stubs during early scaffolding phases. Turn 3 hardcoded sample records into the full 100+ production dataset only after testing execution lifecycles.
*   **Save Final Polish:** Leave fine-tuned aesthetic spacing and custom animation optimizations for the final developmental phase. Focus entirely on layout integrity and data state safety first.