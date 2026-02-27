import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui', margin: '2rem auto', maxWidth: 720 }}>
      <h1>riannah's plants</h1>
      <p>Closed beta app bootstrap is live.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
