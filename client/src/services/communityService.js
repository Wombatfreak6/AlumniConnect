import api from './api';

function queryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.size ? `?${params}` : '';
}

export const mentorshipService = {
  getSlots: (filters = {}) => api.get(`/mentorship/slots${queryString(filters)}`),
  getMySlots: () => api.get('/mentorship/slots/my'),
  getSlot: (id) => api.get(`/mentorship/slots/${id}`),
  createSlot: (body) => api.post('/mentorship/slots', body),
  updateSlot: (id, body) => api.put(`/mentorship/slots/${id}`, body),
  deleteSlot: (id) => api.delete(`/mentorship/slots/${id}`),
  request: (slotId, message) => api.post('/mentorship/requests', { slotId, message }),
  getSent: () => api.get('/mentorship/requests/sent'),
  getReceived: () => api.get('/mentorship/requests/received'),
  updateRequest: (id, status) => api.patch(`/mentorship/requests/${id}/status`, { status }),
};

export const eventService = {
  getEvents: (filters = {}) => api.get(`/events${queryString(filters)}`),
  getEvent: (id) => api.get(`/events/${id}`),
  create: (body) => api.post('/events', body),
  update: (id, body) => api.put(`/events/${id}`, body),
  remove: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`),
  cancel: (id) => api.delete(`/events/${id}/register`),
  mine: () => api.get('/events/my-events'),
  participants: (id) => api.get(`/events/${id}/participants`),
};
