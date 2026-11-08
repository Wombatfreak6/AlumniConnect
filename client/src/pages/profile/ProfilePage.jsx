import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('view'); // 'view' | 'edit'

  // User Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    college: '',
    branch: '',
    batch: '',
    graduationYear: '',
    bio: '',
    company: '',
    designation: '',
    industry: '',
    careerGoals: '',
    linkedinUrl: '',
  });

  // User Skills State
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillSubmitting, setSkillSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  /**
   * Fetch live profile and skills on mount
   */
  useEffect(() => {
    let isMounted = true;
    userService
      .getMyProfile()
      .then((response) => {
        if (!isMounted) return;
        const userData = response.data?.user;
        if (userData) {
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || '',
            college: userData.profile?.college || '',
            branch: userData.profile?.branch || '',
            batch: userData.profile?.batch || '',
            graduationYear: userData.profile?.graduationYear || '',
            bio: userData.profile?.bio || '',
            company: userData.profile?.company || '',
            designation: userData.profile?.designation || '',
            industry: userData.profile?.industry || '',
            careerGoals: userData.profile?.careerGoals || '',
            linkedinUrl: userData.profile?.linkedinUrl || '',
          });
          setSkills(userData.skills || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load profile details.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!profileData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (profileData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (profileData.graduationYear) {
      const year = parseInt(profileData.graduationYear, 10);
      if (isNaN(year) || year < 1960 || year > 2040) {
        errors.graduationYear = 'Please provide a valid graduation year (e.g. 2026).';
      }
    }

    if (profileData.linkedinUrl && profileData.linkedinUrl.trim()) {
      const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
      if (!urlRegex.test(profileData.linkedinUrl.trim())) {
        errors.linkedinUrl = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    return errors;
  };

  /**
   * Submit profile updates to PUT /api/users/me
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: profileData.name.trim(),
        college: profileData.college.trim() || null,
        branch: profileData.branch.trim() || null,
        batch: profileData.batch.trim() || null,
        graduationYear: profileData.graduationYear ? parseInt(profileData.graduationYear, 10) : null,
        bio: profileData.bio.trim() || null,
        company: profileData.company.trim() || null,
        designation: profileData.designation.trim() || null,
        industry: profileData.industry.trim() || null,
        careerGoals: profileData.careerGoals.trim() || null,
        linkedinUrl: profileData.linkedinUrl.trim() || null,
      };

      const res = await userService.updateMyProfile(payload);
      if (res.data?.user) {
        // Refresh AuthContext so that user state across Navbar & Dashboards updates
        await refreshUser();
      }

      setSuccessNotice('Your profile information has been saved successfully!');
      setActiveTab('view');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Add a skill via POST /api/users/me/skills
   */
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    // Check duplicate in local state
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Skill "${trimmed}" is already added to your profile.`);
      return;
    }

    setSkillSubmitting(true);
    setError(null);
    try {
      const response = await userService.addSkill(trimmed);
      const addedSkill = response.data?.skill;
      if (addedSkill) {
        const normalized = {
          id: addedSkill.skillId || addedSkill.id,
          userSkillId: addedSkill.userSkillId,
          name: addedSkill.name,
        };
        setSkills((prev) => [...prev, normalized]);
        setNewSkillInput('');
        setSuccessNotice(`Skill "${addedSkill.name}" added successfully.`);
        setTimeout(() => setSuccessNotice(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add skill.');
    } finally {
      setSkillSubmitting(false);
    }
  };

  /**
   * Remove a skill via DELETE /api/users/me/skills/:skillId
   */
  const handleRemoveSkill = async (skillId, skillName) => {
    setError(null);
    try {
      await userService.removeSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      setSuccessNotice(`Skill "${skillName}" removed.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove skill.');
    }
  };

  if (loading) {
    return <Loading text="Loading your profile details..." fullScreen={false} />;
  }

  const isAlumni = (profileData.role || authUser?.role) === 'ALUMNI';
  const roleLabel = profileData.role || authUser?.role || 'STUDENT';

  return (
    <div className="profile-page">
      {/* Profile Header Banner */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">{isAlumni ? '🎓' : '🎒'}</div>
        </div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{profileData.name || 'Member Profile'}</h1>
            <span className={`badge badge-${roleLabel.toLowerCase()}`}>{roleLabel}</span>
          </div>
          <p className="profile-headline">
            {isAlumni
              ? profileData.designation && profileData.company
                ? `${profileData.designation} at ${profileData.company}`
                : profileData.industry || 'Alumni Member'
              : profileData.branch || 'Undergraduate Student'}
          </p>
          <p className="profile-subheadline">
            {profileData.college || 'Institution Not Specified'}
            {profileData.graduationYear ? ` • Class of ${profileData.graduationYear}` : ''}
            {profileData.email ? ` • ${profileData.email}` : ''}
          </p>
        </div>

        {/* Tab / View Switcher */}
        <div className="profile-header-actions">
          <div className="profile-tab-toggle">
            <button
              type="button"
              className={`profile-toggle-btn ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              View Profile
            </button>
            <button
              type="button"
              className={`profile-toggle-btn ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successNotice && (
        <div className="profile-success-banner" role="status">
          <span>✅ {successNotice}</span>
        </div>
      )}

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Main Profile Grid */}
      <div className="profile-content-grid">
        {/* Left Column: View Mode OR Edit Form */}
        <div className="profile-main-col">
          {activeTab === 'edit' ? (
            /* ================= EDIT MODE ================= */
            <Card
              title="Edit Profile Information"
              subtitle="Update your academic, career, and personal background details"
            >
              <form onSubmit={handleSaveProfile} className="profile-edit-form" noValidate>
                <div className="form-row">
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    required
                  />
                  <Input
                    label="Account Email (Verified)"
                    name="email"
                    value={profileData.email}
                    disabled
                    helpText="Email address cannot be changed."
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="College / University"
                    name="college"
                    value={profileData.college}
                    onChange={handleInputChange}
                    placeholder="e.g. National Institute of Technology"
                  />
                  <Input
                    label="Department / Branch"
                    name="branch"
                    value={profileData.branch}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science and Engineering"
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="Batch Period"
                    name="batch"
                    value={profileData.batch}
                    onChange={handleInputChange}
                    placeholder="e.g. 2022-2026"
                  />
                  <Input
                    label="Graduation Year"
                    name="graduationYear"
                    type="number"
                    value={profileData.graduationYear}
                    onChange={handleInputChange}
                    placeholder="e.g. 2026"
                    error={formErrors.graduationYear}
                  />
                </div>

                {/* Alumni Specific Professional Fields */}
                {isAlumni && (
                  <div className="alumni-edit-section">
                    <h4 className="section-divider-title">💼 Professional Experience & Industry</h4>
                    <div className="form-row">
                      <Input
                        label="Current Company / Organization"
                        name="company"
                        value={profileData.company}
                        onChange={handleInputChange}
                        placeholder="e.g. CloudScale Technologies"
                      />
                      <Input
                        label="Current Designation / Title"
                        name="designation"
                        value={profileData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g. Senior Software Architect"
                      />
                    </div>
                    <div className="form-row">
                      <Input
                        label="Industry Domain"
                        name="industry"
                        value={profileData.industry}
                        onChange={handleInputChange}
                        placeholder="e.g. Cloud Infrastructure, FinTech"
                      />
                      <Input
                        label="LinkedIn Profile URL"
                        name="linkedinUrl"
                        value={profileData.linkedinUrl}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        error={formErrors.linkedinUrl}
                      />
                    </div>
                  </div>
                )}

                {/* Student Career Fields */}
                {!isAlumni && (
                  <div className="student-edit-section">
                    <div className="form-row">
                      <Input
                        label="Company (Internship or Ongoing)"
                        name="company"
                        value={profileData.company}
                        onChange={handleInputChange}
                        placeholder="Optional / Current Employer"
                      />
                      <Input
                        label="LinkedIn Profile URL"
                        name="linkedinUrl"
                        value={profileData.linkedinUrl}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        error={formErrors.linkedinUrl}
                      />
                    </div>
                  </div>
                )}

                <Textarea
                  label="Bio / Professional Summary"
                  name="bio"
                  rows={3}
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell students and alumni about your journey, interests, or mentoring focus..."
                  helpText="Up to 1000 characters."
                />

                <Textarea
                  label={isAlumni ? 'Mentorship & Expertise Areas' : 'Career Goals & Aspirations'}
                  name="careerGoals"
                  rows={3}
                  value={profileData.careerGoals}
                  onChange={handleInputChange}
                  placeholder={
                    isAlumni
                      ? 'Describe topics you can advise on (e.g., System Design, Resume Reviews, Engineering Leadership)...'
                      : 'Describe roles, technologies, or milestones you are working towards...'
                  }
                />

                <div className="form-actions" style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <Button type="submit" variant="primary" isLoading={saving}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('view')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* Bio & Summary Card */}
              <Card title="About Me" className="profile-section-card">
                <p className="profile-bio-text">
                  {profileData.bio || (
                    <span className="text-muted italic">
                      No bio provided yet. Click &quot;Edit Profile&quot; to introduce yourself to fellow alumni and students.
                    </span>
                  )}
                </p>

                {profileData.careerGoals && (
                  <div className="career-goals-box">
                    <span className="goals-label">
                      {isAlumni ? 'Areas of Expertise & Mentorship Focus:' : 'Target Career Direction:'}
                    </span>
                    <p className="goals-text">{profileData.careerGoals}</p>
                  </div>
                )}
              </Card>

              {/* Alumni-specific Industry & Company Card */}
              {isAlumni && (
                <Card title="Industry & Employment" className="profile-section-card" style={{ marginTop: 'var(--space-6)' }}>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Current Company</span>
                      <span className="detail-val">{profileData.company || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Designation</span>
                      <span className="detail-val">{profileData.designation || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Industry</span>
                      <span className="detail-val">{profileData.industry || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">LinkedIn</span>
                      <span className="detail-val">
                        {profileData.linkedinUrl ? (
                          <a
                            href={profileData.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="linkedin-link"
                          >
                            View LinkedIn Profile ↗
                          </a>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Academic Background Card */}
              <Card title="Academic Background" className="profile-section-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Institution</span>
                    <span className="detail-val">{profileData.college || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department / Branch</span>
                    <span className="detail-val">{profileData.branch || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Academic Batch</span>
                    <span className="detail-val">{profileData.batch || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Graduation Year</span>
                    <span className="detail-val">{profileData.graduationYear || '—'}</span>
                  </div>
                </div>

                {!isAlumni && profileData.linkedinUrl && (
                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                    <span className="detail-label">Professional Link</span>
                    <p style={{ margin: '4px 0 0' }}>
                      <a
                        href={profileData.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="linkedin-link"
                      >
                        {profileData.linkedinUrl} ↗
                      </a>
                    </p>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>

        {/* Right Column: Skills & Verification */}
        <aside className="profile-side-col">
          {/* Skills Management Card */}
          <Card
            title="Skills & Competencies"
            subtitle="Skills highlight your background for matching and referrals"
          >
            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="add-skill-form">
              <Input
                placeholder="Add a skill (e.g. React, Go, Docker)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                disabled={skillSubmitting}
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={skillSubmitting}
                disabled={!newSkillInput.trim()}
              >
                Add Skill
              </Button>
            </form>

            {/* Skills Tag Cloud */}
            <div className="skills-tag-cloud" style={{ marginTop: 'var(--space-4)' }}>
              {skills.length === 0 ? (
                <p className="no-skills-notice">No skills added yet. Type a skill above to start building your profile.</p>
              ) : (
                skills.map((skill) => (
                  <span key={skill.id} className="skill-pill">
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill.id, skill.name)}
                      aria-label={`Remove skill ${skill.name}`}
                      title={`Remove ${skill.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </Card>

          {/* Account Status Card */}
          <Card title="Account Verification" style={{ marginTop: 'var(--space-6)' }}>
            <div className="verification-status-box">
              <span className="verified-check">✔</span>
              <div>
                <h4 className="verification-title">Institutional Account</h4>
                <p className="verification-text">
                  Registered with <strong>{profileData.email}</strong> as an authenticated{' '}
                  <strong>{roleLabel}</strong>.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
