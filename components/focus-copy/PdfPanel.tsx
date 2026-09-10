import { Upload, X } from "lucide-react";

import type { Subject } from "@/lib/types";

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
  onSelectPdf: (value: string) => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
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
  onSelectPdf,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onPrevPage,
  onNextPage,
  onClose,
  onUpload,
  onPointerDown,
  onDoubleClick,
}: PdfPanelProps) {
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
              value={selectedPdfId ?? pdfDocumentName}
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
            <button className="icon-button small" onClick={onPrevPage}>
              ◀
            </button>
            <div className="pdf-page-indicator">Page {pdfPage}</div>
            <button className="icon-button small" onClick={onNextPage}>
              ▶
            </button>
            <div className="pdf-zoom">
              <button
                className="icon-button small"
                onClick={onZoomOut}
                aria-label="Zoom out"
              >
                −
              </button>
              <div className="pdf-zoom-label">{Math.round(pdfZoom * 100)}%</div>
              <button
                className="icon-button small"
                onClick={onZoomIn}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                className="icon-button small"
                onClick={onResetZoom}
                aria-label="Reset zoom"
              >
                Fit
              </button>
            </div>
          </div>
          <div className="pdf-toolbar-right">
            <button
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
        <div className="pdf-viewer" style={{ position: "relative" }}>
          {pdfName && !selectedPdfId ? (
            <div className="pdf-skeleton" style={{ padding: 24 }}>
              <div className="skeleton-header" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-page" />
            </div>
          ) : selectedPdfId ? (
            <iframe
              src={`/api/pdfs/${selectedPdfId}`}
              title={pdfDocumentName}
              className="pdf-frame"
              style={{ width: "100%", height: "100%", border: "0" }}
            />
          ) : (
            <div className="pdf-placeholder" style={{ padding: 20 }}>
              <span className="eyebrow">REFERENCE PAGE</span>
              <h3>{pdfDocumentName}</h3>
              <p>{pdfName ?? "No document selected"}</p>
              <div className="pdf-page-metadata">
                <span>Page {pdfPage}</span>
                <span>{Math.round(pdfZoom * 100)}%</span>
              </div>
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
