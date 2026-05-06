
document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'title',
            center: 'timeGridDay,timeGridWeek,dayGridMonth',
            right: 'prev,next today'
        },
        editable: true,
        selectable: true,
        events: [
            {
                title: 'PQ45631 - Lentz',
                start: '2024-10-01',
                start: '2024-10-07T08:00:00',
                end: '2024-10-07T09:00:00',
                backgroundColor: 'rgba(111, 52, 236, 0.12)',
                textColor: '#6F34EC',
            },
            {
                title: 'PQ45616 - Kelly',
                start: '2024-10-01',
                backgroundColor: 'rgba(111, 52, 236, 0.12)',
                textColor: '#6F34EC',
            },
            {
                title: 'PQ45660 - Jordan',
                start: '2024-10-21',
                backgroundColor: 'rgba(227, 10, 10, 0.12)',
                textColor: '#E30A0A',
            },
            {
                title: 'PQ45624 - Annette',
                start: '2024-10-21',
                backgroundColor: 'rgba(227, 10, 10, 0.12)',
                textColor: '#E30A0A',
            },
            {
                title: 'PQ45650 - Ronald',
                start: '2024-10-21',
                backgroundColor: 'rgba(227, 10, 10, 0.12)',
                textColor: '#E30A0A',
            },

            {
                title: 'PQ45632 - Alexander',
                start: '2024-10-16',
                backgroundColor: 'rgba(53, 209, 104, 0.12)',
                textColor: '#35D168',
            },
            {
                title: 'PQ45636 - Jones',
                start: '2024-10-16',
                backgroundColor: 'rgba(53, 209, 104, 0.12)',
                textColor: '#35D168',
                start: '2024-10-10T12:00:00',
                end: '2024-10-10T13:00:00',
            },

            {
                title: 'PQ45649 - Flores',
                start: '2024-10-06',
                backgroundColor: 'rgba(255, 159, 41, 0.12)',
                textColor: '#FF9F29',
            },
            {
                title: 'PQ45627 - William',
                start: '2024-10-06',
                backgroundColor: 'rgba(255, 159, 41, 0.12)',
                textColor: '#FF9F29',
            },

            {
                title: 'PQ45646 - Jerome',
                start: '2024-10-31',
                backgroundColor: 'rgba(255, 159, 41, 0.12)',
                textColor: '#FF9F29',
            },
            {
                title: 'PQ45628 - Marvin',
                start: '2024-10-31',
                backgroundColor: 'rgba(255, 159, 41, 0.12)',
                textColor: '#FF9F29',
            },
            {
                title: 'PQ45624 - Annette',
                start: '2024-10-11',
                backgroundColor: 'rgba(227, 10, 10, 0.12)',
                textColor: '#E30A0A',
            },
            {
                title: 'PQ45650 - Ronald',
                start: '2024-10-11',
                backgroundColor: 'rgba(227, 10, 10, 0.12)',
                textColor: '#E30A0A',
            },
            {
                title: 'PQ45631 - Lentz',
                start: '2024-10-27',
                backgroundColor: 'rgba(111, 52, 236, 0.12)',
                textColor: '#6F34EC',
            },
            {
                title: 'PQ45616 - Kelly',
                start: '2024-10-27',
                backgroundColor: 'rgba(111, 52, 236, 0.12)',
                textColor: '#6F34EC',
            },
        ],
        eventClick: function (info) {
            window.location.href = 'CustomerDetails.html';
        }
    });
    calendar.render();
});
