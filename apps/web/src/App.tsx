/**
 * SYNTARA ERP - Web Application Main Entry
 */

import React from 'react';
import { ThemeProvider } from '@erp-universal/design-system';
import { AppContent } from './AppContent';
import './styles.css';

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;