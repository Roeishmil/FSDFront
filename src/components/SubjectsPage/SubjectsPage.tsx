import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";

/* ⬇ icons for the fancy buttons / badges */
import { Plus, Pencil, Trash2, FileText, Sparkles } from "lucide-react";

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
   Component
   ──────────────────────────── */
const SubjectsPage: FC = () => {
  /*  state  */
  const [subjects, setSubjects]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);

  /*  modal / edit  */
  const [isModalOpen,   setIsModalOpen] = useState(false);
  const [isEditMode,    setIsEditMode]  = useState(false);
  const [currentSubject,setCurrentSubject] = useState<any | null>(null);

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

  const handleEdit = (subject: any) => {
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
          ADD / EDIT MODAL (unchanged)
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
    </div>
  );
};

export default SubjectsPage;
