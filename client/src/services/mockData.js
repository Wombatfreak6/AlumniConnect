/**
 * Mock Data for Frontend Foundation Layout Development
 * Kept separate from UI components so it can be cleanly swapped with real backend APIs in future phases.
 */

export const mockCurrentUser = {
  id: 1,
  name: 'Aarav Sharma',
  email: 'aarav.sharma@alumni.edu',
  role: 'STUDENT',
  isActive: true,
  profile: {
    college: 'National Institute of Technology',
    branch: 'Computer Science and Engineering',
    batch: '2022-2026',
    graduationYear: 2026,
    bio: 'Third-year CS student passionate about distributed systems, backend architectures, and machine learning infrastructure.',
    company: 'TechCorp (Summer Intern)',
    designation: 'Software Engineering Intern',
    industry: 'Software & Technology',
    careerGoals: 'Aspiring to become a Full-Stack Systems Engineer and pursue open-source research.',
    linkedinUrl: 'https://linkedin.com/in/aarav-sharma-sample',
  },
  skills: [
    { id: 1, name: 'React' },
    { id: 2, name: 'Node.js' },
    { id: 3, name: 'PostgreSQL' },
    { id: 4, name: 'Docker' },
    { id: 5, name: 'System Design' },
  ],
};

export const mockAlumniUser = {
  id: 2,
  name: 'Priya Iyer',
  email: 'priya.iyer@google.com',
  role: 'ALUMNI',
  isActive: true,
  profile: {
    college: 'National Institute of Technology',
    branch: 'Computer Science and Engineering',
    batch: '2016-2020',
    graduationYear: 2020,
    bio: 'Senior Staff Systems Architect at CloudScale with 6+ years designing scalable cloud backends and mentoring collegiate talent.',
    company: 'CloudScale Technologies',
    designation: 'Staff Backend Architect',
    industry: 'Cloud Infrastructure',
    careerGoals: 'Helping next-gen engineers transition smoothly from academic code to production-scale distributed platforms.',
    linkedinUrl: 'https://linkedin.com/in/priya-iyer-cloud',
  },
  skills: [
    { id: 6, name: 'Go' },
    { id: 7, name: 'Kubernetes' },
    { id: 8, name: 'Distributed Systems' },
    { id: 9, name: 'PostgreSQL' },
    { id: 10, name: 'Mentorship' },
  ],
};

export const mockStudentStats = [
  { id: 'stat-1', title: 'Active Referrals', value: '3', subtitle: '1 Under Review', icon: '💼', variant: 'primary' },
  { id: 'stat-2', title: 'Mentorship Sessions', value: '4', subtitle: 'Next: Tomorrow, 4 PM', icon: '🎓', variant: 'success' },
  { id: 'stat-3', title: 'Alumni Connected', value: '18', subtitle: '+3 this month', icon: '🤝', variant: 'neutral' },
  { id: 'stat-4', title: 'Campus Events', value: '2', subtitle: 'Annual Hackathon & Summit', icon: '📅', variant: 'warning' },
];

export const mockAlumniStats = [
  { id: 'stat-a1', title: 'Mentees Guided', value: '24', subtitle: '8 active this semester', icon: '🎓', variant: 'primary' },
  { id: 'stat-a2', title: 'Referrals Given', value: '11', subtitle: '4 interviews scheduled', icon: '💼', variant: 'success' },
  { id: 'stat-a3', title: 'Upcoming Sessions', value: '3', subtitle: 'Next slot Friday 6 PM', icon: '⏰', variant: 'warning' },
  { id: 'stat-a4', title: 'Profile Views', value: '142', subtitle: 'By verified students', icon: '👁️', variant: 'neutral' },
];

export const mockAdminStats = [
  { id: 'stat-adm1', title: 'Total Registered', value: '1,420', subtitle: 'Verified collegiate accounts', icon: '👥', variant: 'primary' },
  { id: 'stat-adm2', title: 'Active Students', value: '890', subtitle: 'Across 14 engineering branches', icon: '🎒', variant: 'neutral' },
  { id: 'stat-adm3', title: 'Engaged Alumni', value: '510', subtitle: 'At 120+ top global firms', icon: '💼', variant: 'success' },
  { id: 'stat-adm4', title: 'Pending Verifications', value: '20', subtitle: 'Awaiting graduation review', icon: '⏳', variant: 'warning' },
];

