import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ExternalLink,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';

if (pdfjsWorker) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerModalProps {
  url: string | null;
  fileName?: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  url,
  fileName,
  onClose
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<string>('Loading document...');
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const pageContainerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const renderTasksRef = useRef<{ [key: number]: any }>({});
  const pdfDocRef = useRef<any>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load PDF Document
  useEffect(() => {
    if (!url) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setLoadingProgress('Fetching PDF document...');

    // Clean up previous render tasks
    Object.values(renderTasksRef.current).forEach((task) => {
      try {
        task?.cancel();
      } catch {
        // ignore cancellation errors
      }
    });
    renderTasksRef.current = {};

    const cleanUrl = url.split('#')[0];

    const loadingTask = pdfjsLib.getDocument({
      url: cleanUrl,
      withCredentials: false
    });

    loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
      if (progressData.total > 0 && isMounted) {
        const percent = Math.round((progressData.loaded / progressData.total) * 100);
        setLoadingProgress(`Downloading PDF (${percent}%)...`);
      }
    };

    loadingTask.promise
      .then((pdfDoc) => {
        if (!isMounted) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load PDF document via PDF.js:', err);
        if (!isMounted) return;
        setIsLoading(false);
        setError(
          err?.message ||
            'Unable to render multi-page preview directly inside viewer. You can open or download the PDF using the buttons below.'
        );
      });

    return () => {
      isMounted = false;
      try {
        loadingTask.destroy();
      } catch {
        // ignore destroy errors
      }
    };
  }, [url]);

  // Render Page Canvases
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || numPages <= 0) return;

    let isMounted = true;

    const renderPages = async () => {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (!isMounted) break;
        const canvas = pageCanvasRefs.current[pageNum];
        if (!canvas) continue;

        try {
          // Cancel ongoing render task for this page if any
          if (renderTasksRef.current[pageNum]) {
            renderTasksRef.current[pageNum].cancel();
          }

          const page = await pdfDoc.getPage(pageNum);
          if (!isMounted) break;

          const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: scale * (pixelRatio / 1.5) });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const cssWidth = Math.floor(viewport.width / (pixelRatio / 1.5));
          const cssHeight = Math.floor(viewport.height / (pixelRatio / 1.5));

          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${cssHeight}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };

          const renderTask = page.render(renderContext);
          renderTasksRef.current[pageNum] = renderTask;
          await renderTask.promise;
        } catch (err: any) {
          if (err?.name !== 'RenderingCancelledException') {
            console.warn(`Failed to render PDF page ${pageNum}:`, err);
          }
        }
      }
    };

    renderPages();

    return () => {
      isMounted = false;
    };
  }, [numPages, scale]);

  // Intersection Observer for updating active page counter on scroll
  useEffect(() => {
    if (numPages <= 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageAttr = entry.target.getAttribute('data-page-number');
            if (pageAttr) {
              setCurrentPage(parseInt(pageAttr, 10));
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.3
      }
    );

    Object.values(pageContainerRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const scrollToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > numPages) return;
    const el = pageContainerRefs.current[targetPage];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(targetPage);
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.2);

  if (!url) return null;

  const displayTitle = fileName || 'PDF Document';
  const cleanUrl = url.split('#')[0];

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Controls Bar */}
      <header 
        className="shrink-0 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Document Name & Page Count */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={displayTitle}>
              {displayTitle}
            </h3>
            {numPages > 0 && (
              <p className="text-xs text-slate-400 font-medium">
                Showing all <span className="text-white font-bold">{numPages}</span> {numPages === 1 ? 'page' : 'pages'}
              </p>
            )}
          </div>
        </div>

        {/* Center: Page Navigation & Zoom Toolbar */}
        {numPages > 0 && !error && (
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            {/* Page Navigation */}
            <button
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-200 whitespace-nowrap min-w-[70px] text-center">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.6}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-semibold px-1.5 text-slate-300 min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}

        {/* Right Actions: External Open, Download, Close */}
        <div className="flex items-center gap-2">
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Open in new browser tab"
          >
            <ExternalLink size={16} />
            <span className="hidden sm:inline">Open Native</span>
          </a>

          <a
            href={cleanUrl}
            download={displayTitle}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-md"
            title="Download PDF File"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 border border-slate-700 hover:border-rose-500 transition-colors ml-1"
            title="Close Viewer (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Scrollable Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="my-auto flex flex-col items-center justify-center p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-center max-w-sm">
            <Loader2 size={40} className="text-indigo-400 animate-spin mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Loading PDF Document</h4>
            <p className="text-xs text-slate-400 font-medium">{loadingProgress}</p>
          </div>
        )}

        {error && (
          <div className="my-auto flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-md">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl mb-4 border border-amber-500/30">
              <AlertTriangle size={32} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Direct Multi-Page Preview Unavailable</h4>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {error}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-colors"
              >
                <ExternalLink size={16} />
                Open PDF in Browser
              </a>
              <a
                href={cleanUrl}
                download={displayTitle}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                Download PDF File
              </a>
            </div>
          </div>
        )}

        {!isLoading && !error && numPages > 0 && (
          <div className="flex flex-col items-center gap-6 w-full max-w-5xl py-2">
            {Array.from({ length: numPages }, (_, index) => {
              const pageNum = index + 1;
              return (
                <div
                  key={pageNum}
                  ref={(el) => { pageContainerRefs.current[pageNum] = el; }}
                  data-page-number={pageNum}
                  className="flex flex-col items-center bg-white rounded-lg shadow-2xl border border-slate-700/50 overflow-hidden transition-transform duration-150"
                  style={{
                    maxWidth: '100%'
                  }}
                >
                  <div className="w-full bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Page {pageNum} of {numPages}</span>
                    <span className="text-slate-400">PDF Page</span>
                  </div>

                  <div className="p-1 sm:p-2 bg-slate-200/50 overflow-x-auto max-w-full">
                    <canvas
                      ref={(el) => { pageCanvasRefs.current[pageNum] = el; }}
                      className="block max-w-full shadow-md bg-white rounded"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
