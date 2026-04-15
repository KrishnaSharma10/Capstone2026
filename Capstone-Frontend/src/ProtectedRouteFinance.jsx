// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


const ProtectedRouteFinance = ({ children }) => {
    const token = localStorage.getItem("ICMPTokenFinance");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
            localStorage.removeItem("ICMPTokenFinance");
            return <Navigate to="/login" replace />;
        }

        return children;
    } catch (err) {
        localStorage.removeItem("ICMPTokenFinance");
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRouteFinance;