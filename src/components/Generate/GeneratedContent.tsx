import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";
import { Share2 } from "lucide-react";

type ContentItem = {
  id: string;
  title: string;
  date: string;
  contentType: string;
  subject?: string;
  subjectId?: string;
  content?: string;
  deleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
};

/* ───── Delete Confirmation Modal ───── */
const DeleteConfirmationModal: React.FC<{
  item: ContentItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  if (!item) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3>Delete Content</h3>
        </div>
        <div className={styles.deleteModalBody}>
          <p>Are you sure you want to delete <strong>"{item.title}"</strong>?</p>
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

/* ───── Restore Confirmation Modal ───── */
const RestoreConfirmationModal: React.FC<{
  item: ContentItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, onConfirm, onCancel }) => {
  if (!item) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3>Restore Content</h3>
        </div>
        <div className={styles.deleteModalBody}>
          <p>Are you sure you want to restore <strong>"{item.title}"</strong>?</p>
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

/* ───── Modal component (unchanged logic) ───── */
const ContentModal: React.FC<{
  item: ContentItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
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
            {item.deleted && item.deletedAt && (
              <> • Deleted: {new Date(item.deletedAt).toLocaleDateString()}</>
            )}
          </span>
          <button className={styles.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const GeneratedContent: React.FC = () => {
  const { subjectId } = useParams();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [deletedContentItems, setDeletedContentItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<"All" | "Exam" | "Summary">("All");
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [itemToRestore, setItemToRestore] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const navigate = useNavigate();

  const handleTestClick = () => {
    navigate("/generate-test");
  };

  const handleSummaryClick = () => {
    navigate("/generate-summary");
  };

  const handleDeleteClick = (item: ContentItem) => {
    setItemToDelete(item);
  };

  const handleRestoreClick = (item: ContentItem) => {
    setItemToRestore(item);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      setDeleting(true);
      await contentApi.deleteContent(itemToDelete.id);
      
      // Remove the deleted item from active content and add to deleted content
      setContentItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setDeletedContentItems(prev => [...prev, { ...itemToDelete, deleted: true, deletedAt: new Date().toISOString() }]);
      setItemToDelete(null);
      setError(null);
    } catch (err) {
      setError("Failed to delete content. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!itemToRestore) return;
    
    try {
      setRestoring(true);
      await contentApi.restoreContent(itemToRestore.id);
      
      // Remove from deleted content and add back to active content
      setDeletedContentItems(prev => prev.filter(item => item.id !== itemToRestore.id));
      setContentItems(prev => [...prev, { ...itemToRestore, deleted: false, deletedAt: undefined }]);
      setItemToRestore(null);
      setError(null);
    } catch (err) {
      setError("Failed to restore content. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteCancel = () => {
    setItemToDelete(null);
  };

  const handleRestoreCancel = () => {
    setItemToRestore(null);
  };

  const fetchActiveContent = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const userContent = await contentApi.fetchContent(stored._id);
      const normalized = userContent.map((i: any) => ({
        ...i,
        id: i._id,
        date: i.creationDate || new Date(i.createdAt).toLocaleDateString(),
        contentType:
          i.contentType === "summary"
            ? "Summary"
            : i.contentType === "Exam"
            ? "Exam"
            : i.contentType,
        createdAt: i.createdAt || i.creationDate
      }));
      return normalized.filter((c: any) => c.subjectId === subjectId);
    } catch (error) {
      throw new Error("Failed to fetch active content");
    }
  };

  const fetchDeletedContent = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const deletedContent = await contentApi.fetchDeletedContent(stored._id);
      const normalized = deletedContent.map((i: any) => ({
        ...i,
        id: i._id,
        date: i.creationDate || new Date(i.createdAt).toLocaleDateString(),
        contentType:
          i.contentType === "summary"
            ? "Summary"
            : i.contentType === "Exam"
            ? "Exam"
            : i.contentType,
        createdAt: i.createdAt || i.creationDate
      }));
      return normalized.filter((c: any) => c.subjectId === subjectId);
    } catch (error) {
      throw new Error("Failed to fetch deleted content");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [activeContent, deletedContent] = await Promise.all([
          fetchActiveContent(),
          fetchDeletedContent()
        ]);
        
        setContentItems(activeContent);
        setDeletedContentItems(deletedContent);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId]);

  // Real-time filtered and sorted content using useMemo
  const filteredAndSortedContent = useMemo(() => {
    const currentItems = viewMode === "active" ? contentItems : deletedContentItems;
    
    // Filter content
    let filtered = currentItems.filter((i) => {
      const matchesType = filter === "All" || i.contentType === filter;
      const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });

    // Sort content
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          const dateA = new Date(a.createdAt || a.date).getTime();
          const dateB = new Date(b.createdAt || b.date).getTime();
          comparison = dateA - dateB;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.contentType.localeCompare(b.contentType);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });


    return filtered;
  }, [contentItems, deletedContentItems, viewMode, filter, search, sortBy, sortOrder]);


  return (
    <div className={styles.generatedContent}>
      <div className={styles.header}>
        <h2>Generated Content for {subjectId}</h2>
        <div className={styles.actions}>
          <button className={styles.blackButton} onClick={() => handleSummaryClick()}>
            Create Summary
          </button>
          <button className={styles.blackButton} onClick={() => handleTestClick()}>
            Create Exam
          </button>
        </div>
      </div>

      <div className={styles.viewModeToggle}>
        <button
          className={viewMode === "active" ? styles.active : ""}
          onClick={() => setViewMode("active")}
        >
          Active Content ({contentItems.length})
        </button>
        <button
          className={viewMode === "deleted" ? styles.active : ""}
          onClick={() => setViewMode("deleted")}
        >
          Deleted Content ({deletedContentItems.length})
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {(["All", "Summary", "Exam"] as const).map((t) => (
            <button key={t} className={filter === t ? styles.active : ""} onClick={() => setFilter(t)}>
              {t === "All" ? "All Content" : `${t}s`}
            </button>
          ))}
        </div>

        <div className={styles.searchAndSort}>
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className={styles.sortSelect}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="type-asc">Type A-Z</option>
            <option value="type-desc">Type Z-A</option>
          </select>
        </div>

      </div>

      {loading ? (
        <div className={styles.loading}>Loading content...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : filteredAndSortedContent.length ? (
        <div className={styles.cards}>
          {filteredAndSortedContent.map((c) => (
            <div key={c.id} className={`${styles.card} ${viewMode === "deleted" ? styles.deletedCard : ""}`}>
              <div className={styles.cardHeader}>
                {c.copyContent && <Share2 size={18} />}
                <strong>{c.title}</strong>
                <span>{c.date}</span>
              </div>
              <div className={styles.cardTags}>
                {c.subject && <span className={styles.tag}>{c.subject}</span>}
                <span className={styles.tag}>{c.contentType}</span>
                {viewMode === "deleted" && c.deletedAt && (
                  <span className={styles.deletedTag}>
                    Deleted: {new Date(c.deletedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.viewButton}
                  onClick={() => setSelectedItem(c)}
                >
                  👁 View Content
                </button>
                {viewMode === "active" ? (
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteClick(c)}
                    disabled={deleting}
                  >
                    🗑 Delete
                  </button>
                ) : (
                  <button
                    className={styles.restoreButton}
                    onClick={() => handleRestoreClick(c)}
                    disabled={restoring}
                  >
                    🔄 Restore
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (

        <div className={styles.noContent}>
          {viewMode === "active" 
            ? "No active content found for this subject." 
            : "No deleted content found for this subject."}
        </div>
      )}

      {selectedItem && (
        <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {itemToRestore && (
        <RestoreConfirmationModal
          item={itemToRestore}
          onConfirm={handleRestoreConfirm}
          onCancel={handleRestoreCancel}
        />
      )}

    </div>
  );
};

export default GeneratedContent;