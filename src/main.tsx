import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "./context/UserContext";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={"979131531210-j2jf9nbte5gs6s9ji951jhuspe72s4jc.apps.googleusercontent.com"}>
    <StrictMode>
      <UserProvider>
        <App />
      </UserProvider>
    </StrictMode>
  </GoogleOAuthProvider>
);
