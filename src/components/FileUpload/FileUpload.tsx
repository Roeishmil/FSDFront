import React, { useState } from 'react';
import GoogleDrivePicker from '../googleDrive';
import styles from './FileUpload.module.css';

const FileUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelected = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    console.log('File selected:', file.name);
    // Here you can implement additional logic like uploading to your backend
  };

  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      console.log('Files uploaded:', newFiles.map(f => f.name));
      // Here you can implement additional logic like uploading to your backend
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <h1>Upload Files</h1>
      
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
        </div>
      )}
    </div>
  );
};

export default FileUpload;