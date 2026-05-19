const API_BASE = "http://127.0.0.1:8000";

export async function fetchItems(sessionId) {
  const url = sessionId ? `${API_BASE}/items?sessionId=${sessionId}` : `${API_BASE}/items`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function castVote(payload) {
  const res = await fetch(`${API_BASE}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Vote failed");
  return res.json();
}

export async function fetchResults() {
  const res = await fetch(`${API_BASE}/results`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}

export async function undoVote(sessionId) {
  const res = await fetch(`${API_BASE}/vote/undo`, {
    method: "DELETE",
    headers: { "X-Session-ID": sessionId },
  });
  if (!res.ok) throw new Error("Undo failed");
  return res.json();
}

export async function fetchMyResults(sessionId) {
  const res = await fetch(`${API_BASE}/results/me`, {
    headers: { "X-Session-ID": sessionId },
  });
  if (!res.ok) throw new Error("Failed to fetch personal results");
  return res.json();
}

export async function fetchAnalytics(sessionId) {
  const res = await fetch(`${API_BASE}/analytics/me`, {
    headers: { "X-Session-ID": sessionId },
  });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
