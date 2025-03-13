import { FC } from "react";
import axios from "axios";
import LoginPageStyle from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useUser from "../../hooks/useUser";

const schema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  fullName: z.string().min(1, "Full Name is required"),
  userName: z.string().min(1, "User Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const api = axios.create({
  baseURL: "http://localhost:3000",
});

const SignUpPage: FC = () => {
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const { setUser } = useUser();

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post("/auth/register", data);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      navigate("/");
    } catch (error) {
      console.error("Signup failed", error);
    }
  };

  return (
    <div className={LoginPageStyle.Container}>
      <div className={LoginPageStyle.Box}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2>SignUp</h2>
          <div className={LoginPageStyle.error}>
            {formState.errors.userName && <div className="text-danger">{formState.errors.userName.message}</div>}
          </div>
          <div className={LoginPageStyle.formGroup}>
            <label>User Name:</label>
            <input
              id="userName"
              type="text"
              placeholder="User Name"
              {...register("userName")}
              className={LoginPageStyle.inputField}
            />
          </div>
          <div className={LoginPageStyle.error}>
            {formState.errors.fullName && <div className="text-danger">{formState.errors.fullName.message}</div>}
          </div>
          <div className={LoginPageStyle.formGroup}>
            <label>Full Name:</label>
            <input
              id="fullName"
              type="text"
              placeholder="Full Name"
              {...register("fullName")}
              className={LoginPageStyle.inputField}
            />
          </div>
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
            SignUp
          </button>
        </form>
        <div onClick={() => navigate("/login")} className={LoginPageStyle.herf}>
          Login
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
