import React from 'react';
import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUserTie, FaBell } from 'react-icons/fa';

export default function FinanceSidebar() {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/finance/dashboard', icon: <FaHome /> },
        { name: 'Account', path: '/finance/account', icon: <FaUserTie /> },
        { name: 'Notifications', path: '/finance/notifications', icon: <FaBell /> },
    ];

    return (
        <div className="finance-sidebar">
            <div className="finance-sidebar-logo">ICMP</div>
            <nav className="finance-sidebar-menu">
                {menuItems.map((item, index) => (
                    <Link
                        to={item.path}
                        key={index}
                        className={`finance-sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="finance-sidebar-icon">{item.icon}</span>
                        <span className="finance-sidebar-label">{item.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}