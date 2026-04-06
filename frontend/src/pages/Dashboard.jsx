import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, RefreshCw, SlidersHorizontal, Image as ImageIcon, Loader2, Upload, X, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { getSampleImage, processImage, uploadImage } from '../api';
import ModelGraph from '../ModelGraph';
import '../index.css';

function Dashboard() {
  const [components, setComponents] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentSample, setCurrentSample] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const fileInputRef = useRef(null);

  // GSAP entrance + mouse parallax
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([headerRef.current, ...cardsRef.current.filter(Boolean)], {
        opacity: 0, y: 60, rotateX: -8,
      });
      gsap.to([headerRef.current, ...cardsRef.current.filter(Boolean)], {
        opacity: 1, y: 0, rotateX: 0,
        duration: 1.0, stagger: 0.12, ease: 'power3.out',
        clearProps: 'transform'
      });

      const handleMouseMove = (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        gsap.to('.wb-1', { x: x * -1.2, y: y * -1.2, duration: 1.2, ease: 'power2.out' });
        gsap.to('.wb-2', { x: x * 1.0, y: y * 1.0, duration: 1.4, ease: 'power2.out' });
        gsap.to('.wb-3', { x: x * -0.6, y: y * 0.8, duration: 1.0, ease: 'power2.out' });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => { handleLoadSample(); }, []);

  const handleLoadSample = async () => {
    try {
      setIsProcessing(true); setError(''); setUploadedFileName('');
      const sample_array = await getSampleImage();
      setCurrentSample(sample_array);
      await runProcess(components, sample_array);
    } catch {
      setError('Failed to connect to backend. Is the server running?');
    } finally { setIsProcessing(false); }
  };

  const runProcess = async (n_components, imageArray) => {
    if (!imageArray) return;
    try {
      setIsProcessing(true); setError('');
      const data = await processImage(n_components, imageArray);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Processing failed.');
    } finally { setIsProcessing(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { if (currentSample) runProcess(components, currentSample); }, 500);
    return () => clearTimeout(t);
  }, [components]);

  const handleFileUpload = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) {
      setError('Please upload a valid image file.'); return;
    }
    try {
      setIsUploading(true); setError(''); setUploadedFileName(file.name);
      const imgArr = await uploadImage(file);
      setCurrentSample(imgArr);
      await runProcess(components, imgArr);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
      setUploadedFileName('');
    } finally { setIsUploading(false); }
  }, [components]);

  const onFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
    e.target.value = '';
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileUpload(f);
  };

  const handleDownload = () => {
    if (!results) return;
    const a = document.createElement('a');
    a.href = results.reconstructed_image_b64;
    a.download = `pca_${components}d.png`;
    a.click();
  };

  const addCardRef = (el) => {
    if (el && !cardsRef.current.includes(el)) cardsRef.current.push(el);
  };

  // 3D Tilt on hover — lighter angles for white cards
  const tiltCard = (e, target) => {
    const rect = target.getBoundingClientRect();
    const rx = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -4;
    const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4;
    gsap.to(target, { rotateX: rx, rotateY: ry, translateZ: 20, scale: 1.015, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  };

  const resetTilt = (target) => {
    gsap.to(target, { rotateX: 0, rotateY: 0, translateZ: 0, scale: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  };

  const busy = isProcessing || isUploading;

  return (
    <div ref={containerRef} className="relative min-h-screen" style={{ perspective: '1400px' }}>
      {/* RitheshVerse Watercolor Background */}
      <div className="watercolor-bg">
        <div className="watercolor-blob wb-1"></div>
        <div className="watercolor-blob wb-2"></div>
        <div className="watercolor-blob wb-3"></div>
      </div>
      <div className="texture-overlay"></div>

      <div className="max-w-6xl mx-auto px-6 py-10 md:px-10 md:py-14 relative z-10">

        {/* HEADER — RitheshVerse Varien font */}
        <header ref={headerRef} className="mb-14 text-center">
          <div className="varien text-5xl md:text-7xl font-black mb-3 tracking-tight text-[#0A0A0A] leading-none">
            PCA<br/>
            <span style={{ color: '#7C3AED' }}>Compression</span>
          </div>
          <p className="text-[#6B7280] max-w-xl mx-auto text-base md:text-lg mt-4 leading-relaxed">
            Upload any image or sample an MNIST digit. Watch PCA decompose 784 dimensions into its essential eigenspace.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 flex items-center gap-3 text-sm">
            <X size={16} className="shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* === CONTROLS === */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              ref={addCardRef}
              className="glass-panel p-7"
              onMouseMove={(e) => tiltCard(e, e.currentTarget)}
              onMouseLeave={(e) => resetTilt(e.currentTarget)}
            >
              {/* Section label */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-black/[0.07]">
                <SlidersHorizontal size={18} className="text-[#7C3AED]" />
                <span className="font-semibold text-sm uppercase tracking-widest text-[#0A0A0A]">Controls</span>
              </div>

              {/* Slider */}
              <div className="space-y-4 mb-7">
                <div className="flex justify-between items-center">
                  <label htmlFor="components" className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                    Components
                  </label>
                  <span className="text-sm font-bold text-[#0A0A0A] bg-black/[0.06] px-3 py-0.5 rounded-full">
                    {components}
                  </span>
                </div>
                <input
                  id="components"
                  type="range" min="1" max="100" value={components}
                  onChange={(e) => setComponents(parseInt(e.target.value))}
                  disabled={busy}
                />
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                  <span>1 (max compression)</span>
                  <span>100 (high fidelity)</span>
                </div>
              </div>

              {/* Random Sample Button */}
              <button
                onClick={handleLoadSample}
                disabled={busy}
                className="btn-ghost w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold mb-4 disabled:opacity-40"
              >
                {isProcessing && !isUploading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <RefreshCw size={16} />
                }
                Load Random Digit
              </button>

              {/* Upload Zone */}
              <div
                onClick={() => !busy && fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`upload-zone p-6 text-center ${isDragging ? 'dragging' : ''} ${busy ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file" accept="image/*" className="hidden"
                  onChange={onFileInputChange}
                />
                <div className="flex flex-col items-center gap-2">
                  {isUploading
                    ? <Loader2 size={28} className="animate-spin text-[#7C3AED]" />
                    : <Upload size={28} className={isDragging ? 'text-[#0A0A0A]' : 'text-[#9CA3AF]'} />
                  }
                  <p className="font-semibold text-sm text-[#0A0A0A]">
                    {isUploading ? 'Preprocessing...' : isDragging ? 'Drop to upload' : 'Upload Image'}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {isUploading ? 'Mapping to 28×28 grayscale' : 'Drag & drop or click to browse'}
                  </p>
                  {uploadedFileName && !isUploading && (
                    <span className="text-xs font-mono bg-[#7C3AED]/10 text-[#7C3AED] px-3 py-1 rounded-full truncate max-w-full mt-1">
                      {uploadedFileName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TELEMETRY */}
            {results && (
              <div
                ref={addCardRef}
                className="glass-panel p-7"
                onMouseMove={(e) => tiltCard(e, e.currentTarget)}
                onMouseLeave={(e) => resetTilt(e.currentTarget)}
              >
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-black/[0.07]">
                  <span className="font-semibold text-sm uppercase tracking-widest text-[#0A0A0A]">Telemetry</span>
                </div>

                <div className="space-y-3">
                  <div className="metric-row">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Input Dims</span>
                    <span className="font-mono font-bold text-[#0A0A0A] text-sm">784</span>
                  </div>
                  <div className="metric-row">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">PCA Dims</span>
                    <span className="font-mono font-bold text-[#0A0A0A] text-sm">{results.n_components}</span>
                  </div>
                  <div className="metric-row">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Compression</span>
                    <span className="font-mono font-black text-[#7C3AED]">{results.compression_ratio.toFixed(2)}×</span>
                  </div>
                  <div className="metric-row">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">MSE Loss</span>
                    <span className="font-mono font-black text-red-500">{results.mse.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === VISUALIZATION PANEL === */}
          <div
            ref={addCardRef}
            className="lg:col-span-8 glass-panel p-8 flex flex-col items-center justify-center min-h-[480px] relative"
            onMouseMove={(e) => tiltCard(e, e.currentTarget)}
            onMouseLeave={(e) => resetTilt(e.currentTarget)}
          >
            {/* Loading overlay */}
            {busy && (
              <div className="absolute inset-0 rounded-[20px] bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={40} className="animate-spin text-[#7C3AED]" />
                <p className="text-xs font-semibold tracking-widest uppercase text-[#7C3AED]">
                  {isUploading ? 'Mapping Image to PCA Space…' : 'Decomposing Eigenspace…'}
                </p>
              </div>
            )}

            {!results && !busy ? (
              <div className="flex flex-col items-center gap-4 text-[#9CA3AF]">
                <ImageIcon size={52} strokeWidth={1} />
                <p className="text-sm font-semibold uppercase tracking-widest">Awaiting tensor input…</p>
              </div>
            ) : results ? (
              <div className="w-full space-y-8">

                {/* Side by side images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Original Image Box */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Input Image</div>
                    <div className="image-frame w-full max-w-[280px] aspect-square flex items-center justify-center p-4">
                      <img
                        src={results.original_image_b64}
                        alt="Original input"
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="text-xs text-[#9CA3AF] font-mono">784 dimensions</div>
                  </div>

                  {/* Arrow indicator (hidden on mobile) */}
                  <div className="hidden md:absolute md:flex md:items-center md:justify-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <ArrowRight size={24} className="text-[#7C3AED]" />
                  </div>

                  {/* Reconstructed Output */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
                      After PCA ({results.n_components}D)
                    </div>
                    <div className="image-frame image-frame-accent w-full max-w-[280px] aspect-square flex items-center justify-center p-4">
                      <img
                        src={results.reconstructed_image_b64}
                        alt="Reconstructed after PCA"
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="text-xs text-[#9CA3AF] font-mono">{results.n_components} dimensions</div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/[0.07]">
                  <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-xs">
                    PCA projects 784px into {results.n_components} principal components
                    ({results.compression_ratio.toFixed(1)}× smaller), then reconstructs back.
                    Blurriness reflects information loss.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download size={15} />
                    Export Output
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Isometric Model Graph */}
        <ModelGraph components={components} isActive={!!results} />

        {/* Footer brand line — RitheshVerse style */}
        <footer className="mt-14 text-center">
          <p className="text-xs text-[#9CA3AF] tracking-widest uppercase">
            PCA Compression Matrix · Built with the RitheshVerse design system
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
