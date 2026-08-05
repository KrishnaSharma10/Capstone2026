import React, { useEffect, useState, useContext } from "react";
import "./Status.css";
import {
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaRegBell,
} from "react-icons/fa";
import StudentSidebar from '../../Components/Sidebar';
import Logout from "../../Components/Logout";
import { UserContext } from "../../../UserContext";
import axios from "axios";
import Timetable from "../../Components/TimeTable";

const Status = () => {
  const { student } = useContext(UserContext);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState(-1);
  const [comments, setComments] = useState([]);
  const [appData, setAppData] = useState({});

  useEffect(() => {
    if (student && student.ongoing_application) {
      setActive(true);
      axios.post("http://127.0.0.1:5000/api/get-application-details", {
        application_id: student.ongoing_application
      })
      .then((res) => {
        setStatus(res.data["Application Data"]["stage"]);
        setComments(res.data["Application Data"]["comments"]);
        setAppData(res.data["Application Data"]);
      })
      .catch((err) => {
        console.error("Error fetching application details:", err);
        setActive(false);
      });
    } else {
      setActive(false);
    }
  }, [student]);

  const steps = [
    { label: "Application Sent", stepIndex: 1 },
    { label: "DOAA Approval", stepIndex: 2 },
    { label: "Coordinator Approval", stepIndex: 3 },
    { label: "Fees Submitted by Student", stepIndex: 4 },
    { label: "Fees Receipt Verified", stepIndex: 5 },
  ];

  const totalSteps = steps.length;

  // % width of the red fill line, based on how many steps are completed
  const progressPercent =
    status <= 0 ? '0%' : `${(Math.min(status, totalSteps) / totalSteps) * 100}%`;

  const statusColor = (stepIndex) => {
    if (status === 10) return '#e53935';            // Rejected
    else if (stepIndex <= status) return '#00c853'; // Completed
    else if (stepIndex === status + 1) return '#ffb300'; // In progress
    else return '#c8c8c8'; // Pending
  };

  const overallBadge = () => {
    if (status === 10) {
      return { text: "Rejected", color: "#e53935", bg: "#fdeaea", Icon: FaTimesCircle };
    } else if (status >= totalSteps) {
      return { text: "Completed", color: "#1b873f", bg: "#e6f4ea", Icon: FaCheckCircle };
    } else if (status >= 0) {
      return { text: "In Progress", color: "#b26a00", bg: "#fff6e0", Icon: FaHourglassHalf };
    }
    return { text: "No Application", color: "#888", bg: "#f0f0f0", Icon: FaClipboardList };
  };

  const badge = overallBadge();

  return (
    <div>
      <StudentSidebar />

      <div className="status-top-row">
        <div>
          <p className="status-eyebrow">Application Tracking</p>
          <h1 className="status-heading">Ongoing Application Status</h1>
        </div>
        <div className="status-top-right">
          {active && (
            <div className="status-badge-box">
              <span className="status-badge-dot" style={{ backgroundColor: badge.color }}></span>
              <div>
                <p className="status-badge-label">APPLICATION STATUS</p>
                <p className="status-badge-value" style={{ color: badge.color }}>{badge.text}</p>
              </div>
            </div>
          )}
          <Logout />
        </div>
      </div>

      <div className="status-container">
        <p className="status-app-id">
          Application ID: <span>{student?.ongoing_application || "—"}</span>
        </p>

        {active ? (
          <>
            <div className="status-tracker-card">
              <div className="status-line-bg"></div>
              <div className="status-line-fill" style={{ width: progressPercent }}></div>
              <div className="status-steps">
                {steps.map((step, index) => (
                  <div key={index} className="status-step">
                    <div
                      className="status-dot"
                      style={{
                        backgroundColor: statusColor(step.stepIndex),
                        boxShadow: `0 0 0 3px ${statusColor(step.stepIndex)}33`
                      }}
                    ></div>
                    <div className="status-label">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="status-tt-card">
              <h2 className="status-tt-heading">Time Table</h2>
              <Timetable data={appData?.new_time_table} ed={appData?.elective_data} />
            </div>

{appData?.opted_courses && appData.opted_courses.length > 0 && (
  <div className="status-courses-box">
    <p className="status-courses-title">
      <FaClipboardList /> Opted Course Groups
    </p>
    <div className="status-courses-list">
      {appData.opted_courses.map((val, idx) => (
        <div key={idx} className="status-course-item">
          <span className="status-course-code">{val[0]}</span>
          <span className="status-course-groups">{val[1]}</span>
        </div>
      ))}
    </div>
  </div>
)}

            <div className="status-guidelines-box">
              <p className="status-guidelines-title">
                <FaClipboardList /> Guidelines
              </p>
              <div className="status-guideline-item">
                <span className="status-guideline-num">1</span>
                <span>
                  Get a printout of your new timetable, fee receipt, and generated
                  application, and submit them to your Coordinator.
                </span>
              </div>
            </div>

            <div>
              <h3 className="alerts-heading"><FaRegBell /> Alerts</h3>
              <div className="alerts-box">
                {comments && comments.length > 0 ? (
                  comments.map((val, i) => (
                    <p key={i} className="alert-text">• {val}</p>
                  ))
                ) : (
                  <p className="alert-empty">No comments yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="status-empty-card">
            <FaClipboardList className="status-empty-icon" />
            <p className="status-empty-text">No active applications!</p>
            <p className="status-empty-subtext">
              Once you submit a course improvement request, you can track its progress here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Status;