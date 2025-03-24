import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/RegistrationPage/LoginPage";
import Header from "./Header";
import ViewExam from "./ViewExam";
import ViewSummary from "./ViewSummary";
import UserProfile from "./components/UserProfile/UserProfile";
import SignUpPage from "./components/RegistrationPage/SignUpPage";
import { useEffect, useState } from "react";
import useUser from "./hooks/useUser";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
      <div>
        {isAuthenticated && (
          <div>
            <Header />
          </div>
        )}
        <div>
          <Routes>
            {isAuthenticated ? (
              <>
                <Route path="/" element={<UserProfile />} />
                <Route path="/exam" element={<ViewExam />} />
                <Route path="/summary" element={<ViewSummary />} />
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
