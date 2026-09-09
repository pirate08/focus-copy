import {
  ChevronRight,
  Cloud,
  Menu,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sun,
} from "lucide-react";

type TopBarProps = {
  selectedTopicName: string;
  saveStatus: string;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
  onOpenStealth: () => void;
};

export function TopBar({
  selectedTopicName,
  saveStatus,
  darkMode,
  onToggleTheme,
  onOpenSidebar,
  onOpenStealth,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <NotebookPen size={18} />
        </div>
        <div>
          <strong>FOCUS / COPY</strong>
          <span>UPSC STUDY DESK</span>
        </div>
      </div>
      <div className="topbar-center">
        <div className="breadcrumbs">
          <span>Workspace</span>
          <ChevronRight size={13} />
          <span>{selectedTopicName}</span>
        </div>
        <div className="save-indicator">
          <Cloud size={14} /> {saveStatus}
        </div>
      </div>
      <div className="top-actions">
        <button
          className="icon-button mobile-menu"
          onClick={onOpenSidebar}
          aria-label="Open subjects"
        >
          <Menu size={18} />
        </button>
        <button
          className="icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="office-button" onClick={onOpenStealth}>
          <ShieldCheck size={15} /> Quick Switch <kbd>Esc</kbd>
        </button>
        <div className="avatar">AS</div>
      </div>
    </header>
  );
}
