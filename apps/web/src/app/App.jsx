import React, { useEffect, useState } from 'react';

export function App({ summaryService }) {
  const [summary, setSummary] = useState({ plants: 0, dueToday: 0 });

  useEffect(() => {
    let active = true;

    summaryService.getSummary().then((result) => {
      if (active) {
        setSummary(result);
      }
    });

    return () => {
      active = false;
    };
  }, [summaryService]);

  return (
    <main style={{ fontFamily: 'system-ui', margin: '2rem auto', maxWidth: 720 }}>
      <h1>riannah's plants</h1>
      <p>Closed beta app bootstrap is live.</p>
      <section aria-label="dashboard-summary">
        <p>Total plants: {summary.plants}</p>
        <p>Due today: {summary.dueToday}</p>
      </section>
    </main>
  );
}
