import React, { useEffect, useState } from 'react';
import './TimeTable.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hours = ['8:00 AM', '8:50 AM', '9:40 AM', '10:30 AM', '11:20 AM', '12:10 PM', '1:00 PM', '1:50 PM', '2:40 PM', '3:30 PM', '4:20 PM', '5:10 PM', '6:00 PM'];

const ADDED_MARKER = 'red';
const CLASH_MARKER = 'orange';
const ELECTIVE_COLOR = '#ffc0cb';
const ADDED_DISPLAY_COLOR = '#4169E1';

const legendItems = [
  { label: 'Free Slots', color: '#ffffff', border: true },
  { label: 'Lectures', color: '#FFD700' },
  { label: 'Labs', color: '#90ee90' },
  { label: 'Tutorials', color: '#add8e6' },
  { label: 'Electives', color: '#FFC0CB' },
  { label: 'Added', color: ADDED_DISPLAY_COLOR },
  { label: 'Clash', color: CLASH_MARKER },
];

const TYPE_LABELS = {
  lecture: 'Lecture',
  lab: 'Lab',
  tutorial: 'Tutorial',
};

let courseNamesPromise;

const getCourseNames = () => {
  if (!courseNamesPromise) {
    courseNamesPromise = fetch(`${process.env.REACT_APP_API_URL}/api/get-course-list`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to fetch course names');
        return response.json();
      })
      .then((courses) => courses.reduce((names, course) => {
        const code = course?.subjectCode;
        const name = course?.data?.['course name'];
        if (code && name) names[code] = name;
        return names;
      }, {}));
  }

  return courseNamesPromise;
};

const markerFor = (event) => (event.color || '').toLowerCase();

const Timetable = ({ data, ed }) => {
  const [courseNames, setCourseNames] = useState({});

  useEffect(() => {
    let isMounted = true;

    getCourseNames()
      .then((names) => {
        if (isMounted) setCourseNames(names);
      })
      .catch((error) => console.error('Unable to load course names:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  const events = Array.isArray(data) ? data : [];

  const getEvent = (day, hour) => (
    events.filter((event) => event.day === day && event.hour === hour)
  );

  const renderCellContent = (event) => {
    const marker = markerFor(event);
    const isAdded = marker === ADDED_MARKER;
    const courseName = courseNames[event.subjectCode];
    const fallbackName = (
      event.subjectName && event.subjectName !== event.subjectCode
        ? event.subjectName
        : ''
    );
    const fullName = courseName || fallbackName;
    const title = fullName || event.subjectCode;
    const typeLabel = isAdded ? TYPE_LABELS[event.type] : null;
    const displayColor = isAdded ? ADDED_DISPLAY_COLOR : (event.color || 'white');

    return (
      <div className="cell" style={{ backgroundColor: displayColor }} title={title}>
        {fullName ? (
          <>
            <p className="subname">{fullName}</p>
            <p className="subcode">{event.subjectCode}</p>
          </>
        ) : (
          <p className="subcode">{event.subjectCode}</p>
        )}
        {isAdded && typeLabel && <p className="type-tag">Added · {typeLabel}</p>}
        {event.clash && <p className="clash-tag">⚠ CLASH</p>}
      </div>
    );
  };

  const renderCell = (eventz) => {
    if (eventz.length === 0) {
      return <div className="cell" style={{ backgroundColor: 'white' }}></div>;
    }

    if (eventz.length === 1) {
      const event = eventz[0];

      if (markerFor(event) === ELECTIVE_COLOR && (!ed || !ed.includes(event.subjectCode))) {
        return <div className="cell" style={{ backgroundColor: 'white' }}></div>;
      }

      return renderCellContent(event);
    }

    const clashEvent = eventz.find((event) => markerFor(event) === CLASH_MARKER);
    const addedEvent = eventz.find((event) => markerFor(event) === ADDED_MARKER);
    const electiveEvent = eventz.find(
      (event) => markerFor(event) === ELECTIVE_COLOR && ed && ed.includes(event.subjectCode)
    );
    const regularEvent = eventz.find((event) => {
      const marker = markerFor(event);
      return marker !== ELECTIVE_COLOR && marker !== ADDED_MARKER && marker !== CLASH_MARKER;
    });

    const event = clashEvent || addedEvent || electiveEvent || regularEvent;

    return event
      ? renderCellContent(event)
      : <div className="cell" style={{ backgroundColor: 'white' }}></div>;
  };

  return (
    <>
      <div className="timetable">
        <div className="cell header"></div>
        {hours.map((hour) => (
          <div key={hour} className="cell header">{hour}</div>
        ))}

        {days.map((day) => (
          <React.Fragment key={day}>
            <div className="cell header">{day}</div>
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {renderCell(getEvent(day, hour))}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="timetable-legend">
        {legendItems.map((item) => (
          <div className="legend-item" key={item.label}>
            <span
              className="legend-dot"
              style={{
                backgroundColor: item.color,
                border: item.border ? '2px solid #999' : '2px solid rgba(0,0,0,0.15)',
              }}
            ></span>
            <span className="legend-text">{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default Timetable;
