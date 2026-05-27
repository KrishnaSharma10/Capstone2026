import React from 'react';
import axios from 'axios';
import { UserContext } from '../../../UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../Components/Sidebar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './Account.css';

/* ─── Field definitions ─────────────────────────────────────────────── */
function buildFields(student, subgroups, electives) {
  if (!student) return [];
  return [
    { label: 'Name',            value: student.name,                        section: 'identity' },
    { label: 'Roll Number',     value: student.roll_no,                     section: 'identity' },
    { label: 'Academic Year',   value: student.academic_year,               section: 'identity', type: 'select', options: ['1', '2', '3', '4'] },
    { label: 'Branch',          value: student.branch,                      section: 'course', type: 'select', options: ['COE', 'MECH', 'CIVIL', 'ECE', 'EEE'] },
    { label: 'Sub Group',         value: student.subgroup,                    section: 'course', type: 'select', options: subgroups },
    { label: 'Elective Basket 1', value: student.elective_basket,             section: 'course', type: 'select', options: electives },
    { label: 'Elective Basket 2', value: student.general_elective ?? 'None',  section: 'course', type: 'select', options: ['None', 'Cyber Security', 'EDS', 'French', 'Graph Theory'] },
    // { label: 'Phone Number',      value: student.phone_number,                section: 'identity' },
  ];
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function Account() {
  const navigate = useNavigate();
  const { student, setStudent } = React.useContext(UserContext);

  const [subgroups, setSubgroups] = React.useState([]);
  const [electives, setElectives] = React.useState([]);
  const [fields,    setFields]    = React.useState([]);

  /* Fetch dropdown lists whenever student changes */
  React.useEffect(() => {
    let sg = [], el = [];

    axios.get('http://127.0.0.1:5000/api/student/get-subgroup-name-list')
      .then(res => {
        sg = res.data['subgroupList'];
        setSubgroups(sg);
        setFields(buildFields(student, sg, el));
      })
      .catch(() => toast.error('Failed to load subgroup data, please retry!'));

    axios.get('http://127.0.0.1:5000/api/student/get-elective-basket-list')
      .then(res => {
        el = res.data['electiveBasketList'];
        setElectives(el);
        setFields(buildFields(student, sg, el));
      })
      .catch(() => toast.error('Failed to load elective data, please retry!'));
  }, [student]);

  /* Update a single field value */
  const handleChange = (index, value) => {
    setFields(prev => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  };

  /* Save and navigate */
  const handleSave = () => {
    const map = {};
    fields.forEach(f => { map[f.label] = f.value; });

    const updated = {
      ...student,
      name:             map['Name'],
      roll_no:          map['Roll Number'],
      academic_year:    map['Academic Year'],
      branch:           map['Branch'],
      subgroup:         map['Sub Group'],
      elective_basket:  map['Elective Basket 1'],
      general_elective: map['Elective Basket 2'],
      phone_number:     map['Phone Number'],
    };

    setStudent(updated);

    const token = localStorage.getItem('ICMPTokenStudent');
    axios.post('http://127.0.0.1:5000/api/student/update-details', updated, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(() => {
        toast.success('Details updated successfully!');
        navigate('/student/dashboard');
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to update details. Please try again.');
      });
  };

  /* Render a single form field */
  const renderField = (field, globalIndex) => (
    <div key={globalIndex}>
      <label className="account-field__label">{field.label}</label>
      {field.type === 'select' ? (
        <select
          className="account-field__select"
          value={field.value ?? ''}
          onChange={e => handleChange(globalIndex, e.target.value)}
        >
          {(field.options || []).map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          className="account-field__input"
          value={field.value ?? ''}
          onChange={e => handleChange(globalIndex, e.target.value)}
        />
      )}
    </div>
  );

  const identityFields = fields.filter(f => f.section === 'identity');
  const courseFields   = fields.filter(f => f.section === 'course');

  return (
    <div className="account-page">
      <StudentSidebar />

      <div className="account-main">

        {/* Breadcrumb */}
        <p className="account-breadcrumb">
          <span className="account-breadcrumb__name">{student?.name || 'Student'}</span>
          <span className="account-breadcrumb__sep">/</span>
          Account Settings
        </p>

        {/* Welcome */}
        <p className="account-welcome">Welcome !</p>
        <p className="account-edit-hint">Edit Your Info Here</p>

        {/* Card */}
        <div className="account-card">

          {/* Academic Identity */}
          <p className="account-section-title">Student Details</p>
          <div className="account-grid">
            {identityFields.map((f, i) => renderField(f, i))}
          </div>

          <hr className="account-divider" />

          {/* Course Selection */}
          <p className="account-section-title">Academic Information</p>
          <div className="account-grid">
            {courseFields.map((f, i) => renderField(f, identityFields.length + i))}
          </div>

          {/* Footer row */}
          <div className="account-footer">
            <span className="account-footer__note">
              <span className="account-footer__note-icon">ⓘ</span>
              Changes may take up to 24 hours to reflect in the main directory.
            </span>
            <button className="account-save-btn" onClick={handleSave}>
              Save Changes <CheckCircleIcon style={{ fontSize: 16 }} />
            </button>
          </div>

        </div>

        {/* Editorial watermark */}
        <p className="account-editorial">The Academic Editorial</p>

      </div>
    </div>
  );
}