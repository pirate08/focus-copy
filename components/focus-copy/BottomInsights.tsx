import { ArrowUp, ChevronRight, Sparkles, Zap } from "lucide-react";

export function BottomInsights() {
  return (
    <div className="bottom-insights">
      <div className="insight-card">
        <div className="insight-icon green">
          <Sparkles size={17} />
        </div>
        <div>
          <strong>Revision rhythm</strong>
          <span>3 focused sessions this week · keep the streak going</span>
        </div>
        <ArrowUp size={15} className="trend-up" />
      </div>
      <div className="insight-card">
        <div className="insight-icon amber">
          <Zap size={17} />
        </div>
        <div>
          <strong>Next best action</strong>
          <span>Complete 2 more Geography topics to unlock a review set</span>
        </div>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}
