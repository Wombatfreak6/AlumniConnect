import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const notificationService = {
  list: (limit = 20) => api.get(`/notifications?limit=${limit}`),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  subscribe(onNotification) {
    const stream = new EventSource(`${API_BASE_URL}/notifications/stream`, {
      withCredentials: true,
    });
    stream.addEventListener('notification', (event) => {
      try {
        onNotification(JSON.parse(event.data));
      } catch {
        // Ignore malformed stream payloads.
      }
    });
    return () => stream.close();
  },
};

export default notificationService;
