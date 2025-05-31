import { FC, useEffect, useRef, useState } from "react";
import UserProfileStyle from "./UserProfile.module.css";
import Avatar from "../../assets/avatar.png";
import { INTINAL_DATA_USER, IUser } from "../../Interfaces";
import Loader from "../Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faPen, faSave } from "@fortawesome/free-solid-svg-icons";
import useUser from "../../hooks/useUser";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fileApi } from "../../api";

/* ─────────── validation ─────────── */
const schema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  username: z.string().min(1, "User Name is required"),
});
type FormData = z.infer<typeof schema>;

const UserProfile: FC = () => {
  /* global user */
  const {
    user: fetchedUser,
    isLoading: userLoading,
    error: userError,
    updateUser,
    refetchUser,
  } = useUser();

  /* local state */
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState<IUser>(
    fetchedUser || INTINAL_DATA_USER
  );
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  /* file input */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* form */
  const {
    register,
    handleSubmit,
    formState,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: userData.fullName,
      username: userData.username,
    },
  });

  /* sync fetched user → local state + form */
  useEffect(() => {
    if (fetchedUser) {
      setUserData(fetchedUser);
      setValue("fullName", fetchedUser.fullName);
      setValue("username", fetchedUser.username);
    }
  }, [fetchedUser, setValue]);

  /* ─────────── handlers ─────────── */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorFile("Invalid file type! Please choose JPEG, PNG, GIF, or WebP.");
      return;
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > maxSize) {
      setErrorFile("File too large! Please choose a file smaller than 5MB.");
      return;
    }

    // Make sure we have a user ID
    if (!userData._id) {
      setErrorFile("User ID not found. Please try refreshing the page.");
      return;
    }

    try {
      setIsLoadingFile(true);
      setErrorFile(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Use the fileApi.uploadFile method
      const response = await fileApi.uploadFile(formData, userData._id);
      
      // The response should contain the updated user data
      if (response.data) {
        // Update local state immediately
        setUserData(response.data);
        
        // Force refetch from server to ensure consistency
        if (refetchUser) {
          await refetchUser();
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        setErrorFile("User not found. Please try refreshing the page.");
      } else if (err.response?.status === 413) {
        setErrorFile("File too large! Please choose a smaller image.");
      } else if (err.response?.status === 400) {
        const message = err.response?.data?.message || "Invalid file format.";
        setErrorFile(message);
      } else {
        const msg = err.response?.data?.message || err.message || "Upload failed";
        setErrorFile(msg);
      }
    } finally {
      setIsLoadingFile(false);
      // Clear the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (data: FormData) => {
    try {
      const updated = await updateUser({ ...userData, ...data });
      if (updated) {
        setUserData(updated);
        setEditMode(false);
        
        // Force refetch to ensure consistency
        if (refetchUser) {
          await refetchUser();
        }
      }
    } catch (err: any) {
      console.error("Update user error:", err);
      // Handle error appropriately
    }
  };

  /* ─────────── JSX ─────────── */
  return (
    <div className={UserProfileStyle.pageContainer}>
      <div className={UserProfileStyle.profileCard}>
        {/* avatar & upload */}
        <div className={UserProfileStyle.avatarCol}>
          <div className={UserProfileStyle.avatarWrap}>
            <img
              src={userData.imgUrl || Avatar}
              alt="profile"
              className={UserProfileStyle.profilePic}
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = Avatar;
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className={UserProfileStyle.uploadPicInput}
              onChange={handleFileChange}
              disabled={isLoadingFile}
            />
            <FontAwesomeIcon
              icon={faImage}
              className={`${UserProfileStyle.uploadPicIcon} ${
                isLoadingFile ? UserProfileStyle.disabled : ''
              }`}
              onClick={() => !isLoadingFile && fileInputRef.current?.click()}
            />
          </div>
          {isLoadingFile && <Loader />}
          {errorFile && <p className={UserProfileStyle.error}>{errorFile}</p>}
        </div>

        {/* info column */}
        <div className={UserProfileStyle.infoCol}>
          {userLoading ? (
            <Loader />
          ) : userError ? (
            <p className={UserProfileStyle.error}>{userError}</p>
          ) : editMode ? (
            <form onSubmit={handleSubmit(handleSave)}>
              <div className={UserProfileStyle.formGroup}>
                <label>Full Name:</label>
                <input type="text" {...register("fullName")} />
              </div>

              <div className={UserProfileStyle.formGroup}>
                <label>Username:</label>
                <input type="text" {...register("username")} />
              </div>

              <p className={UserProfileStyle.emailLabel}>
                Email:&nbsp;{userData.email}
              </p>

              <div className={UserProfileStyle.buttonRow}>
                <button type="submit" className={UserProfileStyle.saveBtn}>
                  <FontAwesomeIcon icon={faSave} />
                  Save
                </button>
              </div>

              {formState.errors.fullName && (
                <p className={UserProfileStyle.error}>
                  {formState.errors.fullName.message}
                </p>
              )}
              {formState.errors.username && (
                <p className={UserProfileStyle.error}>
                  {formState.errors.username.message}
                </p>
              )}
            </form>
          ) : (
            <>
              <h2 className={UserProfileStyle.fullName}>{userData.fullName}</h2>
              <p className={UserProfileStyle.field}>
                <span>User Name:</span>&nbsp;{userData.username}
              </p>
              <p className={UserProfileStyle.field}>
                <span>Email:</span>&nbsp;{userData.email}
              </p>

              <div className={UserProfileStyle.buttonRow}>
                <button
                  className={UserProfileStyle.editBtn}
                  onClick={() => setEditMode(true)}
                >
                  <FontAwesomeIcon icon={faPen} />
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;