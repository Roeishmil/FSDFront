import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { useSubject } from "../../hooks/useSubject";
import ContentModal from "./ContentModal";

/* ⬇ icons for the fancy buttons / badges */
import { Plus, Pencil, Trash2, FileText, Sparkles, Eye } from "lucide-react";

import { subjectsApi, contentApi } from "../../api";
import useUser from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";

/* ────────────────────────────
   ZOD validation + form types
   ──────────────────────────── */
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

/* ────────────────────────────
   Interface definitions
   ──────────────────────────── */
interface Subject {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  testCount?: number;
  summaryCount?: number;
  tests?: any[];
  summaries?: any[];
}

type ContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  subjectTitle?: string;
  content?: string; // HTML content
};

const SubjectContentViewer: FC<{
  subject: Subject;
  onClose: () => void;
}> = ({ subject, onClose }) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<"All" | "Exam" | "Summary">("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(subject);
        setLoading(true);
        // Fetch content for this specific subject
        const allContent = await contentApi.fetchContent(user?._id, subject._id);
        console.log("User content:", allContent);

        // Normalize the content items
        const normalizedContent = allContent.map((item) => ({
          ...item,
          contentType:
            item.contentType === "summary" ? "Summary" : item.contentType === "Exam" ? "Exam" : item.contentType,
        }));

        setContentItems(normalizedContent);
        setError(null);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subject._id, user?._id]);

  // Apply filters to contentItems based on search and filter state
  const filteredContent = contentItems.filter((item) => {
    // First, apply contentType filter
    const typeMatches = filter === "All" || item.contentType === filter;

    // Then, apply search filter
    const searchMatches = item.title.toLowerCase().includes(search.toLowerCase());

    return typeMatches && searchMatches;
  });

  // Function to handle viewing content
  const handleViewContent = (item: ContentItem) => {
    setSelectedItem(item);
  };

  // Function to close the modal
  const closeContentModal = () => {
    setSelectedItem(null);
  };

  return (
    <div className={SubjectsPageStyle.subjectContentViewer}>
      <div className={SubjectsPageStyle.contentViewerHeader}>
        <h2>Content for {subject.title}</h2>
        <button className={SubjectsPageStyle.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={SubjectsPageStyle.contentActions}>
        <button className={SubjectsPageStyle.generateButton} onClick={() => navigate("/generate-summary")}>
          <Sparkles size={16} />
          Generate Summary
        </button>
        <button className={SubjectsPageStyle.generateButton} onClick={() => navigate("/generate-test")}>
          <FileText size={16} />
          Create Exam
        </button>
      </div>

      <div className={SubjectsPageStyle.filters}>
        <div className={SubjectsPageStyle.tabs}>
          <button className={`${filter === "All" ? SubjectsPageStyle.active : ""}`} onClick={() => setFilter("All")}>
            All Content
          </button>
          <button
            className={`${filter === "Summary" ? SubjectsPageStyle.active : ""}`}
            onClick={() => setFilter("Summary")}
          >
            Summaries
          </button>
          <button className={`${filter === "Exam" ? SubjectsPageStyle.active : ""}`} onClick={() => setFilter("Exam")}>
            Exams
          </button>
        </div>
        <input
          type="text"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={SubjectsPageStyle.searchInput}
        />
      </div>

      {loading ? (
        <div className={SubjectsPageStyle.loading}>Loading content...</div>
      ) : error ? (
        <div className={SubjectsPageStyle.error}>{error}</div>
      ) : filteredContent.length > 0 ? (
        <div className={SubjectsPageStyle.cards}>
          {filteredContent.map((item) => (
            <div key={item.id} className={SubjectsPageStyle.card}>
              <div className={SubjectsPageStyle.cardHeader}>
                <strong>{item.title}</strong>
                <span>{item.date}</span>
              </div>
              <div className={SubjectsPageStyle.cardTags}>
                {item.subjectTitle && <span className={SubjectsPageStyle.tag}>{item.subjectTitle}</span>}
                <span className={SubjectsPageStyle.tag}>{item.contentType}</span>
              </div>
              <button className={SubjectsPageStyle.viewButton} onClick={() => handleViewContent(item)}>
                <Eye size={14} />
                View Content
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={SubjectsPageStyle.noContent}>
          No content found for this subject. Try creating new content with the buttons above.
        </div>
      )}

      {/* Modal for displaying interactive HTML content */}
      {selectedItem && <ContentModal item={selectedItem} onClose={closeContentModal} />}
    </div>
  );
};

export default SubjectContentViewer;
