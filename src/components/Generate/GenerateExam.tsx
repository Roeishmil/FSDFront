import React, { useState, useRef, useEffect } from "react";
import { examApi } from "../../api"; // adjust the path as needed
import GoogleDrivePicker from "../googleDrive";
import styles from "./Generate.module.css";

// Reusable loader component
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

const GenerateExam: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [numAmerican, setNumAmerican] = useState(0);
  const [numOpen, setNumOpen] = useState(0);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Ensure at least one file is uploaded
      if (uploadedFiles.length === 0) {
        setError("Please upload at least one file.");
        setLoading(false);
        return;
      }

      // Create FormData and append the prompt, numAmerican, numOpen, and the first file
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("numAmerican", numAmerican.toString());
      formData.append("numOpen", numOpen.toString());
      formData.append("file", uploadedFiles[0]); // Send the first file

      // Call the API to create the exam
      const response = await examApi.creatExam(formData);
      setHtmlContent(response);
    } catch (err) {
      console.error("Error generating exam:", err);

      // Provide a user-friendly error message
      if (err instanceof Error && (err as any).code === "ERR_NETWORK") {
        setError("Network error: The server is not responding. Please check your connection and try again.");
      } else if (err instanceof Error && (err as any).response?.status === 404) {
        setError("No input file found. Please upload a PDF or PPTX file first.");
      } else if (err instanceof Error && (err as any).response?.status === 500) {
        setError(`Server error: ${(err as any).response.data?.message || "Failed to generate exam. Please try again."}`);
      } else {
        setError("Failed to generate exam. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset errors when prompt changes
  useEffect(() => {
    if (error) setError(null);
  }, [prompt]);

  // Once HTML is received, inject it and re-run its scripts:
  useEffect(() => {
    if (htmlContent && containerRef.current) {
      containerRef.current.innerHTML = htmlContent;

      // Execute any scripts in the HTML
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

  if (loading) {
    return <Loader message="Generating exam... This may take up to a minute." />;
  }

  if (htmlContent) {
    return <div ref={containerRef} className="html-content-container" />;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Generate Exam</h2>

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
        Enter your custom exam prompt below or leave blank to use the default generator. Make sure you've uploaded a PDF
        file first.
      </p>

      <textarea
        placeholder="Enter your custom exam prompt..."
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

      <div style={{ marginBottom: "15px" }}>
        <label>
          Number of American Questions:
          <input
            type="number"
            min="0"
            value={numAmerican}
            onChange={(e) => setNumAmerican(parseInt(e.target.value, 10) || 0)}
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              width: "80px",
            }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Number of Open Questions:
          <input
            type="number"
            min="0"
            value={numOpen}
            onChange={(e) => setNumOpen(parseInt(e.target.value, 10) || 0)}
            style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              width: "80px",
            }}
          />
        </label>
      </div>

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
        Generate Exam
      </button>
    </div>
  );
};

export default GenerateExam;
