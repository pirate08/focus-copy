import { ArrowUp, MoreHorizontal, ShieldCheck } from "lucide-react";

export function StealthDashboard({ onExit }: { onExit: () => void }) {
  return (
    <div className="stealth-shell">
      <header className="stealth-top">
        <div className="stealth-brand">
          <div className="stealth-logo">
            <BarChartIcon />
          </div>
          <div>
            <strong>ARC / OPERATIONS</strong>
            <span>INTERNAL WORKSPACE</span>
          </div>
        </div>
        <div className="stealth-nav">
          <span>Overview</span>
          <span>Projects</span>
          <span>Reports</span>
          <span>Team</span>
        </div>
        <div className="stealth-profile">
          <span>Alex Sharma</span>
          <div className="avatar">AS</div>
        </div>
      </header>
      <div className="stealth-content">
        <div className="stealth-title">
          <div>
            <span className="eyebrow">MONDAY · SEPTEMBER 07, 2026</span>
            <h1>Good morning, Alex</h1>
            <p>Here is the latest operational snapshot for your workspace.</p>
          </div>
          <button className="exit-stealth" onClick={onExit}>
            <ShieldCheck size={15} /> Return to focus desk <kbd>Esc</kbd>
          </button>
        </div>
        <div className="metrics">
          <div>
            <span>ACTIVE PROJECTS</span>
            <strong>08</strong>
            <small className="positive">
              +12.5% <ArrowUp size={12} />
            </small>
          </div>
          <div>
            <span>OPEN ACTIONS</span>
            <strong>24</strong>
            <small className="neutral">Across 6 teams</small>
          </div>
          <div>
            <span>Q3 DELIVERY</span>
            <strong>87.4%</strong>
            <small className="positive">On track</small>
          </div>
          <div>
            <span>TEAM UTILIZATION</span>
            <strong>76%</strong>
            <small className="positive">+4.8%</small>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dash-card wide">
            <div className="dash-card-head">
              <div>
                <span className="eyebrow">DELIVERY VELOCITY</span>
                <h3>Project throughput</h3>
              </div>
              <button className="icon-button small">
                <MoreHorizontal size={17} />
              </button>
            </div>
            <div className="fake-chart">
              <div className="chart-y">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div className="chart-lines">
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="chart-gridline" />
                <div className="bars">
                  {[42, 58, 50, 72, 64, 81, 73, 91, 82, 96, 87, 100].map(
                    (height, index) => (
                      <div
                        className="bar"
                        style={{ height: `${height}%` }}
                        key={index}
                      />
                    ),
                  )}
                </div>
                <div className="chart-x">
                  <span>OCT</span>
                  <span>NOV</span>
                  <span>DEC</span>
                  <span>JAN</span>
                  <span>FEB</span>
                  <span>MAR</span>
                </div>
              </div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <span className="eyebrow">TEAM ACTIVITY</span>
                <h3>Latest updates</h3>
              </div>
              <MoreHorizontal size={17} />
            </div>
            <div className="activity-list">
              <div>
                <div className="activity-avatar blue">JR</div>
                <span>
                  <strong>Jamie Reynolds</strong> updated Client Onboarding
                  <small>12 minutes ago</small>
                </span>
              </div>
              <div>
                <div className="activity-avatar tan">MK</div>
                <span>
                  <strong>Maya Kapoor</strong> completed Q3 Review
                  <small>43 minutes ago</small>
                </span>
              </div>
              <div>
                <div className="activity-avatar green">DL</div>
                <span>
                  <strong>Devon Lee</strong> created a new milestone
                  <small>1 hour ago</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return (
    <div className="bar-chart-icon">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
