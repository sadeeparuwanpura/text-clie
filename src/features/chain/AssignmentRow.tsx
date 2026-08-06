import { useEffect, useState } from 'react';
import type { AssignmentUpsertInput, ThreadAssignment } from '../../api/threadAssignment.api';
import type { ThreadVariety } from '../../api/threadVariety.api';
import type { Colourway } from '../../api/style.api';
import { Button } from '../../design-system/Button';
import { THREAD_ROLE_COLOR_VAR, type ThreadLineRole } from '../../types/threadLineRole';
import styles from './Chain.module.css';

interface AssignmentRowProps {
  role: ThreadLineRole;
  assignment: ThreadAssignment | null;
  colourways: Colourway[];
  varieties: ThreadVariety[];
  canEdit: boolean;
  saving: boolean;
  onSave: (input: AssignmentUpsertInput) => void;
}

/** One row of Step 6 — a role, its variety/ticket/cone/price, and a shade per colourway (FR-TV-02/05/07). */
export function AssignmentRow({
  role,
  assignment,
  colourways,
  varieties,
  canEdit,
  saving,
  onSave,
}: AssignmentRowProps) {
  const [varietyId, setVarietyId] = useState(assignment?.varietyId ?? '');
  const [ticket, setTicket] = useState(String(assignment?.ticket ?? ''));
  const [coneLengthM, setConeLengthM] = useState(String(assignment?.coneLengthM ?? ''));
  const [unitPrice, setUnitPrice] = useState(String(assignment?.unitPrice ?? ''));
  const [shades, setShades] = useState<Record<string, string>>(
    Object.fromEntries(
      colourways.map((c) => [
        c.id,
        assignment?.shadeByColourway.find((s) => s.colourwayId === c.id)?.shadeCode ?? '',
      ]),
    ),
  );

  // useState's initial value only runs once — without this, a row whose assignment
  // arrives *after* first render (e.g. "Fill recommended" populating a previously
  // unassigned role) would keep showing blank fields even though the server now holds
  // real data, and a subsequent Save would silently no-op on the still-empty varietyId.
  useEffect(() => {
    setVarietyId(assignment?.varietyId ?? '');
    setTicket(String(assignment?.ticket ?? ''));
    setConeLengthM(String(assignment?.coneLengthM ?? ''));
    setUnitPrice(String(assignment?.unitPrice ?? ''));
    setShades(
      Object.fromEntries(
        colourways.map((c) => [
          c.id,
          assignment?.shadeByColourway.find((s) => s.colourwayId === c.id)?.shadeCode ?? '',
        ]),
      ),
    );
  }, [assignment, colourways]);

  const recommended = varieties.filter((v) => v.recommendedRoles.includes(role));
  const others = varieties.filter((v) => !v.recommendedRoles.includes(role));

  function save() {
    const parsedTicket = Number(ticket);
    const parsedCone = Number(coneLengthM);
    const parsedPrice = Number(unitPrice);
    if (
      !varietyId ||
      Number.isNaN(parsedTicket) ||
      Number.isNaN(parsedCone) ||
      Number.isNaN(parsedPrice)
    )
      return;
    onSave({
      varietyId,
      ticket: parsedTicket,
      coneLengthM: parsedCone,
      unitPrice: parsedPrice,
      shadeByColourway: colourways.map((c) => ({
        colourwayId: c.id,
        shadeCode: shades[c.id] ?? '',
      })),
    });
  }

  return (
    <tr>
      <td>
        <span className={styles.roleChip}>
          <span
            className={styles.roleDot}
            style={{ background: THREAD_ROLE_COLOR_VAR[role] }}
            aria-hidden="true"
          />
          {role}
        </span>
      </td>
      <td>
        <select
          className={styles.cellSelect}
          disabled={!canEdit}
          value={varietyId}
          aria-label={`${role} thread variety`}
          onChange={(e) => setVarietyId(e.target.value)}
        >
          <option value="">Select a variety</option>
          {recommended.length > 0 && (
            <optgroup label="Recommended">
              {recommended.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} — {v.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Other varieties">
            {others.map((v) => (
              <option key={v.id} value={v.id}>
                {v.code} — {v.name}
              </option>
            ))}
          </optgroup>
        </select>
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          disabled={!canEdit}
          value={ticket}
          aria-label={`${role} ticket`}
          onChange={(e) => setTicket(e.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          disabled={!canEdit}
          value={coneLengthM}
          aria-label={`${role} cone length`}
          onChange={(e) => setConeLengthM(e.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          step="0.01"
          disabled={!canEdit}
          value={unitPrice}
          aria-label={`${role} unit price`}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tcms-space-1)' }}>
          {colourways.map((c) => (
            <div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--tcms-space-2)' }}
            >
              <span
                style={{
                  fontSize: 'var(--tcms-font-size-xs)',
                  color: 'var(--tcms-text-muted)',
                  minWidth: 60,
                }}
              >
                {c.name}
              </span>
              <input
                className={styles.cellInput}
                disabled={!canEdit}
                value={shades[c.id] ?? ''}
                aria-label={`${role} shade for ${c.name}`}
                onChange={(e) => setShades((prev) => ({ ...prev, [c.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </td>
      {canEdit && (
        <td>
          <Button variant="primary" onClick={save} loading={saving}>
            Save
          </Button>
        </td>
      )}
    </tr>
  );
}
