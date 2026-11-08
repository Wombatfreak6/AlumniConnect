import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import useAuth from '../../hooks/useAuth';
import { mockCurrentUser } from '../../services/mockData';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(() => ({
    name: user?.name || mockCurrentUser.name,
    email: user?.email || mockCurrentUser.email,
    role: user?.role || mockCurrentUser.role,
    ...(user?.profile || mockCurrentUser.profile),
  }));
  const [skills, setSkills] = useState(mockCurrentUser.skills);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [successNotice, setSuccessNotice] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSuccessNotice('Profile details saved successfully!');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    // Check if skill already exists
    if (!skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [
        ...prev,
        { id: Date.now(), name: trimmed },
      ]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
  };

  return (
    <div className="profile-page">
      {/* Profile Header Banner */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">👨‍🎓</div>
        </div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{profileData.name}</h1>
            <span className="profile-role-pill">{profileData.role}</span>
          </div>
          <p className="profile-headline">
            {profileData.designation ? `${profileData.designation} at ${profileData.company}` : `${profileData.branch}`}
          </p>
          <p className="profile-subheadline">
            {profileData.college} • Class of {profileData.graduationYear} • {profileData.email}
          </p>
        </div>
        <div className="profile-header-actions">
          <Button
            variant={isEditing ? 'outline' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {successNotice && (
        <div className="profile-success-banner">
          <span>✅ {successNotice}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="profile-content-grid">
        {/* Left Column: Details or Form */}
        <div className="profile-main-col">
          {isEditing ? (
            /* Edit Mode Form */
            <Card title="Edit Your Professional Profile">
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-row">
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Collegiate Email (Read-Only)"
                    name="email"
                    value={profileData.email}
                    disabled
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="University / College"
                    name="college"
                    value={profileData.college || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. National Institute of Technology"
                  />
                  <Input
                    label="Engineering Department / Branch"
                    name="branch"
                    value={profileData.branch || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science and Engineering"
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="Batch"
                    name="batch"
                    value={profileData.batch || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 2022-2026"
                  />
                  <Input
                    label="Graduation Year"
                    name="graduationYear"
                    type="number"
                    value={profileData.graduationYear || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 2026"
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="Current Company / Organization"
                    name="company"
                    value={profileData.company || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Google or TechCorp"
                  />
                  <Input
                    label="Job Designation / Title"
                    name="designation"
                    value={profileData.designation || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Staff Engineer or Intern"
                  />
                </div>

                <div className="form-row">
                  <Input
                    label="Industry Sector"
                    name="industry"
                    value={profileData.industry || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Cloud Infrastructure"
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    name="linkedinUrl"
                    value={profileData.linkedinUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <Textarea
                  label="Professional Bio"
                  name="bio"
                  rows={3}
                  value={profileData.bio || ''}
                  onChange={handleInputChange}
                  placeholder="Share a short summary of your background, experience, or academic interests..."
                />

                <Textarea
                  label="Career Goals & Aspirations"
                  name="careerGoals"
                  rows={2}
                  value={profileData.careerGoals || ''}
                  onChange={handleInputChange}
                  placeholder="What roles, fields, or milestones are you aiming for?"
                />

                <div className="form-actions" style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
                  <Button type="submit" variant="primary">
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            /* View Mode */
            <>
              <Card title="About & Career Summary" className="profile-section-card">
                <p className="profile-bio-text">
                  {profileData.bio || 'No bio provided yet. Click "Edit Profile" to tell fellow alumni and students about yourself.'}
                </p>
                {profileData.careerGoals && (
                  <div className="career-goals-box">
                    <span className="goals-label">Target Career Direction:</span>
                    <p className="goals-text">{profileData.careerGoals}</p>
                  </div>
                )}
              </Card>

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
              </Card>

              <Card title="Professional Experience" className="profile-section-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Current Organization</span>
                    <span className="detail-val">{profileData.company || 'Student / Not Specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Designation</span>
                    <span className="detail-val">{profileData.designation || 'Undergraduate'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Industry</span>
                    <span className="detail-val">{profileData.industry || 'Technology'}</span>
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
                          View Verified Profile ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Right Column: Skills & Verification */}
        <aside className="profile-side-col">
          {/* Skills Tag Management */}
          <Card title="Skills & Competencies">
            <p className="skills-subtext">
              Highlight your technical skills for smarter mentor matching and referral applications.
            </p>

            <form onSubmit={handleAddSkill} className="add-skill-form">
              <Input
                placeholder="Add skill (e.g. Python, AWS)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm">
                Add
              </Button>
            </form>

            <div className="skills-tag-cloud">
              {skills.map((skill) => (
                <span key={skill.id} className="skill-pill">
                  {skill.name}
                  <button
                    type="button"
                    className="skill-remove-btn"
                    onClick={() => handleRemoveSkill(skill.id)}
                    aria-label={`Remove skill ${skill.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </Card>

          {/* Account Integrity Badge */}
          <Card title="Collegiate Verification" style={{ marginTop: 'var(--space-6)' }}>
            <div className="verification-status-box">
              <span className="verified-check">✔</span>
              <div>
                <h4 className="verification-title">Verified Member</h4>
                <p className="verification-text">
                  Your collegiate email domain has been confirmed by institutional records.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
