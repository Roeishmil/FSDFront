import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";

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
  subjectId?: string;
  content?: string; // HTML content
};

/* ────────────────────────────
   Content Modal Component
   ──────────────────────────── */
   const ContentModal: FC<{
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
      <div className={SubjectsPageStyle.modalOverlay} onClick={(e) => {
        // Close the modal when clicking the overlay (but not the content)
        if (e.target === e.currentTarget) onClose();
      }}>
        <div className={SubjectsPageStyle.modalContent}>
          <div className={SubjectsPageStyle.modalHeader}>
            <h3>{item.title}</h3>
            <button className={SubjectsPageStyle.closeButton} onClick={onClose}>×</button>
          </div>
          <div className={SubjectsPageStyle.modalBody}>
            {item.content ? (
              <iframe 
                ref={iframeRef}
                className={SubjectsPageStyle.contentIframe}
                title={item.title}
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <p>No content available for this item.</p>
            )}
          </div>
          <div className={SubjectsPageStyle.modalFooter}>
            <span className={SubjectsPageStyle.itemMeta}>
              {item.contentType} • {item.date}
            </span>
            <button className={SubjectsPageStyle.closeModalBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

/* ────────────────────────────
   Subject Content Viewer Component
   ──────────────────────────── */
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
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          // Fetch content for this specific subject
          const allContent = await contentApi.fetchContent(user?._id);
          console.log("User content:", allContent);
          
          // Normalize the content items
          const normalizedContent = allContent.map(item => ({
            ...item,
            contentType: item.contentType === "summary" ? "Summary" : 
                        item.contentType === "Exam" ? "Exam" : 
                        item.contentType
          }));
          
          // Filter for only this subject's content
          const filtered = normalizedContent.filter((item) => item.subject === subject.title);
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
    }, [subject._id, user?._id]);
  
    // Apply filters to contentItems based on search and filter state
    const filteredContent = contentItems.filter(
      (item) => {
        // First, apply contentType filter
        const typeMatches = filter === "All" || item.contentType === filter;
        
        // Then, apply search filter
        const searchMatches = item.title.toLowerCase().includes(search.toLowerCase());
        
        return typeMatches && searchMatches;
      }
    );
  
    // Function to handle viewing content
    const handleViewContent = (item: ContentItem) => {
      setSelectedItem(item);
    };
  
    // Function to close the modal
    const closeContentModal = () => {
      setSelectedItem(null);
    };
  
    // Function to generate a new content item
    const handleGenerateContent = (contentType: "Summary" | "Exam") => {
      // Implementation placeholder for generating content
      console.log(`Generating new ${contentType} for subject ${subject.title}`);
      // This would call your API to create a new summary or Exam
    };
  
    return (
      <div className={SubjectsPageStyle.subjectContentViewer}>
        <div className={SubjectsPageStyle.contentViewerHeader}>
          <h2>Content for {subject.title}</h2>
          <button className={SubjectsPageStyle.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={SubjectsPageStyle.contentActions}>
          <button 
            className={SubjectsPageStyle.generateButton}
            onClick={() => handleGenerateContent("Summary")}
          >
            <Sparkles size={16} />
            Generate Summary
          </button>
          <button 
            className={SubjectsPageStyle.generateButton}
            onClick={() => handleGenerateContent("Exam")}
          >
            <FileText size={16} />
            Create Exam
          </button>
        </div>
  
        <div className={SubjectsPageStyle.filters}>
          <div className={SubjectsPageStyle.tabs}>
            <button 
              className={`${filter === "All" ? SubjectsPageStyle.active : ""}`}
              onClick={() => setFilter("All")}
            >
              All Content
            </button>
            <button 
              className={`${filter === "Summary" ? SubjectsPageStyle.active : ""}`}
              onClick={() => setFilter("Summary")}
            >
              Summaries
            </button>
            <button 
              className={`${filter === "Exam" ? SubjectsPageStyle.active : ""}`}
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
                  {item.subject && <span className={SubjectsPageStyle.tag}>{item.subject}</span>}
                  <span className={SubjectsPageStyle.tag}>{item.contentType}</span>
                </div>
                <button 
                  className={SubjectsPageStyle.viewButton}
                  onClick={() => handleViewContent(item)}
                >
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
        {selectedItem && (
          <ContentModal item={selectedItem} onClose={closeContentModal} />
        )}
      </div>
    );
  };
/* ────────────────────────────
   Main Component
   ──────────────────────────── */
