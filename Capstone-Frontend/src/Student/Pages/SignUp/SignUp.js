import React, { useState, useEffect, useRef } from "react";
import "./SignUp.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ── Icons ── */
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Static data ── */
const BRANCHES        = ["COE","COPC", "COBS","AI & ML","MECH", "CIVIL", "ECE", "EEE", "BT", "CHE"];
const DEPARTMENTS     = ["CSED", "ECED", "MED", "CED", "BED", "CHED", "MATH"];
const ELECTIVE_BASKETS = [
  "None", "Financial Derivative", "Data Science", "High Performance Computing",
  "Computer Animation and Gaming", "Information and Cyber Security",
  "Mathematics and Computing", "DevOps and Continuous Delivery", "Full Stack",
  "Conversational AI", "Robotics and Edge AI", "Cyber Forensics and Ethical Hacking",
];
const GENERIC_ELECTIVES = [
  "None", "Campus to Corporate", "Corporate Finance",
  "French", "Graph Theory", "Cyber Security", "EDS",
];
const STEPS = ["Personal", "Academic", "Credentials"];

const Field = ({ label, children }) => (
  <div className="icmp_field_group">
    <div className="icmp_section_label">{label}</div>
    {children}
  </div>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = query.trim() === ""
    ? options
    : options.filter(function (o) {
        return o.toLowerCase().includes(query.trim().toLowerCase());
      });

  useEffect(function () {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return function () {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  useEffect(function () {
    setHighlighted(0);
  }, [query, open]);

  function commit(opt) {
    onChange(opt);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(function (h) { return Math.min(h + 1, filtered.length - 1); });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(function (h) { return Math.max(h - 1, 0); });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) commit(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      if (inputRef.current) inputRef.current.blur();
    }
  }

  return (
    <div className="icmp_combobox" ref={wrapRef}>
      <div className="icmp_combobox_input_wrap">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={open ? query : (value || "")}
          onFocus={function () { setOpen(true); setQuery(""); }}
          onChange={function (e) { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        <span className="icmp_combobox_chevron"><ChevronIcon /></span>
      </div>

      {open && (
        <div className="icmp_combobox_menu">
          {filtered.length === 0 ? (
            <div className="icmp_combobox_empty">No matches</div>
          ) : (
            filtered.map(function (opt, i) {
              return (
                <div
                  key={opt}
                  className={"icmp_combobox_option" + (opt === value ? " selected" : "") + (i === highlighted ? " highlighted" : "")}
                  onMouseDown={function (e) { e.preventDefault(); commit(opt); }}
                  onMouseEnter={function () { setHighlighted(i); }}
                >
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const SignUp = () => {
  const navigate = useNavigate();

  const [step, setStep]         = useState(1);
  const [subgroups, setSubgroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    roll_no: "",
    phone_number: "",
    academic_year: "1",
    branch: "COE",
    department: "CSED",
    subgroup: "",
    elective_basket: "None",
    general_elective: "None",
    thapar_email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/student/get-subgroup-name-list")
      .then(res => {
        const list = res.data["subgroupList"] || [];
        setSubgroups(list);
      })
      .catch(() => toast.error("Failed to load subgroups"));
  }, []);
  const yearFilteredSubgroups = subgroups.filter(function (sg) {
    return sg.charAt(0) === String(form.academic_year);
  });

  useEffect(function () {
    if (yearFilteredSubgroups.length === 0) {
      if (form.subgroup !== "") setForm(function (f) { return { ...f, subgroup: "" }; });
      return;
    }
    if (yearFilteredSubgroups.indexOf(form.subgroup) === -1) {
      setForm(function (f) { return { ...f, subgroup: yearFilteredSubgroups[0] }; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.academic_year, subgroups]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim())                      { toast.error("Name is required");                    return false; }
      if (!form.roll_no.trim())                   { toast.error("Roll number is required");             return false; }
      if (!/^\d{10}$/.test(form.phone_number))    { toast.error("Enter a valid 10-digit phone number"); return false; }
    }
    if (step === 2) {
      if (!form.subgroup) { toast.error("Please select a valid sub group"); return false; }
    }
    if (step === 3) {
      if (!form.thapar_email.endsWith("@thapar.edu")) { toast.error("Email must end with @thapar.edu");            return false; }
      if (form.password.length < 6)                   { toast.error("Password must be at least 6 characters");     return false; }
      if (form.password !== form.confirmPassword)      { toast.error("Passwords do not match");                    return false; }
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateStep()) return;

  setIsSubmitting(true);

  const payload = { ...form };
  delete payload.confirmPassword;

  try {
    const res = await axios.post(
      "http://127.0.0.1:5000/api/student/register",
      payload
    );

    if ([200, 201, 202].includes(res.status)) {
      toast.success("Registration successful!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
      "Registration failed. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <>
      <div className="icmp_login_background" />
      <div className="icmp_login_overlay" />
      <img src="/logo.png" alt="Logo" className="icmp_login_logo" />

      <div className="icmp_login_container">
        <div className="icmp_login_form_box icmp_signup_box">

          {/* Branding */}
          <div className="icmp_login_brand">
            <h2>Improvement Course Management Portal</h2>
            <p>THAPAR INSTITUTE OF ENGINEERING AND TECHNOLOGY</p>
          </div>

          {/* Progress bar */}
          <div className="icmp_progress_row">
            {STEPS.map((label, i) => {
              const num    = i + 1;
              const done   = step > num;
              const active = step === num;
              return (
                <React.Fragment key={label}>
                  <div className={`icmp_step_dot${done ? " done" : ""}${active ? " active" : ""}`}>
                    {done ? <CheckIcon /> : <span>{num}</span>}
                  </div>
                  <div className={`icmp_step_label${active ? " active" : ""}`}>{label}</div>
                  {i < STEPS.length - 1 && (
                    <div className={`icmp_step_line${step > num ? " done" : ""}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div className="icmp_step_content">
              <Field label="Full Name">
                <input placeholder="e.g. Krishna Sharma" value={form.name} onChange={set("name")} autoComplete="off" />
              </Field>
              <Field label="Roll Number">
                <input placeholder="e.g. 102203758" value={form.roll_no} onChange={set("roll_no")} autoComplete="off" />
              </Field>
              <Field label="Phone Number">
                <input placeholder="10-digit mobile number" value={form.phone_number} onChange={set("phone_number")} autoComplete="off" />
              </Field>
              <Field label="Academic Year">
                <select value={form.academic_year} onChange={set("academic_year")}>
                  {["1","2","3","4"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <button type="button" className="icmp_login_submit_btn" onClick={nextStep}>
                Continue <ArrowIcon />
              </button>
            </div>
          )}

          {/* ── Step 2: Academic ── */}
          {step === 2 && (
            <div className="icmp_step_content">
              <div className="icmp_two_col">
                <Field label="Branch">
                  <select value={form.branch} onChange={set("branch")}>
                    {BRANCHES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <select value={form.department} onChange={set("department")}>
                    {DEPARTMENTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Sub Group">
                {subgroups.length === 0 ? (
                  <select disabled>
                    <option>Loading...</option>
                  </select>
                ) : yearFilteredSubgroups.length === 0 ? (
                  <div className="icmp_combobox_empty_static">
                    No sub groups found for Year {form.academic_year}
                  </div>
                ) : (
                  <SearchableSelect
                    value={form.subgroup}
                    onChange={function (v) { setForm(function (f) { return { ...f, subgroup: v }; }); }}
                    options={yearFilteredSubgroups}
                    placeholder={"Search Year " + form.academic_year + " sub groups..."}
                  />
                )}
              </Field>
              <Field label="Elective Basket">
                <select value={form.elective_basket} onChange={set("elective_basket")}>
                  {ELECTIVE_BASKETS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Generic Elective">
                <select value={form.general_elective} onChange={set("general_elective")}>
                  {GENERIC_ELECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <div className="icmp_btn_row">
                <button type="button" className="icmp_back_btn" onClick={prevStep}>
                  <BackIcon /> Back
                </button>
                <button type="button" className="icmp_login_submit_btn icmp_flex1" onClick={nextStep}>
                  Continue <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Credentials ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="icmp_step_content">
                <Field label="Thapar Email (Thapar ID)">
                  <input type="email" placeholder="username@thapar.edu" value={form.thapar_email} onChange={set("thapar_email")} autoComplete="off" />
                </Field>
                <Field label="Create Password">
                  <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
                </Field>
                <p className="icmp_verify_note">
                  ✉ A verification link will be sent to your Thapar email after registration.
                </p>
                <div className="icmp_btn_row">
                  <button type="button" className="icmp_back_btn" onClick={prevStep}>
                    <BackIcon /> Back
                  </button>
                  <button
  type="submit"
  className="icmp_login_submit_btn icmp_flex1"
  disabled={isSubmitting}
>
  {isSubmitting ? "Registering..." : <>Register <CheckIcon /></>}
</button>
                </div>
              </div>
            </form>
          )}

          <p className="icmp_register_footer">
            Already have an account?{" "}
            <span className="icmp-register-link" onClick={() => navigate("/login")}>Sign in here</span>
          </p>

        </div>
      </div>
    </>
  );
};

export default SignUp;