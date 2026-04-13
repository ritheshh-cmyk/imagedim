import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, TrendingDown, Layers, Zap, Award, Info, Loader2, MousePointer2 } from 'lucide-react';
import { fetchSweep } from '../api';

/* ─── SVG Line/Area Chart ────────────────────────────────────── */
const SVGChart = ({
  data, xKey, yKey, label, color, unit = '', height = 220,
  refLineY = null, refLineX = null, refLabel = '', yFormatter = v => v.toFixed(3),
}) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);
  const PAD = { top: 20, right: 16, bottom: 38, left: 54 };

  if (!data.length) return null;

  const xs = data.map(d => d[xKey]);
  const ys = data.map(d => d[yKey]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const W = 100; // viewBox units (%)
  const H = 100;

  const px = x => PAD.left + ((x - minX) / (maxX - minX || 1)) * (W - PAD.left - PAD.right);
  const py = y => PAD.top + (1 - (y - minY) / (maxY - minY || 1)) * (H - PAD.top - PAD.bottom);

  const pts = data.map(d => [px(d[xKey]), py(d[yKey])]);
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1][0]},${H - PAD.bottom} L${pts[0][0]},${H - PAD.bottom} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minY + t * (maxY - minY));
  // X-axis ticks (pick ~5 evenly)
  const step = Math.ceil(data.length / 5);
  const xTickData = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const onMouseMove = useCallback(e => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestDist = Infinity;
    pts.forEach(([px], i) => {
      const d = Math.abs(px - mouseX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHoverIdx(best);
  }, [pts]);

  const hov = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clip-${yKey}`}>
            <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)}
            stroke="#F3F4F6" strokeWidth="0.5" />
        ))}

        {/* Reference line Y */}
        {refLineY != null && refLineY >= minY && refLineY <= maxY && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(refLineY)} y2={py(refLineY)}
              stroke="#F59E0B" strokeWidth="0.6" strokeDasharray="2,1.5" />
            <text x={W - PAD.right - 1} y={py(refLineY) - 1.5} fontSize="2.8" fill="#F59E0B" textAnchor="end" fontWeight="700">{refLabel}</text>
          </g>
        )}

        {/* Reference line X */}
        {refLineX != null && (
          <g>
            <line x1={px(refLineX)} x2={px(refLineX)} y1={PAD.top} y2={H - PAD.bottom}
              stroke="#8B5CF6" strokeWidth="0.6" strokeDasharray="2,1.5" />
            <text x={px(refLineX) + 1} y={PAD.top + 4} fontSize="2.8" fill="#8B5CF6" textAnchor="start" fontWeight="700">k={refLineX}</text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill={`url(#grad-${yKey})`} clipPath={`url(#clip-${yKey})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#clip-${yKey})`} />

        {/* Hover dot */}
        {hov && (
          <circle cx={px(hov[xKey])} cy={py(hov[yKey])} r="2.2" fill={color} stroke="#fff" strokeWidth="1" />
        )}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PAD.left - 2} y={py(t) + 1} fontSize="3" fill="#9CA3AF" textAnchor="end">{yFormatter(t)}</text>
        ))}

        {/* X-axis labels */}
        {xTickData.map((d, i) => (
          <text key={i} x={px(d[xKey])} y={H - PAD.bottom + 6} fontSize="3" fill="#9CA3AF" textAnchor="middle">{d[xKey]}</text>
        ))}

        {/* Axis lines */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth="0.5" />
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#E5E7EB" strokeWidth="0.5" />

        {/* Axis labels */}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 1} fontSize="3.2" fill="#9CA3AF" textAnchor="middle">Components (k)</text>
        <text x={4} y={(PAD.top + H - PAD.bottom) / 2} fontSize="3.2" fill="#9CA3AF" textAnchor="middle" transform={`rotate(-90, 4, ${(PAD.top + H - PAD.bottom) / 2})`}>{label}</text>
      </svg>

      {/* Hover tooltip */}
      {hov && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(17,24,39,0.92)', borderRadius: '10px', padding: '8px 12px',
          pointerEvents: 'none', backdropFilter: 'blur(8px)',
        }}>
          <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', margin: 0 }}>k = {hov[xKey]}</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace', margin: '2px 0 0' }}>
            {yFormatter(hov[yKey])}{unit}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <div style={{
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.95)',
    borderRadius: '18px',
    padding: '22px 24px',
    display: 'flex', flexDirection: 'column', gap: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
    animationDelay: `${delay}ms`,
    willChange: 'transform',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: 32, height: 32, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</span>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF' }}>{label}</span>
    </div>
    <span style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</span>
    {sub && <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{sub}</span>}
  </div>
);

