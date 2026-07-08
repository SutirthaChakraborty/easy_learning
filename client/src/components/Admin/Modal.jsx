import { useState } from "react";
import { MdClose } from "react-icons/md";
import styles from "./AdminUI.module.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

function validateField(f, value, form) {
  const isVisible = !f.showIf || f.showIf(form);
  if (!isVisible) return null;

  const strVal = typeof value === "string" ? value.trim() : value;
  const isEmpty = value === undefined || value === null || strVal === "" || (f.type === "file" && !value);

  if (f.required && isEmpty) return `${f.label} is required`;
  if (isEmpty) return null;

  if (f.type === "email" && !EMAIL_RE.test(strVal)) return "Enter a valid email address";
  if (f.type === "tel" && !PHONE_RE.test(strVal)) return "Enter a valid phone number";
  if (f.type === "number") {
    const n = Number(strVal);
    if (Number.isNaN(n)) return `${f.label} must be a number`;
    if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}`;
    if (f.max !== undefined && n > f.max) return `${f.label} must be at most ${f.max}`;
  }
  if (f.minLength && strVal.length < f.minLength) return `${f.label} must be at least ${f.minLength} characters`;
  if (f.maxLength && strVal.length > f.maxLength) return `${f.label} must be at most ${f.maxLength} characters`;
  return null;
}

function validateForm(fields, form) {
  const errors = {};
  fields.forEach((f) => {
    const err = validateField(f, form[f.key], form);
    if (err) errors[f.key] = err;
  });
  return errors;
}

export default function Modal({ title, fields, onSubmit, onClose, loading, serverError, initial, wide }) {
  const [form, setForm] = useState(initial || {});
  const [touched, setTouched] = useState({});
  const errors = validateForm(fields, form);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleBlur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fields.map((f) => [f.key, true])));
    if (Object.keys(errors).length > 0) return;
    onSubmit(form);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${wide ? styles.modalWide : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {fields.map((f) => {
            if (f.showIf && !f.showIf(form)) return null;
            const showError = touched[f.key] && errors[f.key];
            return (
              <div key={f.key} className={styles.modalField}>
                <label>{f.label}{f.required && " *"}</label>
                {f.type === "select" ? (
                  <select
                    value={form[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={() => handleBlur(f.key)}
                  >
                    <option value="" disabled>{f.placeholder || "Select…"}</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "file" ? (
                  <input
                    type="file"
                    accept={f.accept || "image/*"}
                    onChange={(e) => handleChange(f.key, e.target.files?.[0] || null)}
                    onBlur={() => handleBlur(f.key)}
                  />
                ) : (
                  <input
                    type={f.type === "tel" ? "text" : (f.type || "text")}
                    placeholder={f.placeholder || f.label}
                    value={form[f.key] || ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={() => handleBlur(f.key)}
                  />
                )}
                {showError && <span className={styles.fieldError}>{errors[f.key]}</span>}
              </div>
            );
          })}
          {serverError && <p className={styles.serverError}>{serverError}</p>}
          <button type="submit" className={styles.modalSubmit} disabled={loading || (Object.keys(touched).length > 0 && hasErrors)}>
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
