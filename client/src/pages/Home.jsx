import * as FramerMotion from "framer-motion";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero/Hero";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (user === undefined) return; // still resolving auth — do nothing
    if (!user) {
      e.stopPropagation();
      navigate("/login?role=student");
    }
  };

  return (
    <>
      <SEO
        title="Learningo Home | Continue Your Learning Adventure"
        description="Jump back into gamified English, Maths and Science practice on Learningo — pick up where you left off or start a new adventure."
        path="/home"
      />
      <VideoBackground />
      <FramerMotion.motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80 }}
        transition={{ duration: 0.4 }}
        onClickCapture={handleClick}
      >
        <Hero />
      </FramerMotion.motion.div>
    </>
  );
};

export default Home;