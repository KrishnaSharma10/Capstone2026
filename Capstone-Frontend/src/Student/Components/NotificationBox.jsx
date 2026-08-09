import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import './NotificationBox.css';

const NotificationBox = () => {
  const [showMessage, setShowMessage] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/get-notifications`);
        const sortedNotifications = Array.isArray(res.data)
          ? [...res.data].sort((firstNotification, secondNotification) => {
              const firstCreatedAt = new Date(firstNotification.created_at || 0).getTime();
              const secondCreatedAt = new Date(secondNotification.created_at || 0).getTime();
              return secondCreatedAt - firstCreatedAt;
            })
          : [];

        setNotifications(sortedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="notification-box"
        onClick={() => setShowMessage(true)}
        title="View Notifications"
      >
        <FaBell size={28} />
        <span className="notification-badge">{notifications.length}</span>
      </div>

      {showMessage && (
        <div className="notification-message-box show">
          <button className="close-btn" onClick={() => setShowMessage(false)}>&times;</button>
          <h2>Announcements</h2>
          <div className="notifications-list">
            {notifications.map((notif, index) => (
              <div
                key={notif.id || `${notif.title}-${notif.created_at || index}`}
                className="notification-item"
              >
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                <span className="notification-date">
                  {new Date(notif.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationBox;
