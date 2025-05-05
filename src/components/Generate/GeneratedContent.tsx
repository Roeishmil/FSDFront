import React, { useState } from "react";
import styles from "./GeneratedContent.module.css";

type ContentItem = {
  id: string;
  title: string;
  date: string;
  type: "Test" | "Summary";
  subject?: string;
};

const mockData: ContentItem[] = [
  { id: "1", title: "fdfdf", date: "Apr 9, 2025", type: "Test", subject: "test" },
  { id: "2", title: "1", date: "Apr 9, 2025", type: "Summary" },
  { id: "3", title: "1-s2.0...", date: "Apr 9, 2025", type: "Summary" },
];

const GeneratedContent: React.FC = () => {
  const [filter, setFilter] = useState<"All" | "Test" | "Summary">("All");
  const [search, setSearch] = useState("");

  const filtered = mockData.filter(
    (item) => (filter === "All" || item.type === filter) && item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.generatedContent}>
      <div className={styles.header}>
        <h2>Generated Content</h2>
        <div className={styles.actions}>
          <button className={styles.blackButton}>Generate Summary</button>
          <button className={styles.blackButton}>Create Test</button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {["All", "Summary", "Test"].map((t) => (
            <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t as any)}>
              {t === "All" ? "All Content" : t + "s"}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className={styles.cards}>
        {filtered.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{item.title}</strong>
              <span>{item.date}</span>
            </div>
            <div className={styles.cardTags}>
              {item.subject && <span className={styles.tag}>{item.subject}</span>}
              <span className={styles.tag}>{item.type}</span>
            </div>
            <button className={styles.viewButton}>👁 View Content</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedContent;
