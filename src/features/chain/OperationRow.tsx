import { useState } from 'react';
import type { Operation, OperationLineInput } from '../../api/operation.api';
import { Button } from '../../design-system/Button';
import styles from './Chain.module.css';

interface OperationRowProps {
  operation: Operation;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  saving: boolean;
  onSave: (input: Partial<OperationLineInput>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** One editable row of the Step 3 grid (FR-OP-01/02/04/06) — saves a field the moment it loses focus. */
export function OperationRow({
  operation,
  canEdit,
  isFirst,
  isLast,
  saving,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: OperationRowProps) {
  const [name, setName] = useState(operation.name);
  const [seamLengthCm, setSeamLengthCm] = useState(String(operation.seamLengthCm));
  const [reps, setReps] = useState(String(operation.reps));
  const [spi, setSpi] = useState(String(operation.spi));
  const [note, setNote] = useState(operation.note ?? '');

  function commit(field: keyof OperationLineInput, raw: string, current: unknown) {
    if (!canEdit) return;
    let value: string | number = raw;
    if (field === 'seamLengthCm' || field === 'reps' || field === 'spi') {
      value = Number(raw);
      if (Number.isNaN(value)) return;
    }
    if (value === current) return;
    onSave({ [field]: value } as Partial<OperationLineInput>);
  }

  return (
    <tr>
      <td className="tcms-numeric">{operation.sequence}</td>
      <td>
        <input
          className={styles.cellInput}
          value={name}
          disabled={!canEdit}
          aria-label={`Operation ${operation.sequence} name`}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commit('name', name, operation.name)}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          step="0.1"
          min="0.1"
          disabled={!canEdit}
          value={seamLengthCm}
          aria-label={`Operation ${operation.sequence} seam length in centimetres`}
          onChange={(e) => setSeamLengthCm(e.target.value)}
          onBlur={() => commit('seamLengthCm', seamLengthCm, operation.seamLengthCm)}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          step="1"
          min="1"
          disabled={!canEdit}
          value={reps}
          aria-label={`Operation ${operation.sequence} repetitions`}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => commit('reps', reps, operation.reps)}
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          type="number"
          step="1"
          min="4"
          max="30"
          disabled={!canEdit}
          value={spi}
          aria-label={`Operation ${operation.sequence} stitch density`}
          onChange={(e) => setSpi(e.target.value)}
          onBlur={() => commit('spi', spi, operation.spi)}
        />
      </td>
      <td className="tcms-numeric">{operation.lineSeamM.toFixed(4)}</td>
      <td>
        <input
          className={styles.cellInput}
          value={note}
          disabled={!canEdit}
          placeholder="Note"
          aria-label={`Operation ${operation.sequence} note`}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => commit('note', note, operation.note ?? '')}
        />
      </td>
      {canEdit && (
        <td>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={onMoveUp}
              disabled={isFirst || saving}
              aria-label="Move up"
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              onClick={onMoveDown}
              disabled={isLast || saving}
              aria-label="Move down"
            >
              ↓
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={saving}>
              Delete
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}
