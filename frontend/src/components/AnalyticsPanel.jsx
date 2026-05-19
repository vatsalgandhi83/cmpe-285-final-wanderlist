import { useEffect, useState } from "react";
import { fetchAnalytics } from "../api/client";
import "../styles/AnalyticsPanel.css";

export default function AnalyticsPanel({ sessionId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics(sessionId)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading || !stats) return null;
  if (stats.total_swipes === 0) return null;

  return (
    <div className="analytics-panel">
      <h2>Your Stats</h2>
      <div className="stats-grid">
        <StatCard label="Total Swipes" value={stats.total_swipes} />
        <StatCard label="Love Ratio" value={`${Math.round(stats.yes_ratio * 100)}%`} />
        <StatCard
          label="Avg Decision"
          value={stats.avg_decision_ms ? `${(stats.avg_decision_ms / 1000).toFixed(1)}s` : "—"}
        />
        <StatCard
          label="Fastest"
          value={stats.fastest_ms ? `${(stats.fastest_ms / 1000).toFixed(1)}s` : "—"}
        />
      </div>

      {/* Yes/No ratio bar */}
      <div className="ratio-bar">
        <div className="ratio-yes" style={{ width: `${stats.yes_ratio * 100}%` }}>
          ♥ {stats.yes_count}
        </div>
        <div className="ratio-no">
          ✗ {stats.no_count}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
