import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api"; // adjust the path as needed

type ContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string; // Changed from "type" to "contentType"
  subject?: string;
  subjectId?: string;
  content?: string; // HTML content
};

// Modal component for displaying interactive HTML content
const ContentModal: React.FC<{
  item: ContentItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (item?.content && iframeRef.current) {
      // Get the iframe document
      const iframeDoc = iframeRef.current.contentDocument || 
                        (iframeRef.current.contentWindow?.document);
      
      if (iframeDoc) {
        // Write the HTML content to the iframe
        iframeDoc.open();
        iframeDoc.write(item.content);
        iframeDoc.close();
      }
    }
  }, [item?.content]);

  if (!item) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      // Close the modal when clicking the overlay (but not the content)
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{item.title}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {item.content ? (
            <iframe 
              ref={iframeRef}
              className={styles.contentIframe}
              title={item.title}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <p>No content available for this item.</p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <span className={styles.itemMeta}>
            {item.contentType} • {item.date}
          </span>
          <button className={styles.closeModalBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const GeneratedContent: React.FC = () => {
  const { subjectId } = useParams();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<"All" | "Exam" | "Summary">("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user') || '';
        const parsedData = JSON.parse(userData);
        console.log("Parsed user data:", parsedData);
        // Extract the ID
        const userId = parsedData._id;
        // Replace with your real API
        const allContent = await contentApi.fetchContent(userId);
        console.log("User content:", allContent);
        
        // Make sure the contentType field is correctly set on each item
        const normalizedContent = allContent.map(item => ({
          ...item,
          // Ensure contentType is exactly "Summary" or "Exam" (not lowercase, plural, etc.)
          contentType: item.contentType === "summary" ? "Summary" : 
                       item.contentType === "Exam" ? "Exam" : 
                       item.contentType
        }));
        
        const filtered = normalizedContent.filter((item) => item.subjectId === subjectId);
        console.log("Filtered content:", filtered);
        setContentItems(filtered);
        setError(null);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId]);

  // Apply filters to contentItems based on search and filter state
  const filteredContent = contentItems.filter(
    (item) => {
      // First, apply contentType filter
      const typeMatches = filter === "All" || item.contentType === filter;
      
      // Then, apply search filter
      const searchMatches = item.title.toLowerCase().includes(search.toLowerCase());
      
      console.log(`Item ${item.title} - ContentType: ${item.contentType}, Filter: ${filter}, Matches: ${typeMatches}`);
      
      return typeMatches && searchMatches;
    }
  );

  // Function to handle viewing content
  const handleViewContent = (item: ContentItem) => {
    setSelectedItem(item);
  };

  // Function to close the modal
  const closeModal = () => {
    setSelectedItem(null);
  };

  // Function to generate a new summary
  const handleGenerateContent = (contentType: "Summary" | "Exam") => {
    // Implementation placeholder for generating content
    console.log(`Generating new ${contentType}`);
    // This would call your API to create a new summary or Exam
  };

  return (
    <div className={styles.generatedContent}>
      <div className={styles.header}>
        <h2>Generated Content for {subjectId}</h2>
        <div className={styles.actions}>
          <button 
            className={styles.blackButton}
            onClick={() => handleGenerateContent("Summary")}
          >
            Generate Summary
          </button>
          <button 
            className={styles.blackButton}
            onClick={() => handleGenerateContent("Exam")}
          >
            Create Exam
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          <button 
            className={filter === "All" ? styles.active : ""} 
            onClick={() => setFilter("All")}
          >
            All Content
          </button>
          <button 
            className={filter === "Summary" ? styles.active : ""} 
            onClick={() => setFilter("Summary")}
          >
            Summaries
          </button>
          <button 
            className={filter === "Exam" ? styles.active : ""} 
            onClick={() => setFilter("Exam")}
          >
            Exams
          </button>
        </div>
        <input 
          type="text" 
          placeholder="Search content..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading content...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : filteredContent.length > 0 ? (
        <div className={styles.cards}>
          {filteredContent.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{item.title}</strong>
                <span>{item.date}</span>
              </div>
              <div className={styles.cardTags}>
                {item.subject && <span className={styles.tag}>{item.subject}</span>}
                <span className={styles.tag}>{item.contentType}</span>
              </div>
              <button 
                className={styles.viewButton}
                onClick={() => handleViewContent(item)}
              >
                👁 View Content
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noContent}>
          No content found for this subject. Try adjusting your filters or create new content.
        </div>
      )}

      {/* Modal for displaying interactive HTML content */}
      {selectedItem && (
        <ContentModal item={selectedItem} onClose={closeModal} />
      )}
    </div>
  );
};

export default GeneratedContent;