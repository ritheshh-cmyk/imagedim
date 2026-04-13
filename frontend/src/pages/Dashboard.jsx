import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import {
  Download, RefreshCw, SlidersHorizontal, Image as ImageIcon,
  Loader2, Upload, X, ChevronRight, Info, Layers, GitBranch,
  Cpu, BarChart2, ScanLine,
} from 'lucide-react';
import { getSampleImage, processImage, processHDImage } from '../api';

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════ */

const Divider = () => <div style={{ borderTop: '1px solid #F3F4F6', margin: '12px 0' }} />;

const MetaRow = ({ label, value, highlight, mono = true }) => (
  <div className="meta-row">
    <span className="meta-label">{label}</span>
    <span className={`meta-value${highlight ? ' highlight' : ''}`}
      style={!mono ? { fontFamily: 'Inter, sans-serif' } : {}}>{value}</span>
  </div>
);

const StatChip = ({ label, value, sub, delay = 0 }) => (
  <div className="stat-chip" style={{ animationDelay: `${delay}ms` }}>
    <span className="stat-chip-label">{label}</span>
    <span className="stat-chip-value">{value}</span>
    {sub && <span className="stat-chip-sub">{sub}</span>}
  </div>
);

const SectionHdr = ({ icon, children }) => (
  <div className="section-header">
    {icon && <span style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>{icon}</span>}
    {children}
  </div>
);

const ImagePlaceholder = ({ label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px', color: '#D1D5DB' }}>
    <ImageIcon size={48} strokeWidth={1} />
    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D1D5DB' }}>{label}</p>
  </div>
);

/* Quality bar */
const QualityBar = ({ score }) => {
  const isHigh = score >= 70; const isMid = score >= 40;
  const color = isHigh ? '#10B981' : isMid ? '#F59E0B' : '#EF4444';
  const label = isHigh ? 'High Fidelity' : isMid ? 'Medium Fidelity' : 'Low Fidelity';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Visual Fidelity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, display: 'inline-block' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{score.toFixed(0)}% — {label}</span>
        </div>
      </div>
      <div className="quality-bar-track">
        <div className={`quality-bar-fill${!isHigh && isMid ? ' mid' : !isHigh && !isMid ? ' low' : ''}`} style={{ width: `${score}%` }} />
      </div>
      <p style={{ marginTop: '6px', fontSize: '0.6875rem', color: '#9CA3AF', lineHeight: 1.5 }}>
        {score >= 90 ? 'Excellent — barely distinguishable from origial.'
          : score >= 70 ? 'Good — minor blurring in fine-detail areas.'
          : score >= 50 ? 'Moderate — visible block artifacts, text may blur.'
          : 'Low — heavy compression; clear quality loss visible.'}
      </p>
    </div>
  );
};

