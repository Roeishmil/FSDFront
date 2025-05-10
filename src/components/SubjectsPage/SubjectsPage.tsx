import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { subjectsApi, contentApi } from "../../api";
import useUser from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Subject {
  _id: string;
  title: string;
  description?: string;
  userId: string;
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

// Modal component for displaying interactive HTML content
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

// Content viewer component for displaying a subject's content
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
        const allContent = await contentApi.fetchContent(user._id);
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
  }, [subject._id, user._id]);

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
          Generate Summary
        </button>
        <button 
          className={SubjectsPageStyle.generateButton}
          onClick={() => handleGenerateContent("Exam")}
        >
          Create Exam
        </button>
      </div>

      <div className={SubjectsPageStyle.filters}>
        <div className={SubjectsPageStyle.tabs}>
          <button 
            className={filter === "All" ? SubjectsPageStyle.active : ""} 
            onClick={() => setFilter("All")}
          >
            All Content
          </button>
          <button 
            className={filter === "Summary" ? SubjectsPageStyle.active : ""} 
            onClick={() => setFilter("Summary")}
          >
            Summaries
          </button>
          <button 
            className={filter === "Exam" ? SubjectsPageStyle.active : ""} 
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
                👁 View Content
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

const SubjectsPage: FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<Subject | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.fetchSubjects(user._id);
      setSubjects(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
      setError("Failed to fetch subjects. Please try again later.");
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && currentSubject) {
        // Update existing subject
        const updatedSubject = await subjectsApi.updateSubject(currentSubject._id, data);
        setSubjects((prev) => prev.map((subject) => (subject._id === currentSubject._id ? updatedSubject : subject)));
      } else {
        // Create new subject
        const newSubject = await subjectsApi.createSubject({ ...data, userId: user._id });
        setSubjects((prev) => [...prev, newSubject]);
      }
      reset();
      setIsModalOpen(false);
      setIsEditMode(false);
      setCurrentSubject(null);
    } catch (err) {
      console.error("Failed to save subject", err);
      setError("Failed to save subject. Please try again.");
    }
  };

  const handleEdit = (subject: Subject) => {
    setCurrentSubject(subject);
    setIsEditMode(true);
    setIsModalOpen(true);
    reset({ title: subject.title, description: subject.description });
  };

  const handleDelete = async (subjectId: string) => {
    try {
      await subjectsApi.deleteSubject(subjectId);
      setSubjects((prev) => prev.filter((subject) => subject._id !== subjectId));
    } catch (err) {
      console.error("Failed to delete subject", err);
      setError("Failed to delete subject. Please try again.");
    }
  };

  const handleAddSubject = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    reset({ title: "", description: "" }); // Reset all fields to empty
  };

  const handleViewContent = (subject: Subject) => {
    setViewingContent(subject);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className={SubjectsPageStyle.container}>
      <h1>Subjects</h1>
      <button className={SubjectsPageStyle.addButton} onClick={handleAddSubject}>
        Add Subject
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className={SubjectsPageStyle.error}>{error}</p>
      ) : (
        <ul className={SubjectsPageStyle.subjectList}>
          {subjects.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            subjects.map((subject) => (
              <li key={subject._id} className={SubjectsPageStyle.subjectItem}>
                <h3>{subject.title}</h3>
                <p>{subject.description || "No description provided"}</p>
                <button className={SubjectsPageStyle.viewButton} onClick={() => handleViewContent(subject)}>
                  View Content
                </button>
                <button className={SubjectsPageStyle.editButton} onClick={() => handleEdit(subject)}>
                  Edit
                </button>
                <button className={SubjectsPageStyle.deleteButton} onClick={() => handleDelete(subject._id)}>
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {isModalOpen && (
        <div className={SubjectsPageStyle.modal}>
          <div className={SubjectsPageStyle.modalContent}>
            <h2>{isEditMode ? "Edit Subject" : "Create Subject"}</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={SubjectsPageStyle.formGroup}>
                <label>Title:</label>
                <input type="text" {...register("title")} className={SubjectsPageStyle.inputField} />
                {formState.errors.title && <p className={SubjectsPageStyle.error}>{formState.errors.title.message}</p>}
              </div>
              <div className={SubjectsPageStyle.formGroup}>
                <label>Description:</label>
                <textarea {...register("description")} className={SubjectsPageStyle.inputField} />
              </div>
              <div className={SubjectsPageStyle.buttonGroup}>
                <button type="submit" className={SubjectsPageStyle.saveButton}>
                  Save
                </button>
                <button
                  type="button"
                  className={SubjectsPageStyle.cancelButton}
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setCurrentSubject(null);
                  }}
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