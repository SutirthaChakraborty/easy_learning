import { useState } from "react";
import { MdAttachFile, MdCheckCircle, MdSend } from "react-icons/md";
import styles from "./ContactForm.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent / Guardian" },
  { value: "admin", label: "Organization Admin" },
  { value: "teacher", label: "Teacher / Tutor" },
  { value: "other", label: "Other" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactForm({ fixedRole, defaultName = "", defaultEmail = "", defaultOrgName = "", onSuccess, compact = false }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState(fixedRole || "student");
  const [orgName, setOrgName] = useState(defaultOrgName);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address";
    if (!subject.trim() || subject.trim().length < 3) e.subject = "Subject must be at least 3 characters";
    if (!message.trim() || message.trim().length < 10) e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("role", role);
      form.append("orgName", orgName.trim());
      form.append("subject", subject.trim());
      form.append("message", message.trim());
      if (attachment) form.append("attachment", attachment);

      const r = await fetch(`${API}/api/contact`, { method: "POST", body: form });
      const data = await r.json();
      if (!data.success) {
        setServerError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
      setAttachment(null);
      onSuccess?.();
    } catch {
      setServerError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <MdCheckCircle className={styles.successIcon} />
        <h3>Message sent!</h3>
        <p>The Learningo team will get back to you soon.</p>
        <button className={styles.submitBtn} onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className={`${styles.form} ${compact ? styles.compact : ""}`} onSubmit={handleSubmit}>
      {!fixedRole && (
        <div className={styles.field}>
          <label>I am a</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Your Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>
        <div className={styles.field}>
          <label>Your Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>
      </div>
      <div className={styles.field}>
        <label>Organization (optional)</label>
        <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your school / organization" />
      </div>
      <div className={styles.field}>
        <label>Subject</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this about?" />
        {errors.subject && <span className={styles.error}>{errors.subject}</span>}
      </div>
      <div className={styles.field}>
        <label>Message</label>
        <textarea rows={compact ? 3 : 5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your question or issue…" />
        {errors.message && <span className={styles.error}>{errors.message}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.fileLabel}>
          <MdAttachFile /> {attachment ? attachment.name : "Attach a file (optional)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            hidden
          />
        </label>
      </div>
      {serverError && <p className={styles.serverError}>{serverError}</p>}
      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        <MdSend /> {submitting ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

export default ContactForm;
