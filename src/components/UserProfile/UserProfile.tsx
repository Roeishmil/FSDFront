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
  } = useUser();

  /* local state */
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState<IUser>(
    fetchedUser || INTINAL_DATA_USER
  );
  const [refreshTrigger, setRefreshTrigger] = useState(false);
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
      alert("Invalid file type! Please choose JPEG, PNG, GIF, or WebP.");
      return;
    }

    // Make sure we have a user ID
    if (!userData._id) {
      setErrorFile("User ID not found. Please try refreshing the page.");
      return;
    }

    // Create a FormData with just the file
    // According to usersController.js, the update method expects JSON
    // So we'll need to convert the file to base64 and update user manually
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsLoadingFile(true);
        setErrorFile(null);

        // Convert image to base64 string
        const base64Image = e.target?.result as string;

        // Update user with the image URL
        const updatedUser = {
          ...userData,
          imgUrl: base64Image,
        };

        // Use updateUser from useUser hook to update profile
        if (updateUser) {
          const updated = await updateUser(updatedUser);
          if (updated) {
            setUserData(updated);
            setRefreshTrigger((p) => !p);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorFile(msg);
        console.error("Upload error:", err);
      } finally {
        setIsLoadingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorFile("Error reading file");
      setIsLoadingFile(false);
    };

    // Read file as data URL (base64)
    reader.readAsDataURL(selectedFile);
  };

  const handleSave = async (data: FormData) => {
    const updated = await updateUser({ ...userData, ...data });
    if (updated) {
      setUserData(updated);
      setEditMode(false);
      setRefreshTrigger((p) => !p);
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
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className={UserProfileStyle.uploadPicInput}
              onChange={handleFileChange}
            />
            <FontAwesomeIcon
              icon={faImage}
              className={UserProfileStyle.uploadPicIcon}
              onClick={() => fileInputRef.current?.click()}
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