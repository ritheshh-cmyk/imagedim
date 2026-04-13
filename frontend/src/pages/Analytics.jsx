import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, TrendingDown, Layers, Zap, Award, Info, Loader2 } from 'lucide-react';
import { fetchSweep } from '../api';

/* ══════════════════════════════════════════════════════════════
   SVG CHART — uses real pixel coordinates (600 × 280 viewBox)
══════════════════════════════════════════════════════════════ */
const CHART_W = 600;
const CHART_H = 260;
const PAD = { top: 20, right: 20, bottom: 44, left: 60 };
const CW = CHART_W - PAD.left - PAD.right; // drawable width
const CH = CHART_H - PAD.top  - PAD.bottom; // drawable height

const SVGChart = ({
  data, xKey, yKey, label, color, unit = '',
  refLineY = null, refLineX = null, refLabel = '',
  yFormatter = v => v.toFixed(3),
}) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data.length) return null;

  const xs = data.map(d => d[xKey]);
  const ys = data.map(d => d[yKey]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = 0, maxY = Math.max(...ys) * 1.08;

  const sx = x => PAD.left + ((x - minX) / (maxX - minX || 1)) * CW;
  const sy = y => PAD.top  + (1 - (y - minY) / (maxY - minY || 1)) * CH;

  const pts  = data.map(d => [sx(d[xKey]), sy(d[yKey])]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const area = `${line} L${pts.at(-1)[0].toFixed(1)},${sy(0)} L${pts[0][0].toFixed(1)},${sy(0)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => minY + t * (maxY - minY));
  const xStep = Math.ceil(data.length / 5);
  const xTicks = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  const onMouseMove = useCallback(e => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let best = 0, bestD = Infinity;
    pts.forEach(([px], i) => { const d = Math.abs(px - mx); if (d < bestD) { bestD = d; best = i; } });
    setHoverIdx(best);
  }, [pts]);

  const hov = hoverIdx != null ? data[hoverIdx] : null;
  const gradId = `g_${yKey}`;
  const clipId = `c_${yKey}`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={PAD.left} y={PAD.top} width={CW} height={CH} />
          </clipPath>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <line key={i}
            x1={PAD.left} x2={PAD.left + CW}
            y1={sy(t)}    y2={sy(t)}
            stroke="#F1F5F9" strokeWidth="1"
          />
        ))}

        {/* Ref Y (e.g. 90% variance) */}
        {refLineY != null && refLineY >= minY && refLineY <= maxY && (
          <>
            <line x1={PAD.left} x2={PAD.left + CW} y1={sy(refLineY)} y2={sy(refLineY)}
              stroke="#F59E0B" strokeWidth="1" strokeDasharray="5,4" />
            <text x={PAD.left + CW - 4} y={sy(refLineY) - 5}
              fontSize="11" fill="#F59E0B" textAnchor="end" fontWeight="600">{refLabel}</text>
          </>
        )}

        {/* Ref X (elbow k) */}
        {refLineX != null && (
          <>
            <line x1={sx(refLineX)} x2={sx(refLineX)} y1={PAD.top} y2={PAD.top + CH}
              stroke="#818CF8" strokeWidth="1" strokeDasharray="5,4" />
            <text x={sx(refLineX) + 4} y={PAD.top + 14}
              fontSize="11" fill="#818CF8" fontWeight="600">k={refLineX}</text>
          </>
        )}

        {/* Area */}
        <path d={area} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

        {/* Line */}
        <path d={line} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${clipId})`} />

        {/* Hover dot */}
        {hov && (
          <circle cx={sx(hov[xKey])} cy={sy(hov[yKey])} r="4"
            fill={color} stroke="#fff" strokeWidth="2" />
        )}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PAD.left - 8} y={sy(t) + 4}
            fontSize="11" fill="#94A3B8" textAnchor="end">{yFormatter(t)}</text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((d, i) => (
          <text key={i} x={sx(d[xKey])} y={PAD.top + CH + 18}
            fontSize="11" fill="#94A3B8" textAnchor="middle">{d[xKey]}</text>
        ))}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left}       y1={PAD.top} y2={PAD.top + CH} stroke="#E2E8F0" strokeWidth="1" />
        <line x1={PAD.left} x2={PAD.left + CW}  y1={PAD.top + CH} y2={PAD.top + CH} stroke="#E2E8F0" strokeWidth="1" />

        {/* Axis titles */}
        <text x={PAD.left + CW / 2} y={CHART_H - 2}
          fontSize="11" fill="#94A3B8" textAnchor="middle">Components (k)</text>
        <text x={16} y={PAD.top + CH / 2}
          fontSize="11" fill="#94A3B8" textAnchor="middle"
          transform={`rotate(-90, 16, ${PAD.top + CH / 2})`}>{label}</text>
      </svg>

      {/* Tooltip */}
      {hov && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: '#0F172A', borderRadius: 8, padding: '8px 12px',
          pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>k = {hov[xKey]}</p>
          <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
            {yFormatter(hov[yKey])}{unit}
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Stat card ──────────────────────────────────────────────── */
const Stat = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12,
    padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'transform .2s ease, box-shadow .2s ease',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8' }}>{label}</span>
    </div>
    <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: '#94A3B8' }}>{sub}</span>}
  </div>
);

