import React, { useEffect, useState, useRef } from "react";
import { examApi } from "./api";

// Reusable loader component
const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}
  >
    <style>{`
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
      .spinner {
          width: 50px;
          height: 50px;
          border: 6px solid #ccc;
          border-top: 6px solid #1d72b8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
      }
    `}</style>
    <div className="spinner"></div>
    <p style={{ marginTop: "20px", fontSize: "1.2em", color: "#555" }}>
      {message}
    </p>
  </div>
);

const ViewExam: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1) Fetch the exam HTML
  useEffect(() => {
    examApi
      .creatExam()
      .then((data: string) => {
        setLoading(false);
        setError(null);
        // Save the raw HTML string
        setHtmlContent(data);
      })
      .catch((err) => {
        console.error("Failed to load exam:", err);
        setError("Failed to load the exam content. Please try again later.");
        setLoading(false);
      });
  }, []);

  // 2) Once we have the HTML, inject it and re-run any <script> tags
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    // Put the raw HTML into the container
    containerRef.current.innerHTML = htmlContent;

    // Find and re-inject all <script> tags so they execute
    const scriptTags = containerRef.current.querySelectorAll("script");
    scriptTags.forEach((oldScript) => {
      const newScript = document.createElement("script");
      // Copy over any attributes (e.g. src, type)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copy inline script text
      newScript.text = oldScript.text;
      // Replace old script with the new one
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent]);

  if (loading) {
    return <Loader message="Loading exam..." />;
  }
  if (error) {
    return <div>{error}</div>;
  }

  // 3) The container shows the entire exam page (including button logic)
  return <div ref={containerRef} />;
};

export default ViewExam;
