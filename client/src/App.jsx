import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Background3D from "./components/Background3D/Background3D";
import Navbar from "./components/Navbar/Navbar";
import RoleSelect from "./pages/RoleSelect";
import Home from "./pages/Home";
import SubjectPage from "./pages/SubjectPage";
import ListenModule from "./pages/modules/ListenModule";
import ReadModule from "./pages/modules/ReadModule";
import WriteModule from "./pages/modules/WriteModule";
import SpeakModule from "./pages/modules/SpeakModule";
import GamesPage from "./pages/GamesPage";
import ARHub from "./ar/pages/ARHub";
import ARGame from "./ar/pages/ARGame";
import ARInsights from "./ar/pages/ARInsights";
import Login from "./pages/Login";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import TeacherLogin from "./pages/TeacherLogin";
import ParentLogin from "./pages/ParentLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ParentDashboard from "./pages/parent/ParentDashboard";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/home" element={<Home />} />
        <Route path="/subject/:subject" element={<SubjectPage />} />
        <Route path="/module/listen/:subject" element={<ListenModule />} />
        <Route path="/module/read/:subject" element={<ReadModule />} />
        <Route path="/module/write/:subject" element={<WriteModule />} />
        <Route path="/module/speak/:subject" element={<SpeakModule />} />
        <Route path="/games" element={<GamesPage />} />
        {/* Camera (MediaPipe) games. `/games/ar/insights` is matched before the
            :gameId route so it cannot be swallowed as a game id. */}
        <Route path="/games/ar" element={<ARHub />} />
        <Route path="/games/ar/insights" element={<ARInsights />} />
        <Route path="/games/ar/:gameId" element={<ARGame />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/parent-login" element={<ParentLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const location = useLocation();
  // An active camera session (gameplay itself, or the calibration/insights
  // screens that run alongside it) owns the whole viewport: it must not
  // scroll, and a navbar above it would be a target a child reaches into by
  // accident. The Camera Games hub is just a menu, so it keeps the normal
  // site header and background like any other page.
  const isAR = location.pathname.startsWith("/games/ar/");
  const hideNavbar = isAR || ["/", "/login", "/admin-login", "/superadmin-login", "/teacher-login", "/parent-login", "/admin-dashboard", "/superadmin-dashboard", "/teacher-dashboard", "/parent-dashboard"].includes(location.pathname);
  // Home, About Us, Contact Us, the question modules and the games pages all get the
  // same full-viewport video background, and the role-select gate + every login page
  // share the RoboticBackground instead of the 3D brick scene
  const hideBackground3D = isAR || [
    "/", "/home", "/about-us", "/contact-us",
    "/login", "/admin-login", "/superadmin-login", "/teacher-login", "/parent-login",
  ].includes(location.pathname)
    || location.pathname.startsWith("/module/");

  return (
    <>
      {!hideBackground3D && <Background3D />}
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
