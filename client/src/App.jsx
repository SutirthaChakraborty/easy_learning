import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';

// Add new routes here as the app grows
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Example: <Route path="/learn" element={<Learn />} /> */}
      </Routes>
    </>
  );
}

export default App;
