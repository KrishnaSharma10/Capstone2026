import React, { useContext, useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar';
import StatCard from './DashboardComponents/StatCard';
import StatCardMain from './DashboardComponents/StatCardMain';
import RequestList from './DashboardComponents/RequestList';
import Logout from '../../Components/Logout'
import './Dashboard.css';
import { UserContext } from '../../../UserContext';

// const approvedData = [
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
// ];

// const pendingData = [
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
// ];

// const rejectedData = [
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//   { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//   { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
// ];

const Dashboard = () => {
  const [allApplications, setAllApplications] = useState('');
  const [pendingData, setPendingData] = useState('');
  const [rejectedData, setRejectedData] = useState('');
  const [approvedData, setApprovedData] = useState('');
  const [selectedType, setSelectedType] = useState('Approved'); 
  const [selectedData, setSelectedData] = useState(approvedData);

  const {hod} = useContext(UserContext);

  // const getDataByType = () => {
  //   switch (selectedType) {
  //     case 'Approved':
  //       return approvedData;
  //     case 'Pending':
  //       return pendingData;
  //     case 'Rejected':
  //       return rejectedData;
  //     default:
  //       return [];
  //   }
  // };

  // const handleLogout = () => {
  //   console.log('Logged out');
  //   // Add real logout logic here
  // };

  useEffect(() =>{
          const fetchApplications = async () =>{
              try {
                  const response = await fetch('http://127.0.0.1:5000/api/hod/get-applicationsforhod', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('ICMPTokenHod')}`
  }
});
                  const data = await response.json();
                  console.log(data.data);
                  setAllApplications(data.data);
  
                  const pending = [];
                  const approved = [];
                  const rejected = [];
  
                  data.data.forEach((app) => {
                      switch (app.stage) {
                          case 1:
                          case 2:
                          case 3:
                          case 4:
                              pending.push(app);
                              break;
                          case 5:
                              approved.push(app);
                              break;
                          case 10:
                              rejected.push(app);
                      }
                  });            
                  console.log(pending);
                  console.log(approved);
                  console.log(rejected);
  
                  setPendingData(pending);
                  setApprovedData(approved);
                  setRejectedData(rejected);
  
              } catch (error) {
                  console.error('Error fetching applications data:', error);
                }
          };
  
          fetchApplications();
      }, []);

  return (
    <div className="hod-dashboard-container">
      <Sidebar />
      <div className="hod-dashboard-main">
        <Logout />

          <div className="hod-dashboard-header">
            <div className="hod-header-top">
              <div className="hod-welcome-text">
                <h4>Welcome!</h4>
                <p>{hod?.hod_name || "Loading"}</p>
                <h3>Applications</h3>
              </div>
            </div>

            <div className="hod-stats-section">
            <StatCardMain type="Approved" count="{}" color="#D9FCE3" icon="✅" onClick={() => { setSelectedType('Approved'); setSelectedData(approvedData) }} />
            <StatCard type="Approved" count={approvedData.length} color="#D9FCE3" icon="✅" onClick={() => { setSelectedType('Approved'); setSelectedData(approvedData) }} />
            <StatCard type="Pending" count={pendingData.length} color="#F3E9FF" icon="⏸️" onClick={() => { setSelectedType('Pending'); setSelectedData(pendingData) }} />
            <StatCard type="Rejected" count={rejectedData.length} color="#E2F8FF" icon="🚫" onClick={() => { setSelectedType('Rejected'); setSelectedData(rejectedData) }} />

            </div>
          </div>
     
        {/* ✅ Just pass the whole array once */}
        <RequestList
          data={selectedData}
          requestType={selectedType}
        />
      </div>
    </div>
  );
};

export default Dashboard;
