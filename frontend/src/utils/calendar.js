// Calendar export utilities

export const generateICS = (event) => {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Felicity//Fest Management//EN
BEGIN:VEVENT
UID:${event._id}@felicity.iiit.ac.in
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.eventStartDate)}
DTEND:${formatDate(event.eventEndDate)}
SUMMARY:${event.eventName}
DESCRIPTION:${event.eventDescription?.replace(/\n/g, '\\n') || ''}
ORGANIZER:${event.organizer?.organizerName || 'Felicity'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  return icsContent;
};

export const downloadICS = (event) => {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.eventName.replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const openGoogleCalendar = (event) => {
  const formatGoogleDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatGoogleDate(event.eventStartDate);
  const endDate = formatGoogleDate(event.eventEndDate);
  const title = encodeURIComponent(event.eventName);
  const details = encodeURIComponent(event.eventDescription || '');
  const location = encodeURIComponent('IIIT Hyderabad');

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  
  window.open(url, '_blank');
};
