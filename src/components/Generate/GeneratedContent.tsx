import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";
import ContentModal from "./ContentModal";
import { ContentItem } from "./types";
import { Eye, Pencil, Share2, X } from "lucide-react";
import EditContentModal from "./EditContentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import RestoreConfirmationModal from "./RestoreConfirmationModal";

const GeneratedContent: React.FC = () => {
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
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
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
      setContentItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      setDeletedContentItems((prev) => [
        ...prev,
        { ...itemToDelete, deleted: true, deletedAt: new Date().toISOString() },
      ]);
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
      setDeletedContentItems((prev) => prev.filter((item) => item.id !== itemToRestore.id));
      setContentItems((prev) => [...prev, { ...itemToRestore, deleted: false, deletedAt: undefined }]);
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
      console.log("Fetched user content:", userContent);
      const normalized = userContent.map((i: any) => ({
        ...i,
        id: i._id,
        date: i.creationDate || new Date(i.createdAt).toLocaleDateString(),
        contentType: i.contentType === "summary" ? "Summary" : i.contentType === "Exam" ? "Exam" : i.contentType,
        createdAt: i.createdAt || i.creationDate,
        copyContent: i.copyContent,
        shared: i.shared,
      }));
      return normalized;
    } catch (error) {
      console.log("Error fetching active content:", error);
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
        contentType: i.contentType === "summary" ? "Summary" : i.contentType === "Exam" ? "Exam" : i.contentType,
        createdAt: i.createdAt || i.creationDate,
        copyContent: i.copyContent,
        shared: i.shared,
      }));
      return normalized;
    } catch (error) {
      throw new Error("Failed to fetch deleted content");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [activeContent, deletedContent] = await Promise.all([fetchActiveContent(), fetchDeletedContent()]);
        setContentItems(activeContent);
        setDeletedContentItems(deletedContent);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch content. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveEdit = async (updated: ContentItem) => {
    try {
      await contentApi
        .updateContent(updated.id, {
          title: updated.title,
          subject: updated.subject,
          shared: updated.shared,
        })
        .then((res) => {
          setContentItems((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    title: res.title,
                    subject: res.subject,
                    subjectTitle: res.subjectTitle,
                    shared: res.shared,
                    copyContent: res.copyContent,
                  }
                : item
            )
          );
        });
    } catch (error) {
      console.error("Failed to update content:", error);
    }
  };

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
        <h2>All Generated Content</h2>
        <div className={styles.actions}>
          <button className={styles.blackButton} onClick={() => navigate("/generate-summary")}>
            Create Summary
          </button>
          <button className={styles.blackButton} onClick={() => navigate("/generate-test")}>
            Create Exam
          </button>
        </div>
      </div>

      <div className={styles.viewModeToggle}>
        <button className={viewMode === "active" ? styles.active : ""} onClick={() => setViewMode("active")}>
          Active Content ({contentItems.length})
        </button>
        <button className={viewMode === "deleted" ? styles.active : ""} onClick={() => setViewMode("deleted")}>
          Deleted Content ({deletedContentItems.length})
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {["All", "Summary", "Exam"].map((t) => (
            <button key={t} className={filter === t ? styles.active : ""} onClick={() => setFilter(t as any)}>
              {t === "All" ? "All Content" : `${t}s`}
            </button>
          ))}
        </div>

        <div className={styles.searchAndSort}>
          <input type="text" placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
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
                {c.copyContent && <Share2 size={18} className={styles.shareIcon} />}
                <strong>{c.title}</strong>
                <span>{c.date}</span>
              </div>
              <div className={styles.cardTags}>
                {c.subjectTitle && <span className={styles.tag}>{c.subjectTitle}</span>}
                <span className={styles.tag}>{c.contentType}</span>
                {viewMode === "deleted" && c.deletedAt && (
                  <span className={styles.deletedTag}>Deleted: {new Date(c.deletedAt).toLocaleDateString()}</span>
                )}
              </div>
              <div className={styles.cardSpacer} />
              <div className={styles.cardActionsEdit}>
                <div className={styles.cardActions}>
                  <button className={styles.viewButton} onClick={() => setSelectedItem(c)}>
                    <Eye size={14} /> View Content
                  </button>
                  {/* Only show edit button for active content */}
                  {viewMode === "active" && (
                    <button className={styles.editButtonEdit} onClick={() => setEditingItem(c)}>
                      <Pencil size={14} /> Edit
                    </button>
                  )}
                </div>
                {viewMode === "active" ? (
                  <button className={styles.deleteButton} onClick={() => handleDeleteClick(c)} disabled={deleting}>
                    🗑 Delete
                  </button>
                ) : (
                  <button className={styles.restoreButton} onClick={() => handleRestoreClick(c)} disabled={restoring}>
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

      {selectedItem && <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {itemToDelete && (
        <DeleteConfirmationModal item={itemToDelete} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
      )}

      {itemToRestore && (
        <RestoreConfirmationModal item={itemToRestore} onConfirm={handleRestoreConfirm} onCancel={handleRestoreCancel} />
      )}

      {/* Only show EditContentModal for active content */}
      {editingItem && viewMode === "active" && (
        <EditContentModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
};

export default GeneratedContent;