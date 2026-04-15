import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard, BarChart2, BookOpen } from 'lucide-react';
import { Dock, DockIcon } from './ui/dock';

const DockNavigation = () => {
  const links = [
    { to: '/', label: 'Overview', icon: <Home className="w-full h-full p-2.5" strokeWidth={1.8} />, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-full h-full p-2.5" strokeWidth={1.8} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart2 className="w-full h-full p-2.5" strokeWidth={1.8} /> },
    { to: '/theory', label: 'Theory', icon: <BookOpen className="w-full h-full p-2.5" strokeWidth={1.8} /> },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <Dock direction="middle" iconMagnification={75} iconSize={48} iconDistance={140}>
          {links.map((link) => (
            <DockIcon key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `group relative flex h-full w-full items-center justify-center rounded-[18px] transition-all duration-300 ease-out border shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#6366f1] to-[#0ea5e9] text-white border-transparent shadow-[#6366f1]/30 hover:shadow-md hover:shadow-[#6366f1]/40'
                      : 'bg-white/80 text-slate-600 border-white hover:bg-white hover:text-indigo-600 hover:shadow-lg'
                  }`
                }
              >
                {link.icon}
                
                {/* Antigravity Tooltip */}
                <motion.span 
                  className="absolute -top-12 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] bg-slate-900 border border-slate-700 text-white text-[13px] font-semibold px-3 py-1.5 rounded-lg shadow-xl shadow-slate-900/20 whitespace-nowrap pointer-events-none origin-bottom"
                >
                  {link.label}
                  <svg className="absolute text-slate-900 h-2 w-full left-0 top-full drop-shadow-md" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                </motion.span>
              </NavLink>
            </DockIcon>
          ))}
        </Dock>
      </div>
    </div>
  );
};

export default DockNavigation;
