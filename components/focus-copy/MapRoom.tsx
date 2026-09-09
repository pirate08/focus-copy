import {
  ArrowUp,
  Circle,
  Highlighter,
  Map,
  MapPin,
  MoreHorizontal,
  Pen,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

export type DrawingTool = "pen" | "highlighter" | "pin" | "circle" | "arrow";

const mapOptions = [
  { id: "india_political", label: "India Political", tone: "india" },
  { id: "india_physical", label: "India Physical", tone: "terrain" },
  { id: "world", label: "World Map", tone: "world" },
  { id: "india_states", label: "State-wise", tone: "states" },
] as const;

export function MapRoom({
  compact = false,
  activeMap,
  setActiveMap,
  drawingTool,
  setDrawingTool,
  canvasRef,
  beginDrawing,
  draw,
  setIsDrawing,
  onClose,
  onSave,
  onUndo,
  canUndo,
}: {
  compact?: boolean;
  activeMap: (typeof mapOptions)[number]["id"];
  setActiveMap: (value: (typeof mapOptions)[number]["id"]) => void;
  drawingTool: DrawingTool;
  setDrawingTool: (value: DrawingTool) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  beginDrawing: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  draw: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  setIsDrawing: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  return (
    <div className={`map-room panel-mode${compact ? " compact" : ""}`}>
      <div className="map-head">
        <div>
          <span className="eyebrow">PRACTICE ROOM</span>
          <h2>Blank maps</h2>
        </div>
        <div className="map-head-actions">
          <button className="secondary-button" onClick={onSave}>
            <Save size={15} /> Save to note
          </button>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="map-tabs">
        {mapOptions.map((map) => (
          <button
            className={activeMap === map.id ? "active" : ""}
            onClick={() => setActiveMap(map.id)}
            key={map.id}
          >
            <Map size={14} />
            {map.label}
          </button>
        ))}
      </div>
      <div className="map-body">
        <div className="map-toolbar">
          <span className="eyebrow">ANNOTATE</span>
          {(
            [
              ["pen", Pen],
              ["highlighter", Highlighter],
              ["pin", MapPin],
              ["circle", Circle],
              ["arrow", ArrowUp],
            ] as const
          ).map(([tool, Icon]) => (
            <button
              className={drawingTool === tool ? "active" : ""}
              onClick={() => setDrawingTool(tool)}
              key={tool}
              title={tool}
            >
              <Icon size={17} />
            </button>
          ))}
          <span className="toolbar-separator" />
          <button title="Undo" onClick={onUndo} disabled={!canUndo}>
            <RotateCcw size={17} />
          </button>
          <button title="Clear">
            <MoreHorizontal size={17} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="map-canvas"
          onPointerDown={beginDrawing}
          onPointerMove={draw}
          onPointerUp={() => setIsDrawing(false)}
          onPointerLeave={() => setIsDrawing(false)}
        />
      </div>
      <div className="map-footer">
        <span>
          <MapPin size={14} /> Mark rivers, passes, ports, and sites
        </span>
        <span>Canvas autosaves locally</span>
      </div>
    </div>
  );
}
