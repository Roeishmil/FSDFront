import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { useSubject } from "../../hooks/useSubject";
import SubjectContentViewer from "./SubjectContentViewer";

/* ⬇ icons for the fancy buttons / badges */
import { Plus, Pencil, Trash2, FileText, Sparkles, Eye } from "lucide-react";

import { subjectsApi } from "../../api";
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
  tests?: number;
  summaries?: number;
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
   Main Component
   ──────────────────────────── */
const SubjectsPage: FC = () => {
  /*  state  */
  const { subjects, setSubjects, loading, error, reloadSubject } = useSubject();
  const [viewingContent, setViewingContent] = useState<Subject | null>(null);

  /*  modal / edit  */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

  /*  helpers  */
  const { user } = useUser();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  /* ────────────────────────────
     Handlers (CRUD)
     ──────────────────────────── */
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
        setSubjects((prev) => prev.map((s) => (s._id === currentSubject._id ? updated : s)));
      } else {
        const created = await subjectsApi.createSubject({ ...data, userId: user?._id });
        setSubjects((prev) => [...prev, created]);
      }
      handleCloseModal();
      reloadSubject();
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

        <button className={SubjectsPageStyle.addButton} onClick={handleAddSubject}>
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
          {subjects?.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            subjects?.map((subject) => {
              /* front-end only numbers (fallback to 0) */
              const tests = (subject as any).testCount ?? (subject as any).tests ?? 0;
              const summaries = (subject as any).summaryCount ?? (subject as any).summaries ?? 0;

              return (
                <li key={subject._id} className={SubjectsPageStyle.subjectItem}>
                  {/* pastel strip */}
                  <div className={SubjectsPageStyle.accentBar} />

                  {/* title / desc */}
                  <div className={SubjectsPageStyle.subjectHeader}>
                    <h3>{subject.title}</h3>
                  </div>
                  <p className={SubjectsPageStyle.subjectDescription}>
                    {subject.description ? subject.description : "No description avilable"}
                  </p>

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
                    <button className={SubjectsPageStyle.viewButton} onClick={() => handleViewContent(subject)}>
                      <Eye size={18} />
                      Content
                    </button>
                    <button className={SubjectsPageStyle.editButton} onClick={() => handleEdit(subject)}>
                      <Pencil size={18} />
                      Edit
                    </button>
                    <button className={SubjectsPageStyle.deleteButton} onClick={() => handleDelete(subject._id)}>
                      <Trash2 size={18} />
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
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className={SubjectsPageStyle.modalContentSubject}>
            <h2>{isEditMode ? "Edit Subject" : "Add Subject"}</h2>

            <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className={SubjectsPageStyle.form}>
              <div className={SubjectsPageStyle.formGroup}>
                <label>Title</label>
                <input {...register("title")} className={SubjectsPageStyle.input} />
                {formState.errors.title && (
                  <span className={SubjectsPageStyle.error}>{formState.errors.title.message}</span>
                )}
              </div>

              <div className={SubjectsPageStyle.formGroup}>
                <label>Description</label>
                <textarea {...register("description")} className={SubjectsPageStyle.input} />
              </div>

              <div className={SubjectsPageStyle.modalActions}>
                <button type="submit" className={SubjectsPageStyle.saveButton}>
                  Save
                </button>
                <button type="button" className={SubjectsPageStyle.cancelButton} onClick={handleCloseModal}>
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
          <SubjectContentViewer subject={viewingContent} onClose={() => setViewingContent(null)} />
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
