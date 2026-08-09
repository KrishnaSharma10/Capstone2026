import React, { useState } from 'react';
import CoordinatorSidebar from '../../Components/Sidebar';
import './TimeTable.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const TimeTable = () => {
  const [timetableUploads, setTimetableUploads] = useState([
    { name: 'TIMETABLEJULYTODEC25.xlsx', year: '2025-2026', size: '1.24 MB', date: '7 August, 2025', status: 'Implemented' },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const newUpload = {
      name: file.name,
      year: '2025-2026', // Make this dynamic if needed
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      status: 'Pending'
    };

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://127.0.0.1:3001/upload", formData);

      if (res.data?.success === false) {
        toast.error("Timetable processing failed. Please check the file and try again.");
        setIsUploading(false);
        return;
      }

      if (res.data?.mongo_updated === false) {
        toast.warning(
          "File processed, but the live database update failed. Students may not see this timetable yet. Please retry or contact tech support."
        );
      } else {
        toast.success("File uploaded and processed successfully. Changes are now live.");
      }

      setTimetableUploads((prev) => [
        ...prev,
        { ...newUpload, status: res.data?.mongo_updated === false ? 'Failed' : 'Implemented' },
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Error uploading or processing the file. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <CoordinatorSidebar />
      <div className="coordinator-main-timetable">
        <div className="coordinator-timetable-section">
          <h2 className="coordinator-timetable-title">Time Table</h2>

          <div className="timetable-upload-area">
            {/* Hidden file input */}
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="timetable-file"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <button
              className="timetable-update-btn"
              onClick={() => document.getElementById("timetable-file").click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload New Time Table'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTable;