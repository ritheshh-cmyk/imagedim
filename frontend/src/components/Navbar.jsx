import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, Home, LayoutDashboard, BarChart2, BookOpen } from 'lucide-react';

const navStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '6px 14px', borderRadius: '9999px',
  fontSize: '0.8125rem', fontWeight: 500,
  textDecoration: 'none',
  background: isActive ? '#111827' : 'transparent',
  color: isActive ? '#FFFFFF' : '#6B7280',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
});

const Navbar = () => {
  return (
    <nav style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #E5E7EB',
        borderRadius: '9999px',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px', paddingRight: '14px', borderRight: '1px solid #E5E7EB' }}>
          <ScanLine size={16} color="#111827" />
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827', letterSpacing: '-0.02em' }}>
            PCA<span style={{ color: '#6B7280', fontWeight: 500 }}>Matrix</span>
          </span>
        </div>

        <NavLink to="/" end style={navStyle}>
          <Home size={13} />
          <span>Overview</span>
        </NavLink>

        <NavLink to="/dashboard" style={navStyle}>
          <LayoutDashboard size={13} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/analytics" style={navStyle}>
          <BarChart2 size={13} />
          <span>Analytics</span>
        </NavLink>

        <NavLink to="/theory" style={navStyle}>
          <BookOpen size={13} />
          <span>Theory</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
