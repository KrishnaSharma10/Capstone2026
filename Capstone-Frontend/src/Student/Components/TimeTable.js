import React from 'react';
import './TimeTable.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const hours = ['8:00 AM', '8:50 AM', '9:40 AM', '10:30 AM', '11:20 AM', '12:10 PM', '1:00 PM', '1:50 PM', '2:40 PM', '3:30 PM', '4:20 PM', '5:10 PM', '6:00 PM'];

const legendItems = [
  { label: 'Free Slots', color: '#ffffff', border: true },
  { label: 'Lectures', color: '#FFD700' },
  { label: 'Labs', color: '#90ee90' },
  { label: 'Tutorials', color: '#add8e6' },
  { label: 'Electives', color: '#FFC0CB' },
  { label: 'Added', color: 'red' },
  { label: 'Clash', color: 'orange' },
];

const Timetable = ({ data, ed }) => {
  var events = [{
    "color": "#FFD700",
    "day": "Monday",
    "hour": "9:40 AM",
    "subjectCode": "UHU003",
    "subjectName": "Professional Communication",
    "venue": "LP101"
  }];

  if (data && Array.isArray(data)) {
    events = data;
  }

  const getEvent = (day, hour) => {
    return events.filter((event) => event.day === day && event.hour === hour);
  };

  const renderCell = (eventz) => {
    if (eventz.length === 0) {
      return (
        <div className="cell" style={{ backgroundColor: 'white' }}></div>
      );
    }

    if (eventz.length === 1) {
      const event = eventz[0];

      // elective slot — only show if student has chosen it
      if (event.color === "#FFC0CB") {
        if (ed && ed.includes(event.subjectCode)) {
          return (
            <div className="cell" style={{ backgroundColor: event.color }} >
              <p className='subname'>{event.subjectName}</p>
              <p>{event.subjectCode}</p>
              <p>{event.venue}</p>
            </div>
          );
        } else {
          return <div className="cell" style={{ backgroundColor: 'white' }}></div>;
        }
      }

      // normal slot
      return (
        <div className="cell" style={{ backgroundColor: event.color || 'white' }}>
          <p className='subname'>{event.subjectName}</p>
          <p>{event.subjectCode}</p>
          <p>{event.venue}</p>
          {event.clash && <p style={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>⚠ CLASH</p>}
        </div>
      );
    }

    // multiple events at same slot — priority order:
    // 1. clash slot (orange) — always show
    // 2. added slot (red) — show over existing
    // 3. chosen elective (pink)
    // 4. regular existing slot
    const clashEvent    = eventz.find(e => e.color === "orange");
    const addedEvent    = eventz.find(e => e.color === "red");
    const electiveEvent = eventz.find(e => e.color === "#FFC0CB" && ed && ed.includes(e.subjectCode));
    const regularEvent  = eventz.find(e => e.color !== "#FFC0CB" && e.color !== "red" && e.color !== "orange");

    const event = clashEvent || addedEvent || electiveEvent || regularEvent;

    if (!event) {
      return <div className="cell" style={{ backgroundColor: 'white' }}></div>;
    }

    return (
      <div className="cell" style={{ backgroundColor: event.color || 'white' }}>
        <p className='subname'>{event.subjectName}</p>
        <p>{event.subjectCode}</p>
        <p>{event.venue}</p>
        {event.clash && <p style={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>⚠ CLASH</p>}
      </div>
    );
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
            {hours.map((hour) => {
              const eventz = getEvent(day, hour);
              return (
                <React.Fragment key={hour}>
                  {renderCell(eventz)}
                </React.Fragment>
              );
            })}
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