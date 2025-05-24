import React, { useState, useEffect, useRef } from "react";
import styles from "./SharedContent.module.css";
import SharedContentModal from "./SharedContentModal"
import { contentApi } from "../../api";

type SharedContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  content?: string;
  user: {
    username: string;
    fullName: string;
    imageUrl?: string;
  };
};

const SharedContent: React.FC = () => {
  const [contentItems, setContentItems] = useState<SharedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SharedContentItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const shared = await contentApi.fetchSharedContent();
        const normalized = shared.map((i: any) => ({
          ...i,
          contentType: i.contentType === "summary" ? "Summary" : i.contentType,
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

  return (
    <div className={styles.sharedContent}>
      <h2>Shared Content</h2>
      {loading ? (
        <div className={styles.loading}>Loading content...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : contentItems.length ? (
        <div className={styles.cards}>
          {contentItems.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <strong>{c.title}</strong>
                  <span className={styles.cardDate}>{c.date}</span>
                </div>
                <div className={styles.cardUser}>
                  {c.user.imageUrl && <img src={c.user.imageUrl} alt="User" className={styles.userImage} />}
                  <span className={styles.username}>{c.user.fullName}</span>
                </div>
              </div>
              <div className={styles.cardTags}>
                {c.subject && <span className={styles.tag}>{c.subject}</span>}
                <span className={styles.tag}>{c.contentType}</span>
              </div>
              <button className={styles.viewButton} onClick={() => setSelectedItem(c)}>
                👁 View Content
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
