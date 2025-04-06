import React, { useEffect, useState, useRef } from "react";
import { summaryApi } from "./api";

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

const ViewSummary: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1) Fetch the summary HTML
  useEffect(() => {
    summaryApi
      .creatSummary()
      .then((data: string) => {
        setLoading(false);
        setError(null);
        setHtmlContent(data);
      })
      .catch((err) => {
        console.error("Failed to load summary:", err);
        setError("Failed to load the summary content. Please try again later.");
        setLoading(false);
      });
  }, []);

  // 2) Once we have the HTML, inject it and re-run any <script> tags
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    containerRef.current.innerHTML = htmlContent;

    const scriptTags = containerRef.current.querySelectorAll("script");
    scriptTags.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.text = oldScript.text;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent]);

  if (loading) {
    return <Loader message="Loading summary..." />;
  }
  if (error) {
    return <div>{error}</div>;
  }

  // 3) The container shows the entire summary page (including button logic)
  return <div ref={containerRef} />;
};

export default ViewSummary;
