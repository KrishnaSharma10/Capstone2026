import React, { useState } from 'react';
import './HistoryTile.css';
import Timetable from '../../../Components/TimeTable';

export default function HistoryTile({ data }) {
  const [expanded, setExpanded] = useState(false);

  const isAccepted = data.stage === 5;
  const stageLabel = isAccepted ? 'Accepted' : 'Rejected';

  return (
    <div className={`htile ${expanded ? 'htile--open' : ''}`}>

      {/* ── Clickable header ─────────────────────────────────────── */}
      <div className="htile__header" onClick={() => setExpanded(!expanded)}>
        <div className="htile__header-left">
          <span className="htile__id">Application #{data.application_id}</span>
          <span className={`htile__badge htile__badge--${isAccepted ? 'accepted' : 'rejected'}`}>
            {stageLabel}
          </span>
        </div>
        <span className="htile__toggle">{expanded ? '×' : '+'}</span>
      </div>

      {/* ── Expanded body ────────────────────────────────────────── */}
      {expanded && (
        <div className="htile__body">

          {/* Opted courses */}
          <div className="htile__section">
            <p className="htile__section-label">Opted Courses</p>
            <div className="htile__courses">
              {data.opted_courses.map((val, ind) => (
                <div key={ind} className="htile__course-row">
                  <span className="htile__course-code">{val[0]}</span>
                  <span className="htile__course-group">{val[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timetable */}
          <div className="htile__section">
            <p className="htile__section-label">Generated Timetable</p>
            <div className="htile__timetable-wrap">
              <Timetable data={data.new_time_table} ed={data.elective_data} />
            </div>
          </div>

          {/* Downloads */}
          <div className="htile__section htile__links-row">
            <a
              href={data?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="htile__link-btn"
            >
              <span>📄</span> Application Form
            </a>
            <a
              href={data?.fee_receipt_link}
              target="_blank"
              rel="noopener noreferrer"
              className="htile__link-btn"
            >
              <span>🧾</span> Fee Receipt
            </a>
          </div>

          {/* Comments */}
          {data.comments?.length > 0 && (
            <div className="htile__section">
              <p className="htile__section-label">Comments</p>
              <ul className="htile__comments">
                {data.comments.map((val, ind) => (
                  <li key={ind} className="htile__comment">{val}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}