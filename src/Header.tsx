import React, { useState } from "react";
import ViewTest from "./ViewExam";
import ViewSummary from "./ViewSummary";

const Header: React.FC = () => {
  const [view, setView] = useState("");
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>My Application</h1>
      <button style={styles.button} onClick={() => setView("exam")}>See Exam</button>
      <button style={styles.button} onClick={() => setView("summary")}>See Summary</button>
      <button style={styles.button} onClick={() => setView("")}>Close</button>
      {view === "exam" ? <ViewTest /> : view === "summary" ? <ViewSummary /> : null}
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: "#2c3e50",
    padding: "15px",
    textAlign: "center" as "center",
  },
  title: {
    color: "white",
    margin: 0,
    fontSize: "24px",
  },
  button: {
    margin: "10px",
    padding: "10px 15px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default Header;