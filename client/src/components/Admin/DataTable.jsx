import styles from "./AdminUI.module.css";

export default function DataTable({ columns, rows, actions, emptyMsg }) {
  if (!rows.length) return <p className={styles.empty}>{emptyMsg}</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key] || "—"}</td>)}
              {actions && (
                <td>
                  <div className={styles.rowActions}>
                    {actions.map((a, i) => (
                      <button key={i} className={a.variant === "delete" ? styles.deleteBtn : styles.viewBtn} title={a.title} onClick={() => a.onClick(row)}>
                        {a.icon}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