/* Dim reduction visual */
const DimReductionBar = ({ original, compressed }) => {
  const pct = Math.round((compressed / original) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Dimension Reduction</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{original}D → {compressed}D</span>
      </div>
      <div className="dim-bar-outer">
        <div className="dim-bar-inner" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '0.625rem', color: '#D1D5DB', fontFamily: 'JetBrains Mono, monospace' }}>Original ({original}D)</span>
        <span style={{ fontSize: '0.625rem', color: '#374151', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>Compressed ({pct}% of dims)</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   DETAILED PIPELINE COMPONENT
═══════════════════════════════════════════ */
const ModelPipeline = ({ results, isHD, patchSize, components }) => {
  const containerRef = useRef(null);
  const patchDim = patchSize * patchSize * 3;
  const totalDims = results?.n_patches ? results.n_patches * patchDim : null;
  const compressedDims = results?.n_patches ? results.n_patches * components : null;

  useEffect(() => {
    if (!results || !containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.pipeline-step-card');
    gsap.fromTo(cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
    );
  }, [results]);

  const isOn = !!results;

  const steps = isHD ? [
    {
      icon: <Layers size={16} />,
      title: 'Input Image',
      value: results?.original_resolution ?? '—',
      details: [
        { l: 'Color Mode', v: 'RGB · 3 channels' },
        { l: 'Source', v: 'User Upload' },
        { l: 'Format', v: 'JPEG / PNG / WebP' },
      ],
    },
    {
      icon: <GitBranch size={16} />,
      title: 'Patch Extraction',
      value: `${results?.n_patches?.toLocaleString() ?? '—'} patches`,
      details: [
        { l: 'Patch Size', v: `${patchSize}×${patchSize}px` },
        { l: 'Vector Dim', v: `${patchDim}D per patch` },
        { l: 'PCA Subset', v: `≤ 2,500 patches used for fit` },
      ],
    },
    {
      icon: <Cpu size={16} />,
      title: 'PCA Fit (SVD)',
      value: 'Randomised SVD',
      details: [
        { l: 'Algorithm', v: 'sklearn RandomizedSVD' },
        { l: 'Input Dim', v: `${patchDim}D` },
        { l: 'Complexity', v: 'O(n·k) — not O(n³)' },
      ],
    },
    {
      icon: <BarChart2 size={16} />,
      title: 'Latent Space',
      value: `${patchDim}D → ${components}D`,
      details: [
        { l: 'Formula', v: 'z = (x − μ) · W' },
        { l: 'k components', v: String(components) },
        { l: 'Ratio', v: `${(patchDim / components).toFixed(1)}× per patch` },
      ],
    },
    {
      icon: <ScanLine size={16} />,
      title: 'PCA Output',
      value: results?.variance_retained_pct ? `${results.variance_retained_pct.toFixed(1)}% variance` : `MSE ${results?.mse?.toFixed(2) ?? '—'}`,
      details: [
        { l: 'Formula', v: 'x̂ = z · Wᵀ + μ' },
        { l: 'Compression', v: `${results?.compression_ratio?.toFixed(2) ?? '—'}×` },
        { l: 'MSE Loss', v: results?.mse?.toFixed(4) ?? '—' },
      ],
    },
  ] : [
    {
      icon: <Layers size={16} />, title: 'MNIST Digit',
      value: '28×28 = 784D',
      details: [
        { l: 'Grayscale', v: 'Single channel [0, 1]' },
        { l: 'Source', v: 'fetch_openml · random sample' },
        { l: 'Normalised', v: '÷ 255.0' },
      ],
    },
    {
      icon: <Cpu size={16} />, title: 'PCA Fit',
      value: '2,000 MNIST samples',
      details: [
        { l: 'Algorithm', v: 'Randomised SVD + whitening' },
        { l: 'Input Dim', v: '784D' },
        { l: 'Model Size', v: `784×${components} weights` },
      ],
    },
    {
      icon: <BarChart2 size={16} />, title: 'Latent Code',
      value: `784D → ${components}D`,
      details: [
        { l: 'z = (x − μ) · W', v: '' },
        { l: 'k components', v: String(components) },
        { l: 'Ratio', v: `${(784 / components).toFixed(1)}× per vector` },
      ],
    },
    {
      icon: <ScanLine size={16} />, title: 'PCA Output',
      value: `784D restored`,
      details: [
        { l: 'x̂ = z · Wᵀ + μ', v: '' },
        { l: 'Compression', v: `${results?.compression_ratio?.toFixed(2) ?? '—'}×` },
        { l: 'MSE Loss', v: results?.mse?.toFixed(6) ?? '—' },
      ],
    },
  ];

  return (
    <div ref={containerRef} style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ display: 'flex', gap: '0', minWidth: `${steps.length * 200}px` }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className={`pipeline-step-card${isOn ? ' step-on' : ''}${i === steps.length - 1 ? ' step-last' : ''}`}>
              <span className="step-number-badge">{String(i + 1).padStart(2, '0')}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', marginBottom: '4px', color: i === steps.length - 1 && isOn ? '#9CA3AF' : '#374151' }}>
                {step.icon}
              </div>
              <div className="step-title">{step.title}</div>
              <div className="step-value">{step.value}</div>

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {step.details.filter(d => d.l).map((d, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                    <span className="step-detail">{d.l}</span>
                    {d.v && <span className="step-detail" style={{ fontWeight: 600, textAlign: 'right' }}>{d.v}</span>}
                  </div>
                ))}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div className="step-arrow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <line x1="0" y1="16" x2="24" y2="16" className={`pipeline-connector${isOn ? ' active' : ''}`} />
                  <path d="M20 12 L26 16 L20 20" stroke={isOn ? '#374151' : '#D1D5DB'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Compression math */}
      {results && isHD && totalDims && compressedDims && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {[
            { l: 'Raw Patch Data', v: `${(totalDims / 1000).toFixed(0)}K floats`, sub: `${results.n_patches} × ${patchDim}` },
            { l: 'Latent Codes', v: `${(compressedDims / 1000).toFixed(0)}K floats`, sub: `${results.n_patches} × ${components}` },
            { l: 'Actual Saving', v: `${(totalDims / compressedDims).toFixed(1)}× patch reduction`, sub: 'codes only, excluding model weights' },
          ].map((m, i) => (
            <div key={i}
              style={{
                background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', padding: '14px',
                transition: 'box-shadow 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: '6px' }}>{m.l}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{m.v}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#94A3B8', marginTop: '3px' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
export default function Dashboard() {
  const [components, setComponents]         = useState(20);
  const [patchSize, setPatchSize]           = useState(8);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [isUploading, setIsUploading]       = useState(false);
  const [currentSample, setCurrentSample]   = useState(null);
  const [results, setResults]               = useState(null);
  const [error, setError]                   = useState('');
  const [isDragging, setIsDragging]         = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadedMode, setIsUploadedMode] = useState(false);
  const [backendOnline, setBackendOnline]   = useState(null); // null = unknown

  const fileInputRef = useRef(null);
  const metricsRef   = useRef(null);

  /* Backend ping */
  useEffect(() => {
    fetch('http://127.0.0.1:8000/docs').then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  /* Initial load */
  useEffect(() => { handleLoadSample(); }, []);

  /* GSAP animate metrics when results change */
  useEffect(() => {
    if (!results || !metricsRef.current) return;
    const chips = metricsRef.current.querySelectorAll('.stat-chip');
    gsap.fromTo(chips, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
  }, [results]);

  /* Run PCA */
  const runProcess = useCallback(async (n_components, sampleData, isUpload, patch_size = patchSize) => {
    if (!sampleData) return;
    try {
      setIsProcessing(true); setError('');
      let data;
      if (isUpload || sampleData instanceof File) {
        data = await processHDImage(sampleData, n_components, patch_size);
      } else {
        data = await processImage(n_components, sampleData);
      }
      setResults(data); setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
      setError(err.response?.data?.detail || 'Cannot reach backend — run: uvicorn backend.main:app --reload');
    } finally { setIsProcessing(false); }
  }, [patchSize]);

  /* Slider debounce */
  useEffect(() => {
    const delay = isUploadedMode ? 700 : 280;
    const t = setTimeout(() => { if (currentSample) runProcess(components, currentSample, isUploadedMode); }, delay);
    return () => clearTimeout(t);
  }, [components, patchSize]);

  const handleLoadSample = async () => {
    try {
      setIsProcessing(true); setError(''); setUploadedFileName(''); setIsUploadedMode(false);
      const sample = await getSampleImage();
      setCurrentSample(sample);
      await runProcess(components, sample, false);
    } catch {
      setBackendOnline(false);
      setError('Cannot reach backend. Run: uvicorn backend.main:app --reload');
    } finally { setIsProcessing(false); }
  };

  const handleFileUpload = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) { setError('Please upload a valid image file.'); return; }
    try {
      setComponents(8);
      setIsUploading(true); setError(''); setUploadedFileName(file.name);
      setIsUploadedMode(true); setCurrentSample(file);
      await runProcess(8, file, true, patchSize);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.'); setUploadedFileName('');
    } finally { setIsUploading(false); }
  }, [patchSize]);

  const onFileChange = (e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; };
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileUpload(f); };

  const handleDownload = () => {
    if (!results) return;
    const a = document.createElement('a');
    a.href = results.reconstructed_image_b64; a.download = `pca_k${components}_output.png`; a.click();
  };

  const qualityScore = results
    ? Math.min(100, Math.max(0, results.variance_retained_pct ?? Math.max(0, 100 - (results.mse ?? 0) * 800)))
    : 0;

  const busy     = isProcessing || isUploading;
  const isHDMode = isUploadedMode && (results?.original_resolution || isUploading);
  const patchDim = patchSize * patchSize * 3;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: '60px' }}>


      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Page Header ── */}
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            PCA Compression Lab
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '6px', lineHeight: 1.6 }}>
            Upload an image or use MNIST · Adjust k components · Observe quality vs size trade-off in real time
          </p>
        </header>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '0.8125rem', fontWeight: 500,
          }}>
            <X size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* ══ ROW 1: Controls + Images ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: '14px', marginBottom: '14px' }}>

          {/* ── Controls ── */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <SectionHdr icon={<SlidersHorizontal size={13} />}>Controls</SectionHdr>

            {/* k slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>
                  Components (k)
                </label>
                <div style={{ background: '#111827', color: '#FFFFFF', borderRadius: '7px', padding: '3px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', fontWeight: 800 }}>
                  {components}
                </div>
              </div>
              <input
                type="range" min="1" max={isUploadedMode ? 200 : 150}
                value={components} onChange={(e) => setComponents(+e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.625rem', color: '#D1D5DB', fontFamily: 'JetBrains Mono, monospace' }}>
                <span>1 — smallest</span>
                <span>{isUploadedMode ? 200 : 150} — sharpest</span>
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.6875rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                Fewer = smaller file + blurrier. More = larger file + sharper.
              </p>
            </div>

            <Divider />

            {/* DimBar */}
            <div style={{ marginBottom: '16px' }}>
              <DimReductionBar original={isUploadedMode ? patchDim : 784} compressed={components} />
            </div>

            <Divider />

            {/* Patch size (HD mode only) */}
            {isUploadedMode && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', display: 'block', marginBottom: '8px' }}>
                    Patch Size
                  </label>
                  <div className="patch-radio-group">
                    {[4, 8, 16].map(sz => (
                      <button key={sz} disabled={busy}
                        onClick={() => { setPatchSize(sz); if (currentSample) runProcess(components, currentSample, true, sz); }}
                        className={`patch-radio-btn${patchSize === sz ? ' selected' : ''}`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.625rem', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>4px=48D</span><span>8px=192D</span><span>16px=768D</span>
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Actions */}
            <button onClick={handleLoadSample} disabled={busy} className="btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}>
              {isProcessing && !isUploading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              MNIST Demo
            </button>

            {/* Upload zone — label wraps input for native file picker */}
            <label
              htmlFor="upload-file-input"
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              className={`upload-zone${isDragging ? ' dragging' : ''}`}
              style={{
                opacity: busy ? 0.6 : 1,
                cursor: busy ? 'not-allowed' : 'pointer',
                display: 'block',
                pointerEvents: busy ? 'none' : 'auto',
              }}
            >
              <input
                id="upload-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
                disabled={busy}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                {isUploading
                  ? <Loader2 size={22} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                  : <Upload size={22} style={{ color: isDragging ? '#111827' : '#9CA3AF' }} />
                }
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151' }}>
                  {isUploading ? 'Processing…' : 'Upload Image'}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                  {isDragging ? 'Drop here!' : 'JPEG · PNG · WebP · any size'}
                </p>
                {uploadedFileName && !isUploading && (
                  <span style={{ fontSize: '0.625rem', fontFamily: 'JetBrains Mono, monospace', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '9999px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uploadedFileName}
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* ── ORIGINAL IMAGE ── */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <SectionHdr icon={<ImageIcon size={13} />}>Original Input</SectionHdr>

            {busy && !results
              ? <div className="skeleton" style={{ flex: 1, minHeight: '300px', borderRadius: '12px' }} />
              : results ? (
                <>
                  <div className="image-frame" style={{ flex: 1, minHeight: '280px', marginBottom: '14px', position: 'relative' }}>
                    {busy && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '13px', zIndex: 5, backdropFilter: 'blur(4px)' }}>
                        <Loader2 size={28} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                    <img src={results.original_image_b64} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '300px' }} />
                    {/* Overlay badge */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span className="tag" style={{ background: 'rgba(17,24,39,0.85)', color: '#FFFFFF', border: 'none', backdropFilter: 'blur(6px)' }}>
                        ORIGINAL
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {isHDMode ? (
                      <>
                        <MetaRow label="File" value={uploadedFileName} />
                        <MetaRow label="Resolution" value={results.original_resolution ?? '—'} />
                        <MetaRow label="Mode" value={`${patchSize}×${patchSize}×3 = ${patchDim}D patches`} />
                        <MetaRow label="Patches" value={results.n_patches?.toLocaleString() ?? '—'} />
                      </>
                    ) : (
                      <>
                        <MetaRow label="Dataset" value="MNIST Handwritten Digit" mono={false} />
                        <MetaRow label="Dimensions" value="28×28 = 784D" />
                        <MetaRow label="Channel" value="Grayscale · normalised [0,1]" mono={false} />
                      </>
                    )}
                  </div>
                </>
              ) : <ImagePlaceholder label="Awaiting input" />
            }
          </div>

          {/* ── PCA OUTPUT IMAGE ── */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <SectionHdr icon={<ChevronRight size={13} strokeWidth={3} />}>PCA Compressed Output</SectionHdr>

            {busy && !results
              ? <div className="skeleton" style={{ flex: 1, minHeight: '300px', borderRadius: '12px' }} />
              : results ? (
                <>
                  <div className="image-frame image-frame-output" style={{ flex: 1, minHeight: '280px', marginBottom: '14px', position: 'relative' }}>
                    {busy && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '13px', zIndex: 5, backdropFilter: 'blur(4px)' }}>
                        <Loader2 size={28} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                    <img src={results.reconstructed_image_b64} alt="PCA compressed" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '300px' }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span className="tag" style={{ background: 'rgba(17,24,39,0.85)', color: '#FFFFFF', border: 'none', backdropFilter: 'blur(6px)' }}>
                        k={results.n_components} OUTPUT
                      </span>
                    </div>
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className="tag" style={{
                        background: qualityScore >= 70 ? 'rgba(5,150,105,0.9)' : qualityScore >= 40 ? 'rgba(217,119,6,0.9)' : 'rgba(220,38,38,0.9)',
                        color: '#FFFFFF', border: 'none', backdropFilter: 'blur(6px)'
                      }}>
                        {qualityScore.toFixed(0)}% fidelity
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                    <MetaRow label="k Components" value={String(results.n_components)} highlight />
                    <MetaRow label="Compression" value={`${results.compression_ratio.toFixed(2)}×`} highlight />
                    {results.variance_retained_pct != null && <MetaRow label="Variance Kept" value={`${results.variance_retained_pct.toFixed(1)}%`} />}
                    <MetaRow label="MSE Loss" value={results.mse.toFixed(results.mse < 1 ? 4 : 2)} />
                  </div>

                  <QualityBar score={Math.min(100, Math.max(0, qualityScore))} />

                  <button onClick={handleDownload} className="btn-ghost btn-sm" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                    <Download size={13} /> Download Output
                  </button>
                </>
              ) : <ImagePlaceholder label="Output appears here" />
            }
          </div>
        </div>

        {/* ══ ROW 2: Metrics ══ */}
        {results && (
          <div ref={metricsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '16px' }}>
            <StatChip label="MSE" value={results.mse < 1 ? results.mse.toFixed(4) : results.mse.toFixed(2)} sub="Mean Squared Error — lower is sharper" delay={0} />
            <StatChip label="Compression" value={`${results.compression_ratio.toFixed(2)}×`} sub="Data reduction factor" delay={80} />
            {results.variance_retained_pct != null && (
              <StatChip label="Variance Retained" value={`${results.variance_retained_pct.toFixed(1)}%`} sub="Information preserved by top-k eigenvectors" delay={160} />
            )}
            <StatChip label="k (Components)" value={String(results.n_components)} sub="Eigenvectors kept" delay={240} />
            {results.n_patches != null && (
              <StatChip label="Patches" value={results.n_patches.toLocaleString()} sub={`Each ${patchDim}D → ${results.n_components}D`} delay={320} />
            )}
          </div>
        )}

        {/* ══ ROW 3: Model Pipeline ══ */}
        <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '16px' }}>
          <SectionHdr icon={<Cpu size={13} />}>Model Pipeline — Step-by-Step Execution</SectionHdr>

          {results ? (
            <ModelPipeline results={results} isHD={isHDMode} patchSize={patchSize} components={components} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '40px 0', color: '#D1D5DB' }}>
              <Cpu size={36} strokeWidth={1} />
              <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', fontWeight: 500 }}>Pipeline activates after first compression run</p>
            </div>
          )}
        </div>

        {/* ══ ROW 4: What Happened Explanation ══ */}
        {results && (
          <div className="glass-card" style={{ padding: '24px 28px' }}>
            <SectionHdr icon={<Info size={13} />}>What Just Happened — Plain English</SectionHdr>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Explanation text */}
              <div>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.75, marginBottom: '12px' }}>
                  Your {isHDMode ? 'uploaded photo' : 'MNIST digit'} was split into{' '}
                  <strong>{isHDMode ? results.n_patches?.toLocaleString() ?? '—' : '1'}</strong>{' '}
                  {isHDMode ? `${patchSize}×${patchSize} pixel patches` : '28×28 pixel block'} — each becoming a{' '}
                  <strong>{isHDMode ? patchDim : 784}-dimensional vector</strong>. PCA found the{' '}
                  <strong>k={results.n_components}</strong> eigenvectors that capture the most variance in that space,
                  then projected every {isHDMode ? 'patch' : 'digit vector'} onto those axes.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.75, marginBottom: '12px' }}>
                  The result is a <strong>{results.n_components}-dimensional</strong> code per {isHDMode ? 'patch' : 'image'},
                  versus the original <strong>{isHDMode ? patchDim : 784} dimensions</strong>.
                  That's a <strong>{(isHDMode ? patchDim : 784) / results.n_components > 1 ? ((isHDMode ? patchDim : 784) / results.n_components).toFixed(1) : 1}× reduction per vector</strong>.
                  The output image is built by projecting those codes back to pixel space using the transpose of W.
                </p>
                {results.variance_retained_pct != null && (
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.75 }}>
                    The top <strong>{results.n_components} principal components</strong> captured{' '}
                    <strong>{results.variance_retained_pct.toFixed(1)}%</strong> of total image variance.
                    The remaining {(100 - results.variance_retained_pct).toFixed(1)}% — mostly fine texture and noise —
                    was discarded, which is what causes the visual softening you see.
                  </p>
                )}
              </div>

              {/* Math summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#F8F9FA', border: '1px solid #F3F4F6', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: '12px' }}>Compression Math</p>
                  {[
                    { label: 'Original dim per vector', value: `${isHDMode ? patchDim : 784}D` },
                    { label: 'Compressed dim per vector', value: `${results.n_components}D` },
                    { label: 'Dim reduction factor', value: `${((isHDMode ? patchDim : 784) / results.n_components).toFixed(2)}×` },
                    { label: 'Overall data ratio', value: `${results.compression_ratio.toFixed(2)}×` },
                    { label: 'MSE reconstruction loss', value: results.mse.toFixed(results.mse < 1 ? 6 : 3) },
                    ...(results.variance_retained_pct != null ? [{ label: 'Variance retained', value: `${results.variance_retained_pct.toFixed(2)}%` }] : []),
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Trade-off tip */}
                <div style={{ background: results.n_components < 10 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${results.n_components < 10 ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: results.n_components < 10 ? '#DC2626' : '#059669' }}>
                    {results.n_components < 10
                      ? `⚠️ Very low k=${results.n_components}. Expect heavy blurring — most image detail is discarded. Good for studying compression extremes.`
                      : results.n_components < 30
                      ? `👁️ k=${results.n_components} — moderate compression. Visible softening but overall structure preserved.`
                      : `✅ k=${results.n_components} — high fidelity. Most visual details retained with ${results.compression_ratio.toFixed(1)}× data reduction.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
