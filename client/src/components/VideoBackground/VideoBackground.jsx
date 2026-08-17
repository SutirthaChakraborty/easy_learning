import { useEffect, useState } from "react";
import styles from "./VideoBackground.module.css";
import laptopVideo from "../../assets/videos/bg-laptop.mp4";
import tabletVideo from "../../assets/videos/bg-tab.mp4";
import mobileVideo from "../../assets/videos/bg-mobile.mp4";

// Same breakpoints used elsewhere in the app (Navbar mobile collapse / Hero large-desktop)
const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(max-width: 1199px)";

function getSource() {
  if (typeof window === "undefined") return laptopVideo;
  if (window.matchMedia(MOBILE_QUERY).matches) return mobileVideo;
  if (window.matchMedia(TABLET_QUERY).matches) return tabletVideo;
  return laptopVideo;
}

// Fixed, full-viewport background video that swaps source as the viewport
// crosses the mobile/tablet/laptop breakpoints. Purely decorative — no
// pointer events, no effect on page layout or functionality.
const VideoBackground = () => {
  const [src, setSrc] = useState(getSource);

  useEffect(() => {
    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const tabletMql = window.matchMedia(TABLET_QUERY);
    const update = () => setSrc(getSource());

    mobileMql.addEventListener("change", update);
    tabletMql.addEventListener("change", update);
    return () => {
      mobileMql.removeEventListener("change", update);
      tabletMql.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <video
        key={src}
        className={styles.video}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={styles.overlay} />
    </div>
  );
};

export default VideoBackground;
