export default function Notification({ notification }) {
  if (!notification) return null;

  return (
    <div className={`notification notification--${notification.type}`}>
      <span>{notification.type === "error" ? "✕" : "✓"}</span> {notification.msg}
    </div>
  );
}
