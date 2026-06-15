
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { DeleteCompanySummary } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: DeleteCompanySummary | null;
  companyName: string;
  onConfirm: () => void;
}

export function DeleteCompanyConfirm({ isOpen, onClose, summary, companyName, onConfirm }: Props) {
  if (!summary) return null;

  const { removedPrimaryOpps, nulledViaOpps, deletedContacts, cleanedContactLinks } = summary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${companyName}?`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete Company</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-destructive font-medium">This action cannot be undone.</p>
        
        <div className="bg-muted p-3 rounded text-sm">
          Deleting <strong>{companyName}</strong> will:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Remove the company record and its <strong>{deletedContacts}</strong> contacts</li>
            {removedPrimaryOpps > 0 && (
              <li>Remove <strong>{removedPrimaryOpps}</strong> primary opportunities (and their tasks/meetings)</li>
            )}
            {nulledViaOpps > 0 && (
              <li>Remove the "via" reference from <strong>{nulledViaOpps}</strong> opportunities (they will stay linked to their primary company)</li>
            )}
            {cleanedContactLinks > 0 && (
              <li>Clean <strong>{cleanedContactLinks}</strong> dangling contact links from other opportunities</li>
            )}
            {removedPrimaryOpps === 0 && nulledViaOpps === 0 && (
              <li>No opportunities will be affected</li>
            )}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Primary opportunities (where this is the target company) are fully removed. Via/contracting references are safely nulled.
        </p>
      </div>
    </Modal>
  );
}
