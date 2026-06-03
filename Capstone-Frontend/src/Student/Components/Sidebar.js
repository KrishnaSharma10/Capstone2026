import React, { useState } from "react";
import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaUser,
  FaMoneyCheckAlt,
  FaHistory,
  FaBell,
  FaCog,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaPlusCircle,
} from "react-icons/fa";

export default function StudentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem("ICMPTokenStudent");
    navigate("/login");
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger button — always visible on mobile */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <FaBars />
      </button>

      {/* Dark overlay behind sidebar */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={closeMenu}
      />

      <div className={`student-sidebar ${isOpen ? "open" : ""}`}>
        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-button"
          onClick={closeMenu}
          aria-label="Close menu"
        >
          <FaTimes />
        </button>

        {/* Profile / Logo */}
        <div className="sidebar-profile">
          <img src="/logo.png" alt="logo" className="sidebar-logo-img" />
          <div>
            <h3>Thapar University</h3>
            <p>ICMP</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="student-sidebar-menu">
          {menuItems.map((item, index) => (
            <Link
              to={item.path}
              key={index}
              className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={closeMenu}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          {/*<Link
            to="/student/course-improvement"
            className="new-app-btn"
            onClick={closeMenu}
          >
            <FaPlusCircle />
            <span>New Application</span>
          </Link> */}

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}