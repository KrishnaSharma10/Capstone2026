import React, { useContext, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const ICMPLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const { setStudent, setCoordinator, setDOAA, setHOD, setFinance } = useContext(UserContext);

  const notifySuccess = () => {
    toast.success('Successfully Logged In!!', {
      position: 'top-right',
      autoClose: 4000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@thapar.edu")) {
      alert("Email must end with @thapar.edu");
      return;
    }
    setEmail("");
    setPassword("");
    if (role === "student") {
      const data = {
        thapar_email: email,
        password: password
      }
      try {
        const res = await axios.post("http://127.0.0.1:5000/api/student/login", data);
        if (res.status === 202) {
          notifySuccess();
          localStorage.setItem("ICMPTokenStudent", res.data["token"]);
          setStudent(res.data["studentData"]);
          navigate("/student/dashboard");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 400)
            toast.error(error.response.data.error);
        }
        else
          toast.error('Login Failed');
      }
    } else if (role === "coordinator") {
      const data = {
        email: email,
        password: password
      }

      try {
        const res = await axios.post("http://127.0.0.1:5000/api/coordinator/login", data);
        if (res.status === 202) {
          notifySuccess();
          localStorage.setItem("ICMPTokenCoordinator", res.data["token"]);
          setCoordinator(res.data["coordinatorData"]);
          navigate("/coordinator/dashboard");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 400)
            toast.error(error.response.data.error);
        }
        else {
          toast.error('Login Failed');
        }
      }
    } else if (role === "hod") {
      const data = {
        hod_email: email,
        hod_password: password
      }

      try {
        const res = await axios.post("http://127.0.0.1:5000/api/hod/login", data);
        if (res.status === 202) {
          notifySuccess();
          localStorage.setItem("ICMPTokenHod", res.data["token"]);
          setHOD(res.data["hodData"]);
          navigate("/hod/dashboard");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 400)
            toast.error(error.response.data.error);
        }
        else {
          toast.error('Login Failed');
        }
      }

    } else if (role === "finance") {
      const data = {
        finance_email: email,
        finance_password: password
      }

      try {
        const res = await axios.post("http://127.0.0.1:5000/api/finance/login", data);
        if (res.status === 200) {
          notifySuccess();
          localStorage.setItem("ICMPTokenFinance", res.data["token"]);
          setFinance(res.data["financeData"]);
          navigate("/finance/dashboard");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 400)
            toast.error(error.response.data.error);
        }
        else {
          toast.error('Login Failed');
        }
      }

    } else if (role === "doaa") {
      const data = {
        doaa_email: email,
        doaa_password: password
      }

      try {
        const res = await axios.post("http://127.0.0.1:5000/api/doaa/login", data);
        if (res.status === 202) {
          notifySuccess();
          localStorage.setItem("ICMPTokenDoaa", res.data["token"]);
          setDOAA(res.data["doaaData"]);
          navigate("/doaa/dashboard");
        }
      } catch (error) {
        console.log(error);
        if (error.response) {
          if (error.response.status === 400)
            toast.error(error.response.data.error);
        }
        else {
          toast.error('Login Failed');
        }
      }

    } else {
      return;
    }
  };

  return (
    <>
      <div className="icmp_login_background"></div>
      <div className="icmp_login_overlay"></div>
      <img src="/logo.png" alt="Logo" className="icmp_login_logo" />
      <div className="icmp_login_container">
        <div className="icmp_login_title">Improvement Course Management Portal</div>
        <div className="icmp_login_form_box">
          <h2>ICMP</h2>
          <h3>Login</h3>
          <form onSubmit={handleSubmit}>
            <label htmlFor="role">Member Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="doaa">DOAA</option>
              <option value="hod">HOD</option>
              <option value="coordinator">Coordinator</option>
              <option value="student">Student</option>
              <option value="finance">Finance</option>
            </select>

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="username@thapar.edu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <a href="/forget-pass">Forgot Password?</a>
            <button type="submit">Sign in</button>
          </form>
          <p>
            Don't have an account yet? <a className="icmp-register-link" onClick={() => { navigate("/student/signup") }}>Register Here</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ICMPLogin;