export const mockMentors = [
  {
    id: 1,
    name: 'Priya Iyer',
    company: 'CloudScale Technologies',
    role: 'Staff Backend Architect',
    graduationYear: 2020,
    branch: 'Computer Science',
    topic: 'Cloud Infrastructure & High-Volume Distributed Backends',
    rating: '4.9 ★',
    availableSlots: 2,
    avatar: '👩‍💻',
  },
  {
    id: 2,
    name: 'Vikram Sengupta',
    company: 'FinPulse Systems',
    role: 'VP of Product Engineering',
    graduationYear: 2017,
    branch: 'Electronics & Comm.',
    topic: 'Fintech Engineering, System Architecture & Career Transition',
    rating: '5.0 ★',
    availableSlots: 1,
    avatar: '👨‍💼',
  },
  {
    id: 3,
    name: 'Ananya Deshmukh',
    company: 'NeuralAI Labs',
    role: 'Machine Learning Research Engineer',
    graduationYear: 2021,
    branch: 'Information Technology',
    topic: 'LLM Fine-Tuning, PyTorch Production Pipelines & Graduate Studies',
    rating: '4.8 ★',
    availableSlots: 3,
    avatar: '👩‍🔬',
  },
];

export const mockJobs = [
  {
    id: 1,
    title: 'Associate Cloud Engineer',
    company: 'CloudScale Technologies',
    location: 'Bangalore, India (Hybrid)',
    employmentType: 'Full-time',
    experienceLevel: 'Entry Level (0-2 yrs)',
    postedBy: 'Priya Iyer (Class of 2020)',
    deadline: '2026-12-15',
    tags: ['Go', 'Kubernetes', 'Docker'],
  },
  {
    id: 2,
    title: 'Frontend Developer Intern',
    company: 'FinPulse Systems',
    location: 'Remote',
    employmentType: 'Internship',
    experienceLevel: 'Student / Fresher',
    postedBy: 'Vikram Sengupta (Class of 2017)',
    deadline: '2026-11-30',
    tags: ['React', 'TypeScript', 'CSS/Tokens'],
  },
  {
    id: 3,
    title: 'Systems & Reliability Analyst',
    company: 'Apex Data Services',
    location: 'Hyderabad, India (On-site)',
    employmentType: 'Full-time',
    experienceLevel: 'Entry Level',
    postedBy: 'Rohan Mehra (Class of 2019)',
    deadline: '2026-12-05',
    tags: ['Linux', 'PostgreSQL', 'Python'],
  },
];

export const mockMentorshipRequests = [
  {
    id: 1,
    studentName: 'Rohan Verma',
    topic: 'Transitioning from monolithic Express to Microservices',
    branch: 'Computer Science (3rd Year)',
    requestedTime: 'Nov 12, 2026 • 5:00 PM IST',
    status: 'PENDING',
    message: 'Hi Priya, I read your post about distributed logging and would love 30 minutes of guidance on event queues.',
  },
  {
    id: 2,
    studentName: 'Sneha Patel',
    topic: 'Resume Review for Google Cloud Internship',
    branch: 'Information Technology (Final Year)',
    requestedTime: 'Nov 14, 2026 • 6:30 PM IST',
    status: 'ACCEPTED',
    message: 'Thanks for accepting my request! I have prepared my portfolio and sample projects.',
  },
];

export const mockAdminUsers = [
  {
    id: 1,
    name: 'Aarav Sharma',
    email: 'aarav.sharma@alumni.edu',
    role: 'STUDENT',
    college: 'National Institute of Tech',
    isActive: true,
    joinedDate: 'Oct 14, 2026',
  },
  {
    id: 2,
    name: 'Priya Iyer',
    email: 'priya.iyer@google.com',
    role: 'ALUMNI',
    college: 'National Institute of Tech',
    isActive: true,
    joinedDate: 'Aug 22, 2026',
  },
  {
    id: 3,
    name: 'Vikram Sengupta',
    email: 'vikram.s@finpulse.io',
    role: 'ALUMNI',
    college: 'National Institute of Tech',
    isActive: true,
    joinedDate: 'Jul 10, 2026',
  },
  {
    id: 4,
    name: 'Karan Malhotra',
    email: 'karan.m@campus.edu',
    role: 'STUDENT',
    college: 'National Institute of Tech',
    isActive: false,
    joinedDate: 'Sep 03, 2026',
  },
  {
    id: 5,
    name: 'Campus Administrator',
    email: 'admin@alumniconnect.internal',
    role: 'ADMIN',
    college: 'Central Campus Administration',
    isActive: true,
    joinedDate: 'Jun 01, 2026',
  },
];

export const mockActivities = [
  {
    id: 1,
    title: 'New Mentorship Session Booked',
    description: 'Priya Iyer accepted your 1-on-1 session on Cloud Architecture.',
    timestamp: '2 hours ago',
    icon: '🤝',
    tag: 'Mentorship',
  },
  {
    id: 2,
    title: 'Job Referral Update',
    description: 'Your referral application for CloudScale Technologies was marked for interview.',
    timestamp: 'Yesterday',
    icon: '💼',
    tag: 'Careers',
  },
  {
    id: 3,
    title: 'Upcoming Campus Event',
    description: 'Annual Alumni Tech Summit starts Friday in Main Auditorium.',
    timestamp: '2 days ago',
    icon: '📅',
    tag: 'Events',
  },
];
