import React, { useEffect, useState, useRef } from "react";
import { examApi } from "./api";
import styles from "./components/FileUpload/FileUpload.module.css";
import GoogleDrivePicker from "./components/googleDrive";

// Reusable loader component
const Loader: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      width: "100%",
      minHeight: "200px"
    }}
  >
    <style>{`
      @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }
      .spinner {
          width: 50px;
          height: 50px;
          border: 6px solid #ccc;
          border-top: 6px solid #1d72b8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
      }
    `}</style>
    <div className="spinner"></div>
    <p style={{ marginTop: "20px", fontSize: "1.2em", color: "#555" }}>
      {message}
    </p>
  </div>
);

// Modal component for displaying exam content
const ExamModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  content: string;
}> = ({ isOpen, onClose, content }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content || !modalContentRef.current || !isOpen) return;

    // Put the raw HTML into the container
    modalContentRef.current.innerHTML = content;

    // Find and re-inject all <script> tags so they execute
    const scriptTags = modalContentRef.current.querySelectorAll("script");
    scriptTags.forEach((oldScript) => {
      const newScript = document.createElement("script");
      // Copy over any attributes (e.g. src, type)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copy inline script text
      newScript.text = oldScript.text;
      // Replace old script with the new one
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [content, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          height: "90%",
          padding: "20px",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "#1d72b8",
            color: "white",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={onClose}
        >
          ✕
        </button>
        <div ref={modalContentRef} style={{ marginTop: "20px" }}></div>
      </div>
    </div>
  );
};

const ViewExam: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileSelected = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    console.log('File selected:', file.name);
  };

  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      console.log('Files uploaded:', newFiles.map(f => f.name));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFetchExam = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one file first.");
      return;
    }

    setIsFetching(true);
    setError(null);
    
    try {
      // Use examApi to upload files and create exam
      const formData = new FormData();
      if (uploadedFiles.length > 0) {
        formData.append('file', uploadedFiles[0]);
      }
      
      // Using the examApi to create exam with files
      const data = await examApi.creatExam(formData);
      
      setHtmlContent(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to generate exam:", err);
      setError("Failed to generate the exam content. Please try again later.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div>
      <div className={styles.container}>
        <h1>Upload Files for Exam</h1>
        
        <div className={styles.uploadOptions}>
          <div className={styles.buttonContainer}>
            <label className={styles.fileUploadButton}>
              Upload Local File
              <input
                type="file"
                onChange={handleLocalFileUpload}
                multiple
                style={{ display: 'none' }}
              />
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
                    {(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown type'}
                  </div>
                  <button 
                    className={styles.removeButton}
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            
            <button
              onClick={handleFetchExam}
              disabled={isFetching}
              style={{
                padding: '12px 20px',
                backgroundColor: isFetching ? '#ccc' : '#1d72b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isFetching ? 'not-allowed' : 'pointer',
                margin: '20px 0',
                position: 'relative',
                minWidth: '150px',
              }}
            >
              {isFetching ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="spinner" style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderWidth: '3px',
                    marginRight: '10px' 
                  }}></span>
                  Processing...
                </span>
              ) : 'Generate Exam'}
            </button>
          </div>
        )}
      </div>

      {error && <div style={{ color: 'red', margin: '20px' }}>{error}</div>}
      
      {/* Modal for displaying exam content */}
      <ExamModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        content={htmlContent} 
      />
    </div>
  );
};

export default ViewExam;