import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "./context/UserContext";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={"91361677307-bk7ncjou2r73a83r27mu6rle8cgk7j2u.apps.googleusercontent.com"}>
    <StrictMode>
      <UserProvider>
        <App />
      </UserProvider>
    </StrictMode>
  </GoogleOAuthProvider>
);
