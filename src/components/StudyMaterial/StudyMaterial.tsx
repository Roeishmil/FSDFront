import React from "react";
import { useNavigate } from "react-router-dom";
import "./StudyMaterial.css"; // ensure the path is correct

const StudyMetatrails: React.FC = () => {
  const navigate = useNavigate();

  const handleTestClick = () => {
    // Navigate to the exam generate screen
    navigate("/generate-test");
  };

  const handleSummaryClick = () => {
    // Navigate to the summary generate screen
    navigate("/generate-summary");
  };

  return (
    <div className="study-container">
      <div className="button-container">
        <button className="study-button" onClick={handleTestClick}>
          Tests
        </button>
        <button className="study-button" onClick={handleSummaryClick}>
          Summary
        </button>
      </div>
    </div>
  );
};

export default StudyMetatrails;
