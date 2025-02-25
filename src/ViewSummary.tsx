import React, { useEffect, useState, useRef } from "react";

const ViewSummary: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("../public/summary.html")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load summary file");
        }
        return response.text();
      })
      .then((data) => {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;
        
        // Remove script tags to prevent inline JS execution issues
        const scriptTags = tempDiv.querySelectorAll("script");
        scriptTags.forEach(script => script.remove());
        
        // Get the cleaned HTML content
        setHtmlContent(tempDiv.innerHTML);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  if (error) {
    return <div>Failed to load the summary content. Please try again later.</div>;
  }

  return (
    <div ref={containerRef}>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default ViewSummary;
