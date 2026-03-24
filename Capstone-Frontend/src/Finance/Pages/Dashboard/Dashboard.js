import React, { useContext, useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar';
import Logout from '../../Components/Logout';
import StatCard from './DashboardComponents/StatCard';
import FeeRequestList from './DashboardComponents/FeeRequestList';
import './Dashboard.css';
import { UserContext } from '../../../UserContext';

const FinanceDashboard = () => {
    const [pendingData, setPendingData] = useState([]);
    const [approvedData, setApprovedData] = useState([]);
    const [rejectedData, setRejectedData] = useState([]);
    const [selectedType, setSelectedType] = useState('Pending');
    const [selectedData, setSelectedData] = useState([]);
    const [loading, setLoading] = useState(true);

    const finance = { name: 'Test Finance User' };

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                // Finance fetches all applications that have reached stage 3 or beyond
                const response = await fetch('http://127.0.0.1:5000/api/get-all-applications');
                const data = await response.json();

                const pending = [];   // stage 4 — fee receipt submitted, awaiting finance review
                const approved = [];  // stage 5 — finance approved
                const rejected = [];  // stage 10 — rejected

                data.data.forEach((app) => {
                    switch (app.stage) {
                        case 4:
                            pending.push(app);
                            break;
                        case 5:
                            approved.push(app);
                            break;
                        case 10:
                            rejected.push(app);
                            break;
                        default:
                            break;
                    }
                });

                setPendingData(pending);
                setApprovedData(approved);
                setRejectedData(rejected);
                setSelectedData(pending); // default view = pending
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const handleSelectType = (type, data) => {
        setSelectedType(type);
        setSelectedData(data);
    };

    return (
        <div className="finance-dashboard-container">
            <Sidebar />
            <div className="finance-dashboard-main">
                <Logout />

                <div className="finance-dashboard-header">
                    <div className="finance-welcome">
                        <h4>Welcome,</h4>
                        <p className="finance-welcome-name">{finance?.name || 'Finance Officer'}</p>
                        <h3>Fee Receipt Review</h3>
                    </div>

                    <div className="finance-stats-row">
                        <StatCard
                            type="Pending Review"
                            count={pendingData.length}
                            color="#FFF8E8"
                            icon="⏳"
                            onClick={() => handleSelectType('Pending', pendingData)}
                        />
                        <StatCard
                            type="Approved"
                            count={approvedData.length}
                            color="#E8F5F2"
                            icon="✅"
                            onClick={() => handleSelectType('Approved', approvedData)}
                        />
                        <StatCard
                            type="Rejected"
                            count={rejectedData.length}
                            color="#FDE8E8"
                            icon="🚫"
                            onClick={() => handleSelectType('Rejected', rejectedData)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="finance-loading">Loading applications…</div>
                ) : (
                    <FeeRequestList
                        data={selectedData}
                        requestType={selectedType}
                    />
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;