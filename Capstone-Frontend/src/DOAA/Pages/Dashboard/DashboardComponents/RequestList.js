import React, { useState } from 'react';
import './RequestList.css';
import { FaSort, FaSortUp, FaSortDown, FaUser } from 'react-icons/fa';
import Timetable from '../../../../Student/Components/TimeTable';

const PendingTable = ({ data, requestType, department }) => {

    console.log(data);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedDetailsRow, setSelectedDetailsRow] = useState(null); // NEW
    const [activeTab, setActiveTab] = useState('new');

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
        return sortConfig.direction === 'asc' ? (
            <FaSortUp className="sort-icon" />
        ) : (
            <FaSortDown className="sort-icon" />
        );
    };

    const showDetailsPopup = (row) => {
    setSelectedDetailsRow(row);
    setActiveTab('new');  // ← ADD
    setIsPopupOpen(true);
};

    const closeDetailsPopup = () => {
        setIsPopupOpen(false);
        setSelectedDetailsRow(null);
    };


    return (
        <div className="pending-table">
            <h3>{requestType}</h3>
            <h4>{department}</h4>
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleSort('name')}>
                            Student Name {getSortIcon('name')}
                        </th>
                        <th onClick={() => handleSort('year')}>
                            Year {getSortIcon('year')}
                        </th>
                        <th onClick={() => handleSort('appID')}>
                            Application ID {getSortIcon('appID')}
                        </th>
                        <th onClick={() => handleSort('courses')}>
                            Courses {getSortIcon('courses')}
                        </th>
                        <th onClick={() => handleSort('branch')}>
                            Branch {getSortIcon('branch')}
                        </th>
                        <th>
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => (
                        <tr key={idx}>
                            <td>
                                <FaUser className="user-icon" /> {row.name}
                            </td>
                            <td>{row.year}</td>
                            <td>{row.application_id}</td>
                            <td>{row.opted_courses.length}</td>
                            <td>{row.branch}</td>
                            <td>
                                <button onClick={() => showDetailsPopup(row)}>Get Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isPopupOpen && (
                <div className="doaa-details-popup">
                    <div className="doaa-popup-content2">
                        <h1>Application Id: #{selectedDetailsRow?.application_id}</h1>
                        <h5>Roll No: {selectedDetailsRow?.roll_no}</h5>
                        <h5>Email: {selectedDetailsRow?.email}</h5>
                        <h5>Subgroup: {selectedDetailsRow?.subgroup}</h5>
                        {selectedDetailsRow?.opted_courses.map((val, ind) => {
                            return <h4>- {val[0]} opted with {val[1]}</h4>
                        })}

{/* Warning banner for stage 6 / flagged applications */}
{selectedDetailsRow?.timetable_version_flagged && (
    <div style={{
        background: '#FFF3CD',
        border: '1px solid #FFC107',
        borderRadius: '8px',
        padding: '10px 16px',
        margin: '12px 0',
        color: '#856404',
        fontWeight: 500,
    }}>
        ⚠️ Timetable updated after approval — new clashes may exist.
        {selectedDetailsRow?.clash_slots?.length > 0 && (
            <div style={{ marginTop: '6px', fontSize: '0.85em' }}>
                Clashing slots: {selectedDetailsRow.clash_slots.join(', ')}
            </div>
        )}
    </div>
)}
                        <div className="doaa-timetable-toggle">
    <button
        className={`toggle-btn ${activeTab === 'current' ? 'active' : ''}`}
        onClick={() => setActiveTab('current')}
    >
        Current Timetable
    </button>
    <button
        className={`toggle-btn ${activeTab === 'new' ? 'active' : ''}`}
        onClick={() => setActiveTab('new')}
    >
        New Timetable
    </button>
</div>

{activeTab === 'current'
    ? <Timetable data={selectedDetailsRow?.current_time_table} ed={selectedDetailsRow?.elective_data} />
    : <Timetable data={selectedDetailsRow?.new_time_table} ed={selectedDetailsRow?.elective_data} />
}
                        <h4>
                            Application Form Link:{" "}
                            <a href={selectedDetailsRow?.url} target="_blank" rel="noopener noreferrer">
                                Click Here
                            </a>
                        </h4>
                        <h4>
                            Fee Reciept Link:{" "}
                            <a href={selectedDetailsRow?.fee_receipt_link} target="_blank" rel="noopener noreferrer">
                                Click Here
                            </a>
                        </h4>
                        <button onClick={closeDetailsPopup} className='doaa-popup-close-btn'>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingTable;
