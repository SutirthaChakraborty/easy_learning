import { useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import styles from "./AdminUI.module.css";

export default function MultiSelect({ items, selectedIds, onChange, searchPlaceholder, emptyMsg }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.sublabel?.toLowerCase().includes(q));
  }, [items, search]);

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className={styles.multiSelect}>
      <div className={styles.multiSelectSearch}>
        <MdSearch />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder || "Search…"} />
      </div>
      <div className={styles.multiSelectList}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>{emptyMsg || "No results"}</p>
        ) : (
          filtered.map((item) => (
            <label key={item.id} className={styles.multiSelectItem}>
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              <div className={styles.multiSelectLabel}>
                <strong>{item.label}</strong>
                {item.sublabel && <span>{item.sublabel}</span>}
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
