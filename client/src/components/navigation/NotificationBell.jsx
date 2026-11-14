import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import notificationService from '../../services/notificationService';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const response = await notificationService.list();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Notifications are unavailable.');
    }
  };

  useEffect(() => {
    let mounted = true;

    notificationService
      .list()
      .then((response) => {
        if (!mounted) return;
        setNotifications(response.data?.notifications || []);
        setUnreadCount(response.data?.unreadCount || 0);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || 'Notifications are unavailable.');
      });

    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications((current) =>
        [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 20)
      );
      if (!notification.readAt) setUnreadCount((count) => count + 1);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      try {
        await notificationService.markRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.message || 'Could not mark notification as read.');
      }
    }
    setOpen(false);
    if (notification.href) navigate(notification.href);
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not mark notifications as read.');
    }
  };

  return (
    <div className="notification-menu">
      <Button
        className="notification-trigger"
        variant="outline"
        size="sm"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) refresh();
        }}
      >
        <span aria-hidden="true">🔔</span>
        <span className="notification-trigger-label">Notifications</span>
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </Button>

      {open && (
        <section className="notification-panel" aria-label="Notifications">
          <div className="notification-panel-header">
            <h2>Notifications</h2>
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
          </div>

          {error && (
            <p className="notification-error" role="alert">
              {error}
            </p>
          )}

          <div className="notification-items">
            {notifications.map((item) => (
              <button
                type="button"
                className={`notification-item ${item.readAt ? '' : 'unread'}`}
                key={item.id}
                onClick={() => openNotification(item)}
              >
                <span className="notification-item-title">{item.title}</span>
                <span>{item.message}</span>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
              </button>
            ))}
            {!notifications.length && <p className="notification-empty">You’re all caught up.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
