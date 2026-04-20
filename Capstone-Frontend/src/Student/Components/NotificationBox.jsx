// NotificationBox.jsx
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { FaBell } from 'react-icons/fa';
// import './NotificationBox.css';

// const NotificationBox = () => {
//   const [showMessage, setShowMessage] = useState(false);
//   const [notifMsg, setNotifMsg] = useState(null);

//   // Fetch notification once on mount
//   useEffect(() => {
//     const fetchNotification = async () => {
//       try {
//         const res = await axios.get('http://127.0.0.1:5000/api/get-notification');
//         if (res.data) {
//           setNotifMsg(res.data);
//         }
//       } catch (err) {
//         console.error('Error fetching notification:', err);
//       }
//     };
//     fetchNotification();
//   }, []);

//   // If no notification yet
//   if (!notifMsg) return null;

//   return (
//     <>
//       <div
//         className="notification-box"
//         onClick={() => setShowMessage(true)}
//         title="View Notification"
//       >
//         <FaBell size={28} />
//       </div>

//       <div className={`notification-message-box ${showMessage ? 'show' : 'hide'}`}>
//         <button
//           className="close-btn"
//           onClick={() => setShowMessage(false)}
//         >
//           ×
//         </button>
//         <div className="message-content">
//           <h2>{notifMsg.title}</h2>
//           <p>{notifMsg.message}</p>
//         </div>
//       </div>
//     </>
//   );
// };

// export default NotificationBox;
//angad announcements
//above code only fetches one notification, updating it to fetch all and show them as a list
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
        const res = await axios.get('http://127.0.0.1:5000/api/student/get-notifications');
        if (res.data && res.data.length > 0) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  if (notifications.length === 0) return null;

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
          <button className="close-btn" onClick={() => setShowMessage(false)}>×</button>
          <h2>📢 Announcements</h2>
          <div className="notifications-list">
            {notifications.map((notif, index) => (
              <div key={index} className="notification-item">
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                <span className="notification-date">
                  {new Date(notif.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
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
