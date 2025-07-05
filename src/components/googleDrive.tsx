import React, { useEffect, useState } from 'react';

interface GoogleDrivePickerProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

// Google API configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// Global variable to track script loading
declare global {
  interface Window {
    gapi: any;
    google: any;
    gapiInited: boolean;
    gisInited: boolean;
    pickerInited: boolean;
    tokenClient: any;
  }
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onFilesSelected, className }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeAPIs = async () => {
      try {
        // Check environment variables
        if (!API_KEY || !CLIENT_ID) {
          setLoadingStatus('Missing API credentials');
          return;
        }

        // Initialize global flags if not already set
        if (typeof window.gapiInited === 'undefined') window.gapiInited = false;
        if (typeof window.gisInited === 'undefined') window.gisInited = false;
        if (typeof window.pickerInited === 'undefined') window.pickerInited = false;

        setLoadingStatus('Loading Google APIs...');
        
        // Load GAPI first, then GIS
        await loadGapiScript();
        await loadGisScript();

      } catch (error) {
        setLoadingStatus('Failed to initialize');
      }
    };

    const loadGapiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.gapi && window.gapiInited) {
          resolve();
          return;
        }

        if (window.gapi && !window.gapiInited) {
          initializeGapi().then(resolve).catch(reject);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initializeGapi().then(resolve).catch(reject);
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load GAPI script'));
        };
        
        document.head.appendChild(script);
      });
    };

    const loadGisScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.google?.accounts?.oauth2 && window.gisInited) {
          checkReadiness();
          resolve();
          return;
        }

        if (window.google?.accounts?.oauth2 && !window.gisInited) {
          initializeGis();
          checkReadiness();
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          // Wait a bit for the script to fully initialize
          setTimeout(() => {
            initializeGis();
            checkReadiness();
            resolve();
          }, 100);
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load GIS script'));
        };
        
        document.head.appendChild(script);
      });
    };

    const initializeGapi = async () => {
      return new Promise<void>((resolve, reject) => {
        if (!window.gapi) {
          reject(new Error('GAPI not loaded'));
          return;
        }
        
        // Load client and picker libraries
        window.gapi.load('client:picker', {
          callback: async () => {
            try {
              await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              
              window.gapiInited = true;
              
              // Check if picker is available
              if (window.google?.picker) {
                window.pickerInited = true;
              } else {
                // Set a timeout to check again
                setTimeout(() => {
                  if (window.google?.picker) {
                    window.pickerInited = true;
                    checkReadiness();
                  }
                }, 500);
              }
              
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          onerror: (error: any) => {
            reject(new Error(`GAPI load failed: ${error}`));
          },
          timeout: 10000, // 10 second timeout
          ontimeout: () => {
            reject(new Error('GAPI load timeout'));
          }
        });
      });
    };

    const initializeGis = () => {
      try {
        if (!window.google?.accounts?.oauth2) {
          return;
        }

        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // Will be set when needed
        });
        
        window.gisInited = true;
      } catch (error) {
        // Silent fail
      }
    };

    const checkReadiness = () => {
      if (window.gapiInited && window.gisInited && window.pickerInited) {
        setIsReady(true);
        setLoadingStatus('Ready');
      } else {
        // If we're missing picker but others are ready, try one more time
        if (window.gapiInited && window.gisInited && !window.pickerInited) {
          setTimeout(() => {
            if (window.google?.picker) {
              window.pickerInited = true;
              setIsReady(true);
              setLoadingStatus('Ready');
            }
          }, 1000);
        }
      }
    };

    initializeAPIs();
  }, []);

  const handleGoogleDriveClick = async () => {
    if (!onFilesSelected) {
      alert('File selection handler not configured');
      return;
    }

    if (!isReady) {
      alert('Google APIs are still loading. Please wait a moment.');
      return;
    }

    try {
      setLoadingStatus('Authenticating...');

      // Set up the callback
      window.tokenClient.callback = async (response: any) => {
        if (response.error) {
          setLoadingStatus('Authentication failed');
          return;
        }

        setLoadingStatus('Opening picker...');
        await createPicker(response.access_token);
      };

      // Request access token
      const existingToken = window.gapi.client.getToken();
      if (existingToken === null) {
        window.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        window.tokenClient.requestAccessToken({ prompt: '' });
      }

    } catch (error) {
      setLoadingStatus('Error occurred');
    }
  };

  const createPicker = async (accessToken: string) => {
    try {
      if (!window.google?.picker) {
        alert('Picker API not loaded. Please refresh and try again.');
        return;
      }

      // Create document view with specific MIME types
      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      docsView.setMimeTypes('application/pdf,text/plain,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet');
      docsView.setSelectFolderEnabled(false);

      // Create the picker
      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0]) // Extract app ID from client ID
        .setOAuthToken(accessToken)
        .addView(docsView)
        .addView(new window.google.picker.DocsView(window.google.picker.ViewId.RECENTLY_PICKED))
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => handlePickerCallback(data, accessToken))
        .setTitle('Select a file from Google Drive')
        .setSize(1051, 650)
        .build();

      picker.setVisible(true);
      setLoadingStatus('Picker opened');

    } catch (error) {
      setLoadingStatus('Failed to open picker');
      alert(`Failed to open Google Drive picker: ${error}`);
    }
  };

  const handlePickerCallback = async (data: any, accessToken: string) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];

      try {
        setLoadingStatus('Downloading file...');
        
        let downloadUrl: string;
        let finalMimeType = doc.mimeType;

        // Handle Google Workspace files by exporting as PDF
        if (doc.mimeType.includes('application/vnd.google-apps')) {
          if (doc.mimeType === 'application/vnd.google-apps.document') {
            finalMimeType = 'application/pdf';
            downloadUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=application/pdf`;
          } else if (doc.mimeType === 'application/vnd.google-apps.spreadsheet') {
            finalMimeType = 'application/pdf';
            downloadUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=application/pdf`;
          } else {
            throw new Error(`Unsupported Google Workspace file type: ${doc.mimeType}`);
          }
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
        }

        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const blob = await response.blob();
        let fileName = doc.name;
        
        // Add .pdf extension for exported files if not present
        if (doc.mimeType.includes('application/vnd.google-apps') && !fileName.toLowerCase().endsWith('.pdf')) {
          fileName += '.pdf';
        }

        const file = new File([blob], fileName, { type: finalMimeType });
        
        setLoadingStatus('File ready');
        onFilesSelected([file]);
        
      } catch (error) {
        setLoadingStatus('Download failed');
        alert(`Failed to download the selected file: ${error}`);
      }
    } else if (data.action === window.google.picker.Action.CANCEL) {
      setLoadingStatus('Ready');
    }
  };

  // Default button styles
  const defaultButtonStyle: React.CSSProperties = {
    padding: "12px 20px",
    backgroundColor: isReady ? "#4285f4" : "#9e9e9e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: isReady ? "pointer" : "not-allowed",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background-color 0.2s",
  };

  return (
    <div>
      <button
        onClick={handleGoogleDriveClick}
        disabled={!isReady}
        className={className}
        style={className ? undefined : defaultButtonStyle}
        title={`Status: ${loadingStatus}`}
      >
        <span>📁</span>
        {isReady ? 'Select from Google Drive' : loadingStatus}
      </button>
    </div>
  );
};

export default GoogleDrivePicker;