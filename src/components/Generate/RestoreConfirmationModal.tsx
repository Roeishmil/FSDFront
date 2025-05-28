import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./GeneratedContent.module.css";
import { ContentItem } from "./types";

/* ───── Restore Confirmation Modal ───── */
const RestoreConfirmationModal: React.FC<{
  item: ContentItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  if (!item) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3>Restore Content</h3>
        </div>
        <div className={styles.deleteModalBody}>
          <p>
            Are you sure you want to restore <strong>"{item.title}"</strong>?
          </p>
          <p>This content will be moved back to your active content.</p>
        </div>
        <div className={styles.deleteModalFooter}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.restoreButton} onClick={onConfirm}>
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreConfirmationModal;
