import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download, RefreshCw, SlidersHorizontal, Image as ImageIcon,
  Loader2, Upload, X, ChevronRight, Info,
} from 'lucide-react';
import { getSampleImage, processImage, processHDImage } from '../api';

/* ── Inline helpers ── */
const Divider = () => <div style={{ borderTop: '1px solid #F3F4F6', margin: '16px 0' }} />;

const SectionHeader = ({ icon, children }) => (
  <div className="section-header">
    {icon && <span style={{ color: '#9CA3AF' }}>{icon}</span>}
    {children}
  </div>
);

/* ── Quality bar ── */
const QualityBar = ({ score }) => {
  const color = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF' }}>
          Fidelity Score
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: '700', color, fontFamily: "'JetBrains Mono', monospace" }}>
          {score.toFixed(0)}%
        </span>
      </div>
      <div className="quality-bar-track">
        <div className="quality-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
};

/* ── Stat chip ── */
const StatChip = ({ label, value, sub }) => (
  <div className="stat-chip">
    <span className="stat-chip-label">{label}</span>
    <span className="stat-chip-value">{value}</span>
    {sub && <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '2px' }}>{sub}</span>}
  </div>
);

/* ── Image placeholder ── */
const ImagePlaceholder = ({ label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '240px', gap: '10px', color: '#D1D5DB',
  }}>
    <ImageIcon size={40} strokeWidth={1} />
    <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D1D5DB' }}>
      {label}
    </p>
  </div>
);

