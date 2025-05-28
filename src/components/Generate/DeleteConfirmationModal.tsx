import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";
import ContentModal from "./ContentModal";
import { ContentItem } from "./types";
import { Eye, Pencil, Share2, X } from "lucide-react";
import EditContentModal from "./EditContentModal";

/* ───── Delete Confirmation Modal ───── */
const DeleteConfirmationModal: React.FC<{
  item: ContentItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  if (!item) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3>Delete Content</h3>
        </div>
        <div className={styles.deleteModalBody}>
          <p>
            Are you sure you want to delete <strong>"{item.title}"</strong>?
          </p>
          <p className={styles.deleteWarning}>This content will be moved to trash and can be restored later.</p>
        </div>
        <div className={styles.deleteModalFooter}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.deleteButton} onClick={onConfirm}>
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
};


export default DeleteConfirmationModal;

