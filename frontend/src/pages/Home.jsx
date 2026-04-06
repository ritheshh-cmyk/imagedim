import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { Network, Database, BrainCircuit, ArrowRight } from 'lucide-react';

const Home = () => {
  const containerRef = useRef(null);
  const elementsRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(elementsRef.current, 
        { opacity: 0, y: 50, rotateX: -10 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const addRef = (el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative" style={{ perspective: '1000px' }}>
      
      {/* Abstract Floating Shapes in background */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

      <div className="max-w-4xl w-full text-center mb-16">
        <div ref={addRef} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-black/10 backdrop-blur-md mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">Antigravity UI Verified</span>
        </div>
        
        <h1 ref={addRef} className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-[#0A0A0A] leading-tight varien">
          Visualizing Dimensionality <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#2563EB]">Through Space.</span>
        </h1>
        
        <p ref={addRef} className="text-[#6B7280] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Understand how Principal Component Analysis (PCA) isolates mathematical variance in images and projects it linearly without complex deep learning models.
        </p>

        <div ref={addRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto justify-center"
          >
            Launch Dashboard
            <ArrowRight size={18} />
          </button>
          <a href="https://en.wikipedia.org/wiki/Principal_component_analysis" target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto justify-center font-medium">
            Read the Theory
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full perspective-grid">
        {[
          { icon: <Database size={24} />, title: "Data Ingestion", desc: "Native 28x28 array modeling for any uploaded HD image natively compressed through spatial patching." },
          { icon: <Network size={24} />, title: "Eigenvector Mapping", desc: "Isolating principle vectors and compressing data density by over 80% with minimal MSE decay." },
          { icon: <BrainCircuit size={24} />, title: "Instant Reconstruction", desc: "Visualizing the loss mechanism dynamically as we unroll the latent representations." }
        ].map((feature, i) => (
          <div ref={addRef} key={i} className="glass-panel p-8 text-left group hover:-translate-y-2 transition-transform duration-500">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-100">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-[#0A0A0A] mb-3">{feature.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
