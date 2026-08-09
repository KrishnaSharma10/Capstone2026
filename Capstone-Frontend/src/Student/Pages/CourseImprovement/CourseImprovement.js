import React, { useContext, useEffect, useRef, useState } from 'react';
import './CourseImprovement.css';
import StudentSidebar from '../../Components/Sidebar';
import axios from 'axios'
import { toast } from 'react-toastify';
import { UserContext } from '../../../UserContext';
import Timetable from '../../Components/TimeTable';
import Logout from '../../Components/Logout';
import { useNavigate } from 'react-router-dom';

const scoreMatch = (course, query) => {
  const q = query.toLowerCase().trim();
  const name = course.data["course name"].toLowerCase();
  const code = course.subjectCode.toLowerCase();

  if (name === q || code === q)                        return 4;
  if (name.startsWith(q) || code.startsWith(q))       return 3;
  if (name.split(' ').some(w => w.startsWith(q)))     return 2;
  if (name.includes(q) || code.includes(q))           return 1;
  return 0;
};

const getFilteredCourses = (courseData, query) => {
  if (!query || query.trim().length === 0) return [];
  return courseData
    .map(course => ({ course, score: scoreMatch(course, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course)
    .slice(0, 20);
};
const getClashDetails = (existingTimeTable, newEvents) => {
  const pairs = [];
  newEvents.forEach((newEvent) => {
    if (!newEvent.clash) return;
    const existing = existingTimeTable.find(
      (e) => e.day === newEvent.day && e.hour === newEvent.hour && e.subjectCode !== newEvent.subjectCode
    );
    pairs.push({
      day: newEvent.day,
      hour: newEvent.hour,
      newCode: newEvent.subjectCode,
      existingCode: existing ? existing.subjectCode : null,
    });
  });

  // De-duplicate by course-code pair (a multi-hour lecture clash shouldn't repeat)
  const seen = new Map();
  pairs.forEach((p) => {
    const key = `${p.newCode}__${p.existingCode}`;
    if (!seen.has(key)) seen.set(key, p);
  });
  return Array.from(seen.values());
};

const CourseSearchDropdown = ({ courseData, onSelect, placeholder }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);

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

  const highlightMatch = (text, query) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
    if (idx === -1 || !query.trim()) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: '#c0392b' }}>{text.slice(idx, idx + query.trim().length)}</strong>
        {text.slice(idx + query.trim().length)}
      </>
    );
  };

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
          background: '#ffffff',
          border: '1px solid #e2e0db',
          borderRadius: '8px',
          maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {results.map((course, i) => {
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
                  color: '#1a1a1a',
                  background: isHighlighted ? '#fdf3f2' : 'transparent',
                  borderBottom: '1px solid #f0eeea',
                  transition: 'background 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>
                  {highlightMatch(course.data["course name"], query)}
                </span>
                <span style={{ fontSize: '12px', color: '#9a9a9a' }}>
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

const CourseImprovement = () => {
  const token = localStorage.getItem("ICMPTokenStudent");
  const { student, setStudent } = useContext(UserContext);
  const [courseData, setCourseData] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [choices, setChoices] = useState([]);
  const [newTimeTable, setNewTimeTable] = useState([]);
  const [emptyChoices, setEmptyChoices] = useState(false);

  const [cgpa, setCgpa] = useState("");
  const [IEEFile, setIEEFile] = useState(null); // eslint-disable-line no-unused-vars

  const [active, setActive] = useState(true);
  const [selectedCourseData, setSelectedCourseData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!student) return;

    axios.get(`${process.env.REACT_APP_API_URL}/api/get-course-list`)
      .then((res) => setCourseData(res.data))
      .catch(() => toast.error("Failed to fetch courses"));

    if (!student.ongoing_application) {
      setActive(false);
      return;
    }

    axios.post(`${process.env.REACT_APP_API_URL}/api/get-application-details`, {
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

    axios.post("https://13.50.249.120", data)
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

    axios.post(`${process.env.REACT_APP_API_URL}/api/student/generate-application`, data, {
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

  const getCourseName = (code) => {
    const found = courseData.find((c) => c.subjectCode === code);
    return found ? found.data["course name"] : code;
  };

  const currentMonth = new Date().getMonth();
  const showUpload = currentMonth >= 0 && currentMonth <= 4;

  return (
    <div>
      <StudentSidebar />
      <div className="student-main-course-improvement">

        <div className="student-main-dashboard-top-row">
          <h1>Apply for Grade Enhancement</h1>
          <Logout />
        </div>

        {active
          ? <h1 className='course-improvement-wait-heading'>
              Please Wait for the Ongoing Application to be Accepted/Rejected
            </h1>
          : <>
            <div className="ci-page-intro">
              <div className="ci-page-intro-text">
                <h2>Course Improvement</h2>
                <p>Select courses from your previous semesters to improve your cumulative performance. Ensure all documentation is verified before submission.</p>
              </div>
              <div className="ci-status-badge">
                <div className="ci-status-dot"></div>
                <div>
                  <span className="ci-status-label">Application Status</span>
                  Eligibility Confirmed
                </div>
              </div>
            </div>

            <div className="student-main-course-improvement-top2">
              <p className="ci-guidelines-title">📋 Guidelines:</p>
              <div className="ci-guidelines-steps">
                <div className="ci-guideline-step">
                  <div className="ci-step-number">1</div>
                  <p className="ci-step-text">Generate options by clicking the <strong>Generate options</strong> button at the bottom of the page.</p>
                </div>
                <div className="ci-guideline-step">
                  <div className="ci-step-number">2</div>
                  <p className="ci-step-text">Carefully review and select one of the available academic enhancement options provided.</p>
                </div>
                <div className="ci-guideline-step">
                  <div className="ci-step-number">3</div>
                  <p className="ci-step-text">Wait for the Ongoing Application to be <strong>Accepted/Rejected</strong> before making a new request.</p>
                </div>
              </div>
            </div>

            <div className="student-main-course-improvement-bottom">

              <div className="student-main-course-improvement-bottom-right">
                <div>
                  <p className="ci-card-title">Search Courses for Improvement</p>
                </div>
                <form onSubmit={handleSubmit1}>
                  <label>Search by Course Name or Code</label>
                  <CourseSearchDropdown
                    courseData={courseData}
                    onSelect={setSelectedCourse}
                    placeholder="Ex: Operating Systems or UCS401"
                  />
                  {selectedCourse && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      background: '#fdf3f2',
                      borderRadius: '8px',
                      border: '1px solid #f5c6c2',
                      fontSize: '13px',
                    }}>
                      <strong style={{ color: '#1a1a1a' }}>{selectedCourse.data["course name"]}</strong>
                      <span style={{ color: '#9a9a9a', marginLeft: '8px' }}>{selectedCourse.subjectCode}</span>
                      <div style={{ marginTop: '4px', color: '#9a9a9a', fontSize: '12px' }}>
                        Credits: {selectedCourse.data["Credit"]} &nbsp;·&nbsp;
                        L:{selectedCourse.data["L"]} T:{selectedCourse.data["T"]} P:{selectedCourse.data["P"]}
                      </div>
                    </div>
                  )}
                  <button type="submit">➕ Add Course</button>
                </form>
              </div>

              <div className="student-main-course-improvement-bottom-left">
                <div className="ci-card-header">
                  <p className="ci-card-title">Selected Courses for Improvement</p>
                  {selectedCourseData.length > 0 && (
                    <span className="ci-selected-count">{selectedCourseData.length} Selected</span>
                  )}
                </div>

                <div className="student-main-course-improvement-bottom-left-t1">
                  {selectedCourseData.length === 0 && (
                    <p style={{ color: '#9a9a9a', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                      No courses selected yet
                    </p>
                  )}
                  {selectedCourseData.map((course) => (
                    <div className="student-main-course-improvement-bottom-left-t2" key={course.subjectCode}>
                      <div className="ci-course-card-icon">📚</div>
                      <div className="ci-course-card-info">
                        <h6>{course.subjectName}</h6>
                        <p>{course.subjectCode} · Semester</p>
                      </div>
                      <p onClick={() => handleRemoveCourse(course.subjectCode)} className='remove-x'>✕</p>
                    </div>
                  ))}
                </div>

                <div className="ci-cgpa-row">
                  <label>Present CGPA <span style={{ color: '#c0392b' }}>*</span></label>
                  <input type="text" placeholder='Ex: 8.00' required value={cgpa} onChange={handleCgpaChange} />
                </div>

                {showUpload && (
                  <div className="ci-cgpa-row">
                    <label>Upload IEE Signed Document <span style={{ color: '#9a9a9a', fontWeight: 400 }}>(Mandatory for 8th sem)</span></label>
                    <input type="file" onChange={handleIEEFileChange} />
                  </div>
                )}
              </div>
            </div>

            <button className='generate-options-btn' onClick={handleSubmit2}>
              ⚡ Generate Options
            </button>

            <div className="student-course-improvement-choices-div">
              {choices.length > 0 && <h1>Choose from one of these options:</h1>}
              {emptyChoices && <h1>No Options Found</h1>}
              {choices.map((val, index) => {
                const combinedList = [...student.timeTableData, ...newTimeTable[index]];
                return (
                  <div className='student-course-improvement-individual-choices-div' key={index}>
                    <h2>Option {index + 1}</h2>
                    {Object.entries(val).map(([subjectCode, sgs]) => (
                      <div key={subjectCode}>
                        <h4>{subjectCode}</h4>
                        <p style={{ color: '#6b6b6b' }}>Lecture group: {sgs.lecture_sg || '—'}</p>
                        <p style={{ color: '#6b6b6b' }}>Lab group: {sgs.lab_sg || '—'}</p>
                        <p style={{ color: '#6b6b6b' }}>Tutorial group: {sgs.tutorial_sg || '—'}</p>
                      </div>
                    ))}
                    {(() => {
                      const clashPairs = getClashDetails(student.timeTableData, newTimeTable[index]);
                      if (clashPairs.length === 0) {
                        return <h4 style={{ color: '#27ae60' }}>✅ No clashes</h4>;
                      }
                      return (
                        <div style={{ margin: '8px 0' }}>
                          <h4 style={{ color: '#e67e22', marginBottom: '4px' }}>
                            ⚠️ Has {clashPairs.length} clash{clashPairs.length > 1 ? 'es' : ''}
                          </h4>
                          {clashPairs.map((p, i) => (
                            <p key={i} style={{ fontSize: '14px', color: '#e67e22', fontWeight: 700, margin: '2px 0' }}>
                              {getCourseName(p.newCode)} ({p.newCode}) clashes with{' '}
                              {p.existingCode ? `${getCourseName(p.existingCode)} (${p.existingCode})` : 'an existing class'}
                              {' '}on {p.day} at {p.hour}
                            </p>
                          ))}
                        </div>
                      );
                    })()}
                    <Timetable data={combinedList} ed={student.electiveData} />
                    <button className='finalize-btn' onClick={() => handleSubmit3(val, combinedList)}>
                      Finalize Option {index + 1}
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
