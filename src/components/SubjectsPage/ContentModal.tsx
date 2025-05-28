import { FC, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SubjectsPageStyle from "./SubjectsPage.module.css";
import { useSubject } from "../../hooks/useSubject";

/* ⬇ icons for the fancy buttons / badges */
import { Plus, Pencil, Trash2, FileText, Sparkles, Eye } from "lucide-react";

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
   Interface definitions
   ──────────────────────────── */
interface Subject {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  testCount?: number;
  summaryCount?: number;
  tests?: any[];
  summaries?: any[];
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

const ContentModal: FC<{
  item: ContentItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (item?.content && iframeRef.current) {
      // Get the iframe document
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;

      if (iframeDoc) {
        // Write the HTML content to the iframe
        iframeDoc.open();
        iframeDoc.write(item.content);
        iframeDoc.close();
      }
    }
  }, [item?.content]);

  if (!item) return null;

  return (
    <div
      className={SubjectsPageStyle.modalOverlay}
      onClick={(e) => {
        // Close the modal when clicking the overlay (but not the content)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={SubjectsPageStyle.modalContent}>
        <div className={SubjectsPageStyle.modalHeader}>
          <h3>{item.title}</h3>
          <button className={SubjectsPageStyle.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={SubjectsPageStyle.modalBody}>
          {item.content ? (
            <iframe
              ref={iframeRef}
              className={SubjectsPageStyle.contentIframe}
              title={item.title}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <p>No content available for this item.</p>
          )}
        </div>
        <div className={SubjectsPageStyle.modalFooter}>
          <span className={SubjectsPageStyle.itemMeta}>
            {item.contentType} • {item.date}
          </span>
          <button className={SubjectsPageStyle.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentModal;
