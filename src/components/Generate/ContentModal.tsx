import React, { useEffect, useRef } from "react";
import styles from "./GeneratedContent.module.css";
import { ContentItem } from "./types";

type Props = {
  item: ContentItem | null;
  onClose: () => void;
};

const ContentModal: React.FC<Props> = ({ item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (item?.content && iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(item.content);
        doc.close();
      }
    }
  }, [item?.content]);

  if (!item) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{item.title}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          {item.content ? (
            <iframe
              ref={iframeRef}
              className={styles.contentIframe}
              title={item.title}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <p>No content available for this item.</p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <span className={styles.itemMeta}>
            {item.contentType} • {item.date}
            {item.deleted && item.deletedAt && <> • Deleted: {new Date(item.deletedAt).toLocaleDateString()}</>}
          </span>
          <button className={styles.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentModal;
