import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "./Notifications.module.css";
import {notificationApi} from "../../api";
import {ISubject} from "../../Interfaces"
import useUser from"../../hooks/useUser";

type Notification = {
  _id: string;
  subjectId: string;
  day: string;
  time: {
    hour: number;
    minute: number;
  };
  userId: string;
};

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const NotificationsPage = () => {
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    subjectId: "",
    day: "Sunday",
    time: {hour: 12, minute: 0 },
  });
  const [subjects, setSubjects] = useState<ISubject[]>([]);

  // טען מהשרת בעת טעינת הדף
  useEffect(() => {
    notificationApi.getNotificationsByUserId(user.user?._id||"name")
      .then((res) => setNotifications(res))
      .catch((err) => console.error("שגיאה בטעינת התראות", err));

    notificationApi.getSubjectsByUserId(user.user?._id||"")
      .then((res) => setSubjects(res))
      .catch((err) => console.error("שגיאה בטעינת נושאים", err));
  }, [user.user?._id]);

  const handleAdd = async () => {
    if (!newNotification.subjectId) {
      alert("Please Select Subject");
      return;
    }
    if (!newNotification.time || !newNotification.day) return;
    try {
      const res = await notificationApi.createNotification({
        subjectId: newNotification.subjectId,
        day: newNotification.day,
        time: {
          hour: newNotification.time?.hour!,
          minute: newNotification.time?.minute!,
        },
        userId: user.user?._id||"",
      } as Omit<Notification, "_id">);
      setNotifications([...notifications, res]);
      setNewNotification({ subjectId: "", day: "Sunday", time: {hour:12,minute:0} });
    } catch (err) {
      console.error("שגיאה ביצירת התראה", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error("שגיאה במחיקת התראה", err);
    }
  };
  const getSubjectTitle = (subjectId: string) => {  
    const subject = subjects.find(s => s._id === subjectId);
    console.log(subject);
    return subject?.title || subjectId;
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.subject}>Notifications</h1>
      </div>

      <div className={styles.pageHeader}>
        <div className="grid grid-cols-4 items-center">
          <select
            value={newNotification.subjectId}
            onChange={(e) => setNewNotification({ ...newNotification, subjectId: e.target.value })}
            className="border p-2 col-span-1"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.title}
              </option>
            ))}
          </select>

          <select
            value={newNotification.day}
            onChange={(e) => setNewNotification({ ...newNotification, day: e.target.value })}
            className="border p-2 col-span-1"
          >
            {daysOfWeek.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            value={`${newNotification.time?.hour?.toString().padStart(2, "0") || "12"}:${newNotification.time?.minute?.toString().padStart(2, "0") || "00"}`}
            onChange={(e) => {
                      const [hour, minute] = e.target.value.split(":").map(Number);
                      setNewNotification({
                        ...newNotification,
                        time: { hour, minute }
                      });
                    }}
            className="border p-2 col-span-1"
          />
        </div>
        <button
          onClick={handleAdd}
          className={styles.addButton}>
          <Plus size={18} /> Add Notification
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.map((notif) => (
          <div key={notif._id} className={styles.notificationitem}>
            <div>
              <h2 className="font-medium">{getSubjectTitle(notif.subjectId)}</h2>
              <p className={styles.time}>
                {notif.day}, {notif.time.hour.toString().padStart(2, '0')}:{notif.time.minute.toString().padStart(2, '0')}
              </p>
            </div>
            <button
              onClick={() => handleDelete(notif._id)}
              className={styles.deleteButton}
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
