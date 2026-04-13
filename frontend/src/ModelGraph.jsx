import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Database, Network, Cpu, ArrowRight } from 'lucide-react';

const ModelGraph = ({ components = 20, isActive = false }) => {
  const containerRef = useRef(null);
  const planesRef = useRef([]);
  const linesRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
      if (linesRef.current) {
        gsap.to(linesRef.current, {
          opacity: isActive ? 1 : 0.2,
          duration: 1,
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [isActive]);

  const addPlaneRef = (el) => {
    if (el && !planesRef.current.includes(el)) {
      planesRef.current.push(el);
    }
  };

  // Generate node arrays for visual abstraction
  const inputNodes = Array.from({ length: 49 }); // 7x7 grid to represent 784
  const outputNodes = Array.from({ length: 49 });
  
  // Constrain bottleneck visual nodes between 1 and 25
  const bottleneckCount = Math.max(1, Math.min(25, Math.ceil(components / 4)));
  const bottleneckNodes = Array.from({ length: bottleneckCount });

  return (
    <div ref={containerRef} className="glass-panel p-8 mt-12 w-full overflow-hidden flex flex-col items-center">
      
      <div className="flex items-center gap-2 mb-8 w-full border-b border-black/[0.07] pb-4">
        <Network size={20} className="text-[#7C3AED]" />
        <span className="font-semibold text-sm uppercase tracking-widest text-[#0A0A0A]">
          Autoencoder Bottleneck Architecture
        </span>
      </div>

      <div className="isometric-container min-h-[350px] relative w-full lg:w-4/5 mx-auto">
        
        {/* SVG connection lines in the background */}
        <svg 
          ref={linesRef}
          className="absolute inset-0 w-full h-full" 
          style={{ zIndex: -1, opacity: 0.3 }}
        >
          {/* Abstract connecting lines from input to bottleneck */}
          <line x1="20%" y1="50%" x2="50%" y2="50%" className="connect-line" />
          {/* Abstract connecting lines from bottleneck to output */}
          <line x1="50%" y1="50%" x2="80%" y2="50%" className="connect-line" />
        </svg>

        {/* 1. INPUT LAYER */}
        <div ref={addPlaneRef} className="model-plane w-32 md:w-40" style={{ transform: 'rotateX(55deg) rotateZ(-30deg)' }}>
          <Database size={24} className="text-[#6B7280] mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#0A0A0A] mb-1">Input Space</div>
          <div className="text-[10px] font-mono text-[#6B7280]">784 Features</div>
          
          <div className="node-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {inputNodes.map((_, i) => (
              <div 
                key={`in-${i}`} 
                className={`model-node w-2 h-2 md:w-3 md:h-3 ${isActive ? 'active' : ''}`}
                style={{ opacity: Math.random() * 0.5 + 0.3 }}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block text-[#7C3AED] opacity-50 relative top-10">
           <div className="text-[10px] font-bold uppercase tracking-widest bg-white/50 px-2 py-1 rounded backdrop-blur">Transform (W)</div>
        </div>

        {/* 2. LATENT SPACE (BOTTLENECK) */}
        <div ref={addPlaneRef} className="model-plane w-28 md:w-36 border-purple-200" style={{ transform: 'rotateX(55deg) rotateZ(-30deg) translateZ(30px)', borderColor: 'rgba(124, 58, 237, 0.4)', boxShadow: '0 20px 45px rgba(124, 58, 237, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)' }}>
          <Cpu size={24} className="text-[#7C3AED] mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] mb-1">Latent Space</div>
          <div className="text-[10px] font-mono text-[#7C3AED] bg-purple-100 px-2 rounded">{components} Components</div>
          
          <div className="node-grid mt-4 flex flex-wrap justify-center gap-[4px]">
            {bottleneckNodes.map((_, i) => (
              <div 
                key={`bot-${i}`} 
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-[0_0_10px_rgba(124,58,237,0.5)] ${isActive ? 'opacity-100' : 'opacity-40'}`}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block text-[#2563EB] opacity-50 relative top-10">
           <div className="text-[10px] font-bold uppercase tracking-widest bg-white/50 px-2 py-1 rounded backdrop-blur">Inverse (W⁻¹)</div>
        </div>

        {/* 3. OUTPUT LAYER */}
        <div ref={addPlaneRef} className="model-plane w-32 md:w-40" style={{ transform: 'rotateX(55deg) rotateZ(-30deg)' }}>
          <Database size={24} className="text-[#2563EB] mb-2" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#0A0A0A] mb-1">Reconstructed</div>
          <div className="text-[10px] font-mono text-[#6B7280]">784 Features</div>
          
          <div className="node-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {outputNodes.map((_, i) => (
              <div 
                key={`out-${i}`} 
                className={`model-node output-node w-2 h-2 md:w-3 md:h-3 ${isActive ? 'active' : ''}`}
                style={{ opacity: Math.random() * 0.5 + 0.3 }}
              />
            ))}
          </div>
        </div>

      </div>
      
      <p className="text-xs text-[#9CA3AF] text-center max-w-lg mt-6">
        PCA acts as a linear autoencoder. It projects the high-dimensional input onto an orthogonal basis (eigenspace) with fewer dimensions, storing only the most critical variance in the latent bottleneck space.
      </p>
    </div>
  );
};

export default ModelGraph;
