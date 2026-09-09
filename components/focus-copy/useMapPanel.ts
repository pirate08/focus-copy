import { useCallback, useEffect, useRef, useState } from "react";

export function useMapPanel(
  editorLayoutRef: React.RefObject<HTMLDivElement | null>,
  isPdfOpen: boolean,
  pdfSplitWidth: number,
) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapWidth, setMapWidth] = useState(400);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startWidth: 0 });

  useEffect(() => {
    if (!isDraggingMap) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = editorLayoutRef.current;
      if (!container) return;

      const totalWidth = container.clientWidth;
      const reservedForPdf = isPdfOpen ? pdfSplitWidth : 0;
      const delta = dragStateRef.current.startX - event.clientX;
      const nextWidth = dragStateRef.current.startWidth + delta;
      const minMapWidth = 300;
      const maxMapWidth = totalWidth - reservedForPdf - 500;

      setMapWidth(Math.min(Math.max(nextWidth, minMapWidth), maxMapWidth));
    };

    const handlePointerUp = () => {
      dragStateRef.current.active = false;
      setIsDraggingMap(false);
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
  }, [editorLayoutRef, isDraggingMap, isPdfOpen, pdfSplitWidth]);

  const startMapDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!editorLayoutRef.current) return;
      dragStateRef.current = {
        active: true,
        startX: event.clientX,
        startWidth: mapWidth,
      };
      setIsDraggingMap(true);
      event.preventDefault();
    },
    [editorLayoutRef, mapWidth],
  );

  return {
    isMapOpen,
    setIsMapOpen,
    mapWidth,
    setMapWidth,
    isDraggingMap,
    setIsDraggingMap,
    startMapDrag,
  };
}
