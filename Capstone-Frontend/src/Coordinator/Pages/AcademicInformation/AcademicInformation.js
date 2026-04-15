import React, { useState, useEffect } from 'react'
import './AcademicInformation.css'
import Sidebar from '../../Components/Sidebar'
import { toast } from 'react-toastify'
import axios from 'axios'

export default function AcademicInformation() {
  const [courseList, setCourseList] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // edit modal
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [formData, setFormData] = useState({
    courseName: '', courseCode: '', L: '', T: '', P: ''
  });

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/get-course-list');
      const data = await res.json();
      setCourseList(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      toast.error('Failed to load course list');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  // ── Edit handlers ──────────────────────────────────────────────────────────
  const openEdit = (course) => {
    setEditingCourse(course);
    setEditForm({
      _id: course._id,
      subjectCode: course.subjectCode,
      data: { ...course.data }
    });
  };

  const closeEdit = () => {
    setEditingCourse(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (['L', 'T', 'P', 'Credit'].includes(name)) {
      setEditForm((prev) => ({ ...prev, data: { ...prev.data, [name]: Number(value) } }));
    } else if (name === 'subjectCode') {
      setEditForm((prev) => ({ ...prev, subjectCode: value }));
    } else if (name === 'course name') {
      setEditForm((prev) => ({ ...prev, data: { ...prev.data, 'course name': value } }));
    }
  };

  const handleEditSubmit = async () => {
    try {
      // send _id as string so backend can convert to ObjectID
      const payload = {
        _id: editForm._id.$oid || editForm._id,
        subjectCode: editForm.subjectCode,
        data: editForm.data
      };
      await axios.post('http://127.0.0.1:5000/api/update-course', payload);
      toast.success('Course updated successfully!');
      closeEdit();
      fetchCourses(); // refresh table
    } catch (err) {
      console.error(err);
      toast.error('Failed to update course');
    }
  };

  // ── Add course handler ─────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Course added successfully!");
    setFormData({ courseName: '', courseCode: '', L: '', T: '', P: '' });
  };

  return (
    <div className='coordinator-academic-info-container'>
      <Sidebar />
      <div className="academic-form" style={{ marginLeft: '250px' }}>

        {/* ── Course List Table ── */}
        <h2>Existing Courses</h2>
        {loadingCourses ? (
          <p>Loading courses...</p>
        ) : courseList.length === 0 ? (
          <p>No courses found.</p>
        ) : (
          <table className="course-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Subject Code</th>
                <th>L</th>
                <th>T</th>
                <th>P</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courseList.map((course, idx) => (
                <tr key={idx}>
                  <td>{course.data?.['course name'] || '-'}</td>
                  <td>{course.subjectCode || '-'}</td>
                  <td>{course.data?.L ?? '-'}</td>
                  <td>{course.data?.T ?? '-'}</td>
                  <td>{course.data?.P ?? '-'}</td>
                  <td>
                    <button
                      className="finance-btn finance-btn-details"
                      onClick={() => openEdit(course)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Add Course Form ── */}
        <h2 style={{ marginTop: '40px' }}>Add New Course</h2>
        <form onSubmit={handleSubmit} className="form-fields">
          <div className="form-group">
            <label>New Course Name:</label>
            <input type="text" name="courseName" value={formData.courseName}
              onChange={handleChange} placeholder="Enter course name" required />
          </div>
          <div className="form-group">
            <label>New Course Code:</label>
            <input type="text" name="courseCode" value={formData.courseCode}
              onChange={handleChange} placeholder="Enter course code" required />
          </div>
          <div className="form-group short-inputs">
            <div>
              <label>L:</label>
              <input type="number" name="L" value={formData.L} onChange={handleChange} min="0" required />
            </div>
            <div>
              <label>T:</label>
              <input type="number" name="T" value={formData.T} onChange={handleChange} min="0" required />
            </div>
            <div>
              <label>P:</label>
              <input type="number" name="P" value={formData.P} onChange={handleChange} min="0" required />
            </div>
          </div>
          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>

      {/* ── Edit Modal ── */}
      {editingCourse && (
        <div className="finance-overlay">
          <div className="finance-popup">
            <h3>Edit Course</h3>

            <div className="form-group">
              <label>Course Name:</label>
              <input type="text" name="course name"
                value={editForm.data?.['course name'] || ''}
                onChange={handleEditChange} />
            </div>

            <div className="form-group">
              <label>Subject Code:</label>
              <input type="text" name="subjectCode"
                value={editForm.subjectCode || ''}
                onChange={handleEditChange} />
            </div>

            <div className="form-group short-inputs">
              <div>
                <label>L:</label>
                <input type="number" name="L"
                  value={editForm.data?.L ?? ''} onChange={handleEditChange} min="0" />
              </div>
              <div>
                <label>T:</label>
                <input type="number" name="T"
                  value={editForm.data?.T ?? ''} onChange={handleEditChange} min="0" />
              </div>
              <div>
                <label>P:</label>
                <input type="number" name="P"
                  value={editForm.data?.P ?? ''} onChange={handleEditChange} min="0" />
              </div>
            </div>

            <div className="finance-popup-actions">
              <button className="finance-btn finance-btn-approve" onClick={handleEditSubmit}>
                Save Changes
              </button>
              <button className="finance-btn finance-btn-cancel" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}