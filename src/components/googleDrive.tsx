import React, { useEffect, useState } from 'react';

interface GoogleDrivePickerProps {
  onFileSelected: (file: File) => void;
}


// Google API configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// Global variable to track script loading
declare global {
  interface Window {
    gapi: any;
    google: any;
    gapiInited: boolean;
    gisInited: boolean;
    tokenClient: any;
  }
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onFileSelected }) => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // Load gapi scripts on component mount
  useEffect(() => {
    // Callback when Google API is loaded
    window.gapiInited = false;
    window.gisInited = false;

    // Load the Google API client library
    const loadGapiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:picker', initializeGapiClient);
      };
      script.onerror = () => console.error('Failed to load Google API script');
      document.body.appendChild(script);
    };

    // Load the Google Identity Services
    const loadGisScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initializeGisClient;
      script.onerror = () => console.error('Failed to load Google Identity Services script');
      document.body.appendChild(script);
    };

    // Initialize Google API Client
    const initializeGapiClient = async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        window.gapiInited = true;
        setGapiLoaded(true);
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true);
        });
        maybeEnableButton();
      } catch (error) {
        console.error('Error initializing GAPI client:', error);
      }
    };

    // Initialize Google Identity Services Client
    const initializeGisClient = () => {
      try {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // Will be defined later
        });
        window.gisInited = true;
        maybeEnableButton();
      } catch (error) {
        console.error('Error initializing GIS client:', error);
      }
    };

    // Enable button if all APIs are loaded
    const maybeEnableButton = () => {
      if (window.gapiInited && window.gisInited) {
        setIsButtonDisabled(false);
      }
    };

    loadGapiScript();
    loadGisScript();

    // Clean up function
    return () => {
      // Nothing to clean up for now
    };
  }, []);

  // Handle click on the Google Drive button
  const handleGoogleDriveClick = () => {
    if (isButtonDisabled) {
      console.log('Google API not fully loaded yet');
      return;
    }

    // Get access token
    if (window.tokenClient) {
      // Define callback here to avoid issues with stale closures
      window.tokenClient.callback = async (response: any) => {
        if (response.error !== undefined) {
          console.error('Error getting access token:', response);
          return;
        }
        await createPicker(response.access_token);
      };

      // Request an access token
      if (window.gapi.client.getToken() === null) {
        window.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        window.tokenClient.requestAccessToken({ prompt: '' });
      }
    } else {
      console.error('Token client not initialized');
    }
  };

  // Create and show the Google Drive picker
  const createPicker = async (accessToken: string) => {
    if (!pickerApiLoaded) {
      console.error('Picker API not loaded yet');
      return;
    }

    try {
      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
      
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => pickerCallback(data, accessToken))
        .build();
      
      picker.setVisible(true);
    } catch (error) {
      console.error('Error creating picker:', error);
    }
  };

  // Handle the picker callback
  const pickerCallback = async (data: any, accessToken: string) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const document = data.docs[0];
      console.log('Selected file:', document);

      try {
        // Determine correct URL based on file type
        let downloadUrl;
        if (document.mimeType.includes('application/vnd.google-apps')) {
          // Google Docs, Sheets, etc. need export
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${document.id}/export?mimeType=application/pdf`;
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${document.id}?alt=media`;
        }

        // Download the file
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const file = new File([blob], document.name, { type: document.mimeType });
        onFileSelected(file);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
  };

  // Button styles
  const buttonStyle = {
    margin: "10px",
    padding: "10px 15px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: "#95a5a6",
    cursor: "not-allowed",
  };

  return (
    <button
      onClick={handleGoogleDriveClick}
      disabled={isButtonDisabled}
      style={isButtonDisabled ? buttonDisabledStyle : buttonStyle}
    >
      {isButtonDisabled ? 'Loading Google Drive...' : 'Select from Google Drive'}
    </button>
  );
};

export default GoogleDrivePicker;