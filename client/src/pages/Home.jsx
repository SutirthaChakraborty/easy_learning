import * as FramerMotion from "framer-motion";
import Hero from "../components/Hero/Hero";

const Home = () => {
  return (
    <FramerMotion.motion.div
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <Hero />
    </FramerMotion.motion.div>
  );
};

export default Home;