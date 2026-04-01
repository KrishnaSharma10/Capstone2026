import React from 'react';
import './StatCard.css';

export default function StatCard({ type, count, color, icon, onClick }) {
    return (
        <div
            className="finance-stat-card"
            style={{ backgroundColor: color }}
            onClick={onClick}
        >
            <span className="finance-stat-icon">{icon}</span>
            <div className="finance-stat-info">
                <p className="finance-stat-type">{type}</p>
                <p className="finance-stat-count">{count || 0}</p>
            </div>
        </div>
    );
}