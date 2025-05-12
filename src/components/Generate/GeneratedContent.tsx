import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
<<<<<<< Updated upstream
import { contentApi } from "../../api"; // adjust the path as needed
=======
import { contentApi } from "../../api";
>>>>>>> Stashed changes

type ContentItem = {
  id: string;
  title: string;
  date: string;
<<<<<<< Updated upstream
  contentType: string; // Changed from "type" to "contentType"
  subject?: string;
  subjectId?: string;
  content?: string; // HTML content
};

// Modal component for displaying interactive HTML content
=======
  contentType: string;
  subject?: string;
  subjectId?: string;
  content?: string;
};

/* ───── Modal component (unchanged logic) ───── */
>>>>>>> Stashed changes
const ContentModal: React.FC<{
  item: ContentItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
<<<<<<< Updated upstream
  
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
=======

  useEffect(() => {
    if (item?.content && iframeRef.current) {
      const doc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(item.content);
        doc.close();
>>>>>>> Stashed changes
      }
    }
  }, [item?.content]);

  if (!item) return null;

  return (
<<<<<<< Updated upstream
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
=======
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{item.title}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {item.content ? (
            <iframe
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          <button className={styles.closeModalBtn} onClick={onClose}>Close</button>
=======
          <button className={styles.closeModalBtn} onClick={onClose}>
            Close
          </button>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user') || '';
        const parsedData = JSON.parse(userData);
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
=======
    (async () => {
      try {
        setLoading(true);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const userContent = await contentApi.fetchContent(stored._id);
        console.log("Fetched content:", stored)
        const normalized = userContent.map((i: any) => ({
          ...i,
          contentType:
            i.contentType === "summary"
              ? "Summary"
              : i.contentType === "Exam"
              ? "Exam"
              : i.contentType,
        }));
        setContentItems(normalized.filter((c: any) => c.subjectId === subjectId));
        setError(null);
      } catch {
>>>>>>> Stashed changes
        setError("Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
<<<<<<< Updated upstream
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
=======
    })();
  }, [subjectId]);

  const filteredContent = contentItems.filter((i) => {
    const matchesType = filter === "All" || i.contentType === filter;
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleGenerate = (type: "Summary" | "Exam") =>
    console.log(`Generating ${type}`);
>>>>>>> Stashed changes

  return (
    <div className={styles.generatedContent}>
      <div className={styles.header}>
        <h2>Generated Content for {subjectId}</h2>
        <div className={styles.actions}>
<<<<<<< Updated upstream
          <button 
            className={styles.blackButton}
            onClick={() => handleGenerateContent("Summary")}
          >
            Generate Summary
          </button>
          <button 
            className={styles.blackButton}
            onClick={() => handleGenerateContent("Exam")}
=======
          <button
            className={styles.blackButton}
            onClick={() => handleGenerate("Summary")}
          >
            Generate Summary
          </button>
          <button
            className={styles.blackButton}
            onClick={() => handleGenerate("Exam")}
>>>>>>> Stashed changes
          >
            Create Exam
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
<<<<<<< Updated upstream
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
=======
          {(["All", "Summary", "Exam"] as const).map((t) => (
            <button
              key={t}
              className={filter === t ? styles.active : ""}
              onClick={() => setFilter(t)}
            >
              {t === "All" ? "All Content" : `${t}s`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
>>>>>>> Stashed changes
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading content...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
<<<<<<< Updated upstream
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
=======
      ) : filteredContent.length ? (
        <div className={styles.cards}>
          {filteredContent.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <strong>{c.title}</strong>
                <span>{c.date}</span>
              </div>
              <div className={styles.cardTags}>
                {c.subject && <span className={styles.tag}>{c.subject}</span>}
                <span className={styles.tag}>{c.contentType}</span>
              </div>
              <button
                className={styles.viewButton}
                onClick={() => setSelectedItem(c)}
>>>>>>> Stashed changes
              >
                👁 View Content
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noContent}>
<<<<<<< Updated upstream
          No content found for this subject. Try adjusting your filters or create new content.
        </div>
      )}

      {/* Modal for displaying interactive HTML content */}
      {selectedItem && (
        <ContentModal item={selectedItem} onClose={closeModal} />
=======
          No content found for this subject.
        </div>
      )}

      {selectedItem && (
        <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
>>>>>>> Stashed changes
      )}
    </div>
  );
};

<<<<<<< Updated upstream
export default GeneratedContent;
=======
export default GeneratedContent;
>>>>>>> Stashed changes
