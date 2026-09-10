"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

type PdfPanelProps = {
  pdfSplitWidth: number;
  selectedPdfId: string | null;
  pdfDocumentName: string;
  pdfDocuments: Array<{ id: string; name: string; uploadedAt?: string | null }>;
  pdfName: string | null;
  pdfPage: number;
  pdfZoom: number;
  pdfUploadError: string | null;
  isDragging: boolean;
  isUploading?: boolean;
  onSelectPdf: (value: string) => void;
  onSetZoom: (value: number) => void;
  onSetPage: (value: number) => void;
  onDocumentLoadSuccess?: (numPages: number) => void;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
};

export function PdfPanel({
  pdfSplitWidth,
  selectedPdfId,
  pdfDocumentName,
  pdfDocuments,
  pdfName,
  pdfPage,
  pdfZoom,
  pdfUploadError,
  isDragging,
  isUploading = false,
  onSelectPdf,
  onSetZoom,
  onSetPage,
  onDocumentLoadSuccess,
  onClose,
  onUpload,
  onPointerDown,
  onDoubleClick,
}: PdfPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Safely assign PDF.js worker only on client mount via unpkg CDN
  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }, []);

  // Reset viewer state whenever a different document is picked
  useEffect(() => {
    setNumPages(null);
    setPageWidth(null);
    setDocError(null);
    setIsDocLoading(!!selectedPdfId);
  }, [selectedPdfId]);

  const handleDocumentLoad = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setIsDocLoading(false);
      onDocumentLoadSuccess?.(total);
      if (pdfPage > total) onSetPage(total);
    },
    [onDocumentLoadSuccess, onSetPage, pdfPage],
  );

  const handleDocumentError = useCallback(() => {
    setIsDocLoading(false);
    setDocError("Couldn't load this PDF. Try re-uploading it.");
  }, []);

  const handlePageLoad = useCallback((page: any) => {
    setPageWidth((current) => current ?? (page.originalWidth as number));
  }, []);

  const fitToWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container || !pageWidth) return;
    const available = container.clientWidth - 32;
    const fitted = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, available / pageWidth),
    );
    onSetZoom(Number(fitted.toFixed(2)));
  }, [onSetZoom, pageWidth]);

  useEffect(() => {
    if (pageWidth) fitToWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth, selectedPdfId]);

  const zoomOut = () =>
    onSetZoom(Number(Math.max(MIN_ZOOM, pdfZoom - ZOOM_STEP).toFixed(2)));
  const zoomIn = () =>
    onSetZoom(Number(Math.min(MAX_ZOOM, pdfZoom + ZOOM_STEP).toFixed(2)));
  const goPrev = () => onSetPage(Math.max(1, pdfPage - 1));
  const goNext = () =>
    onSetPage(numPages ? Math.min(numPages, pdfPage + 1) : pdfPage + 1);

  const showSkeleton = isUploading || isDocLoading;

  return (
    <>
      <aside
        className="pdf-panel"
        style={{
          width: `${pdfSplitWidth}px`,
          flexBasis: `${pdfSplitWidth}px`,
          flexShrink: 0,
        }}
      >
        <div className="pdf-toolbar single">
          <div className="pdf-toolbar-left">
            <span className="eyebrow">REFERENCE MATERIAL</span>
            <select
              className="pdf-doc-select"
              value={selectedPdfId ?? ""}
              onChange={(event) => onSelectPdf(event.target.value)}
            >
              {pdfDocuments.length > 0 ? (
                pdfDocuments.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.name}
                  </option>
                ))
              ) : (
                <option value="">No PDFs uploaded yet</option>
              )}
            </select>
          </div>

          <div className="pdf-toolbar-center">
            <button
              type="button"
              className="icon-button small"
              onClick={goPrev}
              disabled={pdfPage <= 1}
              aria-label="Previous page"
            >
              ◀
            </button>
            <div className="pdf-page-indicator">
              Page {pdfPage}
              {numPages ? ` / ${numPages}` : ""}
            </div>
            <button
              type="button"
              className="icon-button small"
              onClick={goNext}
              disabled={!!numPages && pdfPage >= numPages}
              aria-label="Next page"
            >
              ▶
            </button>
            <div className="pdf-zoom">
              <button
                type="button"
                className="icon-button small"
                onClick={zoomOut}
                disabled={pdfZoom <= MIN_ZOOM}
                aria-label="Zoom out"
              >
                −
              </button>
              <div className="pdf-zoom-label">{Math.round(pdfZoom * 100)}%</div>
              <button
                type="button"
                className="icon-button small"
                onClick={zoomIn}
                disabled={pdfZoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="icon-button small"
                onClick={fitToWidth}
                aria-label="Fit to width"
              >
                Fit
              </button>
            </div>
          </div>

          <div className="pdf-toolbar-right">
            <button
              type="button"
              className="icon-button small pdf-close"
              onClick={onClose}
              aria-label="Close PDF pane"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="pdf-upload">
          <label className="upload-card compact">
            <input
              type="file"
              accept="application/pdf"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                await onUpload(file);
              }}
            />
            <Upload size={22} />
            <strong>{pdfName ?? "Add a PDF reference"}</strong>
            <span>
              {pdfName ? "Ready to compare" : "PDF files up to 20 MB"}
            </span>
          </label>
          {pdfUploadError && (
            <small className="error-text">{pdfUploadError}</small>
          )}
        </div>

        <div className="pdf-viewer" ref={containerRef}>
          {showSkeleton ? (
            <div className="pdf-skeleton" style={{ padding: 24 }}>
              <div className="skeleton-header" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-page" />
            </div>
          ) : docError ? (
            <div className="pdf-placeholder" style={{ padding: 20 }}>
              <span className="eyebrow">REFERENCE PAGE</span>
              <p>{docError}</p>
            </div>
          ) : selectedPdfId ? (
            <div className="pdf-canvas-scroll">
              <Document
                file={`/api/pdfs/${selectedPdfId}`}
                onLoadSuccess={handleDocumentLoad}
                onLoadError={handleDocumentError}
                loading={null}
              >
                <Page
                  pageNumber={pdfPage}
                  scale={pdfZoom}
                  onLoadSuccess={handlePageLoad}
                  loading={null}
                  renderAnnotationLayer={false}
                  renderTextLayer
                />
              </Document>
            </div>
          ) : (
            <div className="pdf-placeholder" style={{ padding: 20 }}>
              <span className="eyebrow">REFERENCE PAGE</span>
              <h3>{pdfDocumentName}</h3>
              <p>{pdfName ?? "No document selected"}</p>
            </div>
          )}
        </div>
      </aside>

      <div
        className={`splitter ${isDragging ? "dragging" : ""}`}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize PDF panel"
        title="Drag to resize"
      />
    </>
  );
}

// Added default export to satisfy dynamic imports cleanly
export default PdfPanel;