/* ─── Chart Card ─────────────────────────────────────────────── */
const ChartCard = ({ title, subtitle, badge, badgeColor = '#6B7280', children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.90)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(235,237,240,0.9)',
    borderRadius: '20px',
    padding: '26px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.3s ease',
    willChange: 'transform',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.10)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
      <div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '3px' }}>{title}</h3>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', lineHeight: 1.4 }}>{subtitle}</p>
      </div>
      {badge && (
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '4px 10px', borderRadius: '9999px',
          background: `${badgeColor}14`, color: badgeColor, border: `1px solid ${badgeColor}30`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge}</span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', color: '#D1D5DB', fontSize: '0.6875rem' }}>
      <MousePointer2 size={10} />
      <span>Hover chart for values</span>
    </div>
    {children}
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [kMax, setKMax]     = useState(100);

  const loadData = async (k = kMax) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSweep(k, 2);
      setData(res.sweep);
    } catch {
      setError('Backend offline — run: ./start.sh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* Derived stats */
  const knee   = data.find(d => d.variance_pct >= 90)?.k ?? '—';
  const minMse = data.length ? Math.min(...data.map(d => d.mse)).toFixed(5) : '—';
  const maxVar = data.length ? Math.max(...data.map(d => d.variance_pct)).toFixed(1) : '—';
  const bestQ  = data.length ? Math.max(...data.map(d => d.quality_score)).toFixed(0) : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F8F9FB 0%, #F1F3F6 100%)', paddingTop: '96px', paddingBottom: '100px' }}>

      {/* Page header */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 28px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px #D1FAE5' }} />
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>Model Analytics</p>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.045em', lineHeight: 1, marginBottom: '10px' }}>
              Accuracy &amp; Performance
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#6B7280', maxWidth: '520px', lineHeight: 1.65 }}>
              Live curves showing MSE, variance retained, compression ratio, and quality as the number of principal components <em>k</em> varies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={kMax}
              onChange={e => { const v = +e.target.value; setKMax(v); loadData(v); }}
              style={{
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: '9999px',
                padding: '9px 18px', fontSize: '0.8125rem', fontWeight: 600, color: '#374151',
                cursor: 'pointer', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <option value={50}>k up to 50</option>
              <option value={100}>k up to 100</option>
              <option value={150}>k up to 150</option>
            </select>
            <button
              onClick={() => loadData()}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#111827', color: '#fff', border: 'none',
                borderRadius: '9999px', padding: '9px 22px',
                fontSize: '0.8125rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s, transform 0.15s',
                boxShadow: '0 4px 16px rgba(17,24,39,0.25)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading…' : 'New Sample'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0', color: '#9CA3AF' }}>
          <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={26} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151' }}>Running PCA sweep…</p>
          <p style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Model is pre-loaded at server startup — this should be fast</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ maxWidth: '480px', margin: '40px auto', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '14px', padding: '18px 22px', color: '#DC2626', fontSize: '0.875rem', textAlign: 'center', fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 28px' }}>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <StatCard delay={0}   icon={<TrendingDown size={15} />} label="90% Variance at"      value={`k=${knee}`} sub="Elbow / optimal k"         color="#8B5CF6" />
            <StatCard delay={60}  icon={<Zap size={15} />}          label="Min Reconstruction MSE" value={minMse}     sub="Lowest error (high k)"    color="#10B981" />
            <StatCard delay={120} icon={<Layers size={15} />}       label="Max Variance Retained"  value={`${maxVar}%`} sub={`At k = ${kMax}`}        color="#F59E0B" />
            <StatCard delay={180} icon={<Award size={15} />}        label="Peak Quality Score"     value={`${bestQ}%`} sub="Composite fidelity index" color="#3B82F6" />
          </div>

          {/* 2×2 Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))', gap: '20px', marginBottom: '24px' }}>

            <ChartCard title="MSE vs k" subtitle="Mean Squared Error — lower is better. Drops sharply for small k, then plateaus." badge="Error" badgeColor="#EF4444">
              <SVGChart data={data} xKey="k" yKey="mse" label="MSE" color="#EF4444"
                refLineX={knee !== '—' ? knee : null} refLabel="90% var"
                yFormatter={v => v.toFixed(4)} />
            </ChartCard>

            <ChartCard title="Variance Retained (%) vs k" subtitle="Cumulative explained variance — how much information the compressed representation keeps." badge="Information" badgeColor="#10B981">
              <SVGChart data={data} xKey="k" yKey="variance_pct" label="Variance %" color="#10B981"
                refLineY={90} refLabel="90% threshold" unit="%" yFormatter={v => v.toFixed(1)} />
            </ChartCard>

            <ChartCard title="Compression Ratio vs k" subtitle="Storage savings = 784 / k. Decreases as k increases (more components = less compression)." badge="Storage" badgeColor="#3B82F6">
              <SVGChart data={data} xKey="k" yKey="compression_ratio" label="Ratio (×)" color="#3B82F6"
                yFormatter={v => v.toFixed(1)} unit="×" />
            </ChartCard>

            <ChartCard title="Quality Score vs k" subtitle="Composite fidelity: 0 = max loss, 100 = perfect reconstruction. Higher k = higher quality." badge="Accuracy" badgeColor="#8B5CF6">
              <SVGChart data={data} xKey="k" yKey="quality_score" label="Quality %" color="#8B5CF6"
                refLineY={90} refLabel="High quality" unit="%" yFormatter={v => v.toFixed(0)} />
            </ChartCard>
          </div>

          {/* Reference table */}
          <div style={{
            background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(235,237,240,0.9)', borderRadius: '20px',
            padding: '26px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            marginBottom: '20px',
          }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '3px' }}>Key k-value Reference Table</h3>
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Recommended operating points for different use-cases</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                    {['k', 'MSE', 'Variance %', 'Compression', 'Quality', 'Use-case'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[5, 10, 20, 40, 60, 80, 100].map(targetK => {
                    const row = data.reduce((best, d) => Math.abs(d.k - targetK) < Math.abs(best.k - targetK) ? d : best, data[0]);
                    if (!row) return null;
                    const qColor = row.quality_score >= 70 ? '#10B981' : row.quality_score >= 40 ? '#F59E0B' : '#EF4444';
                    const isElbow = row.k === knee;
                    return (
                      <tr key={targetK} style={{ borderBottom: '1px solid #F9FAFB', background: isElbow ? '#F0FDF4' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => !isElbow && (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => !isElbow && (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {row.k}{isElbow && <span style={{ fontSize: '0.5rem', background: '#D1FAE5', color: '#059669', padding: '1px 6px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase' }}>elbow</span>}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#6B7280' }}>{row.mse.toFixed(5)}</td>
                        <td style={{ padding: '11px 14px', color: '#6B7280' }}>{row.variance_pct.toFixed(1)}%</td>
                        <td style={{ padding: '11px 14px', color: '#6B7280' }}>{row.compression_ratio}×</td>
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: qColor }}>{row.quality_score}%</td>
                        <td style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: '0.75rem' }}>
                          {row.k <= 8 ? 'Maximum compression · structural sketch'
                            : row.k <= 20 ? 'Thumbnail preview · fast transfer'
                            : row.k <= 40 ? 'Balanced quality / size'
                            : row.k <= 70 ? 'Near-lossless · ✓ recommended'
                            : 'Archive quality · minimal compression'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footnote */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#9CA3AF', fontSize: '0.75rem', maxWidth: '720px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p>Each run uses a <strong style={{ color: '#6B7280' }}>random MNIST digit</strong>. PCA is fit with k_max components; each smaller k slices the latent space. The <strong style={{ color: '#6B7280' }}>90% variance threshold</strong> and the MSE elbow mark the optimal trade-off between compression and quality for most digit images.</p>
          </div>
        </div>
      )}
    </div>
  );
}
