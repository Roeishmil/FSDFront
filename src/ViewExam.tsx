import React, { useEffect, useState, useRef } from "react";
import api, {examApi} from "./api";

const ViewExam: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    examApi.creatExam()
      .then((response) => {
        return response;
      })
      .then((data) => {
        // Create a temporary DOM element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data;
        
        // Remove the script tag to prevent toggleAnswer function from being defined
        const scriptTags = tempDiv.querySelectorAll('script');
        scriptTags.forEach(script => script.remove());
        
        // Modify all show-answer buttons
        const buttons = tempDiv.querySelectorAll('.show-answer-btn');
        buttons.forEach(button => {
          const onclickAttr = button.getAttribute('onclick');
          if (onclickAttr) {
            const match = onclickAttr.match(/toggleAnswer\('([^']+)'\)/);
            if (match && match[1]) {
              button.setAttribute('data-answer-id', match[1]);
            }
            button.removeAttribute('onclick');
          }
        });
        
        // Get the cleaned HTML content
        setHtmlContent(tempDiv.innerHTML);
      })
      .catch(() => {
        setError(true);
      });
  }, []);

  // Use event delegation for better performance and reliability
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('show-answer-btn')) {
        e.preventDefault();
        
        const answerId = target.getAttribute('data-answer-id');
        if (answerId) {
          const answerElement = document.getElementById(answerId);
          if (answerElement) {
            // Toggle display
            answerElement.style.display = 
              answerElement.style.display === "block" ? "none" : "block";
          }
        }
      }
    };
    
    container.addEventListener('click', handleClick);
    
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [htmlContent]);

  if (error) {
    return <div>Failed to load the exam content. Please try again later.</div>;
  }

  return (
    <div ref={containerRef}>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default ViewExam;