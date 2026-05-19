import { useEffect, useState, useCallback, useRef } from "react";
import CardDeck from "./components/CardDeck";
import ResultsView from "./components/ResultsView";
import { fetchItems, castVote, fetchAnalytics } from "./api/client";
import "./styles/index.css";

// Generate a stable session ID for anonymous users
function getSessionId() {
  let id = localStorage.getItem("wanderlist_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wanderlist_session", id);
  }
  return id;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [hasVotes, setHasVotes] = useState(false);
  const [view, setView] = useState("swipe"); // "swipe" | "results"
  const sessionId = getSessionId();
  const cardShownAt = useRef(Date.now());

  useEffect(() => {
    if (view === "swipe") {
      Promise.all([
        fetchItems(sessionId),
        fetchAnalytics(sessionId)
      ]).then(([itemsData, analyticsData]) => {
        setItems(itemsData);
        setHasVotes(analyticsData.total_swipes > 0);
        cardShownAt.current = Date.now();
      }).catch(console.error);
    }
  }, [sessionId, view]);

  const handleSwipe = useCallback(
    async (item, choice) => {
      if (!item) return;
      const decisionTimeMs = Date.now() - cardShownAt.current;
      cardShownAt.current = Date.now(); // Reset for next card
      try {
        await castVote({ itemId: item.id, choice, sessionId, decisionTimeMs });
      } catch (err) {
        console.error("Vote failed:", err);
      }
    },
    [sessionId]
  );

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={view === "swipe" ? "active" : ""}
          onClick={() => setView("swipe")}
        >
          Explore
        </button>
        <button
          className={view === "results" ? "active" : ""}
          onClick={() => setView("results")}
        >
          Results
        </button>
      </nav>
      
      {view === "swipe" && (
        <CardDeck
          items={items}
          onSwipe={handleSwipe}
          onViewResults={() => setView("results")}
          sessionId={sessionId}
          initialCanUndo={hasVotes}
        />
      )}

      {view === "results" && <ResultsView />}
    </div>
  );
}
