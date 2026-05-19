# 🌍 Wanderlist

> An AI-assisted travel consensus app — swipe to vote on beautiful travel destinations and see how the rest of the world feels.

**Theme:** The voting theme is **Travel Destinations**. Users are presented with a stack of 100 stunning travel locations across the United States. They can vote "Yes" (Love it) or "No" (Pass) to build their personal bucket list while simultaneously contributing to a global leaderboard of the most popular destinations.

---

## 🏗 Architecture Description

The application is built using a modern, lightweight tech stack designed for speed, responsiveness, and real-time data visualization:

- **Frontend:** Built with **React 18** and **Vite** for fast bundling. The UI leverages **Framer Motion** for smooth, physics-based swipe animations and transitions that mimic native mobile applications.
- **Backend:** Powered by **FastAPI** (Python), providing extremely fast async endpoints. 
- **Database:** Uses **SQLite** via **SQLAlchemy** ORM for persistent, file-based data storage without the need for a separate database server.
- **User Identity & State:** The app uses an authless architecture. Instead of a cumbersome login system, it generates a persistent `UUID` stored in the browser's `localStorage` (`wanderlist_session`). This session ID tracks the user's vote history, allowing for personalized "Matches", stacked undo functionality, and personal analytics.

---

## 🚀 How to Install and Run

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
Open a terminal and run the following commands to set up the Python environment, seed the database, and start the server:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload
```
*The backend API will run on `http://127.0.0.1:8000`*

### 2. Frontend Setup
Open a second terminal window and run:

```bash
cd frontend
npm install
npm run dev
```
*The frontend development server will run on `http://localhost:5173`*

### 3. Usage
Open http://localhost:5173 in your browser. For the best experience, open your browser's Developer Tools and switch to a mobile viewport (e.g., iPhone 12/13).

---

## ✅ Completed Requirements

### Core Requirements (Must Have)
- [x] **Pick a voting theme:** Travel Destinations.
- [x] **100+ distinct items:** Exactly 100 travel locations, each with an image, destination name, city, state, description, and category.
- [x] **Swipe-card interface:** Swiping right or tapping "LOVE" records a 'yes', swiping left or tapping "CROSS" records a 'no'.
- [x] **Visual feedback:** Cards tilt based on swipe direction, accompanied by color hints (green for yes, red for no) and a threshold snap.
- [x] **Smooth transitions:** Framer Motion smoothly handles the exit animation and the next card drops in smoothly.
- [x] **Results View:** Accessible via the "Results" tab at the bottom navigation bar. It shows an aggregate count and is sorted by the most-loved percentage.
- [x] **Persistent backend:** All votes are persisted using FastAPI and SQLite.
- [x] **End-of-deck state:** Handled gracefully with a "Deck Complete!" message prompting the user to view the results.

### Stretch Requirements (Nice to Have)
- [x] **User identity:** Implemented via an anonymous session ID stored in `localStorage`, so user votes are remembered across reloads without needing to sign up.
- [x] **Undo last swipe:** Implemented a "Stacked Undo" allowing infinite undos. Tracks history directly on the backend via the `DELETE /vote/undo` endpoint.
- [x] **"Matches" view:** In the Results tab, items that the user voted "Yes" on AND have a global yes-rate >50% are highlighted at the top as "Your Matches ❤️".
- [x] **Real-time updating:** The global leaderboard on the Results tab actively polls the backend every 3 seconds to dynamically update rankings and percentages in real-time.
- [x] **Admin or seed script:** `backend/seed.py` intelligently parses `backend/data/destinations.json` and gracefully falls back on placeholder images if URLs are missing.
- [x] **Basic analytics:** The Explore view natively tracks and displays total swipes, your love ratio (Yes/No percentage), and your average decision speed in milliseconds.

---

## 🐛 Known Issues
- Currently, if the backend server shuts down, the user's `localStorage` session remains, but if the SQLite database is deleted/re-created, the frontend may still attempt to undo votes that no longer exist in the new database.
- Polling for real-time updates runs constantly while the Results tab is open; over an extended period on a low-battery mobile device, this could slightly impact battery life compared to a WebSocket implementation.
- Very rapid button clicking (faster than the 150ms exit animation) occasionally causes visual stacking hiccups, though the backend state remains perfectly accurate.

---

## 🤖 AI Usage Write-up (Section 6)

**Which parts of the system did Claude write end-to-end?**
Claude did not write many components end-to-end. Instead, Claude mostly handled the initial planning, brainstorming, and structuring phases. I took the lead on most architectural decisions, actively analyzing the pros and cons of various tech stacks (such as choosing FastAPI and SQLite over a heavy external database, or selecting Framer Motion for the UI) before implementing them.

**Where did you have to push back on, fix, or rewrite Claude’s output? Give one concrete example.**
One concrete example was during the implementation of the swipe animations. The AI initially provided a generic solution where clicking the "LOVE" or "CROSS" UI buttons simply popped the card out of the DOM instantly without any smooth transition. I had to push back and instruct the AI to rewrite the logic using Framer Motion's `useImperativeHandle` and `AnimatePresence` so that clicking the buttons programmatically triggered the exact same satisfying physics-based `swipeOut` animations as manually dragging the cards.

**One thing the AI did better than expected, and one thing it did worse.**
- **Better:** The AI was remarkably good at generating the complex boilerplate for the physics-based Framer Motion dragging constraints (handling drag thresholds, rotation calculations based on velocity, and snapping back).
- **Worse:** The AI struggled with React state synchronization across different views. For example, it initially scoped the "Undo" button visibility to a local component state. Whenever I navigated to the Results tab and back, the component would unmount and the Undo button would disappear. I had to explicitly tell it to lift the state up to the root `App` component and refetch analytics on mount to ensure persistent UI states.

**If you used other AI tools alongside Claude, what role did each play?**
I used **Claude** primarily for the high-level planning, architectural brainstorming, and detailing the step-by-step implementation plan. I then used **Gemini** (in the IDE) to assist with the actual coding, debugging, and execution of the implementation steps inside the codebase.
