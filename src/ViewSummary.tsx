import React, { useEffect, useState, useRef } from "react";
import { summaryApi } from "./api";

// Reusable loader component with an inline CSS spinner
const Loader: React.FC<{ message: string }> = ({ message }) => {
  return (
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
};

const ViewSummary: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSummary = (retryCount = 0) => {
    summaryApi
      .creatSummary()
      .then((data: string) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;
        // Remove script tags for security
        const scriptTags = tempDiv.querySelectorAll("script");
        scriptTags.forEach((script) => script.remove());
        setHtmlContent(tempDiv.innerHTML);
        setLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error("Failed to load the summary content:", err);
        if (retryCount < 1) {
          fetchSummary(retryCount + 1);
        } else {
          setError("Failed to load the summary content. Please try again later.");
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <Loader message="Loading summary..." />;
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default ViewSummary;
