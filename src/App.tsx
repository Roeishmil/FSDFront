import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/RegistrationPage/LoginPage";
import Sidenav from "./components/Sidenav/Sidenav";
import AppStyle from "./App.module.css";
import UserProfile from "./components/UserProfile/UserProfile";
import SignUpPage from "./components/RegistrationPage/SignUpPage";
import ViewExam from "./ViewExam";
import ViewSummary from "./ViewSummary";
import { useEffect, useState } from "react";
import useUser from "./hooks/useUser";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileUpload from "./components/FileUpload/FileUpload"; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  return (
    <Router>
      <div className={AppStyle.container}>
        {isAuthenticated && (
          <div className={AppStyle.sidenav}>
            <Sidenav />
          </div>
        )}
        <div className={isAuthenticated ? AppStyle.authenticatedMain : AppStyle.unauthenticatedMain}>
          <Routes>
            {isAuthenticated ? (
              <>
                <Route path="/" element={<UserProfile />} />
                <Route path="/test" element={<ViewExam />} />
                <Route path="/summary" element={<ViewSummary />} />
                <Route path="/upload" element={<FileUpload />} /> 
              </>
            ) : (
              <>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/SignUp" element={<SignUpPage />} />
              </>
            )}
          </Routes>
        </div>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
