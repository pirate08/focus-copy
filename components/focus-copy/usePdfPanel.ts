import { useCallback, useEffect, useRef, useState } from "react";

export function usePdfPanel(
  editorLayoutRef: React.RefObject<HTMLDivElement | null>,
  isMapOpen: boolean,
  mapWidth: number,
) {
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [pdfSplitWidth, setPdfSplitWidth] = useState(520);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startWidth: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPdfOpen = window.localStorage.getItem("focus-copy-pdf-open");
    const savedPdfWidth = window.localStorage.getItem("focus-copy-pdf-width");

    if (savedPdfOpen) {
      setIsPdfOpen(savedPdfOpen === "true");
    }

    if (savedPdfWidth) {
      const parsed = Number(savedPdfWidth);
      if (Number.isFinite(parsed) && parsed >= 400) {
        setPdfSplitWidth(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("focus-copy-pdf-open", String(isPdfOpen));
    }
  }, [isPdfOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "focus-copy-pdf-width",
        String(pdfSplitWidth),
      );
    }
  }, [pdfSplitWidth]);

  useEffect(() => {
    if (!isDraggingPdf) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = editorLayoutRef.current;
      if (!container) return;

      const totalWidth = container.clientWidth;
      const reservedForMap = isMapOpen ? mapWidth : 0;
      const delta = event.clientX - dragStateRef.current.startX;
      const nextWidth = dragStateRef.current.startWidth + delta;
      const minPdfWidth = 400;
      const maxPdfWidth = totalWidth - reservedForMap - 360;

      setPdfSplitWidth(Math.min(Math.max(nextWidth, minPdfWidth), maxPdfWidth));
    };

    const handlePointerUp = () => {
      dragStateRef.current.active = false;
      setIsDraggingPdf(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [editorLayoutRef, isDraggingPdf, isMapOpen, mapWidth]);

  const openPdfPane = useCallback(() => {
    setIsPdfOpen(true);
  }, []);

  const closePdfPane = useCallback(() => {
    setIsPdfOpen(false);
  }, []);

  const togglePdfPane = useCallback(() => {
    setIsPdfOpen((value) => !value);
  }, []);

  const resetPdfSplit = useCallback(() => {
    const containerWidth = editorLayoutRef.current?.clientWidth ?? 0;
    const fallback = Math.max(
      500,
      Math.min(containerWidth / 2, containerWidth - 360),
    );
    setPdfSplitWidth(containerWidth ? fallback : 520);
  }, [editorLayoutRef]);

  const startPdfDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!editorLayoutRef.current) return;
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startWidth: pdfSplitWidth,
    };
    setIsDraggingPdf(true);
    event.preventDefault();
  };

  return {
    isPdfOpen,
    setIsPdfOpen,
    pdfSplitWidth,
    setPdfSplitWidth,
    isDraggingPdf,
    setIsDraggingPdf,
    openPdfPane,
    closePdfPane,
    togglePdfPane,
    resetPdfSplit,
    startPdfDrag,
  };
}
