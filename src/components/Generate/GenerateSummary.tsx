import React, { useState, useRef, useEffect } from "react";
import { summaryApi } from "../../api"; // adjust the path as needed

// Reusable loader component
const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
    }}
  >
    <style>{`
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
      .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
      }
    `}</style>
    <div className="spinner"></div>
    <p style={{ marginTop: "20px", fontSize: "1.1em" }}>{message}</p>
  </div>
);

const GenerateSummary: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Send custom prompt to the API call
      const data = await summaryApi.creatSummary(prompt);
      setHtmlContent(data);
    } catch (err) {
      console.error("Error generating summary:", err);
      
      // Provide a user-friendly error message
      if ((err as any).code === "ERR_NETWORK") {
        setError("Network error: The server is not responding. Please check your connection and try again.");
      } else if ((err as any).response?.status === 404) {
        setError("No input file found. Please upload a PDF or PPTX file first.");
      } else if ((err as any).response?.status === 500) {
        setError(`Server error: ${(err as any).response?.data?.message || "Failed to generate summary. Please try again."}`);
      } else {
        setError("Failed to generate summary. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset errors when prompt changes
  useEffect(() => {
    if (error) setError(null);
  }, [prompt]);

  // Once HTML is received, inject it and re-run its scripts:
  useEffect(() => {
    if (htmlContent && containerRef.current) {
      containerRef.current.innerHTML = htmlContent;
      
      // Execute any scripts in the HTML
      const scriptTags = containerRef.current.querySelectorAll("script");
      scriptTags.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.text = oldScript.text;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [htmlContent]);

  if (loading) {
    return <Loader message="Generating summary... This may take up to a minute." />;
  }

  if (htmlContent) {
    // Generated content is displayed by injecting the HTML
    return <div ref={containerRef} />;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Generate Summary</h2>
      
      {error && (
        <div style={{ 
          color: "white", 
          backgroundColor: "#d9534f", 
          padding: "12px", 
          borderRadius: "4px",
          marginBottom: "15px"
        }}>
          {error}
        </div>
      )}
      
      <p>
        Enter your custom summary prompt below or leave blank to use the default generator.
        Make sure you've uploaded a PDF file first.
      </p>
      
      <textarea
        placeholder="Enter your custom summary prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ 
          width: "100%", 
          height: "150px", 
          marginBottom: "15px", 
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc"
        }}
      />
      
      <button 
        onClick={handleGenerate}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Generate Summary
      </button>
    </div>
  );
};

export default GenerateSummary;