import { useEffect, useState } from "react";
import { fetchResults, fetchMyResults } from "../api/client";
import AnalyticsPanel from "./AnalyticsPanel";
import "../styles/ResultsView.css";

// Read sessionId identically to App.jsx
function getSessionId() {
  return localStorage.getItem("wanderlist_session") || "";
}

export default function ResultsView() {
  const [data, setData] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const sessionId = getSessionId();

  // Polling for live global results
  useEffect(() => {
    fetchResults().then(setData).catch(console.error);
    const interval = setInterval(() => {
      fetchResults().then(setData).catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch personal votes once on mount for matches
  useEffect(() => {
    fetchMyResults(sessionId).then(res => setMyVotes(res.votes)).catch(console.error);
  }, [sessionId]);

  if (!data) return <p style={{textAlign:"center", padding: "40px"}}>Loading results...</p>;

  // Only show items that have at least 1 vote across the platform
  const votedItems = data.results.filter(item => item.total_votes > 0);

  // Calculate matches: Items I voted YES on AND global yes % > 50
  const myYesVoteIds = new Set(myVotes.filter(v => v.choice === "yes").map(v => v.item_id));
  const matches = votedItems.filter(item => myYesVoteIds.has(item.item_id) && item.yes_percentage > 50);

  return (
    <div className="results-view">
      <AnalyticsPanel sessionId={sessionId} />

      {matches.length > 0 && (
        <>
          <div className="results-header" style={{ marginTop: 24, marginBottom: 16 }}>
            <h1 style={{ fontSize: "1.4rem", color: "var(--accent-red)", background: "none", WebkitTextFillColor: "var(--accent-red)" }}>Your Matches ❤️</h1>
            <p className="total-votes">Destinations you loved that the community loves too!</p>
          </div>
          <div className="results-list" style={{ marginBottom: 40 }}>
            {matches.map((item) => (
              <div key={`match-${item.item_id}`} className="result-card" style={{ border: "1px solid rgba(255,82,82,0.3)" }}>
                <img src={item.image_url} alt={item.label} className="result-thumb" />
                <div className="result-info">
                  <h3>{item.label}</h3>
                  <div className="vote-bar">
                    <div className="yes-bar" style={{ width: `${item.yes_percentage}%` }}></div>
                  </div>
                  <span className="vote-stats">
                    <span className="love-stat">{item.yes_percentage}% loved</span>
                    <span>{item.total_votes} votes</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="results-header">
        <h1>Global Leaderboard</h1>
        <p className="total-votes"><span style={{color: "var(--accent-green)"}}>● Live:</span> {data.total_users} {data.total_users === 1 ? "user has" : "users have"} explored destinations</p>
      </div>

      {votedItems.length === 0 ? (
        <div className="no-votes">
          <p>No votes have been cast yet!</p>
          <p>Be the first to explore destinations.</p>
        </div>
      ) : (
        <div className="results-list">
          {votedItems.map((item) => (
            <div key={item.item_id} className="result-card">
              <img src={item.image_url} alt={item.label} className="result-thumb" />
              <div className="result-info">
                <h3>{item.label}</h3>
                <div className="vote-bar">
                  <div className="yes-bar" style={{ width: `${item.yes_percentage}%` }}></div>
                </div>
                <span className="vote-stats">
                  <span className="love-stat">{item.yes_percentage}% loved</span>
                  <span>{item.total_votes} votes</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
