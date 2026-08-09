import React, { useContext, useState } from 'react';
import './Accounts.css';
import Sidebar from '../../Components/Sidebar';
import { FaSave } from 'react-icons/fa';
import { UserContext } from '../../../UserContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Accounts = () => {

  const {hod, setHOD} = useContext(UserContext);
  const [name, setName] = useState("");
  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");


  const handleNameSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a new name");
      return;
    }

    const updatedHod = { ...hod, hod_name: name };

    const token = localStorage.getItem("ICMPTokenHOD");
    const data = {
      hod_name: name,
      hod_email: hod.hod_email
    }
    axios.post(`${process.env.REACT_APP_API_URL}/api/hod/update-name`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    .then(() => {
      toast.success("Name updated successfully!");
      setHOD(updatedHod); // update context
      setName("");         // reset input
    })
    .catch(() => {
      toast.error("Failed to update name.");
    });
  };


  const handlePasswordSave = () => {
    if (!oldP || !newP) {
      toast.error("Please enter both old and new passwords");
      return;
    }

    const token = localStorage.getItem("ICMPTokenHOD");

    axios.post(`${process.env.REACT_APP_API_URL}/api/hod/update-password`, {
      hod_old_password: oldP,
      hod_new_password: newP,
      hod_email: hod.hod_email
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    .then(() => {
      toast.success("Password changed successfully!");
      setOldP("");
      setNewP("");
    })
    .catch(() => {
      toast.error("Password change failed. Please check your old password.");
    });
  };





  return (
    <div className="accounts-layout">
      <Sidebar />

      <div className="accounts-container">
        <div className="accounts-namechange-card">
          <h2 className="welcome-heading">Welcome !</h2>
          <p className="user-role">{hod?.hod_name || "Loading"}</p>

          <h3 className="change-name-heading">Edit your Name</h3>

          <div className="input-group-name">
            <input
              type="text"
              placeholder="Enter your name"
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          

          <button className="save-button-name" onClick={handleNameSave}>
            Save Changes <FaSave className="save-icon" />
          </button>
        </div>


        <div className="accounts-password-card">
          

          <h3 className="change-password-heading">Change Password</h3>

          <div className="input-group-oldpassword">
            <input
              type="password"
              placeholder="Old Password"
              className="password-input"
              value={oldP}
              onChange={(e) => setOldP(e.target.value)}
            />
          </div>

          <div className="input-group-newpassword">
            <input
              type="password"
              placeholder="New Password"
              className="password-input"
              value={newP}
              onChange={(e) => setNewP(e.target.value)}
            />
          </div>

          <button className="save-button-password" onClick={handlePasswordSave}>
            Save Changes <FaSave className="save-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Accounts;