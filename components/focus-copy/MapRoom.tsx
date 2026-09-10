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
          <h2>Map practice</h2>
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
        <button
          className={activeMap === "india_political" ? "active" : ""}
          onClick={() => setActiveMap("india_political")}
        >
          India Blank
        </button>
        <button
          className={activeMap === "india_physical" ? "active" : ""}
          onClick={() => setActiveMap("india_physical")}
        >
          India Reference
        </button>
        <button
          className={activeMap === "india_states" ? "active" : ""}
          onClick={() => setActiveMap("india_states")}
        >
          India State Outlines
        </button>
        <button
          className={activeMap === "world" ? "active" : ""}
          onClick={() => setActiveMap("world")}
        >
          World Map
        </button>
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
        <div
          className="map-canvas-wrap"
          style={{ position: "relative", width: "100%", height: 480 }}
        >
          {/* Map layer */}
          <div
            className="map-layer"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg,#f6fbf9,#eef6f0)",
            }}
          >
            {activeMap === "india_political" && (
              <svg
                viewBox="0 0 800 600"
                style={{ maxWidth: "98%", height: "100%" }}
              >
                <rect width="100%" height="100%" fill="#fff" rx="6" />
                <g fill="none" stroke="#bcd9c4" strokeWidth="1">
                  {/* simple grid + placeholder outline */}
                  <rect
                    x="40"
                    y="40"
                    width="720"
                    height="520"
                    stroke="#d6e8dd"
                  />
                </g>
                <text
                  x="400"
                  y="40"
                  textAnchor="middle"
                  fontSize="18"
                  fill="#547365"
                >
                  India — Political (Outline)
                </text>
              </svg>
            )}
            {activeMap === "india_physical" && (
              <svg
                viewBox="0 0 800 600"
                style={{ maxWidth: "98%", height: "100%" }}
              >
                <rect width="100%" height="100%" fill="#fff" rx="6" />
                <defs>
                  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#dfeedd" />
                    <stop offset="100%" stopColor="#b1d6b0" />
                  </linearGradient>
                </defs>
                <rect
                  x="40"
                  y="40"
                  width="720"
                  height="520"
                  fill="url(#g)"
                  stroke="#c7e0c1"
                />
                <text
                  x="400"
                  y="40"
                  textAnchor="middle"
                  fontSize="18"
                  fill="#38604d"
                >
                  India — Physical (Reference)
                </text>
              </svg>
            )}
            {activeMap === "india_states" && (
              <svg
                viewBox="0 0 800 600"
                style={{ maxWidth: "98%", height: "100%" }}
              >
                <rect width="100%" height="100%" fill="#fff" rx="6" />
                <g fill="none" stroke="#9eb4a6" strokeWidth="1">
                  <rect x="40" y="40" width="720" height="520" />
                </g>
                <text
                  x="400"
                  y="40"
                  textAnchor="middle"
                  fontSize="18"
                  fill="#547365"
                >
                  India — States (Outline)
                </text>
              </svg>
            )}
            {activeMap === "world" && (
              <svg
                viewBox="0 0 1000 600"
                style={{ maxWidth: "98%", height: "100%" }}
              >
                <rect width="100%" height="100%" fill="#fff" rx="6" />
                <text
                  x="500"
                  y="40"
                  textAnchor="middle"
                  fontSize="18"
                  fill="#335"
                >
                  World Map (Reference)
                </text>
              </svg>
            )}
          </div>

          {/* Canvas overlay for annotations */}
          <canvas
            ref={canvasRef}
            className="map-canvas"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            onPointerDown={beginDrawing}
            onPointerMove={draw}
            onPointerUp={() => setIsDrawing(false)}
            onPointerLeave={() => setIsDrawing(false)}
          />
        </div>
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
