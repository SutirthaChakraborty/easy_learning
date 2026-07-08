import { MdSearch } from "react-icons/md";
import styles from "./AdminUI.module.css";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className={styles.searchBar}>
      <MdSearch />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
