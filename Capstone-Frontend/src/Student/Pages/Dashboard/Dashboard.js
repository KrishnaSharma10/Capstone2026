import React, { useContext, useEffect, useRef, useState } from 'react'
import StudentSidebar from '../../Components/Sidebar'
import './Dashboard.css'
import Timetable from '../../Components/TimeTable'
import axios from 'axios'
import { UserContext } from '../../../UserContext'
import Logout from '../../Components/Logout'
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";
/*angad announcements*/
import NotificationBox from '../../Components/NotificationBox';

const Dashboard = () => {
  const { setStudent, student } = useContext(UserContext);
  const [ttData, setTtData] = useState(null);
  const [electiveData, setElectiveData] = useState(null);
  const hasFetchedTTData = useRef(false);
  const hasFetchedElectiveData = useRef(false);


  useEffect(() => {
    if (!student) return;
    console.log(student);

    const fetchElectiveData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/get-elective-data`);
        setElectiveData(res.data);
      } catch (err) {
        console.error("Failed to fetch data:", err.response?.data || err.message);
      }
    }

    const fetchTimeTableData = async () => {
      try {
        const token = localStorage.getItem("ICMPStudentToken");

        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/gettimetable?subgroup=` + student.subgroup, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTtData(res.data.data);

        if (hasFetchedTTData.current == false) {
          setStudent(prev => ({
            ...prev,
            timeTableData: res.data.data
          }));
          hasFetchedTTData.current = true;
        }
        console.log(student);

      } catch (err) {
        console.error("Failed to fetch data:", err.response?.data || err.message);
      }
    }

    fetchTimeTableData();
    fetchElectiveData();
  }, [student]);

  if (!student || !electiveData) return (
    <div>
      <StudentSidebar />
      <div className="student-main-dashboard">
        <div className="student-main-dashboard-top-row">
          <h1>Dashboard</h1>
          <Logout />
        </div>
        <h1 className='loading-heading'>Fetching and Loading the Data...</h1>
      </div>
    </div>
  );

  const ed = electiveData[student.elective_basket];
  if (hasFetchedElectiveData.current == false) {
    setStudent(prev => ({
      ...prev,
      electiveData: ed
    }));
    hasFetchedElectiveData.current = true;
  }
  //angad announcements
// const ed = electiveData?.[student?.elective_basket];
// useEffect(() => {
//   if (ed && !hasFetchedElectiveData.current) {
//     setStudent(prev => ({ ...prev, electiveData: ed }));
//     hasFetchedElectiveData.current = true;
//   }
// }, [ed]);


  return (
    <div className="dashboard-container">
      <StudentSidebar />

      <div className="dashboard-content">

        {/* TOP BAR */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {student.name}</h1>
            <div className="status-row">
              <span className="status-badge">Write Something</span>
            </div>
          </div>
          <Logout />
        </div>

        {/* CARDS */}
        <div className="dashboard-cards">

          <div className="card highlight">
            <p>ROLL NUMBER</p>
            <h2>{student.roll_no}</h2>
            <div className="progress-line"></div>
          </div>

          <div className="card">
            <p>BRANCH / DEPARTMENT</p>
            <h3>{student.branch} / {student.department}</h3>
            <small>Subgroup - {student.subgroup}</small>
          </div>

          <div className="card">
            <p>CURRENT YEAR</p>
            <h1>{student.academic_year}</h1>      
            <small></small>
          </div>

          <div className="card">
            <p>ELECTIVES</p>
            <ul>
              <li>{student.elective_basket}</li>
              <li>{student.general_elective}</li>
            </ul>
          </div>

        </div>

        {/* TIMETABLE */}
        <div className="dashboard-timetable">
          <div className="tt-header">
            <h2>Your Timetable</h2>
          </div>

          <p className="tt-subtext">
            Weekly academic schedule including improvement lectures and sessions.
          </p>

          <div className="timetable-scroll">
            <Timetable data={ttData} ed={ed} />
          </div>
          <div className="timetable-legend">
            <div className="legend-item">
              <span className="legend-dot free"></span>
              <p>Free Slots</p>
            </div>
            <div className="legend-item">
              <span className="legend-dot lecture"></span>
              <p>Lectures</p>
            </div>
            <div className="legend-item">
              <span className="legend-dot lab"></span>
              <p>Labs</p>
            </div>
            <div className="legend-item">
              <span className="legend-dot tutorial"></span>
              <p>Tutorials</p>
            </div>
            <div className="legend-item">
              <span className="legend-dot elective"></span>
              <p>Electives</p>
            </div>
          </div>
        </div>
              {/* angad announcements */}
      <NotificationBox />
      </div>

    </div>
  )
}

export default Dashboard