import React, { useState } from "react";
import "./GeneratedContent.module.css"; // נשתמש בקובץ CSS מותאם לסגנון

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
    <div className="generated-content">
      <div className="header">
        <h2>Generated Content</h2>
        <div className="actions">
          <button className="black-button">Generate Summary</button>
          <button className="black-button">Create Test</button>
        </div>
      </div>

      <div className="filters">
        <div className="tabs">
          {["All", "Summary", "Test"].map((t) => (
            <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t as any)}>
              {t === "All" ? "All Content" : t + "s"}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="cards">
        {filtered.map((item) => (
          <div key={item.id} className="card">
            <div className="card-header">
              <strong>{item.title}</strong>
              <span>{item.date}</span>
            </div>
            <div className="card-tags">
              {item.subject && <span className="tag">{item.subject}</span>}
              <span className="tag">{item.type}</span>
            </div>
            <button className="view-button">👁 View Content</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedContent;
