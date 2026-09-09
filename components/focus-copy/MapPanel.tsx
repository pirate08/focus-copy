import type { Dispatch, SetStateAction } from "react";

import { MapRoom } from "./MapRoom";
import { Splitter } from "./Splitter";

type MapId = "india_political" | "india_physical" | "world" | "india_states";
type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

type MapPanelProps = {
  isMapOpen: boolean;
  mapWidth: number;
  activeMap: MapId;
  drawingTool: DrawingTool;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  isDragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onClose: () => void;
  onSave: () => void;
  onUndo: () => void;
  onSetActiveMap: Dispatch<SetStateAction<MapId>>;
  onSetDrawingTool: Dispatch<SetStateAction<DrawingTool>>;
  onBeginDrawing: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onDraw: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onSetIsDrawing: Dispatch<SetStateAction<boolean>>;
  canUndo: boolean;
};

export function MapPanel({
  isMapOpen,
  mapWidth,
  activeMap,
  drawingTool,
  canvasRef,
  isDragging,
  onPointerDown,
  onClose,
  onSave,
  onUndo,
  onSetActiveMap,
  onSetDrawingTool,
  onBeginDrawing,
  onDraw,
  onSetIsDrawing,
  canUndo,
}: MapPanelProps) {
  if (!isMapOpen) return null;

  return (
    <>
      <Splitter
        onPointerDown={onPointerDown}
        isDragging={isDragging}
        label="Resize map panel"
      />
      <aside
        className="reference-panel map-panel"
        style={{
          width: `${mapWidth}px`,
          flexBasis: `${mapWidth}px`,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <MapRoom
          compact={false}
          activeMap={activeMap as any}
          setActiveMap={onSetActiveMap as any}
          drawingTool={drawingTool}
          setDrawingTool={onSetDrawingTool as any}
          canvasRef={canvasRef}
          beginDrawing={onBeginDrawing}
          draw={onDraw}
          setIsDrawing={onSetIsDrawing}
          onClose={onClose}
          onSave={onSave}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      </aside>
    </>
  );
}
