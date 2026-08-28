import { FaRobot, FaMicrochip, FaNetworkWired, FaBolt } from "react-icons/fa";
import styles from "./RoboticBackground.module.css";

// Shared dark/circuit backdrop used on the role-select gate and every
// role's login page so the entry flow reads as one consistent screen.
const RoboticBackground = () => (
  <>
    <div className={styles.base} aria-hidden="true" />
    <div className={styles.grid} aria-hidden="true" />
    <div className={styles.scanline} aria-hidden="true" />
    <FaRobot className={styles.botIcon} style={{ top: "8%", left: "6%", fontSize: "5rem", animationDelay: "0s" }} aria-hidden="true" />
    <FaMicrochip className={styles.botIcon} style={{ top: "68%", left: "4%", fontSize: "4rem", animationDelay: "-3s" }} aria-hidden="true" />
    <FaNetworkWired className={styles.botIcon} style={{ top: "10%", right: "6%", fontSize: "4.5rem", animationDelay: "-6s" }} aria-hidden="true" />
    <FaBolt className={styles.botIcon} style={{ bottom: "8%", right: "8%", fontSize: "3.5rem", animationDelay: "-2s" }} aria-hidden="true" />
  </>
);

export default RoboticBackground;
