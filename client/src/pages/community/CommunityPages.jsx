import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { eventService, mentorshipService } from '../../services/communityService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './CommunityPages.css';

const dateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
function useLoad(loader, deps = []) {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const refresh = async () => { setLoading(true); try { setData(await loader()); setError(''); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { refresh(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading, refresh, setError };
}

export function MentorshipPage() {
  const { user } = useAuth(); const [search, setSearch] = useState(''); const [message, setMessage] = useState(''); const [notice, setNotice] = useState('');
  const { data, error, loading, refresh, setError } = useLoad(() => mentorshipService.getSlots(search ? { skill: search, expertise: search } : {}), [search]);
  const request = async (slotId) => { try { await mentorshipService.request(slotId, message); setNotice('Your mentorship request was sent.'); setMessage(''); await refresh(); } catch (e) { setError(e.message); } };
  return <section className="community-page"><header className="community-header"><div><span className="badge badge-primary">CAREER GUIDANCE</span><h1>Find a mentor</h1><p>Browse alumni office hours and request a focused conversation.</p></div><Link to={user?.role === 'ALUMNI' ? '/mentorship/manage' : '/mentorship/requests'}><Button variant="outline">{user?.role === 'ALUMNI' ? 'Manage availability' : 'My requests'}</Button></Link></header>
    <Input label="Search by skill, industry, company, or topic" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. product design, finance" />{notice && <p className="community-notice">{notice}</p>}{error && <ErrorAlert message={error} />}{loading ? <Loading text="Finding available mentors…" /> : <div className="community-grid">{(data?.data?.slots || []).map((slot) => <article className="community-card" key={slot.id}><div className="community-card-top"><span className="badge badge-success">AVAILABLE</span><span>{dateTime(slot.startTime)}</span></div><h2><Link to={`/mentorship/slots/${slot.id}`}>{slot.topic}</Link></h2><h3>{slot.alumni.name}</h3><p>{slot.description || 'Connect with an experienced alumni mentor.'}</p><p><strong>Expertise:</strong> {slot.expertise || slot.alumni.profile?.industry || 'General career guidance'}</p>{slot.alumni.profile?.company && <p>{slot.alumni.profile.designation} at {slot.alumni.profile.company}</p>}<Link className="community-link" to={`/mentorship/slots/${slot.id}`}>View mentor and slot details →</Link>{user?.role === 'STUDENT' && (slot.requests?.length ? <span className="badge">{slot.requests[0].status}</span> : <div className="community-actions"><Textarea label="What would you like help with?" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={2} /><Button onClick={() => request(slot.id)}>Request session</Button></div>)}</article>)}{!data?.data?.slots?.length && <p className="community-empty">No upcoming mentorship slots match your search.</p>}</div>}</section>;
}

export function MentorshipDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const { data, error, loading, setError, refresh } = useLoad(() => mentorshipService.getSlot(id), [id]);
  const slot = data?.data?.slot;
  const request = async () => {
    try {
      await mentorshipService.request(slot.id, message);
      setNotice('Your mentorship request was sent.');
      setMessage('');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  if (loading) return <Loading text="Loading mentor details…" />;
  if (!slot) return <section className="community-page">{error && <ErrorAlert message={error} />}<Link to="/mentorship">Back to mentors</Link></section>;
  return <section className="community-page community-narrow">
    <header className="community-header"><div><span className="badge badge-primary">MENTOR PROFILE</span><h1>{slot.alumni.name}</h1></div><Link to="/mentorship"><Button variant="outline">All mentors</Button></Link></header>
    {error && <ErrorAlert message={error} />}{notice && <p className="community-notice">{notice}</p>}
    <article className="community-card"><h2>{slot.topic}</h2><p><strong>When:</strong> {dateTime(slot.startTime)} – {dateTime(slot.endTime)}</p><p>{slot.description || 'Connect with an experienced alumni mentor.'}</p><p><strong>Expertise:</strong> {slot.expertise || slot.alumni.profile?.industry || 'General career guidance'}</p><p><strong>Industry:</strong> {slot.alumni.profile?.industry || 'Not specified'}</p><p><strong>Company:</strong> {slot.alumni.profile?.company || 'Not specified'}{slot.alumni.profile?.designation ? ` · ${slot.alumni.profile.designation}` : ''}</p><p><strong>Branch:</strong> {slot.alumni.profile?.branch || 'Not specified'}{slot.alumni.profile?.graduationYear ? ` · Class of ${slot.alumni.profile.graduationYear}` : ''}</p><p>{slot.alumni.profile?.bio || ''}</p><div className="community-actions-inline">{(slot.alumni.userSkills || []).map(({ skill }) => <span className="badge" key={skill.id}>{skill.name}</span>)}</div>
      {user?.role === 'STUDENT' && (slot.requests?.length ? <p className="community-notice">Your request status: <strong>{slot.requests[0].status}</strong>. <Link to="/mentorship/requests">Track your requests</Link></p> : <div className="community-actions"><Textarea label="What would you like help with?" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} /><Button onClick={request}>Request this session</Button></div>)}
    </article>
  </section>;
}

export function MentorshipManagePage() {
  const { user } = useAuth();
  const alumni = user?.role === 'ALUMNI';
  const loader = async () => {
    if (user?.role === 'STUDENT') {
      const response = await mentorshipService.getSent();
      return { requests: response.data?.requests || [], slots: [] };
    }
    if (!alumni) {
      const response = await mentorshipService.getReceived();
      return { requests: response.data?.requests || [], slots: [] };
    }
    const [slotsResponse, requestsResponse] = await Promise.all([mentorshipService.getMySlots(), mentorshipService.getReceived()]);
    return { slots: slotsResponse.data?.slots || [], requests: requestsResponse.data?.requests || [] };
  };
  const { data, error, loading, refresh, setError } = useLoad(loader, [user?.role]);
  const emptyForm = { topic: '', expertise: '', description: '', startTime: '', endTime: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');
  const toLocalDateTime = (value) => {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() };
      if (editingId) await mentorshipService.updateSlot(editingId, body);
      else await mentorshipService.createSlot(body);
      setForm(emptyForm);
      setEditingId(null);
      setNotice(editingId ? 'Mentorship slot updated.' : 'Availability published.');
      await refresh();
    } catch (err) { setError(err.message); }
  };
  const act = async (id, status) => { try { await mentorshipService.updateRequest(id, status); await refresh(); } catch (e) { setError(e.message); } };
  const cancel = async (id) => { try { await mentorshipService.deleteSlot(id); setNotice('Mentorship slot cancelled.'); await refresh(); } catch (e) { setError(e.message); } };
  const editSlot = (slot) => {
    setEditingId(slot.id);
    setForm({ topic: slot.topic, expertise: slot.expertise || '', description: slot.description || '', startTime: toLocalDateTime(slot.startTime), endTime: toLocalDateTime(slot.endTime) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return <section className="community-page">
    <header className="community-header"><div><span className="badge badge-primary">MENTORSHIP</span><h1>{alumni ? 'Mentorship availability' : user?.role === 'STUDENT' ? 'My mentorship requests' : 'Incoming mentorship requests'}</h1><p>{alumni ? 'Publish office hours and manage your own slots and student requests.' : user?.role === 'STUDENT' ? 'Track or cancel requests you sent to Alumni.' : 'Review requests sent to mentorship slots on the platform.'}</p></div><Link to="/mentorship"><Button variant="outline">Browse mentors</Button></Link></header>
    {notice && <p className="community-notice">{notice}</p>}{error && <ErrorAlert message={error} />}
    {alumni && <form className="community-form" onSubmit={submit}><h2>{editingId ? 'Edit mentorship slot' : 'Offer a mentorship slot'}</h2><Input label="Topic" required minLength={3} maxLength={160} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /><Input label="Expertise" maxLength={1000} value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} /><Textarea label="Description" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="community-form-grid"><Input label="Starts" type="datetime-local" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /><Input label="Ends" type="datetime-local" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div><div className="community-actions-inline"><Button type="submit">{editingId ? 'Save slot' : 'Publish availability'}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Stop editing</Button>}</div></form>}
    {loading ? <Loading text="Loading mentorship activity…" /> : <>
      {alumni && <><h2>Your upcoming slots</h2><div className="community-list">{(data?.slots || []).map((slot) => <article className="community-row" key={slot.id}><div><h3>{slot.topic}</h3><p>{dateTime(slot.startTime)} – {dateTime(slot.endTime)}</p><span className="badge">{slot.status}</span></div><div className="community-actions-inline">{slot.status === 'AVAILABLE' && <><Button variant="outline" onClick={() => editSlot(slot)}>Edit</Button><Button variant="outline" onClick={() => cancel(slot.id)}>Cancel slot</Button></>}</div></article>)}{!data?.slots?.length && <p className="community-empty">You have no upcoming mentorship slots.</p>}</div></>}
      <h2>{alumni ? 'Requests for your slots' : user?.role === 'STUDENT' ? 'Requests you sent' : 'Incoming requests'}</h2><div className="community-list">{(data?.requests || []).map((item) => { const student = user?.role !== 'STUDENT'; const contact = student ? item.student : item.slot.alumni; return <article className="community-row" key={item.id}><div><h3>{item.slot.topic}</h3><p>{dateTime(item.slot.startTime)} · {student ? `Request from ${contact?.name}` : `Mentor: ${contact?.name}`}</p>{item.message && <p>{item.message}</p>}<span className="badge">{item.status}</span></div><div className="community-actions-inline">{item.status === 'PENDING' && (student ? <><Button onClick={() => act(item.id, 'ACCEPTED')}>Accept</Button><Button variant="outline" onClick={() => act(item.id, 'REJECTED')}>Decline</Button></> : <Button variant="outline" onClick={() => act(item.id, 'CANCELLED')}>Cancel request</Button>)}</div></article>; })}{!data?.requests?.length && <p className="community-empty">No mentorship requests.</p>}</div>
    </>}
  </section>;
}

export function EventsPage() {
  const { user } = useAuth(); const [search, setSearch] = useState(''); const [category, setCategory] = useState(''); const [notice, setNotice] = useState('');
  const { data, error, loading, refresh, setError } = useLoad(() => eventService.getEvents({ search, category }), [search, category]);
  const register = async (id) => { try { await eventService.register(id); setNotice('You are registered for this event.'); await refresh(); } catch (e) { setError(e.message); } };
  return <section className="community-page"><header className="community-header"><div><span className="badge badge-primary">CAMPUS COMMUNITY</span><h1>Events</h1><p>Workshops, networking sessions, talks, and career events.</p></div>{['ALUMNI', 'ADMIN'].includes(user?.role) && <Link to="/events/create"><Button>+ Create event</Button></Link>}<Link to="/events/my"><Button variant="outline">My events</Button></Link></header><div className="community-filters"><Input label="Search events" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, description, or location" /><label className="community-field">Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{['WEBINAR','WORKSHOP','REUNION','NETWORKING','CAREER_FAIR','TALK','OTHER'].map((c) => <option key={c}>{c}</option>)}</select></label></div>{notice && <p className="community-notice">{notice}</p>}{error && <ErrorAlert message={error} />}{loading ? <Loading text="Loading events…" /> : <div className="community-grid">{(data?.data?.events || []).map((event) => <article className="community-card" key={event.id}><div className="community-card-top"><span className="badge badge-primary">{event.category.replace('_', ' ')}</span><span>{event.eventType.replace('_', ' ')}</span></div><h2><Link to={`/events/${event.id}`}>{event.title}</Link></h2><p>{event.description}</p><p>📅 {dateTime(event.startDate)}</p><p>📍 {event.location}</p><p>{event._count?.registrations || 0}{event.capacity ? ` / ${event.capacity}` : ''} registered</p><div className="community-actions-inline"><Button onClick={() => register(event.id)} disabled={user?.role === 'ADMIN'}>Register</Button><Link to={`/events/${event.id}`} className="community-link">Details</Link></div></article>)}{!data?.data?.events?.length && <p className="community-empty">No upcoming events found.</p>}</div>}</section>;
}

export function EventFormPage() {
  const { id } = useParams(); const navigate = useNavigate(); const [error, setError] = useState(''); const [loading, setLoading] = useState(Boolean(id));
  const [form, setForm] = useState({ title: '', description: '', category: 'WORKSHOP', location: '', eventType: 'VIRTUAL', startDate: '', endDate: '', registrationDeadline: '', capacity: '' });
  useEffect(() => { if (id) eventService.getEvent(id).then(({ data }) => { const event = data.event; setForm({ ...event, startDate: event.startDate.slice(0, 16), endDate: event.endDate.slice(0, 16), registrationDeadline: event.registrationDeadline?.slice(0, 16) || '', capacity: event.capacity || '' }); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  const submit = async (e) => { e.preventDefault(); try { const body = { ...form, capacity: form.capacity ? Number(form.capacity) : null, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null }; const result = id ? await eventService.update(id, body) : await eventService.create(body); navigate(`/events/${result.data.event.id}`); } catch (err) { setError(err.message); } };
  if (loading) return <Loading text="Loading event…" />;
  return <section className="community-page community-narrow"><header className="community-header"><div><span className="badge badge-primary">EVENTS</span><h1>{id ? 'Edit event' : 'Create an event'}</h1></div><Link to="/events"><Button variant="outline">Back to events</Button></Link></header>{error && <ErrorAlert message={error} />}<form className="community-form" onSubmit={submit}><Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Textarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="community-form-grid"><label className="community-field">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['WEBINAR','WORKSHOP','REUNION','NETWORKING','CAREER_FAIR','TALK','OTHER'].map((c) => <option key={c}>{c}</option>)}</select></label><label className="community-field">Format<select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>{['VIRTUAL','IN_PERSON','HYBRID'].map((c) => <option key={c}>{c}</option>)}</select></label></div><Input label="Location or meeting link" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /><div className="community-form-grid"><Input label="Starts" type="datetime-local" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /><Input label="Ends" type="datetime-local" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /><Input label="Registration deadline" type="datetime-local" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} /><Input label="Capacity (optional)" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div><Button type="submit">{id ? 'Save event' : 'Publish event'}</Button></form></section>;
}

export function EventDetailsPage() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate(); const { data, error, loading, refresh, setError } = useLoad(() => eventService.getEvent(id), [id]); const [participants, setParticipants] = useState([]);
  const event = data?.data?.event;
  const own = event && (event.organizerId === user?.id || user?.role === 'ADMIN');
  const loadParticipants = async () => { try { const result = await eventService.participants(id); setParticipants(result.data.participants); } catch (e) { setError(e.message); } };
  if (loading) return <Loading text="Loading event details…" />;
  if (!event) return <section className="community-page">{error && <ErrorAlert message={error} />}<Link to="/events">Back to events</Link></section>;
  const registered = event.registrations?.[0]?.status === 'REGISTERED';
  const act = async (fn) => { try { await fn(id); await refresh(); } catch (e) { setError(e.message); } };
  return <section className="community-page community-narrow"><header className="community-header"><div><span className="badge badge-primary">{event.category.replace('_', ' ')}</span><h1>{event.title}</h1></div><Link to="/events"><Button variant="outline">All events</Button></Link></header>{error && <ErrorAlert message={error} />}<article className="community-card"><p>{event.description}</p><p><strong>When:</strong> {dateTime(event.startDate)} – {dateTime(event.endDate)}</p><p><strong>Where:</strong> {event.location} · {event.eventType.replace('_', ' ')}</p><p><strong>Organizer:</strong> {event.organizer.name}</p><p><strong>Participants:</strong> {event._count?.registrations || 0}{event.capacity ? ` / ${event.capacity}` : ''}</p><div className="community-actions-inline">{user?.role !== 'ADMIN' && (registered ? <Button variant="outline" onClick={() => act(eventService.cancel)}>Cancel registration</Button> : <Button onClick={() => act(eventService.register)}>Register</Button>)}{own && <><Link to={`/events/${id}/edit`}><Button variant="outline">Edit</Button></Link><Button variant="outline" onClick={loadParticipants}>View participants</Button><Button variant="outline" onClick={() => act(async () => { await eventService.remove(id); navigate('/events'); })}>Delete event</Button></>}</div></article>{participants.length > 0 && <section className="community-list"><h2>Registered participants</h2>{participants.map((p) => <div className="community-row" key={p.id}><strong>{p.user.name}</strong><span>{p.user.role} · {p.user.profile?.branch || 'Branch not specified'}</span></div>)}</section>}</section>;
}

export function MyEventsPage() {
  const { data, error, loading, refresh, setError } = useLoad(() => eventService.mine(), []);
  const cancel = async (id) => { try { await eventService.cancel(id); await refresh(); } catch (e) { setError(e.message); } };
  return <section className="community-page"><header className="community-header"><div><span className="badge badge-primary">YOUR SCHEDULE</span><h1>My events</h1><p>Events you have registered to attend.</p></div><Link to="/events"><Button variant="outline">Browse events</Button></Link></header>{error && <ErrorAlert message={error} />}{loading ? <Loading text="Loading your events…" /> : <div className="community-list">{(data?.data?.registrations || []).map(({ event, status }) => <article className="community-row" key={event.id}><div><h2><Link to={`/events/${event.id}`}>{event.title}</Link></h2><p>{dateTime(event.startDate)} · {event.location}</p><span className="badge">{status}</span></div>{status === 'REGISTERED' && <Button variant="outline" onClick={() => cancel(event.id)}>Cancel</Button>}</article>)}{!data?.data?.registrations?.length && <p className="community-empty">You have no event registrations yet.</p>}</div>}</section>;
}
