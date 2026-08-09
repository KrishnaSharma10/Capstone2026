import React, { useContext, useEffect, useState } from 'react';
import './History.css';
import Sidebar from '../../Components/Sidebar';
import HistoryTile from './HistoryComponents/HistoryTile';
import { UserContext } from '../../../UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function History() {
  const { student } = useContext(UserContext);
  const [applicationData, setApplicationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      axios
        .post(`${process.env.REACT_APP_API_URL}/api/student/get-all-application`, student)
        .then((res) => {
          setApplicationData(res.data.Applications);
        })
        .catch(() => {
          toast.error('Some error in fetching data!!');
        })
        .finally(() => setLoading(false));
    }
  }, [student]);

  const filtered = applicationData?.filter(
    (d) => d.stage === 5 || d.stage === 10
  ) ?? [];

  return (
    <div className="history-page">
      <Sidebar />

      <div className="history-main">
        {/* Header */}
        <p className="history-eyebrow">Application Records</p>
        <h1 className="history-title">Your History</h1>
        <p className="history-subtitle">
          Below are all your finalized improvement course applications. Download
          the application form and fee receipt for each accepted entry, then submit them to the Academic Department.
        </p>

        {/* Info banner */}
        <div className="history-info-banner">
          <span className="history-info-banner__icon">ℹ</span>
          <p className="history-info-banner__text">
            You must download the application form and fee receipt along with a
            copy of your timetable, and submit them to the Academic Department.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-empty">
            <p>Loading your applications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty__icon">📄</span>
            <p className="history-empty__text">No finalized applications to show yet.</p>
          </div>
        ) : (
          <div className="history-tiles-area">
            {filtered.map((data, index) => (
              <HistoryTile key={index} data={data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}