import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Layers, ScanLine, Zap, ChevronRight, BarChart2, Cpu, GitBranch } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════
   TILT CARD HOOK
═══════════════════════════════════════════ */
const useTilt = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -5;
      const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 5;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    };
    const onLeave = () => { el.style.transform = ''; };
    el.style.transition = 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1)';
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);
  return ref;
};

/* ═══════════════════════════════════════════
   PIPELINE DATA
═══════════════════════════════════════════ */
const pipeline = [
  {
    n: '01', icon: <Layers size={18} />, title: 'Input Image',
    spec: 'RGB · Any Resolution',
    detail: 'Loaded as a NumPy array (H×W×3). No resizing — native pixel data flows directly into the patch extractor.',
    tag: 'numpy.ndarray',
  },
  {
    n: '02', icon: <GitBranch size={18} />, title: 'Patch Extraction',
    spec: '8×8×3 = 192 Dims / Patch',
    detail: 'Image is divided into non-overlapping 8×8 pixel tiles. Each tile is flattened into a 192-dimensional vector: [R1…R64, G1…G64, B1…B64].',
    tag: 'shape (N, 192)',
  },
  {
    n: '03', icon: <Cpu size={18} />, title: 'PCA Fit (SVD)',
    spec: 'Randomised SVD on ≤2,500 patches',
    detail: 'A random subset of patches is used to compute eigenvectors. Randomised SVD finds the top-k principal components in O(n·k) time — much faster than full SVD.',
    tag: 'sklearn.PCA',
  },
  {
    n: '04', icon: <BarChart2 size={18} />, title: 'Latent Space Projection',
    spec: '192D → k-Dimensional Code',
    detail: 'Every patch is projected: z = (x − μ) · W, where W is the top-k eigenvector matrix. Each patch is now a compact k-dim code capturing maximum variance.',
    tag: 'z = (x-μ)·W',
  },
  {
    n: '05', icon: <ScanLine size={18} />, title: 'Inverse Transform + Stitch',
    spec: 'k-dim → 192D → Image',
    detail: 'x̂ = z · Wᵀ + μ. Reconstructed patches are stitched back into (H×W×3). The diff from the original is the compression loss — controlled by k.',
    tag: 'x̂ = z·Wᵀ + μ',
  },
];

const features = [
  {
    icon: <Layers size={20} />, title: 'Native RGB — No Downscaling',
    desc: 'Most PCA demos shrink images to 28×28 first. This pipeline compresses your actual photo at full resolution. An 8×8 patch = 192 floats. PCA finds the optimal projection across all patches simultaneously.'
  },
  {
    icon: <Cpu size={20} />, title: 'Scalable Patch Architecture',
    desc: 'Splitting into tiles keeps the covariance matrix at 192×192 — trivially fast. A 4K image becomes ~130K patches, each independently compressed. No memory explosion even at ultra-high resolution.'
  },
  {
    icon: <Zap size={20} />, title: 'CPU-Only · Zero Training',
    desc: 'Randomised SVD computes only the top-k eigenvectors you need, not the full decomposition. Runs in milliseconds on any laptop CPU. No GPU, no neural network weights, no pre-training.'
  },
];

const mathRows = [
  { sym: 'X', def: 'Data matrix — shape (N_patches, 192). Each row is one 8×8 RGB patch.' },
  { sym: 'μ', def: 'Column mean of X. Subtracted before projection to center the data.' },
  { sym: 'W', def: 'Top-k eigenvectors of the covariance matrix XᵀX. Shape: (192, k).' },
  { sym: 'z = (X−μ)·W', def: 'Compressed latent codes. Shape: (N, k). This is what gets "stored".' },
  { sym: 'X̂ = z·Wᵀ+μ', def: 'Reconstructed patches. The PCA output image is built from X̂.' },
  { sym: 'MSE', def: 'mean((X − X̂)²) across all patch pixels. Lower is sharper output.' },
  { sym: 'Variance %', def: 'Σ(top-k eigenvalues) / Σ(all eigenvalues) × 100. Higher = more info kept.' },
];

