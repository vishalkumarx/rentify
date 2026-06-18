import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  isAfter, isBefore, startOfDay, parseISO
} from 'date-fns';

interface CalendarProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  disabled?: boolean;
}

export function Calendar({ startDate, endDate, onChange, disabled = false }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfDay(new Date());
  
  const parsedStart = startDate ? parseISO(startDate) : null;
  const parsedEnd = endDate ? parseISO(endDate) : null;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    if (disabled) return;
    if (isBefore(day, today)) return; // Disable past dates

    const dayStr = format(day, 'yyyy-MM-dd');

    if (!parsedStart || (parsedStart && parsedEnd) || isBefore(day, parsedStart)) {
      // Start new range
      onChange(dayStr, '');
    } else {
      // Complete range
      onChange(startDate, dayStr);
    }
  };

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', opacity: disabled ? 0.5 : 1 }}>
      <button 
        onClick={prevMonth} 
        style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', color: 'var(--text-main)' }}
        disabled={disabled || isBefore(startOfMonth(currentMonth), startOfMonth(today))}
      >
        <ChevronLeft size={18} />
      </button>
      <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-main)' }}>
        {format(currentMonth, 'MMMM yyyy')}
      </div>
      <button 
        onClick={nextMonth} 
        style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', color: 'var(--text-main)' }}
        disabled={disabled}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const dateFormat = 'E';
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          {format(addDays(startDate, i), dateFormat)[0]}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', opacity: disabled ? 0.5 : 1 }}>{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart);
    const endDateGrid = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateGrid;
    let formattedDate = '';

    while (day <= endDateGrid) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const isPast = isBefore(cloneDay, today);
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isStart = parsedStart && isSameDay(cloneDay, parsedStart);
        const isEnd = parsedEnd && isSameDay(cloneDay, parsedEnd);
        const isInRange = parsedStart && parsedEnd && isAfter(cloneDay, parsedStart) && isBefore(cloneDay, parsedEnd);
        
        let bg = 'transparent';
        let color = isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)';
        let borderRadius = '8px';

        if (isStart || isEnd) {
          bg = 'var(--primary)';
          color = '#fff';
        } else if (isInRange) {
          bg = 'var(--primary-glow)';
          color = 'var(--text-main)';
          borderRadius = '0'; // Flat edges for continuous range
        }

        if (isPast || disabled) {
          color = 'var(--text-muted)';
          if (!isInRange && !isStart && !isEnd) {
            bg = 'transparent';
          }
        }

        days.push(
          <div 
            key={day.toString()} 
            onClick={() => handleDateClick(cloneDay)}
            style={{
              padding: '8px 0',
              textAlign: 'center',
              cursor: (isPast || disabled) ? 'not-allowed' : 'pointer',
              background: bg,
              color: color,
              borderRadius: borderRadius,
              fontSize: '14px',
              fontWeight: (isStart || isEnd) ? 700 : 500,
              opacity: (isPast || disabled) ? 0.4 : 1,
              position: 'relative'
            }}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)', fontSize: '13px' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>From</div>
          <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {startDate ? format(parseISO(startDate), 'MMM dd, yyyy') : 'Select date'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)', fontSize: '13px' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>To</div>
          <div style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {endDate ? format(parseISO(endDate), 'MMM dd, yyyy') : 'Select date'}
          </div>
        </div>
      </div>
    </div>
  );
}
