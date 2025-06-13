import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GeneratedContent.module.css";
import { contentApi } from "../../api";
import ContentModal from "./ContentModal";
import { ContentItem } from "./types";
import { ArchiveRestore, Eye, Pencil, Share2, Trash2 } from "lucide-react";
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

  const handleDeleteClick = (item: ContentItem) => setItemToDelete(item);
  const handleRestoreClick = (item: ContentItem) => setItemToRestore(item);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await contentApi.deleteContent(itemToDelete.id);
      setContentItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      setDeletedContentItems(prev => [...prev, { ...itemToDelete, deleted: true, deletedAt: new Date().toISOString() }]);
      setItemToDelete(null);
      setError(null);
    } catch {
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
      setDeletedContentItems(prev => prev.filter(i => i.id !== itemToRestore.id));
      setContentItems(prev => [...prev, { ...itemToRestore, deleted: false, deletedAt: undefined }]);
      setItemToRestore(null);
      setError(null);
    } catch {
      setError("Failed to restore content. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const fetchActiveContent = async () => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const userContent = await contentApi.fetchContent(stored._id);
    return userContent.map((i: any) => ({
      ...i,
      id: i._id,
      date: i.creationDate || new Date(i.createdAt).toLocaleDateString(),
      contentType: i.contentType === "summary" ? "Summary" : i.contentType === "Exam" ? "Exam" : i.contentType,
      createdAt: i.createdAt || i.creationDate,
      copyContent: i.copyContent,
      shared: i.shared,
    }));
  };

  const fetchDeletedContent = async () => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    const deletedContent = await contentApi.fetchDeletedContent(stored._id);
    return deletedContent.map((i: any) => ({
      ...i,
      id: i._id,
      date: i.creationDate || new Date(i.createdAt).toLocaleDateString(),
      contentType: i.contentType === "summary" ? "Summary" : i.contentType === "Exam" ? "Exam" : i.contentType,
      createdAt: i.createdAt || i.creationDate,
      copyContent: i.copyContent,
      shared: i.shared,
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [active, deleted] = await Promise.all([fetchActiveContent(), fetchDeletedContent()]);
        setContentItems(active);
        setDeletedContentItems(deleted);
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
      const res = await contentApi.updateContent(updated.id, {
        title: updated.title,
        subject: updated.subject,
        shared: updated.shared,
      });
      setContentItems(prev =>
        prev.map(item =>
          item.id === updated.id ? { ...item, ...res } : item
        )
      );
    } catch (error) {
      console.error("Failed to update content:", error);
    }
  };

  const filteredAndSortedContent = useMemo(() => {
    const currentItems = viewMode === "active" ? contentItems : deletedContentItems;
    let filtered = currentItems.filter(i => {
      const matchesType = filter === "All" || i.contentType === filter;
      const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.contentType.localeCompare(b.contentType);
          break;
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
          <button className={styles.blackButton} onClick={() => navigate("/generate-summary")}>Create Summary</button>
          <button className={styles.blackButton} onClick={() => navigate("/generate-test")}>Create Exam</button>
        </div>
      </div>

      <div className={styles.viewModeToggle}>
        <button className={viewMode === "active" ? styles.active : ""} onClick={() => setViewMode("active")}>Active Content ({contentItems.length})</button>
        <button className={viewMode === "deleted" ? styles.active : ""} onClick={() => setViewMode("deleted")}>Deleted Content ({deletedContentItems.length})</button>
      </div>

      <div className={styles.filters}>
        <div className={styles.tabs}>
          {["All", "Summary", "Exam"].map(t => (
            <button key={t} className={filter === t ? styles.active : ""} onClick={() => setFilter(t as any)}>
          {t === "All" ? "All Content" : t === "Summary" ? "Summaries" : `${t}s`}
            </button>
          ))}
        </div>
        <div className={styles.searchAndSort}>
          <input type="text" placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={`${sortBy}-${sortOrder}`} onChange={e => {
            const [by, order] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
            setSortBy(by);
            setSortOrder(order);
          }} className={styles.sortSelect}>
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
          {filteredAndSortedContent.map(c => (
            <div key={c.id} className={`${styles.card} ${viewMode === "deleted" ? styles.deletedCard : ""}`}>
              <div className={styles.cardHeader}>
                {c.copyContent && <Share2 size={18} className={styles.shareIcon} />}
                <strong>{c.title}</strong>
              </div>
               <span>{c.date}</span>
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
                    <Eye size={18} /> Content
                  </button>
                  {viewMode === "active" && (
                    <button className={styles.editButtonEdit} onClick={() => setEditingItem(c)}>
                      <Pencil size={18} /> Edit
                    </button>
                  )}
                  {viewMode === "active" ? (
                    <button className={styles.deleteButton} onClick={() => handleDeleteClick(c)} disabled={deleting}>
                      <Trash2 size={18} /> Delete
                    </button>
                  ) : (
                    <button className={styles.restoreButton} onClick={() => handleRestoreClick(c)} disabled={restoring}>
                      <ArchiveRestore size={18} /> Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noContent}>
          {viewMode === "active" ? "No active content found." : "No deleted content found."}
        </div>
      )}

      {selectedItem && <ContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {itemToDelete && <DeleteConfirmationModal item={itemToDelete} onConfirm={handleDeleteConfirm} onCancel={() => setItemToDelete(null)} />}
      {itemToRestore && <RestoreConfirmationModal item={itemToRestore} onConfirm={handleRestoreConfirm} onCancel={() => setItemToRestore(null)} />}
      {editingItem && viewMode === "active" && (
        <EditContentModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
};

export default GeneratedContent;