/* ═══════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════ */
export default function Home() {
  const nav = useNavigate();
  const heroRef = useRef(null);
  const t1 = useTilt(); const t2 = useTilt(); const t3 = useTilt();
  const tiltRefs = [t1, t2, t3];

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Hero entrance */
      gsap.fromTo('.hero-badge',  { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 });
      gsap.fromTo('.hero-h1',    { opacity: 0, y: 32  }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo('.hero-p',     { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.4 });
      gsap.fromTo('.hero-btns',  { opacity: 0, y: 16  }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.55 });
      gsap.fromTo('.stats-strip .stat-item', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.7,
      });

      /* Pipeline steps */
      gsap.fromTo('.pipeline-step-home', { opacity: 0, y: 36, scale: 0.97 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.pipeline-section-home', start: 'top 78%' },
      });

      /* Feature cards */
      gsap.fromTo('.feature-card-home', { opacity: 0, y: 48 }, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.features-section', start: 'top 78%' },
      });

      /* Math rows */
      gsap.fromTo('.math-row', { opacity: 0, x: -16 }, {
        opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: '.math-section', start: 'top 80%' },
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: '60px' }}>

      {/* ── HERO ── */}
      <section className="hero-bg" style={{ padding: '60px 24px 80px', position: 'relative' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div className="hero-badge" style={{ marginBottom: '24px', opacity: 0 }}>
            <span className="badge">
              <span className="live-dot" />
              PCA · Dimensionality Reduction · Linear Algebra
            </span>
          </div>

          <h1 className="hero-h1" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: '22px', opacity: 0 }}>
            Compress Images<br />
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>With Mathematics.</span>
          </h1>

          <p className="hero-p" style={{ fontSize: '1.0625rem', color: '#6B7280', maxWidth: '520px', lineHeight: 1.75, marginBottom: '36px', opacity: 0 }}>
            Principal Component Analysis projects high-dimensional image data onto its most
            informative axes — discarding noise, keeping structure. Up to <strong style={{ color: '#374151' }}>95% smaller</strong> with tunable fidelity.
            No GPU. No neural networks. Pure linear algebra.
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', opacity: 0 }}>
            <button id="cta-dashboard" onClick={() => nav('/dashboard')} className="btn-primary">
              Open Compression Lab <ArrowRight size={16} />
            </button>
            <button id="cta-theory" onClick={() => nav('/theory')} className="btn-ghost">
              Read the Theory
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="stats-strip" style={{ background: '#FFFFFF', borderTop: '1px solid #EAECEF', borderBottom: '1px solid #EAECEF' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0' }}>
          {[
            { n: '95%',    l: 'Max Compression' },
            { n: '192D',   l: 'Input Vector (8×8×3)' },
            { n: '<1ms',   l: 'CPU Latency per Patch' },
            { n: '0',      l: 'Neural Nets Required' },
          ].map((s, i) => (
            <div key={i} className="stat-item" style={{
              padding: '20px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid #F3F4F6' : 'none',
              opacity: 0,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>{s.n}</div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="pipeline-section-home" style={{ padding: '80px 24px 0', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <p className="overline" style={{ marginBottom: '12px' }}>How It Works</p>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>The Compression Pipeline</h2>
          <p style={{ marginTop: '10px', fontSize: '0.9375rem', color: '#6B7280', maxWidth: '520px', lineHeight: 1.65 }}>
            Five deterministic steps — no randomness beyond the SVD seed. Every number below is real math executed on your image.
          </p>
        </div>

        {/* Step cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pipeline.map((step, i) => (
            <div key={i} className="pipeline-step-home glass-card" style={{ padding: '24px 28px', display: 'flex', gap: '24px', alignItems: 'flex-start', opacity: 0 }}>
              {/* Left: number */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: i === pipeline.length - 1 ? '#111827' : '#F3F4F6',
                  color: i === pipeline.length - 1 ? '#FFFFFF' : '#374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid', borderColor: i === pipeline.length - 1 ? '#111827' : '#E5E7EB',
                }}>
                  {step.icon}
                </div>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.625rem', fontWeight: 800, color: '#D1D5DB' }}>{step.n}</span>
              </div>

              {/* Middle: text */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{step.title}</h3>
                  <span className="tag">{step.tag}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600, marginBottom: '6px' }}>{step.spec}</p>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.65 }}>{step.detail}</p>
              </div>

              {/* Right: step number display */}
              <div style={{ flexShrink: 0, width: '44px', textAlign: 'right' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F3F4F6', fontFamily: 'JetBrains Mono,monospace', lineHeight: 1 }}>{step.n}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section" style={{ padding: '80px 24px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <p className="overline" style={{ marginBottom: '12px' }}>Design Decisions</p>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>Why This Approach?</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>
          {features.map((f, i) => (
            <div key={i} ref={tiltRefs[i]} className="feature-card-home float-card" style={{ padding: '28px', opacity: 0 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MATH TABLE ── */}
      <section className="math-section" style={{ padding: '0 24px 80px', maxWidth: '1080px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '36px 40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <p className="overline" style={{ marginBottom: '12px' }}>Linear Algebra Reference</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>The Math Behind Every Compression</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {mathRows.map((row, i) => (
              <div key={i} className="math-row" style={{ display: 'flex', gap: '24px', padding: '14px 0', borderBottom: i < mathRows.length - 1 ? '1px solid #F3F4F6' : 'none', opacity: 0 }}>
                <code style={{ minWidth: '160px', fontSize: '0.8125rem', fontWeight: 700, color: '#111827', fontFamily: 'JetBrains Mono,monospace', background: '#F3F4F6', padding: '4px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                  {row.sym}
                </code>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.65 }}>{row.def}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '20px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.7 }}>
              <strong>Compression ratio</strong> = original dims ÷ compressed dims = <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>192 / k</code> for patch data alone.
              The full savings include removing the high-k eigenvectors from storage — the model only needs the
              mean μ, the weight matrix W (192×k), and the codes z (N×k).
              At k=20, that's a <strong>9.6×</strong> reduction in patch data.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section style={{ background: '#111827', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '16px' }}>Ready To Compress?</p>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '28px' }}>Upload any image. Set k. See the math work.</h2>
        <button onClick={() => nav('/dashboard')} className="btn-primary" style={{ background: '#FFFFFF', color: '#111827', boxShadow: '0 4px 24px rgba(255,255,255,0.15)' }}>
          Open Compression Lab <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer style={{ background: '#111827', borderTop: '1px solid #1F2937', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#4B5563' }}>PCA Matrix · Dimensionality Reduction · Built with FastAPI + React + scikit-learn</p>
      </footer>

    </div>
  );
}
