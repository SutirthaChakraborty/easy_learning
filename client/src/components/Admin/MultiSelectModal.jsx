import { useState } from "react";
import { MdClose } from "react-icons/md";
import MultiSelect from "./MultiSelect";
import styles from "./AdminUI.module.css";

export default function MultiSelectModal({ title, items, onConfirm, onClose, confirmLabel, loading, serverError, emptyMsg, searchPlaceholder }) {
  const [selectedIds, setSelectedIds] = useState([]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <MultiSelect
          items={items}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          searchPlaceholder={searchPlaceholder}
          emptyMsg={emptyMsg}
        />
        {serverError && <p className={styles.serverError}>{serverError}</p>}
        <button
          type="button"
          className={styles.modalSubmit}
          style={{ marginTop: 14 }}
          disabled={loading || selectedIds.length === 0}
          onClick={() => onConfirm(selectedIds)}
        >
          {loading ? "Saving…" : (confirmLabel || `Add Selected (${selectedIds.length})`)}
        </button>
      </div>
    </div>
  );
}
