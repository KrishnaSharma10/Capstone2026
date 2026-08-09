import React, { useEffect, useState } from 'react'
import './Coordinators.css'
import Sidebar from '../../Components/Sidebar'
import CoordinatorList from './CoordinatorsComponents/CoordinatorList';
import Logout from '../../Components/Logout';


// const coordinatorData = {
//   CSED: [
//     { name: 'Dr. Anjula Mehto', tenure: '2020-present', designation: 'Time Table Coordinator', mail: 'amehto@thapar.edu' },
//     { name: 'Dr. Rajesh Kumar', tenure: '2018-present', designation: 'Department Coordinator', mail: 'rkumar@thapar.edu' },
//     { name: 'Dr. Neha Sharma', tenure: '2019-present', designation: 'Placement Coordinator', mail: 'nsharma@thapar.edu' },
//     { name: 'Dr. Amit Verma', tenure: '2021-present', designation: 'Research Coordinator', mail: 'averma@thapar.edu' }
//   ],
//   ECED: [
//     { name: 'Dr. Sunil Grover', tenure: '2017-present', designation: 'Department Coordinator', mail: 'sgrover@thapar.edu' },
//     { name: 'Dr. Priya Malhotra', tenure: '2019-present', designation: 'Time Table Coordinator', mail: 'pmalhotra@thapar.edu' },
//     { name: 'Dr. Rakesh Khanna', tenure: '2020-present', designation: 'Lab Coordinator', mail: 'rkhanna@thapar.edu' },
//     { name: 'Dr. Kavita Singh', tenure: '2018-present', designation: 'Project Coordinator', mail: 'ksingh@thapar.edu' }
//   ],
//   MED: [
//     { name: 'Dr. Vikram Joshi', tenure: '2016-present', designation: 'HOD & Department Coordinator', mail: 'vjoshi@thapar.edu' },
//     { name: 'Dr. Anil Kapoor', tenure: '2019-present', designation: 'Workshop Coordinator', mail: 'akapoor@thapar.edu' },
//     { name: 'Dr. Meena Gupta', tenure: '2020-present', designation: 'Industrial Visit Coordinator', mail: 'mgupta@thapar.edu' },
//     { name: 'Dr. Sanjay Patel', tenure: '2018-present', designation: 'Seminar Coordinator', mail: 'spatel@thapar.edu' }
//   ],
//   CHED: [
//     { name: 'Dr. Ritu Sharma', tenure: '2017-present', designation: 'Department Coordinator', mail: 'rsharma@thapar.edu' },
//     { name: 'Dr. Arun Kumar', tenure: '2019-present', designation: 'Lab Safety Coordinator', mail: 'akumar@thapar.edu' },
//     { name: 'Dr. Pooja Mehta', tenure: '2021-present', designation: 'Research Coordinator', mail: 'pmehta@thapar.edu' }
//   ],
//   CED: [
//     { name: 'Dr. Mohan Lal', tenure: '2018-present', designation: 'Department Coordinator', mail: 'mlal@thapar.edu' },
//     { name: 'Dr. Sneha Reddy', tenure: '2020-present', designation: 'Field Visit Coordinator', mail: 'sreddy@thapar.edu' },
//     { name: 'Dr. Rajeev Malhotra', tenure: '2019-present', designation: 'Project Coordinator', mail: 'rmalhotra@thapar.edu' }
//   ]
// };

export default function Coordinators() {
  const [coordinatorData, setCoordinatorData] = useState({});

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/doaa/all-coordinators-details`);
        const data = await response.json();
        console.log(data);
        setCoordinatorData(data);
        
      } catch (error) {
        console.error('Error fetching coordinator data:', error);
      }
    };

    fetchCoordinators();
  }, []);


  return (
    <div className='doaa-coordinator-container'>
      <Sidebar />
      <div className='doaa-coordinator-main'>
         
          <Logout />
          {Object.entries(coordinatorData).map(([deptName, deptData]) =>(
            <CoordinatorList
            key = {deptName}
            data = {deptData}
            department = {"CSED"}
            />
          ))}
      </div>
    </div>
  )
}
