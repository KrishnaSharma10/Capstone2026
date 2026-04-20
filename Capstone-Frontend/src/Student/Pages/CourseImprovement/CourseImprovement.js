import React, { useContext, useEffect, useRef, useState } from 'react';
import './CourseImprovement.css';
import StudentSidebar from '../../Components/Sidebar';
import { ProgressBar } from 'react-bootstrap';
import axios from 'axios'
import { toast } from 'react-toastify';
import { UserContext } from '../../../UserContext';
import Timetable from '../../Components/TimeTable';
import Logout from '../../Components/Logout';
import { useNavigate } from 'react-router-dom';

const CourseImprovement = () => {
  const token = localStorage.getItem("ICMPTokenStudent");
  const { student, setStudent } = useContext(UserContext);
  const [courseData, setCourseData] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [selectedCourseData, setSelectedCourseData] = useState([]);

  const [timeTableOptionsData, setTimeTableOptionsData] = useState([]);
  const [choices, setChoices] = useState([]);
  const [newTimeTable, setNewTimeTable] = useState([]);
  const [emptyChoices, setEmptyChoices] = useState(false);

  const [cgpa, setCgpa] = useState("");
  const [IEEFile, setIEEFile] = useState(null);

  const [active, setActive] = useState(true);

  const navigate = useNavigate();


  useEffect(() => {
  if (!student) return;

  console.log("Student data:", student);

  // fetch course list
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


  const handleSubmit1 = (e) => {
    e.preventDefault();

    if (selectedCourseCode) {
      const foundCourse = courseData.find(
        (course) => course.subjectCode.toLowerCase() === selectedCourseCode.toLowerCase()
      );

      if (foundCourse) {
        if (selectedCourseData.length === 3) {
          toast.error("Can Select Maximum of 3 Courses");
          return;
        }
        setSelectedCourseData([
          ...selectedCourseData,
          {
            subjectCode: foundCourse.subjectCode,
            subjectName: foundCourse.data["course name"],
            subjectCredits: foundCourse.data["Credit"],
            subjectL: foundCourse.data["L"],
            subjectT: foundCourse.data["T"],
            subjectP: foundCourse.data["P"],
          }
        ]);
      }
    } else if (selectedCourseName) {
      const foundCourse = courseData.find(
        (course) => course.data["course name"].toLowerCase() === selectedCourseName.toLowerCase()
      );
      if (foundCourse) {
        if (selectedCourseData.length === 3) {
          toast.error("Can Select Maximum of 3 Courses");
          return;
        }
        setSelectedCourseData(prevData => [
          ...prevData,
          {
            subjectCode: foundCourse.subjectCode,
            subjectName: foundCourse.data["course name"],
            subjectCredits: foundCourse.data["Credit"],
            subjectL: foundCourse.data["L"],
            subjectT: foundCourse.data["T"],
            subjectP: foundCourse.data["P"],
          }
        ]);
      }
    }

    setSelectedCourseCode('');
    setSelectedCourseName('');
  };

  const handleSubmit2 = () => {
    const data = {
      selectedCourseData: selectedCourseData,
      studentData: student
    }

    console.log(data);
    
    axios.post("http://localhost:3001", data) 
      .then((res) => {
        console.log(res.data);
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
  }

  const handleCgpaChange = (e) => {
    setCgpa(e.target.value);
  };

  const handleIEEFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Upload File Smaller Than 2MB");
      setIEEFile(null);
      return;
    }

    setIEEFile(file);
  };


  const handleSubmit3 = (choice, newTimeTable) => {
    const arr = Object.entries(choice);

    if (cgpa.trim() === '') {
      toast.error("Must enter the CGPA");
      return;
    };

    const data = {
      "email": student.thapar_email,
      "opted_courses": arr,
      "message": "",
      "clashing": newTimeTable.some(event => event.clash),
      "new_time_table": newTimeTable,
      "elective_data": student.electiveData,
      "cgpa": cgpa
    };

    const formData = new FormData();
    formData.append("mainData", data);
    formData.append("IEEPdf", IEEFile);

    console.log(data);

    const confirmed = window.confirm(`Application once submitted can't be taken back. \n\nAre you sure you want to pick these courses with these subgroups ?`);
    if (!confirmed) return;

    toast.warning("Please wait for Application to be generated!!");

    setChoices([]);
    setNewTimeTable([]);

    axios.post("http://127.0.0.1:5000/api/student/generate-application", data, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
      .then((res) => {
        toast.success("Application successfully created!!");
        setStudent(prev => ({
          ...prev,
          ongoing_application: res.data.applicationId
        }));

        setTimeout(() => {
          navigate("/student/status");
        }, 1000);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Try again!!");
      })
  }

  const handleRemoveCourse = (subjectCode) => {
    setSelectedCourseData(prev =>
      prev.filter(course => course.subjectCode !== subjectCode)
    );
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
          ? <h1 className='course-improvement-wait-heading'>Please Wait for the Ongoing Application to be Accepted/Rejected</h1>
          : <>
            <div className="student-main-course-improvement-top2">
              <h3>Guidelines: </h3>
              <h5>- Generate options by clicking on "Generate options" button.</h5>
              <h5>- Select one of the available options.</h5>
              <h5>- Wait for the Ongoing Application to be Accepted/Rejected before making new request.</h5>
            </div>

            <div className="student-main-course-improvement-bottom">
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
                  <input type="text" placeholder='Ex: 8.00' required value={cgpa} onChange={handleCgpaChange} />

                  {showUpload && (
                    <>
                      <p>Upload IEE Signed Document (Mandatory for 8th sem students)</p>
                      <input type="file" />
                    </>
                  )}

                </form>
              </div>

              <div className="student-main-course-improvement-bottom-right">
                <h5>Search Courses for Improvement</h5>
                <form onSubmit={handleSubmit1}>
                  <label style={{ color: 'whitesmoke' }}>Search by Course Code</label>
                  <input
                    list="courseCodes"
                    value={selectedCourseCode}
                    onChange={(e) => {
                      setSelectedCourseCode(e.target.value);
                      setSelectedCourseName('');
                    }}
                    placeholder="Ex: UCS401"
                  />
                  <datalist id="courseCodes">
                    {courseData.map((course) => (
                      <option key={course.subjectCode} value={course.subjectCode} />
                    ))}
                  </datalist>

                  <div style={{ textAlign: 'center', color: 'red', fontWeight: 'bold', margin: '10px 0' }}>OR</div>

                  <label style={{ color: 'whitesmoke' }}>Search by Course Name</label>
                  <input
                    list="courseNames"
                    value={selectedCourseName}
                    onChange={(e) => {
                      setSelectedCourseName(e.target.value);
                      setSelectedCourseCode('');
                    }}
                    placeholder="Ex: Applied Physics"
                  />
                  <datalist id="courseNames">
                    {courseData.map((course) => (
                      <option key={course.subjectCode} value={course.data["course name"]} />
                    ))}
                  </datalist>

                  <button type="submit" style={{ marginTop: '10px' }}>Submit</button>
                </form>
              </div>
            </div>

            <button className='generate-options-btn' onClick={handleSubmit2}>Generate Options</button>

            <div className="student-course-improvement-choices-div">
              {choices.length > 0 ? <h1>Plz Choose from one of these options:</h1> : ""}
              {emptyChoices ? <h1>No Options Found</h1> : ""}
              {choices.map((val, index) => {
                const combinedList = [...student.timeTableData, ...newTimeTable[index]];

                return (
                  <div className='student-course-improvement-individual-choices-div' key={index}>
                    <h2>Option {index+1}</h2>

                    {/* --- subject + subgroup breakdown --- */}
                    {Object.entries(val).map(([subjectCode, sgs]) => (
                      <div key={subjectCode}>
                        <h4>{subjectCode}</h4>
                        <p style={{ color: 'whitesmoke' }}>Lecture group: {sgs.lecture_sg || '—'}</p>
                        <p style={{ color: 'whitesmoke' }}>Lab group: {sgs.lab_sg || '—'}</p>
                        <p style={{ color: 'whitesmoke' }}>Tutorial group: {sgs.tutorial_sg || '—'}</p>
                      </div>
                    ))}

                    {/* --- clash indicator --- */}
                    {newTimeTable[index].some(event => event.clash)
                      ? <h4 style={{color:'orange'}}>⚠️ Has 1 lecture clash</h4>
                      : <h4 style={{color:'#90EE90'}}>✅ No clashes</h4>
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
                        <div className='timetable-legend-circle' style={{backgroundColor: 'orange'}}></div>
                        <p>Clash Slot</p>
                      </div>
                    </div>

                    <button className='finalize-btn' onClick={() => { handleSubmit3(val, combinedList) }}>Finalize option {index + 1}</button>
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