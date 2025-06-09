import { FC, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { useSubject } from "../../hooks/useSubject";
import SubjectContentViewer from "./SubjectContentViewer";

/* icons */
import { Plus, Pencil, Trash2, FileText, Sparkles, Eye } from "lucide-react";

import { subjectsApi } from "../../api";
import useUser from "../../hooks/useUser";
import { useNavigate } from "react-router-dom";

/* ─── validation ─── */
const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

/* ─── types ─── */
interface Subject {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  testCount?: number;
  summaryCount?: number;
  tests?: number;
  summaries?: number;
}

/* ─── component ─── */
const SubjectsPage: FC = () => {
  const { subjects, setSubjects, loading, error, reloadSubject } = useSubject();

  const [viewingContent, setViewingContent] = useState<Subject | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

  const { user } = useUser();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  /* ── CRUD handlers ── */
  const handleAddSubject = () => {
    setIsEditMode(false);
    setCurrentSubject(null);
    setIsModalOpen(true);
    // Reset form with empty values to clear any previous data
    reset({ title: "", description: "" });
  };

  const handleEdit = (subject: Subject) => {
    setIsEditMode(true);
    setCurrentSubject(subject);
    setIsModalOpen(true);
    reset({ title: subject.title, description: subject.description || "" });
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Clear form state when closing modal
    reset({ title: "", description: "" });
    setCurrentSubject(null);
    setIsEditMode(false);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && currentSubject) {
        const updated = await subjectsApi.updateSubject(currentSubject._id, data);
        setSubjects((prev) =>
          prev.map((s) => (s._id === currentSubject._id ? updated : s))
        );
      } else {
        const created = await subjectsApi.createSubject({
          ...data,
          userId: user?._id,
        });
        setSubjects((prev) => [...prev, created]);
      }
      handleCloseModal();
      reloadSubject();
    } catch (err: any) {
      alert(err.message ?? "Save failed");
    }
  };

  /* ── JSX ── */
  return (
    <div className={SubjectsPageStyle.container}>
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

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className={SubjectsPageStyle.error}>{error}</p>
      ) : (
        <ul className={SubjectsPageStyle.subjectList}>
          {subjects?.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            subjects.map((subject) => {
              const tests =
                (subject as any).testCount ??
                (subject as any).tests?.length ??
                0;
              const summaries =
                (subject as any).summaryCount ??
                (subject as any).summaries?.length ??
                0;

              return (
                <li key={subject._id} className={SubjectsPageStyle.subjectItem}>
                  <div className={SubjectsPageStyle.accentBar} />

                  <div className={SubjectsPageStyle.subjectHeader}>
                    <h3>{subject.title}</h3>
                  </div>
                  <p className={SubjectsPageStyle.subjectDescription}>
                    {subject.description
                      ? subject.description
                      : "No description available"}
                  </p>

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

      {isModalOpen && (
        <div
          className={SubjectsPageStyle.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className={SubjectsPageStyle.modalContentSubject}>
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
                <button type="submit" className={SubjectsPageStyle.saveButton}>
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

      {viewingContent && (
        <div
          className={SubjectsPageStyle.contentViewerOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingContent(null);
          }}
        >
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