// Notifications.jsx
import React, { useState, useEffect } from 'react';
import CoordinatorSidebar from '../../Components/Sidebar';
import './Notifications.css';
import Logout from '../../Components/Logout';
import axios from 'axios';

const Notifications = () => {
  const [title, setTitle] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/get-notification`) 
      .then((res) => {
        if (res.data && (res.data.title || res.data.message)) {
          setTitle(res.data.title || '');
          setNotification(res.data.message || '');
        }
      })
      .catch((err) => console.error('Error fetching notification:', err));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !notification.trim()) {
      alert('Please enter both a title and a message!');
      return;
    }

    try {
      const payload = {
        title,
        message: notification,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/coordinator/post-notification`, payload); // your POST endpoint
      alert('Notification updated successfully!');
    } catch (error) {
      console.error('Error posting notification:', error);
      alert('Failed to update notification.');
    }
  };

  return (
    <div className='coordinator-notification'>
      <CoordinatorSidebar />
      <div className="coordinator-notification-main">
        <div className="coordinator-notification-main-top">
          <h1>Manage Notification for Students</h1>
          <Logout />
        </div>

        <div className="coordinator-notification-main-middle">
          <h4>
            Title for Notification
          </h4>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            className="notification-input"
          />

          <h4>
            Message for Notification
          </h4>
          <textarea
            value={notification}
            onChange={(e) => setNotification(e.target.value)}
            placeholder="Type your notification message here..."
            cols="50"
            rows="10"
          />

          <button className="submit-btn" onClick={handleSubmit}>
            Save Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
