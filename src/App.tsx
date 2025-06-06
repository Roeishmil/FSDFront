import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/RegistrationPage/LoginPage";
import Sidenav from "./components/Sidenav/Sidenav";
import AppStyle from "./App.module.css";
import UserProfile from "./components/UserProfile/UserProfile";
import SignUpPage from "./components/RegistrationPage/SignUpPage";
import ViewExam from "./ViewExam";
import ViewSummary from "./ViewSummary";
import StudyMetatrails from "./components/StudyMaterial/StudyMaterial";
import GenerateExam from "./components/Generate/GenerateExam";
import Generate from "./components/Generate/GeneratedContent";
import GenerateSummary from "./components/Generate/GenerateSummary";
import { useEffect, useState } from "react";
import useUser from "./hooks/useUser";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileUpload from "./components/FileUpload/FileUpload";
import SubjectsPage from "./components/SubjectsPage/SubjectsPage";
import SharedContent from "./components/SharedContent/SharedContent";
import NotificationsPage from "./components/NotificationsPage/Notifications";
import { IdleTimeoutProvider } from "./providers/IdleTimeoutProvider";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Check for logout message flag on mount
  useEffect(() => {
    const logoutFlag = localStorage.getItem('idleLogoutMessage');
    if (logoutFlag === 'true') {
      setShowLogoutMessage(true);
      // Don't remove the flag here - let user dismiss it manually
    }
  }, []);

  // Handle idle logout callback
  const handleIdleLogout = () => {
    // Set flag in localStorage so it persists across re-renders
    localStorage.setItem('idleLogoutMessage', 'true');
    setShowLogoutMessage(true);
  };

  // Handle dismissing the logout message
  const dismissLogoutMessage = () => {
    setShowLogoutMessage(false);
    localStorage.removeItem('idleLogoutMessage');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={AppStyle.container} style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className={AppStyle.container}>
        {/* Logout Notification - Persists across authentication states */}
        {showLogoutMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff6b6b',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            zIndex: 10001,
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            animation: 'slideInFromTop 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            maxWidth: '90vw'
          }}>
            <style>
              {`
                @keyframes slideInFromTop {
                  0% { 
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                  }
                  100% { 
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                  }
                }
              `}
            </style>
            <span>🔒 You have been signed out due to inactivity</span>
            <button
              onClick={dismissLogoutMessage}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {isAuthenticated ? (
          <IdleTimeoutProvider 
            timeoutMinutes={2} 
            showWarning={true} 
            warningMinutes={0.5}
            onIdle={handleIdleLogout}
          >
            <div className={AppStyle.sidenav}>
              <Sidenav />
            </div>
            <div className={AppStyle.authenticatedMain}>
              <Routes>
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/study" element={<StudyMetatrails />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/shared-content" element={<SharedContent />} />
                <Route path="/generate-test" element={<GenerateExam />} />
                <Route path="/generate-summary" element={<GenerateSummary />} />
                <Route path="/test" element={<ViewExam />} />
                <Route path="/summary" element={<ViewSummary />} />
                <Route path="/" element={<SubjectsPage />} />
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Routes>
            </div>
          </IdleTimeoutProvider>
        ) : (
          <div className={AppStyle.unauthenticatedMain}>
            <Routes>
              <Route 
                path="/" 
                element={<LoginPage showLogoutMessage={showLogoutMessage} onDismissLogoutMessage={dismissLogoutMessage} />} 
              />
              <Route 
                path="/login" 
                element={<LoginPage showLogoutMessage={showLogoutMessage} onDismissLogoutMessage={dismissLogoutMessage} />} 
              />
              <Route path="/SignUp" element={<SignUpPage />} />
            </Routes>
          </div>
        )}
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;