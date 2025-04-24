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
import GenerateSummary from "./components/Generate/GenerateSummary";
import { useEffect, useState } from "react";
import useUser from "./hooks/useUser";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FileUpload from "./components/FileUpload/FileUpload"; 
import SubjectsPage from "./components/SubjectsPage/SubjectsPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setIsAuthenticated(!!user);
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
                <Route path="/study" element={<StudyMetatrails />} />
                {/* New generation screen routes */}
                <Route path="/generate-test" element={<GenerateExam />} />
                <Route path="/generate-summary" element={<GenerateSummary />} />
                {/* You can keep the legacy routes if needed, or remove them */}
                <Route path="/test" element={<ViewExam />} />
                <Route path="/summary" element={<ViewSummary />} />
                <Route path="/subjects" element={<SubjectsPage />} />
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
