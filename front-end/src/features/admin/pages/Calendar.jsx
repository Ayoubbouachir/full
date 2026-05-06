import React, { useState } from 'react';

const Calendar = () => {
    const [currentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(
            <div key={i} className="calendar-day">
                {i}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', marginLeft: '250px' }}> {/* Adjust margin for sidebar */}
            <h2>Calendar - {currentDate.toLocaleString('default', { month: 'long' })} {year}</h2>
            <div className="calendar-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                maxWidth: '800px',
                marginTop: '20px'
            }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ fontWeight: 'bold' }}>{day}</div>
                ))}
                {days}
            </div>
            <style>{`
        .calendar-day {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background: #fff;
          min-height: 80px;
        }
        .calendar-day:hover {
          background-color: #f0f0f0;
        }
      `}</style>
        </div>
    );
};

export default Calendar;
