import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import './App.css'; 
import 'react-toastify/dist/ReactToastify.css';


import ICMPSignUp from "./Student/Pages/SignUp/SignUp.js";
import StudentDashboard from './Student/Pages/Dashboard/Dashboard.js'
import StudentAccount from './Student/Pages/Profile/Account.js'
import StudentCourseImprovement from './Student/Pages/CourseImprovement/CourseImprovement.js'
import StudentFees from './Student/Pages/Fees/Fees.js'
import StudentStatus from './Student/Pages/Status/Status.js'
import StudentHistory from './Student/Pages/Hsitory/History.js'
import Faq from "./Student/Pages/FAQ/Faq.jsx";

import CoordinatorDashboard from './Coordinator/Pages/Dashboard/Dashboard.js'
import CoordinatorAccount from './Coordinator/Pages/Account/Account.js'
import CoordinatorAcademicInformation from './Coordinator/Pages/AcademicInformation/AcademicInformation.js'
import CoordinatorTimeTable from './Coordinator/Pages/TimeTable/TimeTable.js'
import Notifications from "./Coordinator/Pages/Notifications/Notifications.jsx";


import HODDashboard from './HOD/Pages/Dashboard/Dashboard.js'
import HODCoordinators from './HOD/Pages/Coordinators/Coordinators.js'
import HODAccount from './HOD/Pages/Accounts/Accounts.js'

import DOAADashboard from './DOAA/Pages/Dashboard/Dashboard.js'
import DOAACoordinators from './DOAA/Pages/Coordinators/Coordinators.js'
import DOAAClashingRequest from './DOAA/Pages/ClashingRequests/ClashingRequests.js'
import DOAAClashingStats from './DOAA/Pages/ClashingStats/ClashingStats.js'
import DOAAAccount from './DOAA/Pages/Account/Account.js'

import { ToastContainer } from "react-toastify";
import { UserProvider } from "./UserContext.js";
import { Navigate } from "react-router-dom";


import ICMPLogin from "./Login/Login.js";
import ProtectedRouteStudent from "./ProtectedRouteStudent.jsx";
import ProtectedRouteCoordinator from "./ProtectedRouteCoordinator.jsx";
import ProtectedRouteHod from "./ProtectedRouteHod.jsx";
import ProtectedRouteDoaa from "./ProtectedRouteDoaa.jsx";
import ForgetPass from "./ForgetPass/ForgetPass.jsx";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className='App'>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} /> {/* Default route */}


            <Route path="/login" element={<ICMPLogin />} />
            <Route path="/forget-pass" element={<ForgetPass />} />

            {/* Student routes */}
            <Route path="/student/signup" element={<ICMPSignUp />} />
            <Route path="/student/dashboard" element={<ProtectedRouteStudent><StudentDashboard /></ProtectedRouteStudent>} />
            <Route path="/student/account" element={<ProtectedRouteStudent><StudentAccount /></ProtectedRouteStudent>} />
            <Route path="/student/course-improvement" element={<ProtectedRouteStudent><StudentCourseImprovement /></ProtectedRouteStudent>} />
            <Route path="/student/fees" element={<ProtectedRouteStudent><StudentFees /></ProtectedRouteStudent>} />
            <Route path="/student/status" element={<ProtectedRouteStudent><StudentStatus /></ProtectedRouteStudent>} />
            <Route path="/student/history" element={<ProtectedRouteStudent><StudentHistory /></ProtectedRouteStudent>} />
            <Route path="/student/faq" element={<ProtectedRouteStudent><Faq /></ProtectedRouteStudent>} />

            {/* Coordinator routes */}
            <Route path="/coordinator/dashboard" element={<ProtectedRouteCoordinator><CoordinatorDashboard /></ProtectedRouteCoordinator>} />
            <Route path="/coordinator/account" element={<ProtectedRouteCoordinator><CoordinatorAccount /></ProtectedRouteCoordinator>} />
            <Route path="/coordinator/academic-information" element={<ProtectedRouteCoordinator><CoordinatorAcademicInformation /></ProtectedRouteCoordinator>} />
            <Route path="/coordinator/time-table" element={<ProtectedRouteCoordinator><CoordinatorTimeTable /></ProtectedRouteCoordinator>} />
            <Route path="/coordinator/notification" element={<ProtectedRouteCoordinator><Notifications /></ProtectedRouteCoordinator>} />

            {/* HOD routes */}
            <Route path="/hod/dashboard" element={<ProtectedRouteHod><HODDashboard /></ProtectedRouteHod>} />
            <Route path="/hod/coordinators" element={<ProtectedRouteHod><HODCoordinators /></ProtectedRouteHod>} />
            <Route path="/hod/account" element={<ProtectedRouteHod><HODAccount /></ProtectedRouteHod>} />

            {/* DOAA routes */}
            <Route path="/doaa/dashboard" element={<ProtectedRouteDoaa><DOAADashboard /></ProtectedRouteDoaa>} />
            <Route path="/doaa/coordinators" element={<ProtectedRouteDoaa><DOAACoordinators /></ProtectedRouteDoaa>} />
            <Route path="/doaa/clashing-requests" element={<ProtectedRouteDoaa><DOAAClashingRequest /></ProtectedRouteDoaa>} />
            <Route path="/doaa/clashing-stats" element={<ProtectedRouteDoaa><DOAAClashingStats /></ProtectedRouteDoaa>} />
            <Route path="/doaa/account" element={<ProtectedRouteDoaa><DOAAAccount /></ProtectedRouteDoaa>} />


          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
