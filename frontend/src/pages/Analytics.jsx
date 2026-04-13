import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { RefreshCw, TrendingDown, Layers, Zap, Award, Info, Loader2 } from 'lucide-react';
import { fetchSweep } from '../api';

/* ─── Custom Tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: '1px solid #E5E7EB',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)', fontFamily: 'JetBrains Mono, monospace',
    }}>
      <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginBottom: '4px' }}>k = {label} components</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '0.8125rem', fontWeight: 700, color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}{unit}
        </p>
      ))}
    </div>
  );
};

/* ─── Stat Card ──────────────────────────────────────────────── */
const InfoCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    border: '1px solid #E5E7EB', borderRadius: '16px',
    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.10)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color }}>
      {icon}
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{label}</span>
    </div>
    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{sub}</span>}
  </div>
);

/* ─── Chart Card ─────────────────────────────────────────────── */
const ChartCard = ({ title, subtitle, badge, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(14px)',
    border: '1px solid #E5E7EB', borderRadius: '18px',
    padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '3px' }}>{title}</h3>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{subtitle}</p>
      </div>
      {badge && (
        <span style={{
          fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', padding: '3px 9px', borderRadius: '9999px',
          background: '#F3F4F6', color: '#6B7280',
        }}>{badge}</span>
      )}
    </div>
    {children}
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kMax, setKMax] = useState(100);
  const [crosshairK, setCrosshairK] = useState(null);

  const loadData = async (k = kMax) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSweep(k, 2);
      setData(res.sweep);
    } catch (e) {
      setError('Backend offline — run: ./start.sh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* Derived stats from sweep data */
  const knee = data.find(d => d.variance_pct >= 90)?.k ?? '—';
  const minMse = data.length ? Math.min(...data.map(d => d.mse)).toFixed(5) : '—';
  const maxVar = data.length ? Math.max(...data.map(d => d.variance_pct)).toFixed(1) : '—';
  const bestQ  = data.length ? Math.max(...data.map(d => d.quality_score)).toFixed(0) : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F8', paddingTop: '96px', paddingBottom: '80px' }}>

      {/* Page header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: '6px' }}>
              Model Analytics
            </p>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Accuracy &amp; Performance
            </h1>
            <p style={{ marginTop: '8px', fontSize: '0.9375rem', color: '#6B7280', maxWidth: '540px' }}>
              Mathematical curves showing how reconstruction quality, information retention, and storage efficiency change as the number of principal components (<em>k</em>) increases.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={kMax}
              onChange={e => { setKMax(+e.target.value); loadData(+e.target.value); }}
              style={{
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: '9999px',
                padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 600, color: '#374151',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value={50}>k up to 50</option>
              <option value={100}>k up to 100</option>
              <option value={150}>k up to 150</option>
            </select>
            <button
              onClick={() => loadData()}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#111827', color: '#fff', border: 'none',
                borderRadius: '9999px', padding: '9px 20px',
                fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'New Sample'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '80px 0', color: '#9CA3AF' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#374151' }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Computing PCA sweep across {kMax} k values…</p>
          <p style={{ fontSize: '0.75rem' }}>First load trains the model on MNIST — takes ~10s</p>
        </div>
      )}
      {error && !loading && (
        <div style={{ maxWidth: '480px', margin: '40px auto', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', color: '#DC2626', fontSize: '0.875rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>

          {/* ── Stat Strip ────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <InfoCard icon={<TrendingDown size={15} />} label="90% Variance at k ="  value={`k=${knee}`} sub="Elbow / knee point" color="#8B5CF6" />
            <InfoCard icon={<Zap size={15} />}         label="Min MSE"               value={minMse}       sub="Lowest error achieved"  color="#10B981" />
            <InfoCard icon={<Layers size={15} />}      label="Max Variance Retained" value={`${maxVar}%`} sub={`At k=${kMax}`}          color="#F59E0B" />
            <InfoCard icon={<Award size={15} />}       label="Peak Quality Score"    value={`${bestQ}%`}  sub="Model fidelity index"   color="#3B82F6" />
          </div>

          {/* ── Charts 2×2 grid ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))', gap: '20px' }}>

            {/* 1. MSE vs k ─────────────────────────────────────── */}
            <ChartCard
              title="Reconstruction Error (MSE) vs k"
              subtitle="Mean Squared Error between original & reconstructed — lower is better"
              badge="Loss Curve"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="k" tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Components (k)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={v => v.toFixed(3)} width={52} />
                  <Tooltip content={<CustomTooltip />} />
                  {knee !== '—' && <ReferenceLine x={knee} stroke="#8B5CF6" strokeDasharray="4 3" label={{ value: `90% var k=${knee}`, position: 'top', fontSize: 10, fill: '#8B5CF6' }} />}
                  <Area type="monotone" dataKey="mse" name="MSE" stroke="#EF4444" strokeWidth={2.5} fill="url(#mseGrad)" dot={false} activeDot={{ r: 4, fill: '#EF4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Variance Retained vs k ───────────────────────── */}
            <ChartCard
              title="Variance Retained (%) vs k"
              subtitle="How much of the original information the compressed representation preserves"
              badge="Information"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="k" tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Components (k)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={[0, 100]} unit="%" width={44} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="4 3" label={{ value: '90% threshold', position: 'insideTopRight', fontSize: 10, fill: '#F59E0B' }} />
                  <Area type="monotone" dataKey="variance_pct" name="Variance %" stroke="#10B981" strokeWidth={2.5} fill="url(#varGrad)" dot={false} activeDot={{ r: 4, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Compression Ratio vs k ───────────────────────── */}
            <ChartCard
              title="Compression Ratio vs k"
              subtitle="Storage savings: ratio of original dim (784) to compressed dim (k). Higher = more compressed."
              badge="Storage"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="k" tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Components (k)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} width={44} />
                  <Tooltip content={<CustomTooltip unit="×" />} />
                  <Area type="monotone" dataKey="compression_ratio" name="Ratio" stroke="#3B82F6" strokeWidth={2.5} fill="url(#ratioGrad)" dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Quality Score vs k ───────────────────────────── */}
            <ChartCard
              title="Quality Score vs k"
              subtitle="Composite fidelity score: 0 = maximum loss, 100 = perfect reconstruction"
              badge="Accuracy"
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="k" tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Components (k)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} domain={[0, 100]} unit="%" width={44} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <ReferenceLine y={90} stroke="#10B981" strokeDasharray="4 3" label={{ value: 'High quality', position: 'insideTopRight', fontSize: 10, fill: '#10B981' }} />
                  <Line type="monotone" dataKey="quality_score" name="Quality" stroke="#8B5CF6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Tradeoff Table ────────────────────────────────── */}
          <div style={{ marginTop: '24px' }}>
            <ChartCard title="Key k-value Trade-off Reference" subtitle="Recommended operating points for different use-cases" badge="Reference">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                      {['k', 'MSE', 'Variance %', 'Compression', 'Quality', 'Use-case'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 10, 20, 40, 60, 80, 100].map(k => {
                      const row = data.find(d => Math.abs(d.k - k) <= 2);
                      if (!row) return null;
                      const qColor = row.quality_score >= 70 ? '#10B981' : row.quality_score >= 40 ? '#F59E0B' : '#EF4444';
                      return (
                        <tr key={k} style={{ borderBottom: '1px solid #F9FAFB' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#111827' }}>{row.k}</td>
                          <td style={{ padding: '10px 12px', color: '#6B7280' }}>{row.mse.toFixed(5)}</td>
                          <td style={{ padding: '10px 12px', color: '#6B7280' }}>{row.variance_pct.toFixed(1)}%</td>
                          <td style={{ padding: '10px 12px', color: '#6B7280' }}>{row.compression_ratio}×</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: qColor }}>{row.quality_score}%</td>
                          <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: '0.75rem' }}>
                            {row.k <= 8 ? 'Maximum compression · structural sketch'
                              : row.k <= 20 ? 'Thumbnail preview · fast transfer'
                              : row.k <= 40 ? 'Balanced quality/size'
                              : row.k <= 70 ? 'Near-lossless · recommended'
                              : 'Archive quality · minimal compression'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>

          {/* ── Info footnote ─────────────────────────────────── */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#9CA3AF', fontSize: '0.75rem', maxWidth: '680px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p>Each chart run uses a <strong style={{ color: '#6B7280' }}>random MNIST digit</strong> compressed at every k value with a single fitted PCA (k_max components). Click <em>New Sample</em> to regenerate with a different digit. The 90% variance line marks the commonly used "elbow" point where adding more components gives diminishing returns.</p>
          </div>

        </div>
      )}
    </div>
  );
}
