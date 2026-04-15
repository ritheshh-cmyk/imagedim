import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Theory from './pages/Theory';
import DockNavigation from './components/DockNavigation';
import './index.css';

const AppLayout = () => {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F8' }}>
      <Navbar />
      <DockNavigation />
      <main key={location.pathname} style={{ paddingBottom: '100px' }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/theory"    element={<Theory />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
