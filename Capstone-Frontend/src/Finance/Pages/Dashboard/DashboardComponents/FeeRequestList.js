import React, { useEffect, useState } from 'react';
import './RequestList.css';
import axios from 'axios';
import { FaSort, FaSortUp, FaSortDown, FaUser, FaFileInvoiceDollar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FeeRequestList = ({ data, requestType, onActionComplete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [tableData, setTableData] = useState([]);

    // Rejection popup states
    const [showRejectPopup, setShowRejectPopup] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);

    // Details popup state
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDetailsRow, setSelectedDetailsRow] = useState(null);

    // Bulk selection
    const [selectedRowsData, setSelectedRowsData] = useState([]);

    useEffect(() => {
        if (Array.isArray(data)) {
            setTableData(data);
        }
    }, [data]);

    // ── Sorting ──────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = [...tableData].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="finance-sort-icon" />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp className="finance-sort-icon" />
            : <FaSortDown className="finance-sort-icon" />;
    };

    // ── Single approve ────────────────────────────────────────────────────────
    const handleApprove = (row) => {
        const updatedRow = { ...row, stage: 5 };
        axios.post(`${process.env.REACT_APP_API_URL}/api/finance/update-application`, updatedRow)
            .then(() => {
                setTableData((prev) => prev.filter((item) => item !== row));
                setSelectedRowsData((prev) =>
                    prev.filter((r) => r.application_id !== row.application_id)
                );
                toast.success('Fee receipt approved!');
                onActionComplete();
            })
            .catch((err) => {
                console.error('Error approving application:', err);
                toast.error('Failed to approve. Please try again.');
            });
    };

    // ── Single reject ─────────────────────────────────────────────────────────
    const handleRejectClick = (row) => {
        setSelectedRow(row);
        setRejectionReason('');
        setShowRejectPopup(true);
    };

    const confirmReject = () => {
        const updatedComments = [...(selectedRow.comments || [])];
        // index 2 reserved for finance rejection reason
        updatedComments[2] = rejectionReason;

        const updatedRow = { ...selectedRow, stage: 10, comments: updatedComments };
        axios.post(`${process.env.REACT_APP_API_URL}/api/finance/update-application`, updatedRow)
            .then(() => {
                setTableData((prev) => prev.filter((item) => item !== selectedRow));
                setSelectedRowsData((prev) =>
                    prev.filter((r) => r.application_id !== selectedRow.application_id)
                );
                setShowRejectPopup(false);
                toast.success('Application rejected.');
                onActionComplete();
            })
            .catch((err) => {
                console.error('Error rejecting application:', err);
                toast.error('Failed to reject. Please try again.');
            });
    };

    const cancelReject = () => {
        setShowRejectPopup(false);
        setSelectedRow(null);
        setRejectionReason('');
    };

    // ── Details popup ─────────────────────────────────────────────────────────
    const showDetails = (row) => {
        setSelectedDetailsRow(row);
        setIsDetailsOpen(true);
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedDetailsRow(null);
    };

    // ── Bulk selection ────────────────────────────────────────────────────────
    const handleSelect = (e, rowData) => {
        if (e.target.checked) {
            setSelectedRowsData([...selectedRowsData, rowData]);
        } else {
            setSelectedRowsData(selectedRowsData.filter(
                (r) => r.application_id !== rowData.application_id
            ));
        }
    };

    const handleApproveAll = () => {
        const formList = selectedRowsData.map((val) => ({ ...val, stage: 5 }));
        axios.post(`${process.env.REACT_APP_API_URL}/api/finance/update-all-applications`, { applications: formList })
            .then(() => {
                setTableData((prev) =>
                    prev.filter((item) =>
                        !selectedRowsData.some((sel) => sel.application_id === item.application_id)
                    )
                );
                setSelectedRowsData([]);
                toast.success('Selected applications approved!');
                onActionComplete();
            })
            .catch((err) => {
                console.error('Bulk approve error:', err);
                toast.error('Bulk approve failed. Please refresh.');
            });
    };

    const handleRejectAll = () => {
        const formList = selectedRowsData.map((val) => ({ ...val, stage: 10 }));
        axios.post(`${process.env.REACT_APP_API_URL}/api/finance/update-all-applications`, { applications: formList })
            .then(() => {
                setTableData((prev) =>
                    prev.filter((item) =>
                        !selectedRowsData.some((sel) => sel.application_id === item.application_id)
                    )
                );
                setSelectedRowsData([]);
                toast.success('Selected applications rejected.');
                onActionComplete();
            })
            .catch((err) => {
                console.error('Bulk reject error:', err);
                toast.error('Bulk reject failed. Please refresh.');
            });
    };

    const handleExportCSV = () => {
        const headers = [
            'Student Name',
            'Roll No',
            'Email',
            'Year',
            'Subgroup',
            'Stage',
            'Opted Courses',
            'Application Form Link',
            'Fee Receipt Link',
            'Finance Rejection Reason'
        ];

        const rows = tableData.map((row) => [
            row.name || '',
            row.roll_no || '',
            row.email || '',
            row.year || '',
            row.subgroup || '',
            `Stage ${row.stage}`,
            (row.opted_courses || []).map((c) => `${c[0]} opted with ${c[1]}`).join(' | '),
            row.url || '',
            row.fee_receipt_link || '',
            row.comments?.[2] || ''
        ]);

        const csvContent = [headers, ...rows]
            .map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance_applications_${requestType?.toLowerCase() || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="finance-request-list">
            <h3 className="finance-list-title">
                <FaFileInvoiceDollar className="finance-list-icon" />
                {requestType} Applications
                <span className="finance-count-badge">{tableData.length}</span>
            </h3>

            {tableData.length > 0 && (
                <button className="finance-btn finance-btn-export" onClick={handleExportCSV}>
                    ⬇ Export CSV
                </button>
            )}

            {tableData.length === 0 ? (
                <div className="finance-empty-state">No {requestType.toLowerCase()} applications.</div>
            ) : (
                <table className="finance-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')}>
                                Student Name {getSortIcon('name')}
                            </th>
                            <th onClick={() => handleSort('year')}>
                                Year {getSortIcon('year')}
                            </th>
                            <th onClick={() => handleSort('application_id')}>
                                Application ID {getSortIcon('application_id')}
                            </th>
                            <th>Fee Receipt</th>
                            <th>Details</th>
                            {requestType === 'Pending' && <th>Actions</th>}
                            {requestType === 'Pending' && <th>Select</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, idx) => (
                            <tr key={idx}>
                                <td>
                                    <FaUser className="finance-user-icon" /> {row.name}
                                </td>
                                <td>{row.year}</td>
                                <td>{row.application_id}</td>
                                <td>
                                    {row.fee_receipt_link ? (
                                        <a
                                            href={row.fee_receipt_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="finance-receipt-link"
                                        >
                                            View Receipt
                                        </a>
                                    ) : (
                                        <span className="finance-receipt-missing">Not uploaded</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="finance-btn finance-btn-details"
                                        onClick={() => showDetails(row)}
                                    >
                                        Details
                                    </button>
                                </td>
                                {requestType === 'Pending' && (
                                    <td className="finance-actions-cell">
                                        <button
                                            className="finance-btn finance-btn-approve"
                                            onClick={() => handleApprove(row)}
                                            disabled={!row.fee_receipt_link}
                                            title={!row.fee_receipt_link ? 'No receipt uploaded yet' : ''}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="finance-btn finance-btn-reject"
                                            onClick={() => handleRejectClick(row)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                )}
                                {requestType === 'Pending' && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedRowsData.some(
                                                (sel) => sel.application_id === row.application_id
                                            )}
                                            onChange={(e) => handleSelect(e, row)}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Bulk action bar */}
            {selectedRowsData.length > 0 && (
                <div className="finance-bulk-bar">
                    <span>{selectedRowsData.length} selected</span>
                    <button className="finance-btn finance-btn-approve" onClick={handleApproveAll}>
                        Approve All
                    </button>
                    <button className="finance-btn finance-btn-reject" onClick={handleRejectAll}>
                        Reject All
                    </button>
                </div>
            )}

            {/* ── Reject popup ── */}
            {showRejectPopup && (
                <div className="finance-overlay">
                    <div className="finance-popup">
                        <h4>Reject: {selectedRow?.name}</h4>
                        <p className="finance-popup-sub">Application #{selectedRow?.application_id}</p>
                        <textarea
                            className="finance-popup-textarea"
                            placeholder="Enter rejection reason (optional)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="finance-popup-actions">
                            <button className="finance-btn finance-btn-reject" onClick={confirmReject}>
                                Confirm Reject
                            </button>
                            <button className="finance-btn finance-btn-cancel" onClick={cancelReject}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Details popup ── */}
            {isDetailsOpen && selectedDetailsRow && (
                <div className="finance-overlay">
                    <div className="finance-popup finance-details-popup">
                        <h2>Application #{selectedDetailsRow.application_id}</h2>
                        <div className="finance-details-grid">
                            <div className="finance-details-row">
                                <span className="finance-details-label">Student</span>
                                <span>{selectedDetailsRow.name}</span>
                            </div>
                            <div className="finance-details-row">
                                <span className="finance-details-label">Roll No</span>
                                <span>{selectedDetailsRow.roll_no}</span>
                            </div>
                            <div className="finance-details-row">
                                <span className="finance-details-label">Email</span>
                                <span>{selectedDetailsRow.email}</span>
                            </div>
                            <div className="finance-details-row">
                                <span className="finance-details-label">Year</span>
                                <span>{selectedDetailsRow.year}</span>
                            </div>
                            <div className="finance-details-row">
                                <span className="finance-details-label">Subgroup</span>
                                <span>{selectedDetailsRow.subgroup}</span>
                            </div>
                            <div className="finance-details-row">
                                <span className="finance-details-label">Stage</span>
                                <span className={`finance-stage-badge stage-${selectedDetailsRow.stage}`}>
                                    Stage {selectedDetailsRow.stage}
                                </span>
                            </div>
                        </div>

                        <div className="finance-details-section">
                            <h4>Opted Courses</h4>
                            {selectedDetailsRow.opted_courses?.map((val, ind) => (
                                <p key={ind} className="finance-course-item">
                                    • {val[0]} opted with {val[1]}
                                </p>
                            ))}
                        </div>

                        <div className="finance-details-section">
                            <h4>Links</h4>
                            <p>
                                <span className="finance-details-label">Application Form: </span>
                                {selectedDetailsRow.url ? (
                                    <a href={selectedDetailsRow.url} target="_blank" rel="noopener noreferrer">
                                        Open Form
                                    </a>
                                ) : <span className="finance-receipt-missing">Not available</span>}
                            </p>
                            <p>
                                <span className="finance-details-label">Fee Receipt: </span>
                                {selectedDetailsRow.fee_receipt_link ? (
                                    <a href={selectedDetailsRow.fee_receipt_link} target="_blank" rel="noopener noreferrer">
                                        Open Receipt
                                    </a>
                                ) : (
                                    <span className="finance-receipt-missing">Not uploaded yet</span>
                                )}
                            </p>
                        </div>

                        {selectedDetailsRow.comments?.[2] && (
                            <div className="finance-details-section">
                                <h4>Finance Rejection Reason</h4>
                                <p>{selectedDetailsRow.comments[2]}</p>
                            </div>
                        )}

                        <button className="finance-btn finance-btn-cancel finance-close-btn" onClick={closeDetails}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeRequestList;