import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, LayoutDashboard, BarChart2, BookOpen, ChevronRight } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(248,250,252,0.92)' : 'rgba(248,250,252,0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${scrolled ? '#E2E8F0' : 'transparent'}`,
      transition: 'background .2s ease, border-color .2s ease, box-shadow .2s ease',
      boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.04)' : 'none',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ScanLine size={16} color="#F8FAFC" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', letterSpacing: '-.02em' }}>
            PCA<span style={{ color: '#94A3B8', fontWeight: 400 }}>Matrix</span>
          </span>
        </NavLink>

        {/* Middle items moved to Dock */}

        {/* CTA */}
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#0F172A', color: '#F8FAFC', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'transform .15s ease, background .15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#1E293B'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#0F172A'; }}
          >
            Try it <ChevronRight size={13} />
          </button>
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;
