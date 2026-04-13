import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ScanLine, Zap, ChevronRight } from 'lucide-react';

/* ── Static PCA Pipeline Diagram ── */
const PipelineDiagram = () => {
  const steps = [
    { n: '01', title: 'Input Image', sub: 'RGB · Any size' },
    { n: '02', title: 'Patch Split', sub: '8×8×3 ＝ 192D' },
    { n: '03', title: 'Eigenvector Fit', sub: 'Randomised SVD' },
    { n: '04', title: 'Latent Space', sub: 'k components' },
    { n: '05', title: 'Reduced Output', sub: 'Fidelity preserved' },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: '520px' }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '96px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: i === 3 ? '#111827' : '#F3F4F6',
                color: i === 3 ? '#FFFFFF' : '#374151',
                border: i === 3 ? 'none' : '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: '700', marginBottom: '10px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>{step.n}</div>
              <div style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#111827', marginBottom: '3px' }}>{step.title}</div>
              <div style={{ fontSize: '0.6rem', color: '#9CA3AF', fontFamily: "'JetBrains Mono', monospace" }}>{step.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '16px' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, #D1D5DB, #E5E7EB)' }} />
                <ChevronRight size={12} color="#9CA3AF" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ── Explanation cards data ── */
const features = [
  {
    icon: <Layers size={18} />,
    title: 'Full-Color RGB Compression',
    desc: 'Works on any image at its native resolution. Splits each frame into 8×8 pixel patches forming 192-dimensional vectors, then finds the optimal low-dimensional projection that captures maximum variance.',
  },
  {
    icon: <ScanLine size={18} />,
    title: 'Patch-Based Scalability',
    desc: 'By processing independent tiles rather than the full flattened image, the algorithm scales to 4K+ images without memory issues. Fits PCA on a 2,500-patch random subset, then transforms all patches.',
  },
  {
    icon: <Zap size={18} />,
    title: 'Zero Deep Learning',
    desc: 'Powered entirely by Randomised SVD — a classical linear algebra algorithm. CPU-only, millisecond latency, no GPU required, no model training. The mathematical elegance of eigenspace decomposition.',
  },
];

/* ── Math explainer rows ── */
const mathRows = [
  { term: 'Principal Component', def: 'An eigenvector of the data covariance matrix — the direction of maximum variance.' },
  { term: 'k Components', def: 'The number of eigenvectors kept. Fewer = smaller file, blurrier image.' },
  { term: 'Compression Ratio', def: 'Original dims ÷ k. At k=10, a 192-dim patch compresses ~19×.' },
  { term: 'Variance Retained', def: 'Sum of selected eigenvalues ÷ total variance × 100%. Higher = better fidelity.' },
  { term: 'MSE', def: 'Mean Squared Error between original and reduced image pixel values.' },
];

/* ── Home Page ── */
const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: '64px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="badge">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151', display: 'inline-block' }} />
              PCA · Dimensionality Reduction · Linear Algebra
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: '800',
            color: '#111827',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '20px',
          }}>
            Compress Images<br />
            <span style={{ color: '#6B7280', fontWeight: '400' }}>With Mathematics.</span>
          </h1>

          <p style={{ fontSize: '1.0625rem', color: '#6B7280', maxWidth: '540px', lineHeight: '1.75', marginBottom: '36px' }}>
            Principal Component Analysis reduces high-dimensional image data to its essential
            geometric structure — up to 95% smaller with controllable fidelity.
            No neural networks. Pure linear algebra.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} className="btn-primary" id="open-dashboard-btn">
              Open Dashboard <ArrowRight size={15} />
            </button>
            <a
              href="https://en.wikipedia.org/wiki/Principal_component_analysis"
              target="_blank" rel="noreferrer"
              className="btn-ghost"
            >
              Read the Theory
            </a>
          </div>
        </section>

        {/* ── Pipeline Diagram ── */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: '48px' }}>
          <p style={{
            fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '24px'
          }}>
            Compression Pipeline
          </p>
          <PipelineDiagram />
          <p style={{ marginTop: '20px', fontSize: '0.8125rem', color: '#9CA3AF', lineHeight: '1.6' }}>
            Each image is divided into small patches. PCA finds the <strong style={{ color: '#6B7280' }}>eigenvectors</strong> that
            capture the most variance. Only the top <em>k</em> are kept — dropping the rest
            reduces the storage representation while preserving the visual structure.
          </p>
        </div>

        {/* ── Feature Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '9px',
                background: '#F3F4F6', color: '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', border: '1px solid #E5E7EB',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: '1.65' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Math Glossary ── */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{
            fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '20px'
          }}>
            Key Concepts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {mathRows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', gap: '20px', padding: '14px 0',
                borderBottom: i < mathRows.length - 1 ? '1px solid #F3F4F6' : 'none',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  minWidth: '160px', fontSize: '0.75rem', fontWeight: '700',
                  color: '#111827', fontFamily: "'JetBrains Mono', monospace",
                }}>{row.term}</div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: '1.6' }}>{row.def}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
