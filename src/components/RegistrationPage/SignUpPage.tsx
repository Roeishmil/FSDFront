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
    }, "Password too weak")
});

type FormData = z.infer<typeof schema>;

const SignUpPage: FC = () => {
  const { register, handleSubmit, formState, reset } = useForm<FormData>({ resolver: zodResolver(schema) });
  const navigate = useNavigate();
  const { setUser } = useUser();
  
  // Add state for error messages, success, and loading
  const [signupError, setSignupError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

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
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              <h2 style={{ color: '#155724', marginBottom: '15px' }}>🎉 Registration Successful!</h2>
              <p style={{ margin: '10px 0', fontSize: '16px' }}>{successMessage}</p>
              <p style={{ margin: '10px 0', fontSize: '14px' }}>You will be automatically logged in shortly...</p>
            </div>
            <button 
              onClick={handleContinue}
              className={LoginPageStyle.Button}
              style={{ marginTop: '10px' }}
            >
              Continue Now
            </button>
          </div>
        ) : (
          // Registration form
          <form onSubmit={handleSubmit(onSubmit)}>
            <h2>SignUp</h2>
            
            {/* Display signup error */}
            {signupError && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                border: '1px solid #f5c6cb'
              }}>
                {signupError}
              </div>
            )}
            
            <div className={LoginPageStyle.error}>
              {formState.errors.username && <div className="text-danger">{formState.errors.username.message}</div>}
            </div>
            <div className={LoginPageStyle.formGroup}>
              <label>User Name:</label>
              <input
                id="username"
                type="text"
                placeholder="User Name"
                {...register("username")}
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
            <button type="submit" className={LoginPageStyle.Button} disabled={isLoading}>
              {isLoading ? "Creating Account..." : "SignUp"}
            </button>
          </form>
        )}
        
        {!showSuccess && (
          <div onClick={() => navigate("/login")} className={LoginPageStyle.herf}>
            Login
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;