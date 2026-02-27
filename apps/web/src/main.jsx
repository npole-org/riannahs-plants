import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { authService, summaryService } from './services';

createRoot(document.getElementById('root')).render(<App summaryService={summaryService} authService={authService} />);
