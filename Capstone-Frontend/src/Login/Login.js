import React, { useContext, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

/* ── Role config ── */
const ROLES = [
  {
    value: "student",
    label: "Student",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
  },
  {
    value: "coordinator",
    label: "Coordinator",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    value: "hod",
    label: "HOD",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <polyline points="16 3 20 7 16 11" />
      </svg>
    ),
  },
  {
    value: "finance",
    label: "Finance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    value: "doaa",
    label: "DOAA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

/* ── Portal icon ── */
const PortalIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* ── Arrow icon ── */
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ICMPLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const { setStudent, setCoordinator, setDOAA, setHOD, setFinance } = useContext(UserContext);

  const notifySuccess = () =>
    toast.success("Successfully Logged In!!", { position: "top-right", autoClose: 4000 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.endsWith("@thapar.edu")) {
      alert("Email must end with @thapar.edu");
      return;
    }
    const emailVal = email;
    const passwordVal = password;
    setEmail("");
    setPassword("");

    const errorHandler = (error) => {
      console.log(error);
      if (error.response?.status === 400) toast.error(error.response.data.error);
      else toast.error("Login Failed");
    };

    try {
      if (role === "student") {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/student/login`, { thapar_email: emailVal, password: passwordVal });
        if (res.status === 202) { notifySuccess(); localStorage.setItem("ICMPTokenStudent", res.data.token); setStudent(res.data.studentData); navigate("/student/dashboard"); }
      } else if (role === "coordinator") {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/coordinator/login`, { email: emailVal, password: passwordVal });
        if (res.status === 202) { notifySuccess(); localStorage.setItem("ICMPTokenCoordinator", res.data.token); setCoordinator(res.data.coordinatorData); navigate("/coordinator/dashboard"); }
      } else if (role === "hod") {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/hod/login`, { hod_email: emailVal, hod_password: passwordVal });
        if (res.status === 202) { notifySuccess(); localStorage.setItem("ICMPTokenHod", res.data.token); setHOD(res.data.hodData); navigate("/hod/dashboard"); }
      } else if (role === "finance") {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/finance/login`, { finance_email: emailVal, finance_password: passwordVal });
        if (res.status === 200) { notifySuccess(); localStorage.setItem("ICMPTokenFinance", res.data.token); setFinance(res.data.financeData); navigate("/finance/dashboard"); }
      } else if (role === "doaa") {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/doaa/login`, { doaa_email: emailVal, doaa_password: passwordVal });
        if (res.status === 202) { notifySuccess(); localStorage.setItem("ICMPTokenDoaa", res.data.token); setDOAA(res.data.doaaData); navigate("/doaa/dashboard"); }
      }
    } catch (error) {
      errorHandler(error);
    }
  };

  const row1 = ROLES.slice(0, 3);
  const row2 = ROLES.slice(3);

  return (
    <>
      <div className="icmp_login_background" />
      <div className="icmp_login_overlay" />
      <img src="/logo.png" alt="Logo" className="icmp_login_logo" />

      <div className="icmp_login_container">
        <div className="icmp_login_form_box">

          {/* Branding */}
          <div className="icmp_login_brand">
            <h2>Improvement Course Management Portal</h2>
            <p>THAPAR INSTITUTE OF ENGINEERING AND TECHNOLOGY</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Role selector — row 1 */}
            <div className="icmp_section_label">Select Role</div>
            <div className="icmp_role_grid">
              {row1.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`icmp_role_btn${role === r.value ? " active" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            {/* Role selector — row 2 */}
            <div className="icmp_role_grid_row2">
              {row2.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`icmp_role_btn${role === r.value ? " active" : ""}`}
                  onClick={() => setRole(r.value)}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            {/* Email */}
            <div className="icmp_field_group">
              <div className="icmp_section_label">University Email</div>
              <input
                type="email"
                placeholder="username@thapar.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="icmp_field_group">
              <div className="icmp_field_header">
                <span className="icmp_section_label">Password</span>
                <a href="/forget-pass" className="icmp_forgot_link">Forgot Password?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="icmp_login_submit_btn">
              Sign In <ArrowIcon />
            </button>
          </form>

          <p className="icmp_register_footer">
            Don't have an account?{" "}
            <span className="icmp-register-link" onClick={() => navigate("/student/signup")}>
              Register here
            </span>
          </p>

        </div>
      </div>
    </>
  );
};

export default ICMPLogin;