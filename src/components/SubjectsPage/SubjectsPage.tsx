import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { subjectsApi } from "../../api";
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

const SubjectsPage: FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
                <button className={SubjectsPageStyle.viewButton} onClick={() => navigate(`/generated/${subject._id}`)}>
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
    </div>
  );
};

export default SubjectsPage;
