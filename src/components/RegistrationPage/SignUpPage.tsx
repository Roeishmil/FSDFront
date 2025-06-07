import { FC, useState } from "react";
import axios from "axios";
import LoginPageStyle from "./LoginPage.module.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useUser from "../../hooks/useUser";
import { userApi } from "../../api";

const schema = z.object({
  email: z.string().email("Invalid email"),
  fullName: z.string()
    .min(1, "Full Name is required")
    .regex(/^[a-zA-Z\u0590-\u05FF\s]+$/, "Full Name should contain only letters and spaces")
    .refine(name => name.trim().includes(' '), "Full Name should contain at least one space"),
  username: z.string()
    .min(1, "User Name is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Username should contain only letters, numbers and underscores"),
   password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(password => {
      // At least one uppercase letter
      const hasUpperCase = /[A-Z]/.test(password);
      // At least one lowercase letter
      const hasLowerCase = /[a-z]/.test(password);
      // At least one digit
      const hasDigit = /\d/.test(password);
      // At least one special character
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
    }, "Password must contain uppercase, lowercase, number and special character")
});

type FormData = z.infer<typeof schema>;

const SignUpPage: FC = () => {
  const { register, handleSubmit, formState, reset, watch } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const { setUser } = useUser();
  
  // Add state for error messages, success, and loading
  const [signupError, setSignupError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Watch password for strength indicator
  const watchedPassword = watch("password", "");

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "#e2e8f0" };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) return { strength: score, label: "Weak", color: "#e53e3e" };
    if (score <= 3) return { strength: score, label: "Fair", color: "#dd6b20" };
    if (score <= 4) return { strength: score, label: "Good", color: "#38a169" };
    return { strength: score, label: "Strong", color: "#22543d" };
  };

  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSignupError(""); // Clear previous errors
    setShowSuccess(false); // Clear previous success message
    
    try {
      const response = await userApi.register(data);
      console.log("Signup response", response);
      
      // Show success message
      setSuccessMessage(`Welcome ${response.fullName}! Your account has been created successfully.`);
      setShowSuccess(true);
      
      // Wait a moment to show success message before auto-login
      setTimeout(() => {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            _id: response._id,
            username: response.username,
            email: response.email,
            fullName: response.fullName,
          })
        );
        localStorage.setItem("userId", response._id);
        setUser(response);
        navigate("/");
      }, 2000); // 2 second delay to show success message
      
    } catch (error: any) {
      console.error("Signup failed", error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        if (status === 409 || status === 400) {
          // Conflict - user already exists or validation error
          if (message && message.includes('email')) {
            setSignupError("An account with this email already exists. Please use a different email or try logging in.");
          } else if (message && message.includes('username')) {
            setSignupError("This username is already taken. Please choose a different username.");
          } else if (message) {
            setSignupError(message);
          } else {
            setSignupError("An account with these details already exists. Please try different credentials.");
          }
        } else if (status === 422) {
          // Validation error
          setSignupError("Please check your information and make sure all fields are filled correctly.");
        } else if (status === 429) {
          setSignupError("Too many signup attempts. Please try again later.");
        } else if (message) {
          setSignupError(message);
        } else {
          setSignupError("Registration failed. Please try again.");
        }
      } else if (error.request) {
        // Network error
        setSignupError("Network error. Please check your connection and try again.");
      } else {
        // Other error
        setSignupError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Manual continue option if user doesn't want to wait
    setShowSuccess(false);
    navigate("/");
  };

  return (
    <div className={LoginPageStyle.Container}>
      <div className={LoginPageStyle.Box}>
        {showSuccess ? (
          // Success confirmation screen
          <div style={{ textAlign: 'center' }}>
            <div className={LoginPageStyle.alertSuccess}>
              <h2 className={LoginPageStyle.successTitle}>🎉 Welcome Aboard!</h2>
              <p style={{ margin: '10px 0', fontSize: '16px', lineHeight: '1.5' }}>
                {successMessage}
              </p>
              <p style={{ margin: '15px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                Redirecting you to your dashboard...
              </p>
              <div style={{ 
                width: '100%', 
                height: '4px', 
                background: 'rgba(34, 84, 61, 0.2)', 
                borderRadius: '2px', 
                margin: '15px 0',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#22543d',
                  borderRadius: '2px',
                  animation: 'progressBar 2s ease-in-out'
                }}></div>
              </div>
            </div>
            <button 
              onClick={handleContinue}
              className={LoginPageStyle.Button}
              style={{ marginTop: '10px' }}
            >
              Continue Now
            </button>
            <style>
              {`
                @keyframes progressBar {
                  from { width: 0%; }
                  to { width: 100%; }
                }
              `}
            </style>
          </div>
        ) : (
          // Registration form
          <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Create Account</h2>
            
            {/* Display signup error */}
            {signupError && (
              <div className={LoginPageStyle.alertError}>
                <strong>⚠️ Registration Failed:</strong> {signupError}
              </div>
            )}
            
            <div className={`${LoginPageStyle.formGroup} ${formState.errors.username ? LoginPageStyle.hasError : ''}`}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Choose a unique username"
                {...register("username")}
                className={LoginPageStyle.inputField}
              />
              {formState.errors.username && (
                <div className={LoginPageStyle.error}>
                  {formState.errors.username.message}
                </div>
              )}
            </div>

            <div className={`${LoginPageStyle.formGroup} ${formState.errors.fullName ? LoginPageStyle.hasError : ''}`}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                {...register("fullName")}
                className={LoginPageStyle.inputField}
              />
              {formState.errors.fullName && (
                <div className={LoginPageStyle.error}>
                  {formState.errors.fullName.message}
                </div>
              )}
            </div>

            <div className={`${LoginPageStyle.formGroup} ${formState.errors.email ? LoginPageStyle.hasError : ''}`}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register("email")}
                className={LoginPageStyle.inputField}
              />
              {formState.errors.email && (
                <div className={LoginPageStyle.error}>
                  {formState.errors.email.message}
                </div>
              )}
            </div>

            <div className={`${LoginPageStyle.formGroup} ${formState.errors.password ? LoginPageStyle.hasError : ''}`}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                {...register("password")}
                className={LoginPageStyle.inputField}
              />
              {watchedPassword && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    background: '#e2e8f0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      height: '100%',
                      background: passwordStrength.color,
                      transition: 'all 0.3s ease',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: passwordStrength.color
                  }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              {formState.errors.password && (
                <div className={LoginPageStyle.error}>
                  {formState.errors.password.message}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className={`${LoginPageStyle.Button} ${isLoading ? LoginPageStyle.loading : ''}`} 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
        
        {!showSuccess && (
          <div onClick={() => navigate("/login")} className={LoginPageStyle.herf}>
            Already have an account? Sign In
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;