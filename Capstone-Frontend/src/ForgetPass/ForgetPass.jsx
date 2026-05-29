import React, { useState } from "react";
import "./ForgetPass.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ── Mail icon ── */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

/* ── Arrow icon (reused from Login) ── */
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ── Back arrow icon ── */
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ForgetPass = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@thapar.edu")) {
      toast.error("Email must end with @thapar.edu");
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/forget-password", { email });
      if (res.status === 200) {
        toast.success("Password reset link sent to your email!");
        setSent(true);
        setEmail("");
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        toast.error(error.response.data.error || "Request failed");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <>
      <div className="icmp_fp_background" />
      <div className="icmp_fp_overlay" />
      <img src="/logo.png" alt="Logo" className="icmp_fp_logo" />

      <div className="icmp_fp_container">
        <div className="icmp_fp_form_box">

          {/* Branding */}
          <div className="icmp_fp_brand">
            <div className="icmp_fp_icon">
              <MailIcon />
            </div>
            <h2>Improvement Course Management Portal</h2>
            <p>THAPAR INSTITUTE OF ENGINEERING AND TECHNOLOGY</p>
          </div>

          {/* Divider */}
          <div className="icmp_fp_divider">
            <span>Forgot Password</span>
          </div>

          {!sent ? (
            <>
              <p className="icmp_fp_hint">
                Enter your Thapar university email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="icmp_fp_field_group">
                  <div className="icmp_fp_section_label">University Email</div>
                  <input
                    type="email"
                    placeholder="username@thapar.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="icmp_fp_submit_btn">
                  Send Reset Link <ArrowIcon />
                </button>
              </form>
            </>
          ) : (
            <div className="icmp_fp_success_box">
              <div className="icmp_fp_success_icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11.5 14.5 15.5 9.5" />
                </svg>
              </div>
              <p className="icmp_fp_success_title">Check your inbox</p>
              <p className="icmp_fp_success_text">
                A password reset link has been sent. Please check your email and follow the instructions.
              </p>
            </div>
          )}

          <p className="icmp_fp_footer">
            Remembered your password?{" "}
            <span className="icmp_fp_back_link" onClick={() => navigate("/login")}>
              <BackIcon /> Back to Login
            </span>
          </p>

        </div>
      </div>
    </>
  );
};

export default ForgetPass;