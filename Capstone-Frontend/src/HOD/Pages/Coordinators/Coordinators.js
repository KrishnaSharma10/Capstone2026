import React, { useContext, useEffect, useState } from 'react';
import './Coordinators.css';
import Sidebar from '../../Components/Sidebar';
import Logout from '../../Components/Logout'
import { UserContext } from '../../../UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Coordinators = () => {
  const {hod} = useContext(UserContext);
  const [coordinators, setCoordinators] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    designation: '',
    password: '',
  });

const token = localStorage.getItem('ICMPTokenHod');
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hod/all-coordinators-details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        console.log(data);
        setCoordinators(data.data || []);
      } catch (error) {
        console.error('Error fetching coordinator data:', error);
      }
    };

    fetchCoordinators();
  }, []);

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email || !newFaculty.designation || !newFaculty.password) return;

    const newEntry = {
      department: hod.hod_department,
      name: newFaculty.name,
      tenureStart: 'present -',
      tenureEnd: 'present',
      designation: newFaculty.designation,
      email: newFaculty.email
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/hod/create-coordinator`, {
        name: newFaculty.name,
        email: newFaculty.email,
        password: newFaculty.password,
        designation: newFaculty.designation,
        department: hod.hod_department,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCoordinators([...coordinators, newEntry]);
      setNewFaculty({ name: '', email: '', designation: '', password: '' });
      setShowPopup(false);
      toast.success("Coordinator added successfully!");
    } catch (error) {
      toast.error("Some error occurred");
    }
  };

  const handleRemoveFaculty = async (index, email) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/hod/delete-coordinator`, {
        email: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedCoordinators = coordinators.filter((_, i) => i !== index);
      setCoordinators(updatedCoordinators);
      toast.success("Deleted successfully!!!");
    } catch (error) {
      toast.error("Some error occurred!!");
    }
  };

  return (
    <div className="hod-coordinators-page">
      <Sidebar />
      <div className="hod-coordinators-main-content">
        <Logout />
        <div className="hod-coordinator-table">
          <h3>Coordinators</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tenure</th>
                <th>Designation</th>
                <th>Mail ID</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {coordinators.map((coord, index) => (
                <tr key={index}>
                  <td><img src='https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg' alt="profile" className='hod-coordinators-icon-img'/> {coord.name}</td>
                  <td>{coord.tenureStart} , {coord.tenureEnd}</td>
                  <td>{coord.designation}</td>
                  <td>{coord.email}</td>
                  <td><button className="hod-coordinators-remove-btn" onClick={() => handleRemoveFaculty(index, coord.email)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="hod-coordinators-add-btn" onClick={() => setShowPopup(true)}>Add Faculty ➕</button>

          {showPopup && (
            <div className="hod-coordinators-popup-box">
              <div className="hod-coordinators-popup-grid">
                  <input
                    type="text"
                    placeholder="Faculty Name"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="hod-coordinators-popup-input"
                  />
                  <input
                    type="text"
                    placeholder="Thapar ID"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  className="hod-coordinators-popup-input"
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                  className="hod-coordinators-popup-input"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newFaculty.password}
                    onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                  className="hod-coordinators-popup-input"
                  />
                </div>
              <button onClick={handleAddFaculty} className="hod-coordinators-save-btn">
                Save Changes <span className="hod-coordinators-icon">➕</span>
                </button>
              </div>
            )}

        </div>
      </div>
    </div>
  );
};
export default Coordinators;