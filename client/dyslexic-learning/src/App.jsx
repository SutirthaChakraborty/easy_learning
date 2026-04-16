import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProgressProvider } from './context/ProgressContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import AppRoutes from './routes/AppRoutes';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProgressProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </ProgressProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
