import { FC, useEffect, useRef, useState } from "react";
import UserProfileStyle from "./UserProfile.module.css";
import Avatar from "../../assets/avatar.png";
import { INTINAL_DATA_USER, IUser } from "../../Interfaces";
import Loader from "../Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import useUser from "../../hooks/useUser";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fileApi } from "../../api";

const schema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  username: z.string().min(1, "User Name is required"),
});

type FormData = z.infer<typeof schema>;

const UserProfile: FC = () => {
  const { user: fetchedUser, isLoading: userLoading, error: userError, updateUser } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState<IUser>(fetchedUser || INTINAL_DATA_USER);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [errorFile, setErrorFile] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: userData.fullName,
      username: userData.username,
    },
  });

  useEffect(() => {
    if (fetchedUser) {
      setUserData(fetchedUser);
      setValue("fullName", fetchedUser.fullName);
      setValue("username", fetchedUser.username);
    }
  }, [fetchedUser, setValue]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      if (!validImageTypes.includes(selectedFile.type)) {
        alert("Invalid file type! Please select an image (JPEG, PNG, GIF, WebP).");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", userData.username ?? "");

      try {
        setIsLoadingFile(true);
        setErrorFile(null);
        const response = await fileApi.uploadFile(formData);

        console.log("File uploaded successfully:", response.data.user);

        // Update the global state or backend
        setUserData((prevUserData) => ({
          ...prevUserData,
          imgUrl: response.data.user.imgUrl,
        }));

        // If using a global state, update it here
        if (updateUser) {
          setRefreshTrigger((prev) => !prev);
          await updateUser(response.data.user);
        }
        setIsLoadingFile(false);
      } catch (error) {
        console.error("Error uploading file:", error);
        setErrorFile(error instanceof Error ? error.message : String(error));
      }
    }
  };

  const handleSave = async (data: FormData) => {
    const updatedUser = await updateUser({ ...userData, ...data });
    if (updatedUser) {
      setUserData(updatedUser);
      setEditMode(false);
      setRefreshTrigger((prev) => !prev);
    }
  };

  return (
    <>
      <div className={UserProfileStyle.pageContainer}>
        <div className={UserProfileStyle.profileContainer}>
          <div className={userLoading || isLoadingFile ? UserProfileStyle.loaderContiner : ""}>
            {userError && editMode && <p>{userError}</p>}
            {errorFile && <p>{errorFile}</p>}
            {userLoading || isLoadingFile ? (
              <Loader />
            ) : (
              <div className={UserProfileStyle.userInfo}>
                {editMode ? (
                  <form onSubmit={handleSubmit(handleSave)}>
                    <div className={UserProfileStyle.formGroup}>
                      <label>Full Name:</label>
                      <input type="text" {...register("fullName")} />
                    </div>

                    <div className={UserProfileStyle.formGroup}>
                      <label>username:</label>
                      <input type="text" {...register("username")} />
                    </div>

                    <p>Email: {userData.email}</p>

                    <div className={UserProfileStyle.buttonContainer}>
                      <button type="submit" className={UserProfileStyle.saveBtn}>
                        Save
                      </button>
                    </div>

                    <div>
                      {formState.errors.fullName && (
                        <>
                          <div className="text-danger">{formState.errors.fullName.message}</div>
                          <div className="text-danger">{formState.errors.username?.message}</div>
                        </>
                      )}
                    </div>
                  </form>
                ) : (
                  <>
                    <h2>{userData.fullName}</h2>
                    <p>User Name: {userData.username}</p>
                    <p>Email: {userData.email}</p>

                    <div className={UserProfileStyle.buttonContainer}>
                      <button className={UserProfileStyle.editBtn} onClick={() => setEditMode(true)}>
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className={UserProfileStyle.imageContainer}>
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <img src={userData.imgUrl ? userData.imgUrl : Avatar} alt="User" className={UserProfileStyle.profilePic} />
              {/* <input
                className={UserProfileStyle.uploadPicInput}
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <FontAwesomeIcon
                className={UserProfileStyle.uploadPicIcon}
                onClick={() => fileInputRef.current?.click()}
                icon={faImage}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
