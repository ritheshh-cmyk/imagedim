import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ArrowRight, Sigma, Grid3X3, TrendingDown, Layers, ChevronDown } from 'lucide-react';

const MathBlock = ({ children, label }) => (
  <div style={{ margin: '14px 0', position: 'relative' }}>
    {label && (
      <span style={{ position: 'absolute', top: '-10px', left: '16px', background: '#F8FAFC', padding: '0 6px', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>
        {label}
      </span>
    )}
    <div style={{
      background: '#111827', borderRadius: '12px', padding: '18px 22px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9375rem', color: '#E5E7EB',
      letterSpacing: '0.02em', lineHeight: 1.8, overflowX: 'auto',
    }}>
      {children}
    </div>
  </div>
);

const SectionCard = ({ icon, title, index, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(14px)',
      border: '1px solid #E5E7EB', borderRadius: '20px',
      overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      marginBottom: '20px',
      transition: 'box-shadow 0.2s ease',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '22px 26px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          width: '36px', height: '36px', borderRadius: '10px', background: '#111827',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
        }}>
          {icon}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF' }}>Step {index}</p>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{title}</h2>
        </div>
        <ChevronDown size={18} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
      </button>
      {open && <div style={{ padding: '0 26px 26px', borderTop: '1px solid #F3F4F6' }}>{children}</div>}
    </div>
  );
};

const Pill = ({ children, color = '#6B7280', bg = '#F3F4F6' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', margin: '2px 3px', fontFamily: 'JetBrains Mono, monospace' }}>
    {children}
  </span>
);

const Body = ({ children }) => (
  <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, margin: '12px 0' }}>{children}</p>
);

const Highlight = ({ children }) => (
  <strong style={{ color: '#111827', fontWeight: 700 }}>{children}</strong>
);

