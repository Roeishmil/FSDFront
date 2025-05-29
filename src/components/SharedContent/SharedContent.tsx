import React, { useState, useEffect } from "react";
import styles from "./SharedContent.module.css";
import SharedContentModal from "./SharedContentModal";
import { contentApi } from "../../api";
import { Eye } from "lucide-react";

type SharedContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  subjectTitle?: string;
  content?: string;
  user: {
    username: string;
    fullName: string;
    imgUrl?: string;
  };
};

const SharedContent: React.FC = () => {
  const [contentItems, setContentItems] = useState<SharedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SharedContentItem | null>(null);
  const [filter, setFilter] = useState<"All" | "Summary" | "Exam">("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const shared = await contentApi.fetchSharedContent();
        const normalized = shared.map((i: any) => ({
          ...i,
          contentType: i.contentType === "summary" ? "Summary" : i.contentType === "Exam" ? "Exam" : i.contentType,
        }));
        setContentItems(normalized);
        setError(null);
      } catch {
        setError("Failed to fetch shared content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredContent = contentItems.filter((item) => {
    const matchesType = filter === "All" || item.contentType === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className={styles.sharedContent}>
      <h2>Shared Content</h2>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {["All", "Summary", "Exam"].map((t) => (
            <button key={t} className={filter === t ? styles.active : ""} onClick={() => setFilter(t as any)}>
              {t === "All" ? "All Content" : `${t}s`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search shared content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
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
                <div className={styles.cardTitle}>
                  <strong>{c.title}</strong>
                  <span className={styles.cardDate}>{c.date}</span>
                </div>
                <div className={styles.cardUser}>
                  {c.user.imgUrl && <img src={c.user.imgUrl} alt="User" className={styles.userImage} />}
                  <span className={styles.username}>{c.user.fullName}</span>
                </div>
              </div>
              <div className={styles.cardTags}>
                {c.subjectTitle && <span className={styles.tag}>{c.subjectTitle}</span>}
                <span className={styles.tag}>{c.contentType}</span>
              </div>
              <button className={styles.viewButton} onClick={() => setSelectedItem(c)}>
                <Eye size={14} />
                View Content
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noContent}>No shared content found.</div>
      )}

      {selectedItem && <SharedContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

export default SharedContent;
