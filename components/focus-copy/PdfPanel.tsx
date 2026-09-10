"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./pdf-panel.css";

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
  /** Called when the user wants to delete the selected PDF. */
  onDeletePdf?: (id: string) => Promise<void>;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
};

function PdfPanel({
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
  onDeletePdf,
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    }
  }, []);

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

  const handleDocumentError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setIsDocLoading(false);
    setDocError("Couldn't load this PDF. Try re-uploading it.");
  }, []);

  const handlePageLoad = useCallback((page: any) => {
    setPageWidth((current) => current ?? (page.originalWidth as number));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Prefer a bundled worker in public/ for predictable loading.
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Could not set pdfjs workerSrc:", err);
    }
  }, []);

  const zoomOut = () =>
    onSetZoom(Number(Math.max(MIN_ZOOM, pdfZoom - ZOOM_STEP).toFixed(2)));
  const zoomIn = () =>
    onSetZoom(Number(Math.min(MAX_ZOOM, pdfZoom + ZOOM_STEP).toFixed(2)));
  const goPrev = () => onSetPage(Math.max(1, pdfPage - 1));
  const goNext = () =>
    onSetPage(numPages ? Math.min(numPages, pdfPage + 1) : pdfPage + 1);

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

  const showSkeleton = isUploading || isDocLoading;

  return (
    <>
      <aside
        className="pdfp-panel"
        style={{
          width: `${pdfSplitWidth}px`,
          flexBasis: `${pdfSplitWidth}px`,
          flexShrink: 0,
        }}
      >
        <div className="pdfp-toolbar">
          <div className="pdfp-row-top">
            <span className="pdfp-eyebrow">REFERENCE</span>
            <select
              className="pdfp-select"
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="pdfp-delete"
                onClick={async () => {
                  if (!selectedPdfId) return;
                  const ok = window.confirm(
                    "Delete this PDF? This action cannot be undone.",
                  );
                  if (!ok) return;
                  try {
                    await onDeletePdf?.(selectedPdfId);
                  } catch (err) {
                    // parent will show errors via toast
                  }
                }}
                aria-label="Delete PDF"
                title="Delete PDF"
                disabled={!selectedPdfId}
              >
                <Trash2 size={14} />
              </button>

              <button
                type="button"
                className="pdfp-close"
                onClick={onClose}
                aria-label="Close PDF pane"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="pdfp-row-controls">
            <div className="pdfp-group">
              <button
                type="button"
                className="pdfp-btn"
                onClick={goPrev}
                disabled={pdfPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="pdfp-page-indicator">
                {pdfPage}
                {numPages ? ` / ${numPages}` : ""}
              </span>
              <button
                type="button"
                className="pdfp-btn"
                onClick={goNext}
                disabled={!!numPages && pdfPage >= numPages}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="pdfp-group">
              <button
                type="button"
                className="pdfp-btn"
                onClick={zoomOut}
                disabled={pdfZoom <= MIN_ZOOM}
                aria-label="Zoom out"
              >
                <Minus size={13} />
              </button>
              <span className="pdfp-zoom-label">
                {Math.round(pdfZoom * 100)}%
              </span>
              <button
                type="button"
                className="pdfp-btn"
                onClick={zoomIn}
                disabled={pdfZoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                className="pdfp-btn"
                onClick={fitToWidth}
                aria-label="Fit to width"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        <div className="pdfp-upload">
          <label className="pdfp-upload-card">
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
            <Upload size={18} />
            <span className="pdfp-upload-text">
              <strong>{pdfName ?? "Add a PDF reference"}</strong>
              <span>
                {pdfName ? "Ready to compare" : "PDF files up to 20 MB"}
              </span>
            </span>
          </label>
          {pdfUploadError && (
            <small className="pdfp-error">{pdfUploadError}</small>
          )}
        </div>

        <div className="pdfp-viewer" ref={containerRef}>
          {showSkeleton ? (
            <div className="pdfp-skeleton">
              <div className="pdfp-skeleton-line" />
              <div className="pdfp-skeleton-line short" />
              <div className="pdfp-skeleton-page" />
            </div>
          ) : docError ? (
            <div className="pdfp-placeholder">
              <span className="pdfp-eyebrow">REFERENCE PAGE</span>
              <p>{docError}</p>
            </div>
          ) : selectedPdfId ? (
            <div className="pdfp-canvas-scroll">
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
            <div className="pdfp-placeholder">
              <h3>{pdfDocumentName}</h3>
              <p>{pdfName ?? "No document selected"}</p>
            </div>
          )}
        </div>
      </aside>

      <div
        className={`pdfp-splitter ${isDragging ? "dragging" : ""}`}
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

export default PdfPanel;
