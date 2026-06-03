import React, { useContext, useEffect, useRef, useState } from 'react';
import './CourseImprovement.css';
import StudentSidebar from '../../Components/Sidebar';
import axios from 'axios'
import { toast } from 'react-toastify';
import { UserContext } from '../../../UserContext';
import Timetable from '../../Components/TimeTable';
import Logout from '../../Components/Logout';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────
// Scoring function: higher = better match
// Exact match → starts with → word starts with → contains
// ─────────────────────────────────────────────
const scoreMatch = (course, query) => {
  const q = query.toLowerCase().trim();
  const name = course.data["course name"].toLowerCase();
  const code = course.subjectCode.toLowerCase();

  if (name === q || code === q)                        return 4; // exact
  if (name.startsWith(q) || code.startsWith(q))       return 3; // starts with
  if (name.split(' ').some(w => w.startsWith(q)))     return 2; // word starts with
  if (name.includes(q) || code.includes(q))           return 1; // contains
  return 0;
};

const getFilteredCourses = (courseData, query) => {
  if (!query || query.trim().length === 0) return [];
  return courseData
    .map(course => ({ course, score: scoreMatch(course, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course)
    .slice(0, 20); // max 10 results
};

// ─────────────────────────────────────────────
// Reusable smart search dropdown component
// ─────────────────────────────────────────────
const CourseSearchDropdown = ({ courseData, onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setHighlighted(-1);

    if (val.trim().length === 0) {
      setResults([]);
      setOpen(false);
      onSelect(null);
      return;
    }

    const filtered = getFilteredCourses(courseData, val);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  const handleSelect = (course) => {
    const displayName = `${course.data["course name"]} (${course.subjectCode})`;
    setQuery(displayName);
    setOpen(false);
    setResults([]);
    onSelect(course);
  };

  // Highlight the matched part of the label
  const highlightMatch = (text, query) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
    if (idx === -1 || !query.trim()) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: '#fff' }}>{text.slice(idx, idx + query.trim().length)}</strong>
        {text.slice(idx + query.trim().length)}
      </>
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && results[highlighted]) {
        handleSelect(results[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />

      {open && results.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          background: '#1e2a38',
          border: '1px solid #3a4a5c',
          borderRadius: '6px',
          maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {results.map((course, i) => {
            const label = `${course.data["course name"]} (${course.subjectCode})`;
            const isHighlighted = i === highlighted;
            return (
              <li
                key={course.subjectCode}
                onMouseDown={() => handleSelect(course)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#cdd6e0',
                  background: isHighlighted ? '#2c3e50' : 'transparent',
                  borderBottom: '1px solid #2c3e50',
                  transition: 'background 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {highlightMatch(course.data["course name"], query)}
                </span>
                <span style={{ fontSize: '12px', color: '#7a9bb5' }}>
                {course.subjectCode}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const CourseImprovement = () => {
  const token = localStorage.getItem("ICMPTokenStudent");
  const { student, setStudent } = useContext(UserContext);
  const [courseData, setCourseData] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null); // single selected course object

  const [choices, setChoices] = useState([]);
  const [newTimeTable, setNewTimeTable] = useState([]);
  const [emptyChoices, setEmptyChoices] = useState(false);

  const [cgpa, setCgpa] = useState("");
  const [IEEFile, setIEEFile] = useState(null); // eslint-disable-line no-unused-vars

  const [active, setActive] = useState(true);

  // Holds the list of courses the student has added (up to 3)
  const [selectedCourseData, setSelectedCourseData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!student) return;

    axios.get("http://127.0.0.1:5000/api/get-course-list")
      .then((res) => setCourseData(res.data))
      .catch(() => toast.error("Failed to fetch courses"));

    if (!student.ongoing_application) {
      setActive(false);
      return;
    }

    axios.post("http://127.0.0.1:5000/api/get-application-details", {
      application_id: student.ongoing_application
    })
      .then((res) => {
        const stage = res.data?.["Application Data"]?.["stage"];
        if (stage === 5 || stage === 10 || stage === -1) {
          setActive(false);
        } else {
          setActive(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching application:", err);
        setActive(false);
      });
  }, [student]);

  // ── Add course to list ──
  const handleSubmit1 = (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error("Please select a course from the dropdown");
      return;
    }

    if (selectedCourseData.length >= 3) {
      toast.error("Can select maximum of 3 courses");
      return;
    }

    const alreadyAdded = selectedCourseData.some(
      c => c.subjectCode === selectedCourse.subjectCode
    );
    if (alreadyAdded) {
      toast.error("This course is already added");
      return;
    }

    setSelectedCourseData(prev => [
      ...prev,
      {
        subjectCode: selectedCourse.subjectCode,
        subjectName: selectedCourse.data["course name"],
        subjectCredits: selectedCourse.data["Credit"],
        subjectL: selectedCourse.data["L"],
        subjectT: selectedCourse.data["T"],
        subjectP: selectedCourse.data["P"],
      }
    ]);

    setSelectedCourse(null);
  };

  const handleSubmit2 = () => {
    const data = {
      selectedCourseData: selectedCourseData,
      studentData: student
    };

    axios.post("http://localhost:3001", data)
      .then((res) => {
        setChoices(res.data.choices);
        setNewTimeTable(res.data.newTimeTable);
        toast.success("Options Generated Successfully!!");
        if (res.data.choices && res.data.choices.length > 0) {
          setEmptyChoices(false);
        } else {
          toast.error("Could not find any Options");
          setEmptyChoices(true);
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        toast.error("Internal Server Error");
      });
  };

  const handleCgpaChange = (e) => setCgpa(e.target.value);

  const handleIEEFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Upload File Smaller Than 2MB");
      setIEEFile(null);
      return;
    }
    setIEEFile(file);
  };

  const handleSubmit3 = (choice, newTimeTable) => {
    const arr = Object.entries(choice).map(([code, sgs]) => [
      code,
      `Lecture: ${sgs.lecture_sg || '-'}, Lab: ${sgs.lab_sg || '-'}, Tutorial: ${sgs.tutorial_sg || '-'}`
    ]);

    if (cgpa.trim() === '') {
      toast.error("Must enter the CGPA");
      return;
    }

    const data = {
      "email": student.thapar_email,
      "opted_courses": arr,
      "message": "",
      "clashing": newTimeTable.some(event => event.clash),
      "new_time_table": newTimeTable,
      "current_time_table": student.timeTableData,
      "elective_data": student.electiveData,
      "cgpa": cgpa
    };

    const confirmed = window.confirm(
      `Application once submitted can't be taken back.\n\nAre you sure you want to pick these courses with these subgroups?`
    );
    if (!confirmed) return;

    toast.warning("Please wait for Application to be generated!!");
    setChoices([]);
    setNewTimeTable([]);

    axios.post("http://127.0.0.1:5000/api/student/generate-application", data, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        toast.success("Application successfully created!!");
        setStudent(prev => ({ ...prev, ongoing_application: res.data.applicationId }));
        setTimeout(() => navigate("/student/status"), 1000);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Try again!!");
      });
  };

  const handleRemoveCourse = (subjectCode) => {
    setSelectedCourseData(prev => prev.filter(c => c.subjectCode !== subjectCode));
  };

  const currentMonth = new Date().getMonth();
  const showUpload = currentMonth >= 0 && currentMonth <= 4;

  return (
    <div>
      <StudentSidebar />
      <div className="student-main-course-improvement">
        <div className="student-main-dashboard-top-row">
          <h1>Courses Improvement Section</h1>
          <Logout />
        </div>

        {active
          ? <h1 className='course-improvement-wait-heading'>
              Please Wait for the Ongoing Application to be Accepted/Rejected
            </h1>
          : <>
            <div className="student-main-course-improvement-top2">
              <h3>Guidelines:</h3>
              <h5>- Generate options by clicking on "Generate options" button.</h5>
              <h5>- Select one of the available options.</h5>
              <h5>- Wait for the Ongoing Application to be Accepted/Rejected before making new request.</h5>
            </div>

            <div className="student-main-course-improvement-bottom">

              {/* ── LEFT: selected courses list ── */}
              <div className="student-main-course-improvement-bottom-left">
                <h5>Selected Courses for Improvement</h5>
                <div className="student-main-course-improvement-bottom-left-t1">
                  {selectedCourseData.map((course) => (
                    <div className="student-main-course-improvement-bottom-left-t2" key={course.subjectCode}>
                      <h6>{course.subjectName}</h6>
                      <p>{course.subjectCode}</p>
                      <p>Course Credits: {course.subjectCredits}</p>
                      <p>L: {course.subjectL} T: {course.subjectT} P: {course.subjectP}</p>
                      <p onClick={() => handleRemoveCourse(course.subjectCode)} className='remove-x'>X</p>
                    </div>
                  ))}
                </div>
                <form>
                  <p>Present CGPA <span style={{ color: 'red' }}>*</span></p>
                  <input
                    type="text"
                    placeholder='Ex: 8.00'
                    required
                    value={cgpa}
                    onChange={handleCgpaChange}
                  />
                  {showUpload && (
                    <>
                      <p>Upload IEE Signed Document (Mandatory for 8th sem students)</p>
                      <input type="file" onChange={handleIEEFileChange} />
                    </>
                  )}
                </form>
              </div>

              {/* ── RIGHT: search ── */}
              <div className="student-main-course-improvement-bottom-right">
                <h5>Search Courses for Improvement</h5>
                <form onSubmit={handleSubmit1}>

                  <label style={{ color: 'whitesmoke' }}>
                    Search by Course Name or Code
                  </label>

                  {/* Single unified smart search — replaces both old inputs */}
                  <CourseSearchDropdown
                    courseData={courseData}
                    onSelect={setSelectedCourse}
                    placeholder="Ex: Operating Systems or UCS401"
                  />

                  {/* Preview of the selected course */}
                  {selectedCourse && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      background: '#1e2a38',
                      borderRadius: '6px',
                      border: '1px solid #3a4a5c',
                      color: '#cdd6e0',
                      fontSize: '13px',
                    }}>
                      <strong style={{ color: '#fff' }}>
                        {selectedCourse.data["course name"]}
                      </strong>
                      <span style={{ color: '#7a9bb5', marginLeft: '8px' }}>
                        {selectedCourse.subjectCode}
                      </span>
                      <div style={{ marginTop: '4px', color: '#7a9bb5' }}>
                        Credits: {selectedCourse.data["Credit"]} &nbsp;·&nbsp;
                        L:{selectedCourse.data["L"]} &nbsp;
                        T:{selectedCourse.data["T"]} &nbsp;
                        P:{selectedCourse.data["P"]}
                      </div>
                    </div>
                  )}

                  <button type="submit" style={{ marginTop: '14px' }}>
                    Add Course
                  </button>
                </form>
              </div>
            </div>

            <button className='generate-options-btn' onClick={handleSubmit2}>
              Generate Options
            </button>

            <div className="student-course-improvement-choices-div">
              {choices.length > 0 && <h1>Plz Choose from one of these options:</h1>}
              {emptyChoices && <h1>No Options Found</h1>}
              {choices.map((val, index) => {
                const combinedList = [...student.timeTableData, ...newTimeTable[index]];
                return (
                  <div className='student-course-improvement-individual-choices-div' key={index}>
                    <h2>Option {index + 1}</h2>

                    {Object.entries(val).map(([subjectCode, sgs]) => (
                      <div key={subjectCode}>
                        <h4>{subjectCode}</h4>
                        <p style={{ color: 'whitesmoke' }}>Lecture group: {sgs.lecture_sg || '—'}</p>
                        <p style={{ color: 'whitesmoke' }}>Lab group: {sgs.lab_sg || '—'}</p>
                        <p style={{ color: 'whitesmoke' }}>Tutorial group: {sgs.tutorial_sg || '—'}</p>
                      </div>
                    ))}

                    {newTimeTable[index].some(event => event.clash)
                      ? <h4 style={{ color: 'orange' }}>⚠️ Has 1 lecture clash</h4>
                      : <h4 style={{ color: '#90EE90' }}>✅ No clashes</h4>
                    }

                    <Timetable data={combinedList} ed={student.electiveData} />

                    <div className="timetable-legend">
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: 'white' }}></div>
                        <p>Free Slots</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: '#FFD700' }}></div>
                        <p>Lectures</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: '#90EE90' }}></div>
                        <p>Labs</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: '#ADD8E6' }}></div>
                        <p>Tutorials</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: 'pink' }}></div>
                        <p>Electives</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: 'red' }}></div>
                        <p>Added Slots</p>
                      </div>
                      <div className='timetable-legend-inner'>
                        <div className='timetable-legend-circle' style={{ backgroundColor: 'orange' }}></div>
                        <p>Clash Slot</p>
                      </div>
                    </div>

                    <button
                      className='finalize-btn'
                      onClick={() => handleSubmit3(val, combinedList)}
                    >
                      Finalize option {index + 1}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        }
      </div>
    </div>
  );
};

export default CourseImprovement;