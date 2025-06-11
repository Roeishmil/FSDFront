/* src/components/generate/GenerateExam.tsx */
import React, { useState, useRef, useEffect } from "react";
import { examApi, contentApi } from "../../api";
import GoogleDrivePicker from "../googleDrive";
import { useSubject } from "../../hooks/useSubject";
import styles from "./Generate.module.css";
import { useLocation } from "react-router-dom";

/* ─── loader ─── */
const Loader: React.FC<{ msg: string }> = ({ msg }) => (
  <div
    style={{
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        marginBottom: 18,
        border: "4px solid #e2e8f0",
        borderTop: "4px solid #0ea5e9",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    />
    <p>{msg}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ─── metadata modal ─── */
interface ContentMetadataProps {
  contentId: string;
  initialTitle: string;
  perSubject?: string;
  onClose: () => void;
  onSaved: () => void;            // NEW: callback on successful save
}

const ContentMetadata: React.FC<ContentMetadataProps> = ({
  contentId,
  initialTitle,
  perSubject,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subject, setSubject] = useState(perSubject || "");
  const { subjects } = useSubject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    try {
      setBusy(true);
      await contentApi.updateContent(contentId, { title, subject });
      onSaved();        // let parent know it succeeded
      onClose();
    } catch {
      setError("Failed to update exam details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.metadataOverlay} onClick={onClose}>
      <div className={styles.metadataCard} onClick={(e) => e.stopPropagation()}>
        <h3>Update Exam Details</h3>

        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className={styles.label} style={{ marginTop: 12 }}>
          Subject
        </label>
        <select
          className={styles.input}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select subject…</option>
          {subjects?.map((s: any) => (
            <option key={s._id} value={s._id}>
              {s.title}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            className={styles.primaryButton}
            style={{ background: "#64748b", color: "#fff" }}
          >
            Cancel
          </button>
          <button onClick={save} disabled={busy} className={styles.primaryButton}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── main component ─── */
const GenerateExam: React.FC = () => {
  /* inputs */
  const [prompt, setPrompt] = useState("");
  const [numAmerican, setNumAmerican] = useState(8);
  const [numOpen, setNumOpen] = useState(3);
  const [difficulty, setDifficulty] = useState<"Easy" | "Moderate" | "Hard">(
    "Moderate"
  );
  const [subject, setSubject] = useState("");

  /* uploads */
  const [uploaded, setUploaded] = useState<File[]>([]);

  /* result + meta */
  const [htmlContent, setHtmlContent] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [metaDone, setMetaDone] = useState(false);

  /* ui flags */
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);  // NEW: flash message

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hiddenDrivePicker = useRef<HTMLInputElement>(null);
  const { subjects } = useSubject();

  /* upload helpers */
  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUploaded((p) => [...p, ...Array.from(e.target.files || [])]);

  const handleDriveUpload = (files: File[]) =>
    setUploaded((p) => [...p, ...files]);

  const removeFile = (i: number) =>
    setUploaded((p) => p.filter((_, idx) => idx !== i));

  /* generate exam */
  const handleGenerate = async () => {
    if (!uploaded.length) {
      setError("Please upload at least one PDF file.");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const fd = new FormData();
      fd.append("prompt", prompt);
      fd.append("subject", subject);
      fd.append("numAmerican", numAmerican.toString());
      fd.append("numOpen", numOpen.toString());
      fd.append("difficulty", difficulty);
      fd.append("file", uploaded[0]);

      const uid = localStorage.getItem("userId");
      if (uid) fd.append("userId", uid);

      const res = await examApi.creatExam(fd);

      if (typeof res === "object" && res && "html" in res) {
        setHtmlContent(res.html as string);
        if (res.contentId) setContentId(res.contentId as string);
      } else {
        setHtmlContent(res as unknown as string);
      }
    } catch {
      setError("Failed to generate exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* pick subject from URL (optional) */
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    setSubject(id || "");
  }, [location.search]);

  /* write HTML + dynamic height */
  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Inject HTML
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Resize helper
    const setHeight = () => {
      if (!iframe || !doc) return;
      const height = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight
      );
      iframe.style.height = height + "px";
    };

    // Observe size changes inside iframe
    const ro = new ResizeObserver(setHeight);
    ro.observe(doc.documentElement);

    // extra hooks for fonts / images / viewport changes
    iframe.addEventListener("load", setHeight);
    window.addEventListener("resize", setHeight);
    setTimeout(setHeight, 250);

    // clean-up
    return () => {
      ro.disconnect();
      iframe.removeEventListener("load", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, [htmlContent]);

  /* loaders */
  if (loading) return <Loader msg="Generating exam… This may take a minute." />;
  if (saving) return <Loader msg="Saving exam to your account…" />;

  /* ------------ rendered exam ------------ */
  if (htmlContent) {
    return (
      <>
        {showMeta && contentId && (
          <ContentMetadata
            contentId={contentId}
            initialTitle={`Exam - ${difficulty}`}
            perSubject={subject}
            onClose={() => {
              setShowMeta(false);
              setMetaDone(true);
            }}
            onSaved={() => {
              setFlash("Exam saved successfully!");
              setTimeout(() => setFlash(null), 3000);
            }}
          />
        )}

        {error && (
          <p style={{ color: "#b91c1c", margin: "12px 0" }}>{error}</p>
        )}

        {flash && (
          <p
            style={{
              background: "#dcfce7",
              color: "#15803d",
              padding: "10px 14px",
              borderLeft: "4px solid #16a34a",
              borderRadius: "6px",
              margin: "12px 0",
              fontWeight: 600,
            }}
          >
            {flash}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {contentId && (
            <button
              onClick={() => setShowMeta(true)}
              className={styles.primaryButton}
              style={{ width: 200 }}
            >
              {metaDone ? "Edit Exam Details" : "Set Exam Details"}
            </button>
          )}
        </div>

        <iframe
          ref={iframeRef}
          title="generated-exam"
          style={{ width: "100%", border: "none", overflow: "hidden" }}
        />
      </>
    );
  }

  /* ------------ initial form ------------ */
  return (
    <div className={styles.container}>
      {/* header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerIcon}>📝</div>
        <div>
          <h2 className={styles.pageTitle}>Generate New Exam</h2>
          <p className={styles.pageSubtitle}>
            Upload material and create an exam in seconds
          </p>
        </div>
      </div>

      {error && (
        <p
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "10px 14px",
            borderLeft: "4px solid #dc2626",
            borderRadius: "6px",
            marginTop: 12,
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      {/* form card */}
      <div className={styles.formCard}>
        {/* prompt */}
        <label className={styles.label}>Custom Prompt (optional)</label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a custom prompt here…"
        />

        {/* counts + difficulty */}
        <div className={styles.twoCol}>
          <div>
            <label className={styles.label}># Closed Questions</label>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={numAmerican}
              onChange={(e) => setNumAmerican(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={styles.label}># Open Questions</label>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={numOpen}
              onChange={(e) => setNumOpen(Number(e.target.value))}
            />
          </div>
        </div>

        <label className={styles.label}>Difficulty</label>
        <select
          className={`${styles.input} ${styles.select}`}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as any)}
        >
          <option value="Easy">Easy</option>
          <option value="Moderate">Moderate</option>
          <option value="Hard">Hard</option>
        </select>

        {/* subject selector */}
        <label className={styles.label} style={{ marginTop: 12 }}>
          Subject
        </label>
        <select
          className={styles.input}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select subject…</option>
          {subjects?.map((s: any) => (
            <option key={s._id} value={s._id}>
              {s.title}
            </option>
          ))}
        </select>

        {/* upload bloc */}
        <h3 className={styles.uploadSectionTitle}>Upload Files</h3>

        <div className={styles.uploadRow}>
          <label className={styles.dragArea} htmlFor="localFile">
            <span className={styles.dragIcon}>📄</span>
            <p>
              <strong>Click to upload</strong>
            </p>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              PDF only, up to 10&nbsp;MB
            </p>
            <input
              id="localFile"
              type="file"
              multiple
              onChange={handleLocalUpload}
              style={{ display: "none" }}
            />
          </label>

          <span className={styles.orText}>or</span>

          <GoogleDrivePicker
            className={styles.driveButton}
            onFilesSelected={handleDriveUpload}
            ref={hiddenDrivePicker}
          />
        </div>

        {uploaded.length > 0 && (
          <ul className={styles.fileList}>
            {uploaded.map((f, i) => (
              <li key={i} className={styles.fileItem}>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileInfo}>
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  className={styles.removeButton}
                  onClick={() => removeFile(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={handleGenerate} className={styles.primaryButton}>
          Generate Exam
        </button>
      </div>
    </div>
  );
};

export default GenerateExam;
