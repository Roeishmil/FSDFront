import { useState } from "react";
import { Plus, SaveIcon, Trash2 } from "lucide-react";
import styles from './Notifications.module.css';


type Notification = {
  id: number;
  subject: string;
  day: string;
  time: string;
};

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, subject: "Weekly summary", day: "Monday", time: "09:00" },
    { id: 2, subject: "New content alert", day: "Wednesday", time: "14:30" },
  ]);

  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    subject: "",
    day: "Sunday",
    time: "12:00",
  });

  const handleAdd = () => {
    if (!newNotification.subject || !newNotification.time || !newNotification.day) return;
    const newId = Date.now();
    setNotifications([
      ...notifications,
      { id: newId, subject: newNotification.subject, day: newNotification.day, time: newNotification.time },
    ]);
    setNewNotification({ subject: "", day: "Sunday", time: "12:00" });
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.subject}>Notifications</h1>
      </div>

      <div className={styles.pageHeader}>
        <div className="grid grid-cols-4 items-center">
          <input
            type="text"
            placeholder="Subject"
            value={newNotification.subject}
            onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })}
            className="border p-2 col-span-1"
          />
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
            value={newNotification.time}
            onChange={(e) => setNewNotification({ ...newNotification, time: e.target.value })}
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
          <div key={notif.id} className={styles.notificationitem}>
            <div>
              <h2 className="font-medium">{notif.subject}</h2>
              <p className={styles.time}>{notif.day}, {notif.time}</p>
            </div>
            <button
              onClick={() => handleDelete(notif.id)}
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
