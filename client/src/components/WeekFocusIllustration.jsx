export default function WeekFocusIllustration() {
  return (
    <div className="week-illustration" aria-hidden="true">
      <div className="week-illustration-header">
        <span>This week</span>
        <strong>Sep 1 – 7</strong>
      </div>
      <div className="week-illustration-focus">
        <span className="week-illustration-badge">#1 focus</span>
        <strong>Ship the thing that matters</strong>
        <div className="week-illustration-chips">
          <span>P0</span>
          <span>#ship</span>
        </div>
      </div>
      <div className="week-illustration-grid">
        <div className="week-illustration-card">Design review</div>
        <div className="week-illustration-card">QA checklist</div>
        <div className="week-illustration-card">Deploy plan</div>
      </div>
    </div>
  );
}