const SubjectsPage: FC = () => {
  /*  state  */
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<Subject | null>(null);

  /*  modal / edit  */
  const [isModalOpen,   setIsModalOpen] = useState(false);
  const [isEditMode,    setIsEditMode]  = useState(false);
  const [currentSubject,setCurrentSubject] = useState<Subject | null>(null);

  /*  helpers  */
  const { user }             = useUser();
  const navigate             = useNavigate();
  const formRef              = useRef<HTMLFormElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  /* ────────────────────────────
     Fetch subjects once
     ──────────────────────────── */
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const data = await subjectsApi.fetchSubjects(user?._id);
        setSubjects(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [user?._id]);

  /* ────────────────────────────
     Handlers (CRUD)
     ──────────────────────────── */
  const handleAddSubject = () => {
    setIsEditMode(false);
    setCurrentSubject(null);
    setIsModalOpen(true);
    reset();
  };

  const handleEdit = (subject: Subject) => {
    setIsEditMode(true);
    setCurrentSubject(subject);
    setIsModalOpen(true);
    reset({ title: subject.title, description: subject.description });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await subjectsApi.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      alert(err.message ?? "Delete failed");
    }
  };

  const handleViewContent = (subject: Subject) => {
    setViewingContent(subject);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && currentSubject) {
        const updated = await subjectsApi.updateSubject(currentSubject._id, data);
        setSubjects((prev) =>
          prev.map((s) => (s._id === currentSubject._id ? updated : s))
        );
      } else {
        const created = await subjectsApi.createSubject({ ...data, userId: user?._id });
        setSubjects((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      alert(err.message ?? "Save failed");
    }
  };

  /* ────────────────────────────
     JSX
     ──────────────────────────── */
  return (
    <div className={SubjectsPageStyle.container}>
      {/* page header */}
      <div className={SubjectsPageStyle.pageHeader}>
        <h1 className={SubjectsPageStyle.pageTitle}>Subjects</h1>

        <button
          className={SubjectsPageStyle.addButton}
          onClick={handleAddSubject}
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      {/* main list */}
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className={SubjectsPageStyle.error}>{error}</p>
      ) : (
        <ul className={SubjectsPageStyle.subjectList}>
          {subjects.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            subjects.map((subject) => {
              /* front-end only numbers (fallback to 0) */
              const tests     = (subject as any).testCount     ?? (subject as any).tests?.length     ?? 0;
              const summaries = (subject as any).summaryCount  ?? (subject as any).summaries?.length ?? 0;

              return (
                <li
                  key={subject._id}
                  className={SubjectsPageStyle.subjectItem}
                >
                  {/* pastel strip */}
                  <div className={SubjectsPageStyle.accentBar} />

                  {/* title / desc */}
                  <div className={SubjectsPageStyle.subjectHeader}>
                    <h3>{subject.title}</h3>
                  </div>
                  {subject.description && (
                    <p className={SubjectsPageStyle.subjectDescription}>
                      {subject.description}
                    </p>
                  )}

                  {/* tests / summaries badges */}
                  <div className={SubjectsPageStyle.countsRow}>
                    <div className={SubjectsPageStyle.countBadge}>
                      <FileText size={14} />
                      <span>Tests:&nbsp;{tests}</span>
                    </div>
                    <div className={SubjectsPageStyle.countBadge}>
                      <Sparkles size={14} />
                      <span>Summaries:&nbsp;{summaries}</span>
                    </div>
                  </div>

                  {/* actions */}
                  <div className={SubjectsPageStyle.actionRow}>
                    <button
                      className={SubjectsPageStyle.viewButton}
                      onClick={() => handleViewContent(subject)}
                    >
                      <Eye size={14} />
                      View Content
                    </button>
                    <button
                      className={SubjectsPageStyle.editButton}
                      onClick={() => handleEdit(subject)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      className={SubjectsPageStyle.deleteButton}
                      onClick={() => handleDelete(subject._id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* ──────────────────────────────
          ADD / EDIT MODAL
         ────────────────────────────── */}
      {isModalOpen && (
        <div
          className={SubjectsPageStyle.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className={SubjectsPageStyle.modalContent}>
            <h2>{isEditMode ? "Edit Subject" : "Add Subject"}</h2>

            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className={SubjectsPageStyle.form}
            >
              <div className={SubjectsPageStyle.formGroup}>
                <label>Title</label>
                <input
                  {...register("title")}
                  className={SubjectsPageStyle.input}
                />
                {formState.errors.title && (
                  <span className={SubjectsPageStyle.error}>
                    {formState.errors.title.message}
                  </span>
                )}
              </div>

              <div className={SubjectsPageStyle.formGroup}>
                <label>Description</label>
                <textarea
                  {...register("description")}
                  className={SubjectsPageStyle.input}
                />
              </div>

              <div className={SubjectsPageStyle.modalActions}>
                <button
                  type="submit"
                  className={SubjectsPageStyle.saveButton}
                >
                  Save
                </button>
                <button
                  type="button"
                  className={SubjectsPageStyle.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Content Viewer */}
      {viewingContent && (
        <div className={SubjectsPageStyle.contentViewerOverlay}>
          <SubjectContentViewer 
            subject={viewingContent} 
            onClose={() => setViewingContent(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;