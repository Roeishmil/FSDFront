import React, { useState, useRef, useEffect } from "react";
import { summaryApi, contentApi } from "../../api";
import GoogleDrivePicker from "../googleDrive"; // Same picker component you use
import styles from "./Generate.module.css"; // Same styles

const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
    }}
  >
    <style>{`
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
      .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
      }
    `}</style>
    <div className="spinner"></div>
    <p style={{ marginTop: "20px", fontSize: "1.1em" }}>{message}</p>
  </div>
);

// ContentMetadata component for title/subject editing
const ContentMetadata: React.FC<{ 
  contentId: string, 
  initialTitle: string,
  onClose: () => void
}> = ({ contentId, initialTitle, onClose }) => {
  const [title, setTitle] = useState(initialTitle);
  const [subject, setSubject] = useState(""); // Direct subject input instead of selection
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      // Update content with title and subject as direct text input
      await contentApi.updateContent(contentId, { 
        title, 
        subject // Send the subject text directly instead of an ID
      });
      
      setUpdating(false);
      onClose();
    } catch (err) {
      console.error("Error updating content:", err);
      setError("Failed to update summary details. Please try again.");
      setUpdating(false);
    }
  };

  return (
    <div className={styles.metadataOverlay}>
      <div className={styles.metadataCard}>
        <h3>Update Summary Details</h3>
        
        {error && (
          <div style={{ color: "white", backgroundColor: "#d9534f", padding: "10px", marginBottom: "15px", borderRadius: "4px" }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: "15px" }}>
          <label>
            Title:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "4px",
                border: "1px solid #ccc"
              }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: "15px" }}>
          <label>
            Subject:
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject name"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "4px",
                border: "1px solid #ccc"
              }}
            />
          </label>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "8px 15px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Skip
          </button>
          
          <button
            onClick={handleUpdate}
            disabled={updating || !title.trim()}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "8px 15px",
              borderRadius: "4px",
              cursor: updating || !title.trim() ? "not-allowed" : "pointer"
            }}
          >
            {updating ? "Updating..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const GenerateSummary: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for handling saved content
  const [contentId, setContentId] = useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [metadataEdited, setMetadataEdited] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (uploadedFiles.length === 0) {
        setError("Please upload at least one file.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("file", uploadedFiles[0]); // Send first file
      
      // Get the user ID from localStorage if available
      const userId = localStorage.getItem("userId");
      if (userId) {
        formData.append("userId", userId);
      }

      // Call the API to create the summary
      const response = await summaryApi.creatSummary(formData);
      
      // Check if the response is an object with html and contentId properties
      if (typeof response === 'object' && response !== null && 'html' in response) {
        setHtmlContent(response.html);
        
        // If we got a content ID back, save it and show the metadata form
        if (response.contentId) {
          console.log("Content ID received:", response.contentId);
          setContentId(response.contentId);
          setShowMetadataForm(true);
        } else {
          console.error("No contentId in response:", response);
        }
      } else {
        // If the response is just HTML as a string
        setHtmlContent(response);
        console.warn("Response was not an object with html/contentId:", response);
      }
    } catch (err) {
      console.error("Error generating summary:", err);

      if ((err as any).code === "ERR_NETWORK") {
        setError("Network error: The server is not responding. Please check your connection and try again.");
      } else if ((err as any).response?.status === 404) {
        setError("No input file found. Please upload a PDF or PPTX file first.");
      } else if ((err as any).response?.status === 500) {
        setError(
          `Server error: ${(err as any).response?.data?.message || "Failed to generate summary. Please try again."}`
        );
      } else {
        setError("Failed to generate summary. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) setError(null);
  }, [prompt]);

  useEffect(() => {
    if (htmlContent && containerRef.current) {
      containerRef.current.innerHTML = htmlContent;

      const scriptTags = containerRef.current.querySelectorAll("script");
      scriptTags.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.text = oldScript.text;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [htmlContent]);

  const handleFileSelected = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
    console.log("File selected:", file.name);
  };

  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      console.log(
        "Files uploaded:",
        newFiles.map((f) => f.name)
      );
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCloseMetadataForm = () => {
    setShowMetadataForm(false);
    setMetadataEdited(true);
  };

  const handleOpenMetadataForm = () => {
    if (contentId) {
      setShowMetadataForm(true);
    } else {
      console.error("Cannot open metadata form: contentId is null");
      setError("Unable to edit summary details. Content ID not found.");
    }
  };

  if (loading) {
    return <Loader message="Generating summary... This may take up to a minute." />;
  }

  if (htmlContent) {
    return (
      <>
        {showMetadataForm && contentId && (
          <ContentMetadata 
            contentId={contentId} 
            initialTitle={`Summary - ${new Date().toLocaleDateString()}`}
            onClose={handleCloseMetadataForm}
          />
        )}
        
        {error && (
          <div
            style={{
              color: "white",
              backgroundColor: "#d9534f",
              padding: "12px",
              borderRadius: "4px",
              margin: "10px 20px",
            }}
          >
            {error}
          </div>
        )}
        
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px" }}>
          {!showMetadataForm && contentId && (
            <button
              onClick={handleOpenMetadataForm}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "10px"
              }}
            >
              {metadataEdited ? "Edit Summary Details" : "Set Summary Title & Subject"}
            </button>
          )}
          
          {!showMetadataForm && !contentId && (
            <div style={{ color: "#6c757d", padding: "8px 15px", fontSize: "0.9em" }}>
              Content ID not available - metadata editing disabled
            </div>
          )}
        </div>
        
        <div ref={containerRef} className="html-content-container" />
      </>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Generate Summary</h2>

      {error && (
        <div
          style={{
            color: "white",
            backgroundColor: "#d9534f",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      <p>
        Enter your custom summary prompt below or leave blank to use the default generator. Make sure you've uploaded a
        PDF file first.
      </p>

      <textarea
        placeholder="Enter your custom summary prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{
          width: "100%",
          height: "150px",
          marginBottom: "15px",
          padding: "10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />

      <div className={styles.container}>
        <h1>Upload Files</h1>

        <div className={styles.uploadOptions}>
          <div className={styles.buttonContainer}>
            <label className={styles.fileUploadButton}>
              Upload Local File
              <input type="file" onChange={handleLocalFileUpload} multiple style={{ display: "none" }} />
            </label>

            <GoogleDrivePicker onFileSelected={handleFileSelected} />
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className={styles.fileList}>
            <h2>Uploaded Files</h2>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index} className={styles.fileItem}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileInfo}>
                    {(file.size / 1024).toFixed(2)} KB • {file.type || "Unknown type"}
                  </div>
                  <button className={styles.removeButton} onClick={() => removeFile(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Generate Summary
      </button>
    </div>
  );
};

export default GenerateSummary;