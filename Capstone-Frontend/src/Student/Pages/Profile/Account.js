import React from 'react';
import axios from 'axios';
import { UserContext } from '../../../UserContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../Components/Sidebar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import './Account.css';

/* ─── Searchable Sub Group combobox ─────────────────────────────────── */
function SubgroupSearchSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlighted, setHighlighted] = React.useState(0);
  const wrapRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const filtered = query.trim() === ''
    ? options
    : options.filter(function (o) {
        return o.toLowerCase().includes(query.trim().toLowerCase());
      });

  React.useEffect(function () {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return function () {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  React.useEffect(function () {
    setHighlighted(0);
  }, [query, open]);

  function commit(opt) {
    onChange(opt);
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(function (h) { return Math.min(h + 1, filtered.length - 1); });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(function (h) { return Math.max(h - 1, 0); });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) commit(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      if (inputRef.current) inputRef.current.blur();
    }
  }

  return (
    <div className="account-combobox" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className="account-field__select account-combobox__input"
        autoComplete="off"
        placeholder={placeholder}
        value={open ? query : (value || '')}
        onFocus={function () { setOpen(true); setQuery(''); }}
        onChange={function (e) { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div className="account-combobox__menu">
          {filtered.length === 0 ? (
            <div className="account-combobox__empty">No matches</div>
          ) : (
            filtered.map(function (opt, i) {
              return (
                <div
                  key={opt}
                  className={'account-combobox__option' + (opt === value ? ' selected' : '') + (i === highlighted ? ' highlighted' : '')}
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
}

/* ─── Field definitions ─────────────────────────────────────────────── */
function buildFields(student, subgroups, electives) {
  if (!student) return [];
  return [
    { label: 'Name',            value: student.name,                        section: 'identity' },
    { label: 'Roll Number',     value: student.roll_no,                     section: 'identity' },
    { label: 'Academic Year',   value: student.academic_year,               section: 'identity', type: 'select', options: ['1', '2', '3', '4'] },
    { label: 'Branch',          value: student.branch,                      section: 'course', type: 'select', options: ['COE', 'MECH', 'CIVIL', 'ECE', 'EEE'] },
    { label: 'Sub Group',         value: student.subgroup,                    section: 'course', type: 'subgroup-search', options: subgroups },
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

      // If Academic Year changed, make sure Sub Group still matches the new year
      if (next[index].label === 'Academic Year') {
        const sgIndex = next.findIndex(f => f.label === 'Sub Group');
        if (sgIndex !== -1) {
          const yearFiltered = subgroups.filter(sg => sg.charAt(0) === String(value));
          if (!yearFiltered.includes(next[sgIndex].value)) {
            next[sgIndex] = { ...next[sgIndex], value: yearFiltered[0] || '' };
          }
        }
      }

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

  const academicYearValue = fields.find(f => f.label === 'Academic Year')?.value;

  /* Render a single form field */
  const renderField = (field, globalIndex) => (
    <div key={globalIndex}>
      <label className="account-field__label">{field.label}</label>
      {field.type === 'subgroup-search' ? (
        (() => {
          const yearFiltered = (field.options || []).filter(
            sg => sg.charAt(0) === String(academicYearValue)
          );
          return yearFiltered.length === 0 ? (
            <div className="account-combobox__empty-static">
              No sub groups found for Year {academicYearValue}
            </div>
          ) : (
            <SubgroupSearchSelect
              value={field.value}
              onChange={v => handleChange(globalIndex, v)}
              options={yearFiltered}
              placeholder={`Search Year ${academicYearValue} sub groups...`}
            />
          );
        })()
      ) : field.type === 'select' ? (
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