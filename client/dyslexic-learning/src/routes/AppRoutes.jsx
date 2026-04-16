import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Pages
import Home from '../pages/Home/Home';
import Games from '../pages/Games/Games';
import Stories from '../pages/Stories/Stories';
import Practice from '../pages/Practice/Practice';
import Dashboard from '../pages/Dashboard/Dashboard';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.GAMES} element={<Games />} />
        <Route path={ROUTES.STORIES} element={<Stories />} />
        <Route path={ROUTES.PRACTICE} element={<Practice />} />
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
