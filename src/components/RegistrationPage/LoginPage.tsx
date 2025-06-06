import { FC, useState } from "react";
import axios from "axios";
import LoginPageStyle from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import useUser from "../../hooks/useUser";

const schema = z.object({
  emailOrusername: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

const LoginPage: FC = () => {
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Add state for error messages
  const [loginError, setLoginError] = useState<string>("");
  const [googleError, setGoogleError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoginError(""); // Clear previous errors

    try {
      const response = await api.post("/auth/login", data);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userId", response.data.user._id);
      setUser(response.data.user);
      navigate("/");
    } catch (error: any) {
      console.error("Login failed", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;

        if (status === 401) {
          setLoginError("Invalid email/username or password. Please try again.");
        } else if (status === 404) {
          setLoginError("User not found. Please check your credentials or sign up.");
        } else if (status === 429) {
          setLoginError("Too many login attempts. Please try again later.");
        } else if (message) {
          setLoginError(message);
        } else {
          setLoginError("Login failed. Please try again.");
        }
      } else if (error.request) {
        // Network error
        setLoginError("Network error. Please check your connection and try again.");
      } else {
        // Other error
        setLoginError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const googleResponseMessage = async (credentialResponse: CredentialResponse) => {
    setGoogleError(""); // Clear previous errors

    try {
      const response = await api.post("/auth/googleSignin", { credential: credentialResponse });
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userId", response.data.user._id);

      setUser(response.data.user);
      navigate("/");
    } catch (error: any) {
      console.error("Google login failed", error);

      if (error.response) {
        const message = error.response.data?.message || error.response.data?.error;
        setGoogleError(message || "Google login failed. Please try again.");
      } else if (error.request) {
        setGoogleError("Network error. Please check your connection and try again.");
      } else {
        setGoogleError("Google login failed. Please try again.");
      }
    }
  };

  const googleErrorMessage = () => {
    console.log("Google Error");
    setGoogleError("Google login was cancelled or failed. Please try again.");
  };

  return (
    <div className={LoginPageStyle.Container}>
      <div className={LoginPageStyle.Box}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2>Login</h2>

          {/* Display general login error */}
          {loginError && (
            <div className="alert alert-danger" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              {loginError}
            </div>
          )}

          {/* Display Google login error */}
          {googleError && (
            <div className="alert alert-danger" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              {googleError}
            </div>
          )}

          <div className={LoginPageStyle.error}>
            {formState.errors.emailOrusername && (
              <div className="text-danger">{formState.errors.emailOrusername.message}</div>
            )}
          </div>
          <div className={LoginPageStyle.formGroup}>
            <label>Email:</label>
            <input
              id="emailOrusername"
              type="text"
              placeholder="email / username"
              {...register("emailOrusername")}
              className={LoginPageStyle.inputField}
            />
          </div>
          <div className={LoginPageStyle.error}>
            {formState.errors.password && <div className="text-danger">{formState.errors.password.message}</div>}
          </div>
          <div className={LoginPageStyle.formGroup}>
            <label>Password:</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              {...register("password")}
              className={LoginPageStyle.inputField}
            />
          </div>
          <button type="submit" className={LoginPageStyle.Button} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <div style={{
            width: '100%',
            margin: '10px 0',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <GoogleLogin
              onSuccess={googleResponseMessage}
              onError={googleErrorMessage}
              width="350px" // Set this to match your form width
              size="large"
            />
          </div>
        </form>
        <div onClick={() => navigate("/SignUp")} className={LoginPageStyle.herf}>
          SignUp
        </div>
      </div>
    </div>
  );
};

export default LoginPage;