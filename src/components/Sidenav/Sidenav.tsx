import { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Book,
  User,
  LogOut,
  MenuSquare,
} from "lucide-react";
import styles from "./Sidenav.module.css";
import useUser from "../../hooks/useUser";
import Logo from "../../assets/Logo.png";

const Sidenav: FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
        <img src={Logo} alt="Logo" style={{ width: 30, height: 30 }}/>
        <span>Why Not 100?</span>
      </div>

      {/* ─── Current user (mini card) ─── */}
      {user && (
        <div className={styles.userCard}>
          <p className={styles.userName}>{user.fullName}</p>
          <p className={styles.userEmail}>{user.email}</p>
        </div>
      )}

      {/* ─── Nav links ─── */}
      <nav className={styles.nav}>
        <Link
          to="/"
          className={`${styles.link} ${
            pathname === "/" ? styles.active : ""
          }`}
        >
          <Home size={18} />
          Profile
        </Link>

        <Link
          to="/generate"
          className={`${styles.link} ${
            pathname.startsWith("/generate") ? styles.active : ""
          }`}
        >
          <FileText size={18} />
          Generated&nbsp;Content
        </Link>

        <Link
          to="/subjects"
          className={`${styles.link} ${
            pathname.startsWith("/subjects") ? styles.active : ""
          }`}
        >
          <Book size={18} />
          Subjects
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