/* ── Chart card ─────────────────────────────────────────────── */
const Card = ({ title, subtitle, tag, tagColor = '#64748B', children }) => (
  <div style={{
    background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12,
    padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow .2s ease',
  }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{title}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', lineHeight: 1.4 }}>{subtitle}</p>
      </div>
      {tag && (
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
          padding: '3px 9px', borderRadius: 9999, flexShrink: 0,
          background: `${tagColor}12`, color: tagColor, border: `1px solid ${tagColor}22`,
        }}>{tag}</span>
      )}
    </div>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [kMax, setKMax]     = useState(100);

  const load = async (k = kMax) => {
    setLoading(true); setError(null);
    try { const r = await fetchSweep(k, 2); setData(r.sweep); }
    catch { setError('Backend offline — run: ./start.sh'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const knee   = data.find(d => d.variance_pct >= 90)?.k ?? '—';
  const minMse = data.length ? Math.min(...data.map(d => d.mse)).toFixed(5) : '—';
  const maxVar = data.length ? Math.max(...data.map(d => d.variance_pct)).toFixed(1) : '—';
  const bestQ  = data.length ? Math.max(...data.map(d => d.quality_score)).toFixed(0) : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: '#94A3B8' }}>
              Model Analytics
            </p>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#0F172A', letterSpacing: '-.02em' }}>
              Accuracy &amp; Performance
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#64748B', maxWidth: 480, lineHeight: 1.6 }}>
              Live PCA curves across <em>k</em> principal components — MSE, variance retained, compression, and quality.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={kMax}
              onChange={e => { const v = +e.target.value; setKMax(v); load(v); }}
              style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
                padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#334155',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value={50}>k up to 50</option>
              <option value={100}>k up to 100</option>
              <option value={150}>k up to 150</option>
            </select>
            <button
              onClick={() => load()}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#0F172A', color: '#F8FAFC', border: 'none', borderRadius: 8,
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? .6 : 1, transition: 'opacity .15s, transform .15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading…' : 'New Sample'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            <Loader2 size={32} style={{ color: '#334155', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#334155' }}>Running PCA sweep…</p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>Model is pre-loaded at startup</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ maxWidth: 440, margin: '40px auto', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '16px 20px', color: '#DC2626', fontSize: 14, textAlign: 'center', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            {/* Stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              <Stat icon={<TrendingDown size={14} />} label="90% Variance at"      value={`k=${knee}`}     sub="Elbow point"             color="#6366F1" />
              <Stat icon={<Zap size={14} />}          label="Min MSE"              value={minMse}          sub="Lowest error (high k)"   color="#10B981" />
              <Stat icon={<Layers size={14} />}       label="Max Variance"         value={`${maxVar}%`}   sub={`At k = ${kMax}`}        color="#F59E0B" />
              <Stat icon={<Award size={14} />}        label="Peak Quality"         value={`${bestQ}%`}    sub="Fidelity index"          color="#3B82F6" />
            </div>

            {/* 2×2 charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: 16, marginBottom: 20 }}>
              <Card title="MSE vs k" subtitle="Mean Squared Error — lower is better. Drops sharply, then plateaus." tag="Error" tagColor="#EF4444">
                <SVGChart data={data} xKey="k" yKey="mse" label="MSE" color="#EF4444"
                  refLineX={knee !== '—' ? knee : null} refLabel="elbow"
                  yFormatter={v => v.toFixed(4)} />
              </Card>

              <Card title="Variance Retained (%) vs k" subtitle="Cumulative explained variance — information preservation." tag="Information" tagColor="#10B981">
                <SVGChart data={data} xKey="k" yKey="variance_pct" label="Variance %" color="#10B981"
                  refLineY={90} refLabel="90% threshold" unit="%" yFormatter={v => v.toFixed(1)} />
              </Card>

              <Card title="Compression Ratio vs k" subtitle="Storage savings = 784 / k. High ratio = small file, lower quality." tag="Storage" tagColor="#3B82F6">
                <SVGChart data={data} xKey="k" yKey="compression_ratio" label="Ratio ×" color="#3B82F6"
                  yFormatter={v => v.toFixed(1)} unit="×" />
              </Card>

              <Card title="Quality Score vs k" subtitle="Composite fidelity: 0 = max loss, 100 = perfect reconstruction." tag="Accuracy" tagColor="#8B5CF6">
                <SVGChart data={data} xKey="k" yKey="quality_score" label="Quality %" color="#8B5CF6"
                  refLineY={90} refLabel="High quality" unit="%" yFormatter={v => v.toFixed(0)} />
              </Card>
            </div>

            {/* Reference table */}
            <div style={{ background: '#fff', border: '1px solid #F1F5F9', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#0F172A' }}>k-value Reference Table</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94A3B8' }}>Recommended operating points for different use-cases</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['k', 'MSE', 'Variance', 'Compression', 'Quality', 'Use-case'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#94A3B8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 10, 20, 40, 60, 80, 100].map(tk => {
                      const row = data.reduce((b, d) => Math.abs(d.k - tk) < Math.abs(b.k - tk) ? d : b, data[0]);
                      if (!row) return null;
                      const qC = row.quality_score >= 70 ? '#10B981' : row.quality_score >= 40 ? '#F59E0B' : '#EF4444';
                      const isE = row.k === knee;
                      return (
                        <tr key={tk}
                          style={{ borderBottom: '1px solid #F8FAFC', background: isE ? '#F0FDF4' : 'transparent', transition: 'background .12s' }}
                          onMouseEnter={e => { if (!isE) e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={e => { if (!isE) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>
                            {row.k}{isE && <span style={{ marginLeft: 6, fontSize: 10, background: '#D1FAE5', color: '#059669', padding: '1px 7px', borderRadius: 9999, fontWeight: 700 }}>elbow</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.mse.toFixed(5)}</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.variance_pct.toFixed(1)}%</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.compression_ratio}×</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: qC }}>{row.quality_score}%</td>
                          <td style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                            {row.k <= 8 ? 'Maximum compression' : row.k <= 20 ? 'Thumbnail / fast transfer' : row.k <= 40 ? 'Balanced quality/size' : row.k <= 70 ? '✓ Recommended' : 'Near-lossless'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div style={{ display: 'flex', gap: 10, color: '#94A3B8', fontSize: 12, maxWidth: 640, alignItems: 'flex-start' }}>
              <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, lineHeight: 1.6 }}>Each run uses a <strong style={{ color: '#64748B' }}>random MNIST digit</strong>. PCA is fit once with k_max components; each k slices the latent space. The <strong style={{ color: '#64748B' }}>90% variance line</strong> marks the elbow where adding more components gives diminishing returns.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
