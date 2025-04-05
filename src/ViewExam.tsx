import React, { useEffect, useState, useRef } from "react";
import { examApi } from "./api";

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

const ViewExam: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchExam = () => {
    examApi
      .creatExam()
      .then((data: string) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;
        // Remove script tags for safety
        const scriptTags = tempDiv.querySelectorAll("script");
        scriptTags.forEach((script) => script.remove());
        setHtmlContent(tempDiv.innerHTML);
        setLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error("Failed to load exam:", err);
        setError("Failed to load the exam content. Please try again later.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExam();
  }, []);

  // Disable all interactions while loading
  useEffect(() => {
    if (loading) {
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.pointerEvents = "auto";
    }
    return () => {
      document.body.style.pointerEvents = "auto";
    };
  }, [loading]);

  // Optional event delegation for dynamic button clicks (for toggling answers)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("show-answer-btn")) {
        e.preventDefault();
        const answerId = target.getAttribute("data-answer-id");
        if (answerId) {
          const answerElement = document.getElementById(answerId);
          if (answerElement) {
            answerElement.style.display =
              answerElement.style.display === "block" ? "none" : "block";
          }
        }
      }
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [htmlContent]);

  if (loading) {
    return <Loader message="Loading exam..." />;
  }
  if (error) {
    return <div>{error}</div>;
  }
  return (
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
};

export default ViewExam;
