import { FC, useState } from "react";
import axios from "axios";
import style from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import useUser from "../../hooks/useUser";

/* ─── validation ─── */
const schema = z.object({
  emailOrusername: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
type FormData = z.infer<typeof schema>;

const api = axios.create({ baseURL: import.meta.env.VITE_BASE_URL });

interface Props {
  showLogoutMessage?: boolean;
  onDismissLogoutMessage?: () => void;
}

const LoginPage: FC<Props> = ({
  showLogoutMessage = false,
  onDismissLogoutMessage
}) => {
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const navigate = useNavigate();
  const { setUser } = useUser();

  const [loginError, setLoginError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ── form submit ── */
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const res = await api.post("/auth/login", data);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userId", res.data.user._id);
      localStorage.removeItem("idleLogoutMessage");
      setUser(res.data.user);
      navigate("/");
    } catch (err: any) {
      if (err.response?.status === 401)
        setLoginError("Invalid email / username or password.");
      else if (err.response?.status === 404)
        setLoginError("User not found. Please sign up.");
      else
        setLoginError(
          err.response?.data?.message ||
            "Login failed. Please try again later."
        );
    } finally {
      setIsLoading(false);
    }
  };

  /* ── google ── */
  const googleSuccess = async (cred: CredentialResponse) => {
    setGoogleError("");
    try {
      const res = await api.post("/auth/googleSignin", { credential: cred });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("userId", res.data.user._id);
      localStorage.removeItem("idleLogoutMessage");
      setUser(res.data.user);
      navigate("/");
    } catch (err: any) {
      setGoogleError(
        err.response?.data?.message ||
          "Google login failed. Please try again."
      );
    }
  };
  const googleErrorHandler = () =>
    setGoogleError("Google login was cancelled or failed.");

  /* ─────────────────────────── */
  return (
    <div className={style.Container}>
      {showLogoutMessage && (
        <div className={style.logoutMessage}>
          <span>🔒 You have been signed out due to inactivity</span>
          <button
            onClick={onDismissLogoutMessage}
            className={style.dismissBtn}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className={style.Box}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>Welcome Back</h2>

          {loginError && (
            <div className={style.alertError}>
              <strong>⚠️ Login Failed:</strong> {loginError}
            </div>
          )}
          {googleError && (
            <div className={style.alertError}>
              <strong>⚠️ Google Login Failed:</strong> {googleError}
            </div>
          )}

          {/* Email or username */}
          <div
            className={`${style.formGroup} ${
              formState.errors.emailOrusername ? style.hasError : ""
            }`}
          >
            <label htmlFor="emailOrusername">Email or Username</label>
            <input
              id="emailOrusername"
              type="text"
              placeholder="Enter your email or username"
              {...register("emailOrusername")}
              className={style.inputField}
            />
            {formState.errors.emailOrusername ? (
              <p className={style.error}>
                {formState.errors.emailOrusername.message}
              </p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          {/* Password */}
          <div
            className={`${style.formGroup} ${
              formState.errors.password ? style.hasError : ""
            }`}
          >
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className={style.inputField}
            />
            {formState.errors.password ? (
              <p className={style.error}>{formState.errors.password.message}</p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          <button
            type="submit"
            className={`${style.Button} ${isLoading ? style.loading : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Signing In…" : "Sign In"}
          </button>

          <div className={style.googleLoginWrapper}>
            <GoogleLogin
              onSuccess={googleSuccess}
              onError={googleErrorHandler}
              size="large"
              width="100%"
            />
          </div>
        </form>

        <div
          onClick={() => navigate("/SignUp")}
          className={style.herf}
        >
          Don't have an account? Sign Up
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
