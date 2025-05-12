import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";

type ContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  subjectId?: string;
  content?: string;
};

/* ───── Modal component (unchanged logic) ───── */
const ContentModal: React.FC<{
  item: ContentItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (item?.content && iframeRef.current) {
      const doc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(item.content);
        doc.close();
      }
    }
  }, [item?.content]);

  if (!item) return null;


  return (
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
          <button className={styles.closeModalBtn} onClick={onClose}>
            Close
          </button>
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

  const navigate = useNavigate();

  const handleTestClick = () => {
    // Navigate to the exam generate screen
    navigate("/generate-test");
  };

  const handleSummaryClick = () => {
    // Navigate to the summary generate screen
    navigate("/generate-summary");
  };


  useEffect(() => {
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
        setError("Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId]);

  const filteredContent = contentItems.filter((i) => {
    const matchesType = filter === "All" || i.contentType === filter;
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleGenerate = (type: "Summary" | "Exam") =>
    console.log(`Generating ${type}`);

  return (
    <div className={styles.generatedContent}>
      <div className={styles.header}>
        <h2>Generated Content for {subjectId}</h2>
        <div className={styles.actions}>
          <button
            className={styles.blackButton}
            onClick={() => handleSummaryClick()}
          >
            Create Summary
          </button>
          <button
            className={styles.blackButton}
            onClick={() => handleTestClick()}
          >
            Create Exam
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
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
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading content...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
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
              >
                👁 View Content
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noContent}>
          No content found for this subject.
        </div>
      )}

      {selectedItem && (
        <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default GeneratedContent;
