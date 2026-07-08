import * as FramerMotion from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaUserShield, FaCrown, FaChalkboardTeacher } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import styles from "./RoleSelect.module.css";
import logo from "/logo.png";

const roles = [
  {
    key: "student",
    icon: <FaUserGraduate />,
    title: "Student",
    description: "Access lessons, games, and track your learning progress.",
    color: "#4f8ef7",
    gradient: "linear-gradient(135deg, #1a3a6e 0%, #1e5799 100%)",
    route: "/login",
  },
  {
    key: "admin",
    icon: <MdAdminPanelSettings />,
    title: "Admin / Parents",
    description: "Monitor student progress and manage learning activities.",
    color: "#a259f7",
    gradient: "linear-gradient(135deg, #3b1a6e 0%, #6a1e99 100%)",
    route: "/admin-login",
  },
  {
    key: "teacher",
    icon: <FaChalkboardTeacher />,
    title: "Teacher",
    description: "View and manage the batches your admin has assigned to you.",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
    route: "/teacher-login",
  },
  {
    key: "superadmin",
    icon: <FaCrown />,
    title: "Super Admin",
    description: "Full platform control — manage users, content, and settings.",
    color: "#f7a825",
    gradient: "linear-gradient(135deg, #6e4a1a 0%, #99701e 100%)",
    route: "/superadmin-login",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" },
  }),
};

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.header}>
        <img src={logo} alt="Easy Learning" className={styles.logo} />
        <h1 className={styles.title}>Welcome to Easy Learning</h1>
        <p className={styles.subtitle}>Choose how you want to sign in</p>
      </div>

      <div className={styles.cards}>
        {roles.map((role, i) => (
          <FramerMotion.motion.div
            key={role.key}
            className={styles.card}
            style={{ background: role.gradient }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={i}
            whileHover={{ scale: 1.04, translateY: -6 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.iconWrap} style={{ color: role.color }}>
              {role.icon}
            </div>
            <h2 className={styles.roleTitle}>{role.title}</h2>
            <p className={styles.roleDesc}>{role.description}</p>
            <button
              className={styles.signInBtn}
              style={{ borderColor: role.color, color: role.color }}
              onClick={() => navigate(role.route)}
            >
              Sign In
            </button>
          </FramerMotion.motion.div>
        ))}
      </div>
      <p className={styles.copyright}>A product by ©ABC Company</p>
    </FramerMotion.motion.div>
  );
};

export default RoleSelect;