export default function Theory() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: '60px', paddingBottom: '80px' }}>

      {/* Hero */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px 40px' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: '6px' }}>
          Mathematical Theory
        </p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '14px' }}>
          How Principal Component<br/>Analysis Works
        </h1>
        <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.7, maxWidth: '600px' }}>
          PCA finds the axes (directions) in high-dimensional space that capture the most variance. 
          By projecting data onto only the top-k such axes, we achieve compression with minimal information loss.
        </p>

        {/* Quick stats strip */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '24px' }}>
          {[
            { label: 'Input Dims', value: '784', sub: '28×28 pixels' },
            { label: 'Max k', value: '150', sub: 'components' },
            { label: 'Max compression', value: '78×', sub: 'at k=10' },
            { label: 'Algorithm', value: 'rSVD', sub: 'randomized SVD' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
              padding: '12px 18px', minWidth: '110px',
            }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>{s.label}</p>
              <p style={{ fontSize: '1.375rem', fontWeight: 900, color: '#111827', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>

        {/* Step 1 — Center */}
        <SectionCard icon={<Sigma size={16} />} title="Mean Centering the Data" index={1}>
          <Body>Before PCA, we <Highlight>subtract the mean</Highlight> from every feature so the data is centered at the origin. This ensures the first principal component points in the direction of maximum <em>variance</em>, not maximum <em>magnitude</em>.</Body>
          <MathBlock label="Formula">
            X̃ = X - μ{'\n'}
            {'    '}where  μⱼ = (1/n) Σᵢ Xᵢⱼ   (column means)
          </MathBlock>
          <Body>In our implementation MNIST pixels are first normalised to <Pill>[0, 1]</Pill> by dividing by 255, then sklearn's PCA centers automatically before computing the decomposition.</Body>
        </SectionCard>

        {/* Step 2 — Covariance */}
        <SectionCard icon={<Grid3X3 size={16} />} title="Covariance Matrix & Eigenvectors" index={2}>
          <Body>PCA finds directions <Highlight>W</Highlight> (eigenvectors) along which the data varies the most. These are the columns of the covariance matrix decomposition:</Body>
          <MathBlock label="Covariance">
            C = (1/n) X̃ᵀ X̃     shape: (d × d)
          </MathBlock>
          <Body>We then solve the eigenvalue problem:</Body>
          <MathBlock label="Eigendecomposition">
            C W = W Λ{'\n'}
            {'    '}W = [w₁ w₂ … wₖ]   — eigenvectors (principal axes){'\n'}
            {'    '}Λ = diag(λ₁ ≥ λ₂ ≥ … ≥ λₖ) — eigenvalues (variance explained)
          </MathBlock>
          <Body>Each eigenvector <Pill>wᵢ</Pill> points in a direction of decreasing variance. We pick only the <Highlight>top k</Highlight> eigenvectors to form the compression matrix.</Body>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            {[
              { label: 'Sklearn solver', value: 'randomized SVD', note: 'O(n·d·k) vs O(d³)' },
              { label: 'Whiten', value: 'True', note: 'divides by √λᵢ' },
              { label: 'Input shape', value: '(n, 784)', note: 'n=2000 MNIST digits' },
              { label: 'W shape', value: '(784, k)', note: 'projection matrix' },
            ].map(r => (
              <div key={r.label} style={{ background: '#F9FAFB', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', marginBottom: '2px' }}>{r.label}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{r.value}</p>
                <p style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{r.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Step 3 — Project */}
        <SectionCard icon={<ArrowRight size={16} />} title="Projection — Encoding (Compression)" index={3}>
          <Body>To compress an image <Pill>x</Pill> (shape 784), we project it onto the k principal axes. The result <Pill>z</Pill> lives in a k-dimensional <Highlight>latent space</Highlight>:</Body>
          <MathBlock label="Encode">
            z = Wᵀ · x̃       shape: (k,){'\n'}
            {'    '}k ≪ 784  →  massive dimensionality reduction
          </MathBlock>
          <Body>With <Pill>k=20</Pill> we go from 784 numbers → 20 numbers — a <Highlight>39× compression ratio</Highlight>. The latent vector z contains the image's "essence" expressed in the coordinate frame of principal components.</Body>
          <MathBlock label="In our app (whitened)">
            z = (X̃ · W) / √Λ   (sklearn .transform() with whiten=True)
          </MathBlock>
        </SectionCard>

        {/* Step 4 — Reconstruct */}
        <SectionCard icon={<TrendingDown size={16} />} title="Reconstruction — Decoding" index={4}>
          <Body>To reconstruct, we multiply back through <Pill>W</Pill> and add the mean. The reconstruction is an <Highlight>approximation</Highlight> — information lost in the dropped components cannot be recovered:
          </Body>
          <MathBlock label="Decode">
            x̂ = W · z + μ{'\n'}
            {'   '}MSE = (1/d) ‖x - x̂‖²
          </MathBlock>
          <Body>As k → d, <Pill>x̂ → x</Pill> exactly (zero error). As k → 1, the image is reduced to its single most-variant direction — a blurry, 1D summary.</Body>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 18px', marginTop: '14px' }}>
            <p style={{ fontSize: '0.8125rem', color: '#065F46', fontWeight: 600, marginBottom: '4px' }}>💡 Why MSE is the right metric</p>
            <p style={{ fontSize: '0.8125rem', color: '#047857', lineHeight: 1.6 }}>
              MSE = mean of squared pixel differences. It directly measures how far the reconstruction deviates from the original in the pixel domain — equivalent to the L2 norm in 784-dimensional space, normalized by dimensionality.
            </p>
          </div>
        </SectionCard>

        {/* Step 5 — Variance */}
        <SectionCard icon={<Layers size={16} />} title="Variance Retained & the Elbow Criterion" index={5}>
          <Body>Each eigenvalue <Pill>λᵢ</Pill> tells us how much variance that component explains. The cumulative sum gives the <Highlight>variance retained</Highlight> at k components:</Body>
          <MathBlock label="Variance Retained">
            VR(k) = Σᵢ₌₁ᵏ λᵢ / Σᵢ₌₁ᵈ λᵢ × 100%
          </MathBlock>
          <Body>In practice, MNIST reaches ~<Pill>90% variance at k≈60</Pill>. The "elbow" on the MSE curve at that point suggests that beyond k=60, additional components mostly encode noise rather than signal.</Body>
          <MathBlock label="Compression Ratio">
            CR(k) = d / k  =  784 / k{'\n'}
            {'    '}e.g. k=10 → 784/10 = 78.4×  compression
          </MathBlock>
          <Body>The <strong>Analytics page</strong> plots all these curves live against a random MNIST digit so you can find the elbow interactively.</Body>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'k=5',   cr: '156×', var: '~55%', note: 'Sketch only' },
              { label: 'k=20',  cr: '39×',  var: '~78%', note: 'Balanced' },
              { label: 'k=60',  cr: '13×',  var: '~90%', note: '✓ Elbow point' },
              { label: 'k=150', cr: '5.2×', var: '~99%', note: 'Near-lossless' },
            ].map(r => (
              <div key={r.label} style={{ flex: '1 1 120px', background: r.note.includes('✓') ? '#ECFDF5' : '#F9FAFB', border: r.note.includes('✓') ? '1px solid #6EE7B7' : '1px solid #F3F4F6', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#111827', fontSize: '0.9375rem' }}>{r.label}</p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Ratio: {r.cr}</p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Var: {r.var}</p>
                <p style={{ fontSize: '0.6875rem', color: r.note.includes('✓') ? '#059669' : '#9CA3AF', fontWeight: 600, marginTop: '4px' }}>{r.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* HD Images note */}
        <div style={{
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(14px)',
          border: '1px solid #E5E7EB', borderRadius: '20px',
          padding: '26px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '10px' }}>
            📸 HD Images — Patch-based PCA
          </h2>
          <Body>For uploaded photos (arbitrary size, RGB), processing the full image at once would require a covariance matrix of size <Pill>H×W×3 × H×W×3</Pill> — infeasible. Instead we use <Highlight>patch-based PCA</Highlight>:</Body>
          <MathBlock label="Patch pipeline">
            1. Split image into P×P patches    (default P=16){'\n'}
            2. Flatten each patch: shape (P·P·3,){'\n'}
            3. Stack all patches: shape (N_patches, P²·3){'\n'}
            4. Fit PCA → compress → reconstruct each patch{'\n'}
            5. Reassemble patches into full image
          </MathBlock>
          <Body>This gives <Highlight>local PCA</Highlight> per spatial region, which works well for natural images and scales to any resolution without memory issues.</Body>
        </div>

      </div>
    </div>
  );
}
