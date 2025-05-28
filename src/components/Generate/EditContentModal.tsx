import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";
import ContentModal from "./ContentModal";
import { ContentItem } from "./types";
import { Share2, X } from "lucide-react";
import { useSubject } from "../../hooks/useSubject";

const EditContentModal = ({
  item,
  onClose,
  onSave,
}: {
  item: ContentItem;
  onClose: () => void;
  onSave: (updated: ContentItem) => void;
}) => {
  const [title, setTitle] = useState(item.title);
  const [subject, setSubject] = useState(item.subject);
  const [shared, setShared] = useState(item.shared);
  const { subjects } = useSubject();

  const handleSubmit = () => {
    onSave({ ...item, title, subject, shared });
    onClose();
  };

  return (
    <div className={styles.modalOverlayEdit}>
      <div className={styles.modalEdit}>
        <div className={styles.modalHeaderEdit}>
          <h3>Edit Content</h3>
          <button className={styles.closeButtonEdit} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBodyEdit}>
          <label>
            Title:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>Subject:</label>
          <select className={styles.subjectInput} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject…</option>
            {subjects &&
              subjects.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
          </select>
          <label className={styles.checkboxRowEdit}>
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            <span>Shared</span>
          </label>
        </div>
        <div className={styles.modalFooterEdit}>
          <button className={styles.saveButtonEdit} onClick={handleSubmit}>
            Save
          </button>
          <button className={styles.cancelButtonEdit} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditContentModal;
