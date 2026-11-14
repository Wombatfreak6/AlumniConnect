import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { eventService, mentorshipService } from '../../services/communityService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './CommunityPages.css';

const eventCategories = ['WEBINAR', 'WORKSHOP', 'REUNION', 'NETWORKING', 'CAREER_FAIR', 'TALK', 'OTHER'];
const eventTypes = ['VIRTUAL', 'IN_PERSON', 'HYBRID'];
const emptySlotForm = { topic: '', expertise: '', description: '', startTime: '', endTime: '' };
const emptyEventForm = {
  title: '',
  description: '',
  category: 'WORKSHOP',
  location: '',
  eventType: 'VIRTUAL',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  capacity: '',
};

const dateTime = (value) =>
  new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const displayEnum = (value) => value.replace('_', ' ');

// Convert an ISO timestamp to the local value expected by datetime-local inputs.
const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

function useLoad(loader, loadKey = '') {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load this page.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadKey, refreshKey]);

  return {
    data,
    error,
    loading,
    refresh: () => setRefreshKey((key) => key + 1),
    setError,
  };
}

export function MentorshipPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({});
  const [notice, setNotice] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const { data, error, loading, refresh, setError } = useLoad(
    () => mentorshipService.getSlots(search ? { skill: search, expertise: search } : {}),
    search
  );

  const requestSlot = async (slotId) => {
    setSubmittingId(slotId);
    try {
      await mentorshipService.request(slotId, drafts[slotId] || '');
      setNotice('Your mentorship request was sent.');
      setDrafts((current) => ({ ...current, [slotId]: '' }));
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const slots = data?.data?.slots || [];

  return (
    <section className="community-page">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">CAREER GUIDANCE</span>
          <h1>Find a mentor</h1>
          <p>Browse alumni office hours and request a focused conversation.</p>
        </div>
        <Link to={user?.role === 'ALUMNI' ? '/mentorship/manage' : '/mentorship/requests'}>
          <Button variant="outline">
            {user?.role === 'ALUMNI' ? 'Manage availability' : 'My requests'}
          </Button>
        </Link>
      </header>

      <Input
        label="Search by skill, industry, company, or topic"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="e.g. product design, finance"
      />

      {notice && <p className="community-notice">{notice}</p>}
      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Loading message="Finding available mentors…" />
      ) : (
        <div className="community-grid">
          {slots.map((slot) => {
            const alreadyRequested = slot.requests?.length > 0;
            return (
              <article className="community-card" key={slot.id}>
                <div className="community-card-top">
                  <span className="badge badge-success">AVAILABLE</span>
                  <span>{dateTime(slot.startTime)}</span>
                </div>
                <h2>
                  <Link to={`/mentorship/slots/${slot.id}`}>{slot.topic}</Link>
                </h2>
                <h3>{slot.alumni.name}</h3>
                <p>{slot.description || 'Connect with an experienced alumni mentor.'}</p>
                <p>
                  <strong>Expertise:</strong>{' '}
                  {slot.expertise || slot.alumni.profile?.industry || 'General career guidance'}
                </p>
                {slot.alumni.profile?.company && (
                  <p>
                    {slot.alumni.profile.designation} at {slot.alumni.profile.company}
                  </p>
                )}
                <Link className="community-link" to={`/mentorship/slots/${slot.id}`}>
                  View mentor and slot details →
                </Link>
                {user?.role === 'STUDENT' &&
                  (alreadyRequested ? (
                    <span className="badge">{slot.requests[0].status}</span>
                  ) : (
                    <div className="community-actions">
                      <Textarea
                        label="What would you like help with?"
                        value={drafts[slot.id] || ''}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [slot.id]: event.target.value }))
                        }
                        maxLength={1000}
                        rows={2}
                      />
                      <Button
                        onClick={() => requestSlot(slot.id)}
                        isLoading={submittingId === slot.id}
                      >
                        Request session
                      </Button>
                    </div>
                  ))}
              </article>
            );
          })}
          {!slots.length && (
            <p className="community-empty">No upcoming mentorship slots match your search.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function MentorshipDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { data, error, loading, setError, refresh } = useLoad(
    () => mentorshipService.getSlot(id),
    id
  );
  const slot = data?.data?.slot;

  const requestSlot = async () => {
    if (!slot) return;
    setSubmitting(true);
    try {
      await mentorshipService.request(slot.id, message);
      setNotice('Your mentorship request was sent.');
      setMessage('');
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading mentor details…" />;
  if (!slot) {
    return (
      <section className="community-page">
        {error && <ErrorAlert message={error} />}
        <Link to="/mentorship">Back to mentors</Link>
      </section>
    );
  }

  return (
    <section className="community-page community-narrow">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">MENTOR PROFILE</span>
          <h1>{slot.alumni.name}</h1>
        </div>
        <Link to="/mentorship">
          <Button variant="outline">All mentors</Button>
        </Link>
      </header>

      {error && <ErrorAlert message={error} />}
      {notice && <p className="community-notice">{notice}</p>}

      <article className="community-card">
        <h2>{slot.topic}</h2>
        <p>
          <strong>When:</strong> {dateTime(slot.startTime)} – {dateTime(slot.endTime)}
        </p>
        <p>{slot.description || 'Connect with an experienced alumni mentor.'}</p>
        <p>
          <strong>Expertise:</strong>{' '}
          {slot.expertise || slot.alumni.profile?.industry || 'General career guidance'}
        </p>
        <p>
          <strong>Industry:</strong> {slot.alumni.profile?.industry || 'Not specified'}
        </p>
        <p>
          <strong>Company:</strong> {slot.alumni.profile?.company || 'Not specified'}
          {slot.alumni.profile?.designation ? ` · ${slot.alumni.profile.designation}` : ''}
        </p>
        <p>
          <strong>Branch:</strong> {slot.alumni.profile?.branch || 'Not specified'}
          {slot.alumni.profile?.graduationYear
            ? ` · Class of ${slot.alumni.profile.graduationYear}`
            : ''}
        </p>
        <p>{slot.alumni.profile?.bio || ''}</p>

        <div className="community-actions-inline">
          {(slot.alumni.userSkills || []).map(({ skill }) => (
            <span className="badge" key={skill.id}>
              {skill.name}
            </span>
          ))}
        </div>

        {user?.role === 'STUDENT' &&
          (slot.requests?.length ? (
            <p className="community-notice">
              Your request status: <strong>{slot.requests[0].status}</strong>.{' '}
              <Link to="/mentorship/requests">Track your requests</Link>
            </p>
          ) : (
            <div className="community-actions">
              <Textarea
                label="What would you like help with?"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1000}
                rows={3}
              />
              <Button onClick={requestSlot} isLoading={submitting}>
                Request this session
              </Button>
            </div>
          ))}
      </article>
    </section>
  );
}

export function MentorshipManagePage() {
  const { user } = useAuth();
  const isAlumni = user?.role === 'ALUMNI';
  const isStudent = user?.role === 'STUDENT';

  const loader = async () => {
    if (isStudent) {
      const response = await mentorshipService.getSent();
      return { requests: response.data?.requests || [], slots: [] };
    }
    if (!isAlumni) {
      const response = await mentorshipService.getReceived();
      return { requests: response.data?.requests || [], slots: [] };
    }
    const [slotsResponse, requestsResponse] = await Promise.all([
      mentorshipService.getMySlots(),
      mentorshipService.getReceived(),
    ]);
    return {
      slots: slotsResponse.data?.slots || [],
      requests: requestsResponse.data?.requests || [],
    };
  };

  const { data, error, loading, refresh, setError } = useLoad(loader, user?.role);
  const [form, setForm] = useState(emptySlotForm);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');

  const submitSlot = async (event) => {
    event.preventDefault();
    try {
      const body = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      if (editingId) {
        await mentorshipService.updateSlot(editingId, body);
        setNotice('Mentorship slot updated.');
      } else {
        await mentorshipService.createSlot(body);
        setNotice('Availability published.');
      }
      setForm(emptySlotForm);
      setEditingId(null);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateRequest = async (id, status) => {
    try {
      await mentorshipService.updateRequest(id, status);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const cancelSlot = async (id) => {
    try {
      await mentorshipService.deleteSlot(id);
      setNotice('Mentorship slot cancelled.');
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const editSlot = (slot) => {
    setEditingId(slot.id);
    setForm({
      topic: slot.topic,
      expertise: slot.expertise || '',
      description: slot.description || '',
      startTime: toLocalInput(slot.startTime),
      endTime: toLocalInput(slot.endTime),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const heading = isAlumni
    ? 'Mentorship availability'
    : isStudent
      ? 'My mentorship requests'
      : 'Incoming mentorship requests';
  const subtitle = isAlumni
    ? 'Publish office hours and manage your own slots and student requests.'
    : isStudent
      ? 'Track or cancel requests you sent to alumni.'
      : 'Review requests sent to mentorship slots on the platform.';

  return (
    <section className="community-page">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">MENTORSHIP</span>
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>
        <Link to="/mentorship">
          <Button variant="outline">Browse mentors</Button>
        </Link>
      </header>

      {notice && <p className="community-notice">{notice}</p>}
      {error && <ErrorAlert message={error} />}

      {isAlumni && (
        <form className="community-form" onSubmit={submitSlot}>
          <h2>{editingId ? 'Edit mentorship slot' : 'Offer a mentorship slot'}</h2>
          <Input
            label="Topic"
            required
            minLength={3}
            maxLength={160}
            value={form.topic}
            onChange={(event) => setForm({ ...form, topic: event.target.value })}
          />
          <Input
            label="Expertise"
            maxLength={1000}
            value={form.expertise}
            onChange={(event) => setForm({ ...form, expertise: event.target.value })}
          />
          <Textarea
            label="Description"
            maxLength={1000}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="community-form-grid">
            <Input
              label="Starts"
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
            />
            <Input
              label="Ends"
              type="datetime-local"
              required
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
            />
          </div>
          <div className="community-actions-inline">
            <Button type="submit">{editingId ? 'Save slot' : 'Publish availability'}</Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptySlotForm);
                }}
              >
                Stop editing
              </Button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <Loading message="Loading mentorship activity…" />
      ) : (
        <>
          {isAlumni && (
            <>
              <h2>Your upcoming slots</h2>
              <div className="community-list">
                {(data?.slots || []).map((slot) => (
                  <article className="community-row" key={slot.id}>
                    <div>
                      <h3>{slot.topic}</h3>
                      <p>
                        {dateTime(slot.startTime)} – {dateTime(slot.endTime)}
                      </p>
                      <span className="badge">{slot.status}</span>
                    </div>
                    <div className="community-actions-inline">
                      {slot.status === 'AVAILABLE' && (
                        <>
                          <Button variant="outline" onClick={() => editSlot(slot)}>
                            Edit
                          </Button>
                          <Button variant="outline" onClick={() => cancelSlot(slot.id)}>
                            Cancel slot
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
                {!data?.slots?.length && (
                  <p className="community-empty">You have no upcoming mentorship slots.</p>
                )}
              </div>
            </>
          )}

          <h2>
            {isAlumni
              ? 'Requests for your slots'
              : isStudent
                ? 'Requests you sent'
                : 'Incoming requests'}
          </h2>
          <div className="community-list">
            {(data?.requests || []).map((item) => {
              const contact = isStudent ? item.slot.alumni : item.student;
              return (
                <article className="community-row" key={item.id}>
                  <div>
                    <h3>{item.slot.topic}</h3>
                    <p>
                      {dateTime(item.slot.startTime)} ·{' '}
                      {isStudent ? `Mentor: ${contact?.name}` : `Request from ${contact?.name}`}
                    </p>
                    {item.message && <p>{item.message}</p>}
                    <span className="badge">{item.status}</span>
                  </div>
                  <div className="community-actions-inline">
                    {item.status === 'PENDING' &&
                      (isStudent ? (
                        <Button
                          variant="outline"
                          onClick={() => updateRequest(item.id, 'CANCELLED')}
                        >
                          Cancel request
                        </Button>
                      ) : (
                        <>
                          <Button onClick={() => updateRequest(item.id, 'ACCEPTED')}>Accept</Button>
                          <Button
                            variant="outline"
                            onClick={() => updateRequest(item.id, 'REJECTED')}
                          >
                            Decline
                          </Button>
                        </>
                      ))}
                  </div>
                </article>
              );
            })}
            {!data?.requests?.length && <p className="community-empty">No mentorship requests.</p>}
          </div>
        </>
      )}
    </section>
  );
}

export function EventsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [notice, setNotice] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const { data, error, loading, refresh, setError } = useLoad(
    () => eventService.getEvents({ search, category }),
    `${search}\u0000${category}`
  );

  const register = async (id) => {
    setSubmittingId(id);
    try {
      await eventService.register(id);
      setNotice('You are registered for this event.');
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const events = data?.data?.events || [];

  return (
    <section className="community-page">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">CAMPUS COMMUNITY</span>
          <h1>Events</h1>
          <p>Workshops, networking sessions, talks, and career events.</p>
        </div>
        {['ALUMNI', 'ADMIN'].includes(user?.role) && (
          <Link to="/events/create">
            <Button>+ Create event</Button>
          </Link>
        )}
        <Link to="/events/my">
          <Button variant="outline">My events</Button>
        </Link>
      </header>

      <div className="community-filters">
        <Input
          label="Search events"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Title, description, or location"
        />
        <label className="community-field">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {eventCategories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      {notice && <p className="community-notice">{notice}</p>}
      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Loading message="Loading events…" />
      ) : (
        <div className="community-grid">
          {events.map((event) => (
            <article className="community-card" key={event.id}>
              <div className="community-card-top">
                <span className="badge badge-primary">{displayEnum(event.category)}</span>
                <span>{displayEnum(event.eventType)}</span>
              </div>
              <h2>
                <Link to={`/events/${event.id}`}>{event.title}</Link>
              </h2>
              <p>{event.description}</p>
              <p>📅 {dateTime(event.startDate)}</p>
              <p>📍 {event.location}</p>
              <p>
                {event._count?.registrations || 0}
                {event.capacity ? ` / ${event.capacity}` : ''} registered
              </p>
              <div className="community-actions-inline">
                <Button
                  onClick={() => register(event.id)}
                  disabled={user?.role === 'ADMIN'}
                  isLoading={submittingId === event.id}
                >
                  Register
                </Button>
                <Link to={`/events/${event.id}`} className="community-link">
                  Details
                </Link>
              </div>
            </article>
          ))}
          {!events.length && <p className="community-empty">No upcoming events found.</p>}
        </div>
      )}
    </section>
  );
}

export function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [form, setForm] = useState(emptyEventForm);

  useEffect(() => {
    if (!id) return;
    let active = true;
    eventService
      .getEvent(id)
      .then(({ data }) => {
        if (!active) return;
        const event = data.event;
        setForm({
          title: event.title,
          description: event.description,
          category: event.category,
          location: event.location,
          eventType: event.eventType,
          startDate: toLocalInput(event.startDate),
          endDate: toLocalInput(event.endDate),
          registrationDeadline: toLocalInput(event.registrationDeadline),
          capacity: event.capacity ?? '',
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const submitEvent = async (event) => {
    event.preventDefault();
    try {
      const body = {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        eventType: form.eventType,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationDeadline: form.registrationDeadline
          ? new Date(form.registrationDeadline).toISOString()
          : null,
        capacity: form.capacity ? Number(form.capacity) : null,
      };
      const result = id
        ? await eventService.update(id, body)
        : await eventService.create(body);
      navigate(`/events/${result.data.event.id}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <Loading message="Loading event…" />;

  return (
    <section className="community-page community-narrow">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">EVENTS</span>
          <h1>{id ? 'Edit event' : 'Create an event'}</h1>
        </div>
        <Link to="/events">
          <Button variant="outline">Back to events</Button>
        </Link>
      </header>

      {error && <ErrorAlert message={error} />}

      <form className="community-form" onSubmit={submitEvent}>
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Textarea
          label="Description"
          required
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="community-form-grid">
          <label className="community-field">
            Category
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {eventCategories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="community-field">
            Format
            <select
              value={form.eventType}
              onChange={(event) => setForm({ ...form, eventType: event.target.value })}
            >
              {eventTypes.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <Input
          label="Location or meeting link"
          required
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
        />
        <div className="community-form-grid">
          <Input
            label="Starts"
            type="datetime-local"
            required
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />
          <Input
            label="Ends"
            type="datetime-local"
            required
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
          <Input
            label="Registration deadline"
            type="datetime-local"
            value={form.registrationDeadline}
            onChange={(event) => setForm({ ...form, registrationDeadline: event.target.value })}
          />
          <Input
            label="Capacity (optional)"
            type="number"
            min="1"
            value={form.capacity}
            onChange={(event) => setForm({ ...form, capacity: event.target.value })}
          />
        </div>
        <Button type="submit">{id ? 'Save event' : 'Publish event'}</Button>
      </form>
    </section>
  );
}

export function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const { data, error, loading, refresh, setError } = useLoad(
    () => eventService.getEvent(id),
    id
  );
  const event = data?.data?.event;
  const ownsEvent = event && (event.organizerId === user?.id || user?.role === 'ADMIN');
  const registered = event?.registrations?.[0]?.status === 'REGISTERED';

  const loadParticipants = async () => {
    try {
      const result = await eventService.participants(id);
      setParticipants(result.data.participants);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const act = async (action) => {
    try {
      await action(id);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <Loading message="Loading event details…" />;
  if (!event) {
    return (
      <section className="community-page">
        {error && <ErrorAlert message={error} />}
        <Link to="/events">Back to events</Link>
      </section>
    );
  }

  return (
    <section className="community-page community-narrow">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">{displayEnum(event.category)}</span>
          <h1>{event.title}</h1>
        </div>
        <Link to="/events">
          <Button variant="outline">All events</Button>
        </Link>
      </header>

      {error && <ErrorAlert message={error} />}

      <article className="community-card">
        <p>{event.description}</p>
        <p>
          <strong>When:</strong> {dateTime(event.startDate)} – {dateTime(event.endDate)}
        </p>
        <p>
          <strong>Where:</strong> {event.location} · {displayEnum(event.eventType)}
        </p>
        <p>
          <strong>Organizer:</strong> {event.organizer.name}
        </p>
        <p>
          <strong>Participants:</strong> {event._count?.registrations || 0}
          {event.capacity ? ` / ${event.capacity}` : ''}
        </p>
        <div className="community-actions-inline">
          {user?.role !== 'ADMIN' &&
            (registered ? (
              <Button variant="outline" onClick={() => act(eventService.cancel)}>
                Cancel registration
              </Button>
            ) : (
              <Button onClick={() => act(eventService.register)}>Register</Button>
            ))}
          {ownsEvent && (
            <>
              <Link to={`/events/${id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <Button variant="outline" onClick={loadParticipants}>
                View participants
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  act(async () => {
                    await eventService.remove(id);
                    navigate('/events');
                  })
                }
              >
                Delete event
              </Button>
            </>
          )}
        </div>
      </article>

      {participants.length > 0 && (
        <section className="community-list">
          <h2>Registered participants</h2>
          {participants.map((participant) => (
            <div className="community-row" key={participant.id}>
              <strong>{participant.user.name}</strong>
              <span>
                {participant.user.role} · {participant.user.profile?.branch || 'Branch not specified'}
              </span>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}

export function MyEventsPage() {
  const { data, error, loading, refresh, setError } = useLoad(() => eventService.mine(), 'mine');

  const cancel = async (id) => {
    try {
      await eventService.cancel(id);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const registrations = data?.data?.registrations || [];

  return (
    <section className="community-page">
      <header className="community-header">
        <div>
          <span className="badge badge-primary">YOUR SCHEDULE</span>
          <h1>My events</h1>
          <p>Events you have registered to attend.</p>
        </div>
        <Link to="/events">
          <Button variant="outline">Browse events</Button>
        </Link>
      </header>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Loading message="Loading your events…" />
      ) : (
        <div className="community-list">
          {registrations.map(({ event, status }) => (
            <article className="community-row" key={event.id}>
              <div>
                <h2>
                  <Link to={`/events/${event.id}`}>{event.title}</Link>
                </h2>
                <p>
                  {dateTime(event.startDate)} · {event.location}
                </p>
                <span className="badge">{status}</span>
              </div>
              {status === 'REGISTERED' && (
                <Button variant="outline" onClick={() => cancel(event.id)}>
                  Cancel
                </Button>
              )}
            </article>
          ))}
          {!registrations.length && (
            <p className="community-empty">You have no event registrations yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
