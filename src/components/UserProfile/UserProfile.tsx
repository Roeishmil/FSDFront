import { FC, useEffect, useRef, useState } from "react";
import UserProfileStyle from "./UserProfile.module.css";
import Avatar from "../../assets/avatar.png";
import { INTINAL_DATA_USER, IUser } from "../../Interfaces";
import axios from "axios";
import Loader from "../Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import PostsPage from "../Posts/PostsPage";
import useUser from "../../hooks/useUser";

const UserProfile: FC = () => {
  const { user: fetchedUser, isLoading: userLoading, error: userError, updateUser } = useUser();
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState<IUser>(fetchedUser || INTINAL_DATA_USER);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fetchedUser) {
      setUserData(fetchedUser);
    }
  }, [fetchedUser]);

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
      formData.append("userId", userData._id ?? "");

      try {
        const response = await axios.post("http://localhost:3000/file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("File uploaded successfully:", response.data);
        setUserData(response.data.user);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const updatedUser = await updateUser(userData);
    if (updatedUser) {
      setUserData(updatedUser);
      setEditMode(false);
    }
  };

  return (
    <>
      <div className={UserProfileStyle.pageContainer}>
        <div className={UserProfileStyle.profileContainer}>
          <div>
            {userError && <p>{userError}</p>}
            {userLoading ? (
              <Loader />
            ) : (
              <div className={UserProfileStyle.userInfo}>
                {editMode ? (
                  <>
                    <div className={UserProfileStyle.formGroup}>
                      <label>Full Name:</label>
                      <input type="text" name="fullName" value={userData.fullName} onChange={handleChange} />
                    </div>

                    <div className={UserProfileStyle.formGroup}>
                      <label>Username:</label>
                      <input type="text" name="userName" value={userData.userName} onChange={handleChange} />
                    </div>
                  </>
                ) : (
                  <>
                    <h2>{userData.fullName}</h2>
                    <p>User Name: {userData.userName}</p>
                  </>
                )}
                <p>Email: {userData.email}</p>

                <div className={UserProfileStyle.buttonContainer}>
                  {editMode ? (
                    <button className={UserProfileStyle.saveBtn} onClick={handleSave}>
                      Save
                    </button>
                  ) : (
                    <button className={UserProfileStyle.editBtn} onClick={() => setEditMode(true)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={UserProfileStyle.imageContainer}>
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <img src={userData.imgUrl ? userData.imgUrl : Avatar} alt="User" className={UserProfileStyle.profilePic} />

              <input
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
              />
            </div>
          </div>
        </div>
      </div>
      <PostsPage userPosts={true} />
    </>
  );
};

export default UserProfile;
