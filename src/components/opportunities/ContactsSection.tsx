import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Opportunity } from '@/lib/types';

interface Props {
  opportunity: Opportunity;
}

export default function ContactsSection({ opportunity }: Props) {
  const { data, addContactToCompany, linkContactToOpp, unlinkContactFromOpp } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLinkedIn, setNewLinkedIn] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [linkSelect, setLinkSelect] = useState('');

  const company = data.companies.find(c => c.id === opportunity.company_id);
  const viaCompany = opportunity.via_company_id ? data.companies.find(c => c.id === opportunity.via_company_id) : null;
  const availableContacts = [...(company?.contacts || []), ...(viaCompany?.contacts || [])].filter(
    (c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx // dedup
  );

  const linkedContacts = availableContacts.filter(c => opportunity.contact_ids.includes(c.id));

  const handleCreateAndLink = () => {
    if (!newName.trim() || !company) return;
    const contactId = addContactToCompany(company.id, {
      name: newName.trim(),
      title: newTitle.trim() || null,
      linkedin: newLinkedIn.trim() || null,
      notes: newNotes.trim() || null,
    });
    // link it
    linkContactToOpp(opportunity.id, contactId);
    setNewName(''); setNewTitle(''); setNewLinkedIn(''); setNewNotes('');
    setShowCreate(false);
  };

  const handleLink = () => {
    if (linkSelect) {
      linkContactToOpp(opportunity.id, linkSelect);
      setLinkSelect('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Contacts (from company)</h3>
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(!showCreate)}>+ New Contact</Button>
      </div>

      {/* Linked */}
      <div className="mb-3 space-y-1">
        {linkedContacts.length === 0 && <div className="text-xs text-muted-foreground">No contacts linked yet.</div>}
        {linkedContacts.map(contact => (
          <div key={contact.id} className="text-sm border rounded p-2 flex justify-between items-start">
            <div>
              <div className="font-medium">{contact.name} {contact.title && <span className="text-muted-foreground text-xs">— {contact.title}</span>}</div>
              {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs underline text-blue-600">LinkedIn</a>}
              {contact.notes && <div className="text-xs mt-1 text-muted-foreground">{contact.notes}</div>}
            </div>
            <button onClick={() => unlinkContactFromOpp(opportunity.id, contact.id)} className="text-xs text-destructive">unlink</button>
          </div>
        ))}
      </div>

      {/* Link existing */}
      {availableContacts.length > 0 && (
        <div className="flex gap-2 mb-3">
          <select 
            value={linkSelect} 
            onChange={e => setLinkSelect(e.target.value)} 
            className="flex-1 border rounded p-1 text-sm bg-background"
          >
            <option value="">Link existing contact...</option>
            {availableContacts
              .filter(c => !opportunity.contact_ids.includes(c.id))
              .map(c => <option key={c.id} value={c.id}>{c.name} {c.title ? `(${c.title})` : ''}</option>)}
          </select>
          <Button size="sm" onClick={handleLink} disabled={!linkSelect}>Link</Button>
        </div>
      )}

      {/* Create new */}
      {showCreate && (
        <div className="border rounded p-3 space-y-2 bg-muted/10">
          <Input placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} className="text-sm" />
          <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="text-sm" />
          <Input placeholder="LinkedIn URL" value={newLinkedIn} onChange={e => setNewLinkedIn(e.target.value)} className="text-sm" />
          <Input placeholder="Relationship notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateAndLink}>Create & Link</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
          <div className="text-xs text-muted-foreground">New contact will be added to {company?.name}</div>
        </div>
      )}
    </div>
  );
}
