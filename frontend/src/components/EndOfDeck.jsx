import "../styles/EndOfDeck.css";

export default function EndOfDeck({ total, onViewResults }) {
  return (
    <div className="end-of-deck">
      <div className="celebration-icon">🎉</div>
      <h2>You're all caught up!</h2>
      <p>You've explored all available destinations.</p>
      <p className="subtitle">See how your choices compare with the rest of the world.</p>
      <button className="primary-btn" onClick={onViewResults}>
        View Global Leaderboard
      </button>
    </div>
  );
}
