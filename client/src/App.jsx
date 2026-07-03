import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Navbar from "./components/Navbar/Navbar";
import RoleSelect from "./pages/RoleSelect";
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
import ContactUs from "./pages/ContactUs";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/home" element={<Home />} />
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
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const location = useLocation();
  const hideNavbar = ["/", "/login", "/admin-login", "/superadmin-login", "/admin-dashboard", "/superadmin-dashboard"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div style={{ paddingTop: hideNavbar ? "0" : "80px", flex: 1, display: "flex", flexDirection: "column" }}>
        <AnimatedRoutes />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
