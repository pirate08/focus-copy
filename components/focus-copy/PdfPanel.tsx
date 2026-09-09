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
        <div className="pdf-header">
          <div className="pdf-header-left">
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
          <div className="pdf-header-actions">
            <button
              className="icon-button small"
              onClick={onZoomOut}
              aria-label="Zoom out"
            >
              −
            </button>
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
              100%
            </button>
          </div>
        </div>
        <div className="pdf-header-toolbar">
          <button className="pdf-nav-button" onClick={onPrevPage}>
            Prev
          </button>
          <span>Page {pdfPage}</span>
          <button className="pdf-nav-button" onClick={onNextPage}>
            Next
          </button>
          <button
            className="icon-button small pdf-close"
            onClick={onClose}
            aria-label="Close PDF pane"
          >
            <X size={15} />
          </button>
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
        <div className="pdf-viewer">
          {selectedPdfId ? (
            <iframe
              src={`/api/pdfs/${selectedPdfId}`}
              title={pdfDocumentName}
              className="pdf-frame"
              style={{ width: "100%", height: "100%", border: "0" }}
            />
          ) : (
            <div className="pdf-viewer-scroll" style={{ zoom: pdfZoom }}>
              <div className="pdf-page-frame">
                <div className="pdf-page-content">
                  <span className="eyebrow">REFERENCE PAGE</span>
                  <h3>{pdfDocumentName}</h3>
                  <p>{pdfName ?? "No document selected"}</p>
                  <div className="pdf-page-metadata">
                    <span>Page {pdfPage}</span>
                    <span>{Math.round(pdfZoom * 100)}%</span>
                  </div>
                  <div className="pdf-sample-lines">
                    <span>Topic summary</span>
                    <span>Key facts</span>
                    <span>Definition</span>
                    <span>Examples</span>
                    <span>Exam angle</span>
                  </div>
                </div>
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
