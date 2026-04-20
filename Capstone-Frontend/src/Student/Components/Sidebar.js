import React, { useState } from "react";
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaUser,
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaHistory,
  FaBell,
  FaCog,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function StudentSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/student/dashboard", icon: <FaHome /> },
    { name: "Course Improvement", path: "/student/course-improvement", icon: <FaBook /> },
    { name: "Accounts", path: "/student/account", icon: <FaUser /> },
    { name: "Fees Payment", path: "/student/fees", icon: <FaMoneyCheckAlt /> },
    { name: "History", path: "/student/history", icon: <FaHistory /> },
    { name: "Status", path: "/student/status", icon: <FaBell /> },
    { name: "FAQs", path: "/student/faq", icon: <FaCog /> },
  ];

  return (
    <>
      {!isOpen && (
        <button
          className="mobile-menu-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
      )}

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div className={`student-sidebar ${isOpen ? "open" : ""}`}>
        <button className="sidebar-close-button" onClick={() => setIsOpen(false)}>
          <FaTimes />
        </button>

        {/* TOP PROFILE */}
        <div className="sidebar-profile">
          <img src="/logo.png" alt="logo" className="sidebar-logo-img" />
          <div>
            <h3>Thapar University</h3>
            <p>ICMP</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="student-sidebar-menu">
          {menuItems.map((item, index) => (
            <Link
              to={item.path}
              key={index}
              className={`menu-item ${location.pathname === item.path ? "active" : ""
                }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}