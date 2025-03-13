import { FC } from "react";
import axios from "axios";
import LoginPageStyle from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import useUser from "../../hooks/useUser";

const schema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const api = axios.create({
  baseURL: "http://localhost:3000",
});

const LoginPage: FC = () => {
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const { setUser } = useUser();

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post("/auth/login", data);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      navigate("/");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const googleResponseMessage = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await api.post("/auth/googleSignin", { credential: credentialResponse });
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      navigate("/");
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const googleErrorMessage = () => {
    console.log("Google Error");
  };

  return (
    <div className={LoginPageStyle.Container}>
      <div className={LoginPageStyle.Box}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2>Login</h2>
          <div className={LoginPageStyle.error}>
            {formState.errors.email && <div className="text-danger">{formState.errors.email.message}</div>}
          </div>
          <div className={LoginPageStyle.formGroup}>
            <label>Email:</label>
            <input
              id="email"
              type="text"
              placeholder="Email"
              {...register("email")}
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
          <button type="submit" className={LoginPageStyle.Button}>
            login
          </button>
          <GoogleLogin onSuccess={googleResponseMessage} onError={googleErrorMessage} />
        </form>
        <div onClick={() => navigate("/SignUp")} className={LoginPageStyle.herf}>
          SignUp
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
