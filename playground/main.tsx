import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AvailabilityCalendar } from '../src';
import type { AvailabilitySlot, BlockedSlot } from '../src';

const initialSlots: AvailabilitySlot[] = [
  { id: 1, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
  { id: 2, dayOfWeek: 3, startTime: '14:00', endTime: '17:00' },
  { id: 3, dayOfWeek: 5, startTime: '10:00', endTime: '13:00' },
];

const blockedSlots: BlockedSlot[] = [
  { dayOfWeek: 2, startTime: '12:00', endTime: '13:00', label: 'Lunch' },
  { dayOfWeek: 4, startTime: '12:00', endTime: '13:00', label: 'Lunch' },
];

function DefaultExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: 18, fontWeight: 600 }}>
        Default
      </h2>
      <div style={{ height: '60vh' }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat='12'
        />
      </div>
    </div>
  );
}

function CustomizedExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: 18, fontWeight: 600 }}>
        Customized
      </h2>
      <div style={{ height: '60vh' }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat='24'
          startDay={1}
          dayLabelFormat='long'
          gridLineStyle='dotted'
          theme={{
            calendarBackground: '#1e1e2e',
            borderColor: '#45475a',
            headerBackground: '#313244',
            headerTextColor: '#cdd6f4',
            timeLabelColor: '#a6adc8',
            gridLineColor: '#45475a',
            slotBackground: '#89b4fa',
            slotTextColor: '#1e1e2e',
            slotBorderColor: '#74c7ec',
            blockedBackground: '#45475a',
            blockedTextColor: '#f38ba8',
            blockedBorderColor: '#f38ba8',
            blockedStripeColor: 'rgba(243,139,168,0.25)',
            previewBackground: 'rgba(137,180,250,0.3)',
            previewBorderColor: '#89b4fa',
          }}
          renderSlot={(_slot, info) => (
            <div style={{ padding: '2px 4px', fontSize: 11 }}>
              <strong>
                {info.startLabel} – {info.endLabel}
              </strong>
              {!info.isCompact && (
                <>
                  <br />
                  <span style={{ opacity: 0.8 }}>{info.durationLabel}</span>
                </>
              )}
            </div>
          )}
          renderBlockedSlot={(slot) => (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {slot.label}
            </span>
          )}
        />
      </div>
    </div>
  );
}

function ClassNamesExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: 18, fontWeight: 600 }}>
        classNames (CSS / Tailwind friendly)
      </h2>
      <div style={{ height: '60vh' }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat='12'
          startDay={0}
          dayLabelFormat='short'
          gridLineStyle='dotted'
          classNames={{
            gridContainer: 'my-grid',
            header: 'my-header',
            headerCell: 'my-header-cell',
            timeLabel: 'my-time',
            dayColumn: 'my-day-col',
            slot: 'my-slot',
            slotRemoveButton: 'my-remove-btn',
            blockedSlot: 'my-blocked',
            createPreview: 'my-preview',
            moveGhost: 'my-ghost',
            hourLine: 'my-hour',
            subHourLine: 'my-sub-hour',
          }}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <DefaultExample />
      <CustomizedExample />
      <ClassNamesExample />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
