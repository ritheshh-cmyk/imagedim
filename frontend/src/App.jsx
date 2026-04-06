import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import './index.css';

// RitheshVerse immersive wrapper across all routes
const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="relative min-h-screen" style={{ perspective: '1400px' }}>
      {/* Global Background Elements */}
      <div className="watercolor-bg">
        <div className="watercolor-blob wb-1"></div>
        <div className="watercolor-blob wb-2"></div>
        <div className="watercolor-blob wb-3"></div>
      </div>
      <div className="texture-overlay"></div>

      <Navbar />

      <main className="relative z-10 w-full animate-fade-in" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      
      {/* Global Footer */}
      <footer className="relative z-10 pb-8 text-center bg-transparent mt-14">
        <p className="text-xs text-[#9CA3AF] tracking-widest uppercase">
          PCA Matrix · Multi-Page Antigravity Implementation
        </p>
      </footer>
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
