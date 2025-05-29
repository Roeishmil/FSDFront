interface ImportMetaEnv {
  VITE_GOOGLE_API_KEY: string;
  VITE_GOOGLE_CLIENT_ID: string;
  VITE_BASE_URL:string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