/* ══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
function Dashboard() {
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

  const fileInputRef = useRef(null);

  /* ── Initial load ── */
  useEffect(() => { handleLoadSample(); }, []);

  /* ── Run compression ── */
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
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Processing failed. Is the backend running?');
    } finally {
      setIsProcessing(false);
    }
  }, [patchSize]);

  /* ── Slider debounce ── */
  useEffect(() => {
    const delay = isUploadedMode ? 700 : 280;
    const t = setTimeout(() => {
      if (currentSample) runProcess(components, currentSample, isUploadedMode);
    }, delay);
    return () => clearTimeout(t);
  }, [components, patchSize]);

  const handleLoadSample = async () => {
    try {
      setIsProcessing(true); setError(''); setUploadedFileName(''); setIsUploadedMode(false);
      const sample = await getSampleImage();
      setCurrentSample(sample);
      await runProcess(components, sample, false);
    } catch {
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
      setError(err.response?.data?.detail || 'Upload failed.');
      setUploadedFileName('');
    } finally { setIsUploading(false); }
  }, [patchSize]);

  const onFileChange  = (e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; };
  const onDragOver    = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave   = () => setIsDragging(false);
  const onDrop        = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileUpload(f); };

  const handleDownload = () => {
    if (!results) return;
    const a = document.createElement('a'); a.href = results.reconstructed_image_b64;
    a.download = `pca_compressed_${components}k.png`; a.click();
  };

  /* ── Derived metrics ── */
  const qualityScore = results
    ? (results.variance_retained_pct != null
        ? results.variance_retained_pct
        : Math.max(0, 100 - (results.mse ?? 0) * 800))
    : 0;

  const busy = isProcessing || isUploading;
  const isHDMode = isUploadedMode && results?.original_resolution;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Page Header ── */}
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            PCA Compression Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
            Upload any image · Adjust components · Watch quality trade-offs in real time
          </p>
        </header>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem',
          }}>
            <X size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* ══ MAIN 3-COLUMN GRID ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: '20px', marginBottom: '24px' }}>

          {/* ── Column 1: Controls ── */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <SectionHeader icon={<SlidersHorizontal size={14} />}>Controls</SectionHeader>

            {/* Components slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
                  Components (k)
                </label>
                <span style={{
                  background: '#111827', color: '#FFFFFF', borderRadius: '6px',
                  padding: '2px 10px', fontSize: '0.8125rem', fontWeight: '700',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{components}</span>
              </div>
              <input
                type="range" min="1" max={isUploadedMode ? 200 : 150}
                value={components} onChange={(e) => setComponents(+e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#D1D5DB', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>1 — max compress</span>
                <span>{isUploadedMode ? '200' : '150'} — max fidelity</span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '8px', lineHeight: '1.5' }}>
                Fewer components = smaller file, lower quality. More = larger file, sharper output.
              </p>
            </div>

            <Divider />

            {/* Patch size — only for HD uploads */}
            {isUploadedMode && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', display: 'block', marginBottom: '8px' }}>
                    Patch Size
                  </label>
                  <div className="patch-radio-group">
                    {[4, 8, 16].map(sz => (
                      <button
                        key={sz}
                        onClick={() => { setPatchSize(sz); if (currentSample) runProcess(components, currentSample, true, sz); }}
                        className={`patch-radio-btn${patchSize === sz ? ' selected' : ''}`}
                        disabled={busy}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '6px', lineHeight: '1.5' }}>
                    Patch size controls vector dimensionality: 4px=48D, 8px=192D, 16px=768D
                  </p>
                </div>
                <Divider />
              </>
            )}

            {/* Buttons */}
            <button
              onClick={handleLoadSample} disabled={busy}
              className="btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}
            >
              {isProcessing && !isUploading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Load Random MNIST Digit
            </button>

            {/* Upload zone */}
            <div
              onClick={() => !busy && fileInputRef.current?.click()}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              className={`upload-zone${isDragging ? ' dragging' : ''}${busy ? ' opacity-50 pointer-events-none' : ''}`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {isUploading
                  ? <Loader2 size={24} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                  : <Upload size={24} style={{ color: isDragging ? '#111827' : '#9CA3AF' }} />
                }
                <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#374151' }}>
                  {isUploading ? 'Processing…' : isDragging ? 'Drop image here' : 'Upload Image'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  {isUploading ? 'Extracting RGB patches' : 'Drag & drop · JPEG, PNG, WebP'}
                </p>
                {uploadedFileName && !isUploading && (
                  <span style={{
                    fontSize: '0.6875rem', fontFamily: 'JetBrains Mono, monospace',
                    background: '#F3F4F6', color: '#374151', padding: '2px 10px',
                    borderRadius: '9999px', maxWidth: '100%', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{uploadedFileName}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Column 2: Original Input Image ── */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader icon={<ImageIcon size={14} />}>Original Input</SectionHeader>

            {/* Loading skeleton */}
            {busy && !results && (
              <div className="skeleton" style={{ flex: 1, minHeight: '280px', borderRadius: '10px' }} />
            )}

            {/* Image */}
            {results ? (
              <>
                <div className="image-frame" style={{ flex: 1, minHeight: '280px', marginBottom: '16px', position: 'relative' }}>
                  {busy && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '11px', zIndex: 5,
                    }}>
                      <Loader2 size={28} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                  <img
                    src={results.original_image_b64}
                    alt="Original input"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto', maxHeight: '320px' }}
                  />
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {isHDMode ? (
                    <>
                      <MetaRow label="Filename" value={uploadedFileName} mono />
                      <MetaRow label="Resolution" value={results.original_resolution} mono />
                      <MetaRow label="Color Mode" value="RGB · 3 channels" mono />
                      <MetaRow label="Patch Dim" value={`${patchSize}×${patchSize}×3 = ${patchSize * patchSize * 3}D`} mono />
                    </>
                  ) : (
                    <>
                      <MetaRow label="Source" value="MNIST Handwritten Digit" />
                      <MetaRow label="Dimensions" value="28×28 = 784D (grayscale)" mono />
                      <MetaRow label="Mode" value="Flat vector · PCA direct" />
                    </>
                  )}
                </div>
              </>
            ) : !busy ? (
              <ImagePlaceholder label="Awaiting input…" />
            ) : null}
          </div>

          {/* ── Column 3: Compressed PCA Output ── */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <SectionHeader>
              <span style={{ color: '#9CA3AF', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <ChevronRight size={14} strokeWidth={3} />
              </span>
              PCA Compressed Output
            </SectionHeader>

            {busy && !results && (
              <div className="skeleton" style={{ flex: 1, minHeight: '280px', borderRadius: '10px' }} />
            )}

            {results ? (
              <>
                <div className="image-frame image-frame-output" style={{ flex: 1, minHeight: '280px', marginBottom: '16px', position: 'relative' }}>
                  {busy && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '11px', zIndex: 5,
                    }}>
                      <Loader2 size={28} style={{ color: '#374151', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                  <img
                    src={results.reconstructed_image_b64}
                    alt="PCA compressed output"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto', maxHeight: '320px' }}
                  />
                </div>

                {/* Output metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <MetaRow label="Components Used" value={`k = ${results.n_components}`} mono />
                  <MetaRow
                    label="Compression Ratio"
                    value={`${results.compression_ratio.toFixed(2)}×`}
                    mono
                    highlight
                  />
                  {isHDMode && results.n_patches != null && (
                    <MetaRow label="Patches Processed" value={results.n_patches.toLocaleString()} mono />
                  )}
                </div>

                {/* Quality bar */}
                <QualityBar score={Math.min(100, Math.max(0, qualityScore))} />

                {/* Download */}
                <button onClick={handleDownload} className="btn-ghost btn-sm" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                  <Download size={13} /> Download Compressed Image
                </button>
              </>
            ) : !busy ? (
              <ImagePlaceholder label="Output appears here…" />
            ) : null}
          </div>
        </div>

        {/* ══ METRICS ROW ══ */}
        {results && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <StatChip
              label="MSE Loss"
              value={results.mse.toFixed(results.mse < 1 ? 4 : 2)}
              sub="Mean Squared Error · lower is better"
            />
            <StatChip
              label="Compression"
              value={`${results.compression_ratio.toFixed(2)}×`}
              sub="Original data / compressed data"
            />
            {results.variance_retained_pct != null && (
              <StatChip
                label="Variance Retained"
                value={`${results.variance_retained_pct.toFixed(1)}%`}
                sub="Information preserved by top-k eigenvectors"
              />
            )}
            <StatChip
              label="Components (k)"
              value={results.n_components}
              sub="Principal eigenvectors kept"
            />
            {results.n_patches != null && (
              <StatChip
                label="Patches"
                value={results.n_patches.toLocaleString()}
                sub={`${patchSize}×${patchSize}=` + patchSize * patchSize + `D per patch per channel`}
              />
            )}
          </div>
        )}

        {/* ══ EXPLANATION STRIP ══ */}
        {results && (
          <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: '#FAFAFA' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Info size={15} style={{ color: '#9CA3AF', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: '1.7', margin: 0 }}>
                <strong style={{ color: '#374151' }}>What you're seeing:</strong> The image on the right is the PCA-compressed version
                of the original. Using <strong style={{ color: '#374151' }}>k = {results.n_components}</strong> principal components,
                PCA projects each {isHDMode ? `${patchSize * patchSize * 3}` : '784'}-dimensional
                {isHDMode ? ' patch' : ' pixel vector'} into {results.n_components} dimensions,
                then maps it back to the original space — keeping only the structure captured
                by the top eigenvectors.
                {results.variance_retained_pct != null &&
                  ` This retains ${results.variance_retained_pct.toFixed(1)}% of the total image variance.`}
                {' '}Higher k = sharper output. Lower k = smaller file, more blurring.
              </p>
            </div>
          </div>
        )}

        {/* ══ PIPELINE FLOW GRAPH ══ */}
        {results && (
          <div className="card" style={{ padding: '24px 28px' }}>
            <SectionHeader>Model Pipeline — What Happened Step by Step</SectionHeader>
            <PipelineFlow results={results} isHD={isHDMode} patchSize={patchSize} />
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Metadata row ── */
const MetaRow = ({ label, value, mono, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#FAFAFA', borderRadius: '7px', border: '1px solid #F3F4F6' }}>
    <span style={{ fontSize: '0.6875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF' }}>
      {label}
    </span>
    <span style={{
      fontSize: '0.75rem', fontWeight: highlight ? '700' : '600',
      fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
      color: highlight ? '#111827' : '#374151',
    }}>
      {value}
    </span>
  </div>
);

/* ── Horizontal Pipeline Flow ── */
const PipelineFlow = ({ results, isHD, patchSize }) => {
  const dim = patchSize * patchSize * 3;

  const steps = isHD ? [
    {
      n: '01',
      title: 'Input Image',
      detail: results.original_resolution || '—',
      sub: 'Loaded as RGB numpy array',
    },
    {
      n: '02',
      title: 'Patch Extraction',
      detail: `${results.n_patches?.toLocaleString() ?? '—'} patches`,
      sub: `${patchSize}×${patchSize}×3 = ${dim}D per patch`,
    },
    {
      n: '03',
      title: 'PCA Fit',
      detail: `Randomised SVD`,
      sub: 'Fitted on ≤2,500 patch subset',
    },
    {
      n: '04',
      title: 'Compress',
      detail: `${dim}D → ${results.n_components}D`,
      sub: `${results.compression_ratio.toFixed(1)}× data reduction`,
    },
    {
      n: '05',
      title: 'PCA Output',
      detail: `${results.variance_retained_pct?.toFixed(1) ?? '—'}% variance kept`,
      sub: `MSE = ${results.mse.toFixed(2)}`,
    },
  ] : [
    {
      n: '01',
      title: 'MNIST Digit',
      detail: '28×28 = 784D',
      sub: 'Grayscale normalised [0,1]',
    },
    {
      n: '02',
      title: 'PCA Fit',
      detail: 'Trained on 2,000 samples',
      sub: 'Whiten + Randomised SVD',
    },
    {
      n: '03',
      title: 'Compress',
      detail: `784D → ${results.n_components}D`,
      sub: `${results.compression_ratio.toFixed(1)}× reduction`,
    },
    {
      n: '04',
      title: 'PCA Output',
      detail: `784D restored`,
      sub: `MSE = ${results.mse.toFixed(4)}`,
    },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', minWidth: `${steps.length * 160}px` }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{
              flex: 1,
              background: i === steps.length - 1 ? '#111827' : '#FAFAFA',
              border: `1px solid ${i === steps.length - 1 ? '#111827' : '#E5E7EB'}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '4px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: '-9px', left: '12px',
                background: i === steps.length - 1 ? '#FFFFFF' : '#111827',
                color: i === steps.length - 1 ? '#111827' : '#FFFFFF',
                borderRadius: '9999px', width: '18px', height: '18px',
                fontSize: '9px', fontWeight: '700', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                border: '1.5px solid ' + (i === steps.length - 1 ? '#D1D5DB' : '#111827'),
              }}>{step.n}</span>
              <span style={{
                fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: i === steps.length - 1 ? '#FFFFFF' : '#111827',
              }}>{step.title}</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: '600',
                fontFamily: "'JetBrains Mono', monospace",
                color: i === steps.length - 1 ? '#E5E7EB' : '#374151',
              }}>{step.detail}</span>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: i === steps.length - 1 ? '#6B7280' : '#9CA3AF',
                lineHeight: '1.4',
              }}>{step.sub}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', flexShrink: 0 }}>
                <ChevronRight size={16} color="#D1D5DB" strokeWidth={2.5} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
