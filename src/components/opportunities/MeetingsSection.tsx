import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Opportunity, MeetingType } from '@/lib/types';
import { MEETING_TYPES } from '@/lib/constants';

interface Props {
  opportunity: Opportunity;
}

export default function MeetingsSection({ opportunity }: Props) {
  const { addMeetingToOpp } = useAppStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<MeetingType>('Video');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  const sortedMeetings = [...opportunity.meetings].sort((a, b) => b.date.localeCompare(a.date));

  const handleAdd = () => {
    if (!attendees.trim() || !date) return;
    addMeetingToOpp(opportunity.id, {
      date,
      type,
      attendees: attendees.trim(),
      notes: notes.trim() || null,
      outcome: outcome.trim() || null,
    });
    setAttendees('');
    setNotes('');
    setOutcome('');
  };

  return (
    <div>
      <h3 className="font-medium mb-2">Meetings Log</h3>

      <div className="space-y-3 mb-3 max-h-48 overflow-auto pr-1">
        {sortedMeetings.length === 0 && (
          <div className="text-xs text-muted-foreground">No meetings logged yet.</div>
        )}
        {sortedMeetings.map(m => (
          <div key={m.id} className="border rounded p-2 text-sm bg-muted/20">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{m.date} • {m.type}</span>
            </div>
            <div><strong>Attendees:</strong> {m.attendees}</div>
            {m.notes && <div className="mt-1"><strong>Notes:</strong> {m.notes}</div>}
            {m.outcome && <div className="mt-1"><strong>Outcome:</strong> {m.outcome}</div>}
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs block mb-0.5">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="text-xs block mb-0.5">Type</label>
            <select value={type} onChange={e => setType(e.target.value as MeetingType)} className="w-full border rounded p-1 text-sm bg-background">
              {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <Input 
          placeholder="Attendees (e.g. Priya Sharma, Alex Rivera)" 
          value={attendees} 
          onChange={e => setAttendees(e.target.value)} 
          className="text-sm" 
        />
        <Input 
          placeholder="Notes" 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          className="text-sm" 
        />
        <Input 
          placeholder="Outcome" 
          value={outcome} 
          onChange={e => setOutcome(e.target.value)} 
          className="text-sm" 
        />
        <Button size="sm" onClick={handleAdd}>Log Meeting</Button>
      </div>
    </div>
  );
}
