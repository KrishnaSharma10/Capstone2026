import React from 'react';
import './Logout.css';
import { useNavigate } from 'react-router-dom';

export default function FinanceLogout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('ICMPTokenFinance');
        navigate('/login');
    };

    return (
        <div className="finance-top-row">
            <button className="finance-logout-button" onClick={handleLogout}>
                Log Out <span className="finance-logout-icon">➡️</span>
            </button>
        </div>
    );
}