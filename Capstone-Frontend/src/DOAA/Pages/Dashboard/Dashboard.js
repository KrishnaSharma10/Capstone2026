import React, { useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar';
import StatCard from './DashboardComponents/StatCard';
import StatCardMain from './DashboardComponents/StatCardMain';
import RequestList from './DashboardComponents/RequestList';
import Logout from '../../Components/Logout';
import './Dashboard.css';
import GaugeChart from '../../../Coordinator/Pages/Dashboard/DashboardComponents/GaugeChart';

const Dashboard = () => {
    const [allApplications, setAllApplications] = useState('');
    const [pendingData, setPendingData]         = useState([]);
    const [rejectedData, setRejectedData]       = useState([]);
    const [approvedData, setApprovedData]       = useState([]);
    const [needsReviewData, setNeedsReviewData] = useState([]);   // ← new
    const [selectedType, setSelectedType]       = useState('Approved');
    const [selectedData, setSelectedData]       = useState([]);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/get-all-applications');
                const data = await response.json();
                setAllApplications(data.data);

                const pending     = [];
                const approved    = [];
                const rejected    = [];
                const needsReview = [];   // ← new

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
                        case 6:               // ← new
                            needsReview.push(app);
                            break;
                        case 10:
                            rejected.push(app);
                    }
                });

                setPendingData(pending);
                setApprovedData(approved);
                setRejectedData(rejected);
                setNeedsReviewData(needsReview);   // ← new
                setSelectedData(approved);  // seed the initial view
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
                            <StatCard type="Approved"        count={approvedData.length}    color="#D9FCE3" icon="✅" onClick={() => { setSelectedType('Approved');     setSelectedData(approvedData);    }} />
                            <StatCard type="Pending"         count={pendingData.length}     color="#F3E9FF" icon="⏸️" onClick={() => { setSelectedType('Pending');      setSelectedData(pendingData);     }} />
                            <StatCard type="Rejected"        count={rejectedData.length}    color="#E2F8FF" icon="🚫" onClick={() => { setSelectedType('Rejected');     setSelectedData(rejectedData);    }} />
                            <StatCard type="Needs Re-review" count={needsReviewData.length} color="#FFE8E8" icon="⚠️" onClick={() => { setSelectedType('Needs Re-review'); setSelectedData(needsReviewData); }} />  {/* ← new */}
                        </div>
                    </div>
                </div>

                <RequestList
                    data={selectedData}
                    requestType={selectedType}
                    department={"CSED"}
                />

                
            </div>
        </div>
    );
};

export default Dashboard;