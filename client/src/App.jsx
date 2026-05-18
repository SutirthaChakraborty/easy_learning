import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import SubjectPage from "./pages/SubjectPage";
import GamesPage from "./pages/GamesPage";
import ListenModule from "./pages/modules/ListenModule";
import ReadModule from "./pages/modules/ReadModule";
import WriteModule from "./pages/modules/WriteModule";
import SpeakModule from "./pages/modules/SpeakModule";
import SpellingGame from "./pages/games/SpellingGame";
import MemoryGame from "./pages/games/MemoryGame";
import PuzzleGame from "./pages/games/PuzzleGame";
import Login from "./pages/Login";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/subject/:subject" element={<SubjectPage />} />
        <Route path="/module/listen/:subject" element={<ListenModule />} />
        <Route path="/module/read/:subject" element={<ReadModule />} />
        <Route path="/module/write/:subject" element={<WriteModule />} />
        <Route path="/module/speak/:subject" element={<SpeakModule />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/spelling" element={<SpellingGame />} />
        <Route path="/games/memory" element={<MemoryGame />} />
        <Route path="/games/puzzle" element={<PuzzleGame />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ paddingTop: "80px", flex: 1, display: "flex", flexDirection: "column" }}>
          <AnimatedRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
