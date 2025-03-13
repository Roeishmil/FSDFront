import React, { useState } from 'react'
import useUser from "../src/hooks/useUser";
import { useEffect } from "react";



import Header from './Header';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './components/RegistrationPage/LoginPage';
import SignUpPage from './components/RegistrationPage/SignUpPage';
import UserProfile from './components/UserProfile/UserProfile';

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
            <Header />
        )}
        <div>
          <Routes>
            {isAuthenticated ? (
              <>
                <Route path="/" />
                <Route path="/profile" element={<UserProfile />} />

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
      </div>
    </Router>
  );
}

export default App;

