import React, { useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar';
import StatCard from './DashboardComponents/StatCard';
import StatCardMain from './DashboardComponents/StatCardMain';
import RequestList from './DashboardComponents/RequestList';
import Logout from '../../Components/Logout'
import './Dashboard.css';
import GaugeChart from '../../../Coordinator/Pages/Dashboard/DashboardComponents/GaugeChart';

// const approvedData = {
//     CSED: [
//         { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//         { name: 'Tina Sharma', year: 1, courses: 1, date: '01 March, 2024' },
//     ],
//     ECED: [
//         { name: 'Arnam Chaurasiya', year: 1, courses: 2, date: '01 March, 2024' },
//         { name: 'Arnam Chaurasiya', year: 1, courses: 3, date: '01 March, 2024' },
//     ],
//     MED: [
//         { name: 'Arnam Chaurasiya', year: 1, courses: 1, date: '01 March, 2024' },
//     ]
// };

// const pendingData = {
//     CSED: [
//         { name: 'Ravi Kumar', year: 2, courses: 1, date: '03 March, 2024' },
//         { name: 'Simran Kaur', year: 3, courses: 2, date: '02 March, 2024' },
//     ],
//     ECED: [
//         { name: 'Nikhil Mehta', year: 4, courses: 1, date: '04 March, 2024' },
//     ]
// };


// const rejectedData = {
//     CSED: [
//         { name: 'Anjali Mishra', year: 2, courses: 1, date: '28 Feb, 2024' },
//     ],
//     ECED: [
//         { name: 'Rahul Verma', year: 1, courses: 2, date: '27 Feb, 2024' },
//     ]
// };

const Dashboard = () => {
    const [allApplications, setAllApplications] = useState('');
    const [pendingData, setPendingData] = useState('');
    const [rejectedData, setRejectedData] = useState('');
    const [approvedData, setApprovedData] = useState('');
    const [selectedType, setSelectedType] = useState('Approved'); 
    const [selectedData, setSelectedData] = useState(approvedData);
    
    useEffect(() =>{
        const fetchApplications = async () =>{
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-all-applications`);
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
        <div className="doaa-dashboard-container">
            <Sidebar />
            <div className="doaa-dashboard-main">
                <Logout />
                <div className="doaa-dashboard-header">
                    <div className="doaa-header-top">
                        <div className="doaa-welcome-text">
                            <h4>Welcome !</h4>
                            <p>Dr. Shruti Sharma</p>
                            <h3>Applications</h3>
                        </div>
                    </div>

                    <div className="doaa-stats-section">
                        <GaugeChart
                            approved={approvedData.length}
                            pending={pendingData.length}
                            rejected={rejectedData.length}
                        />
                        <div className="doaa-stats-section-right">
                            <StatCard type="Approved" count={approvedData.length} color="#D9FCE3" icon="✅" onClick={() => {setSelectedType('Approved'); setSelectedData(approvedData)}} />
                            <StatCard type="Pending" count={pendingData.length} color="#F3E9FF" icon="⏸️" onClick={() => {setSelectedType('Pending'); setSelectedData(pendingData)}} />
                            <StatCard type="Rejected" count={rejectedData.length} color="#E2F8FF" icon="🚫" onClick={() => { setSelectedType('Rejected'); setSelectedData(rejectedData) }} />
                        </div>
                    </div>
                </div>

                {/* {Object.entries(selectedData).map(([deptName, deptData]) => ( */}
                    <RequestList
                        // key={deptName}
                        data={selectedData}
                        requestType={selectedType}
                        department={"CSED"}
                    />
                {/* ))} */}

            </div>
        </div>
    );
};

export default Dashboard;
