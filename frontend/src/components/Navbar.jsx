import React from 'react';
import { NavLink } from 'react-router-dom';
import { Network, Home, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-panel px-6 py-3 flex items-center gap-8 rounded-full border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-2 mr-4">
          <Network size={20} className="text-[#7C3AED]" />
          <span className="font-extrabold tracking-tight hidden md:inline text-[#0A0A0A]">
            PCA<span className="text-[#7C3AED]">Matrix</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? 'bg-[#0A0A0A] text-white shadow-md' 
                  : 'text-[#6B7280] hover:bg-black/5 hover:text-[#0A0A0A]'
              }`
            }
          >
            <Home size={16} />
            <span className="hidden sm:inline">Overview</span>
          </NavLink>
          
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive 
                  ? 'bg-[#0A0A0A] text-white shadow-md' 
                  : 'text-[#6B7280] hover:bg-black/5 hover:text-[#0A0A0A]'
              }`
            }
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
