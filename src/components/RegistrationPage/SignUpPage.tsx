import { FC, useEffect, useState } from "react";
import style from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { userApi } from "../../api";
import useUser from "../../hooks/useUser";

/* ─────────  VALIDATION  ───────── */
const schema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .regex(/^[A-Za-z0-9_]+$/, "Letters, numbers and underscores only"),
  fullName: z.string()
    .regex(/^[A-Za-z\u0590-\u05FF\s]+$/, "Full Name must contain at least one space")
    .min(3, "Full Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "At least 8 characters")
    .refine((v) => /[A-Z]/.test(v), "Must contain uppercase")
    .refine((v) => /[a-z]/.test(v), "Must contain lowercase")
    .refine((v) => /\d/.test(v), "Must contain a number")
    .refine((v) => /[!@#$%^&*(),.?\":{}|<>]/.test(v), "Must contain a symbol")
});
type FormData = z.infer<typeof schema>;

const SignUpPage: FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const navigate = useNavigate();
  const { setUser } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  /* ─────────  PASSWORD STRENGTH  ───────── */
  const pwd = watch("password", "");
  const [rules, setRules] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setRules({
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?\":{}|<>]/.test(pwd)
    });
  }, [pwd]);

  const score = Object.values(rules).filter(Boolean).length;
  const barClass =
    score <= 1 ? "" : score <= 2 ? "fair" : score <= 4 ? "good" : "strong";
  const barWidth = `${(score / 5) * 100}%`;
  const strength =
    score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 4 ? "Good" : "Strong";

  /* ─────────  SUBMIT  ───────── */
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setServerError("");
    try {
      const res = await userApi.register(data);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res));
      localStorage.setItem("userId", res._id);
      setUser(res);
      navigate("/");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─────────  JSX  ───────── */
  return (
    <div className={style.Container}>
      <div className={style.Box}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2>Create Account</h2>

          {serverError && (
            <div className={style.alertError}>
              <strong>⚠️</strong> {serverError}
            </div>
          )}

          {/* ── Username ── */}
          <div className={`${style.formGroup} ${errors.username ? style.hasError : ""}`}>
            <label>Username</label>
            <input
              className={style.inputField}
              placeholder="Choose a unique username"
              {...register("username")}
            />
            {errors.username ? (
              <p className={style.error}>{errors.username.message}</p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          {/* ── Full name ── */}
          <div className={`${style.formGroup} ${errors.fullName ? style.hasError : ""}`}>
            <label>Full Name</label>
            <input
              className={style.inputField}
              placeholder="Enter your full name"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className={style.error}>{errors.fullName.message}</p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          {/* ── Email ── */}
          <div className={`${style.formGroup} ${errors.email ? style.hasError : ""}`}>
            <label>Email Address</label>
            <input
              className={style.inputField}
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
            />
            {errors.email ? (
              <p className={style.error}>{errors.email.message}</p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          {/* ── Password ── */}
          <div className={`${style.formGroup} ${errors.password ? style.hasError : ""}`}>
            <label>Password</label>
            <input
              className={style.inputField}
              type="password"
              placeholder="Create a strong password"
              {...register("password")}
            />

            {/* live checklist */}
            {pwd && (
              <div className={style.passwordRules}>
                {[
                  { ok: rules.length, text: "≥ 8 chars" },
                  { ok: rules.upper, text: "Uppercase" },
                  { ok: rules.lower, text: "Lowercase" },
                  { ok: rules.number, text: "Number" },
                  { ok: rules.special, text: "Symbol" }
                ].map(({ ok, text }) => (
                  <p key={text} className={`${style.rule} ${ok ? "pass" : ""}`}>
                    {ok ? "✔︎" : "–"} {text}
                  </p>
                ))}
                <div className={style.barWrap}>
                  <div
                    className={`${style.barFill} ${barClass}`}
                    style={{ width: barWidth }}
                  />
                </div>
                <span className={style.strengthLabel}>{strength}</span>
              </div>
            )}

            {errors.password ? (
              <p className={style.error}>{errors.password.message}</p>
            ) : (
              <div className={style.fieldGap} />
            )}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            className={`${style.Button} ${isLoading ? style.loading : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Creating…" : "Create Account"}
          </button>
        </form>

        {/* bottom link */}
        <div onClick={() => navigate("/login")} className={style.herf}>
          Already have an account? Sign In
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
