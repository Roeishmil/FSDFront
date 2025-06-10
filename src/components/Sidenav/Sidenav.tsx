import { FC, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Book,
  User,
  Bell,
  LogOut,
  Share2,
  SquarePen,
  TextSelect,
  PlusCircle,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import styles from "./Sidenav.module.css";
import useUser from "../../hooks/useUser";
import Logo from "../../assets/Logo.png";

const Sidenav: FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(undefined);
    navigate("/login");
  };

  return (
    <aside className={styles.sidebar}>
      {/* ─── Brand ─── */}
      <div className={styles.brand}>
        <img src={Logo} alt="Logo" style={{ width: 30, height: 30 }} />
        <span>Why Not 100?</span>
      </div>

      {/* ─── Current user ─── */}
      {user && (
        <div className={styles.userCard}>
          <p className={styles.userName}>{user.fullName}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <nav className={styles.nav}>
        <Link to="/profile" className={`${styles.link} ${pathname.startsWith("/profile") ? styles.active : ""}`}>
          <User size={18} />
          Profile
        </Link>

        <Link to="/" className={`${styles.link} ${pathname === "/" ? styles.active : ""}`}>
          <Book size={18} />
          Subjects
        </Link>

        {/* ─── Create Section ─── */}
        <div className={styles.generateGroup}>
          <button
            className={`${styles.link} ${
              pathname.startsWith("/generate-test") || pathname.startsWith("/generate-summary") ? styles.active : ""
            }`}
            onClick={() => setIsCreateOpen(!isCreateOpen)}
          >
            <PlusCircle size={18} />
            Create
            {isCreateOpen ? (
              <ChevronDown size={16} className={styles.chevron} />
            ) : (
              <ChevronRight size={16} className={styles.chevron} />
            )}
          </button>
          {isCreateOpen && (
            <div className={styles.submenu}>
              <Link
                to="/generate-test"
                className={`${styles.sublink} ${pathname.startsWith("/generate-test") ? styles.subactive : ""}`}
              >
                <SquarePen size={16} />
                Create Exam
              </Link>
              <Link
                to="/generate-summary"
                className={`${styles.sublink} ${pathname.startsWith("/generate-summary") ? styles.subactive : ""}`}
              >
                <TextSelect size={16} />
                Create Summary
              </Link>
            </div>
          )}
        </div>

        {/* ─── Generated Content Section ─── */}
        <div className={styles.generateGroup}>
          <button
            className={`${styles.link} ${
              pathname.startsWith("/generated-content") || pathname.startsWith("/shared-content") ? styles.active : ""
            }`}
            onClick={() => setIsGenerateOpen(!isGenerateOpen)}
          >
            <Layers size={18} />
            Content
            {isGenerateOpen ? (
              <ChevronDown size={16} className={styles.chevron} />
            ) : (
              <ChevronRight size={16} className={styles.chevron} />
            )}
          </button>
          {isGenerateOpen && (
            <div className={styles.submenu}>
              <Link
                to="/generated-content"
                className={`${styles.sublink} ${pathname.startsWith("/generated-content") ? styles.subactive : ""}`}
              >
                <FileText size={16} />
                Generated Content
              </Link>
              <Link
                to="/shared-content"
                className={`${styles.sublink} ${pathname.startsWith("/shared-content") ? styles.subactive : ""}`}
              >
                <Share2 size={16} />
                Shared Content
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/notifications"
          className={`${styles.link} ${pathname.startsWith("/notifications") ? styles.active : ""}`}
        >
          <Bell size={18} />
          Notifications
        </Link>
      </nav>

      {/* ─── Logout ─── */}
      <button onClick={handleLogout} className={styles.logout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
};

export default Sidenav;
