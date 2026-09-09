type SplitterProps = {
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  isDragging: boolean;
  label: string;
};

export function Splitter({
  onPointerDown,
  onDoubleClick,
  isDragging,
  label,
}: SplitterProps) {
  return (
    <div
      className={`splitter ${isDragging ? "dragging" : ""}`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      title="Drag to resize"
    />
  );
}
