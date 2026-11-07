import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge">Verified University Network</span>
            <h1 className="hero-title">
              Bridging Collegiate Ambition with Professional Excellence
            </h1>
            <p className="hero-subtitle">
              AlumniConnect empowers students and alumni through structured 1-on-1 mentorship,
              direct career referrals, and trusted institutional collaboration.
            </p>
            <div className="hero-actions">
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Join the Network
                </Button>
              </Link>
              <Link to="/student">
                <Button variant="outline" size="lg">
                  Explore Student Hub
                </Button>
              </Link>
            </div>
            <div className="hero-social-proof">
              <span className="proof-metric"><strong>1,400+</strong> Active Members</span>
              <span className="proof-separator">•</span>
              <span className="proof-metric"><strong>120+</strong> Global Companies</span>
              <span className="proof-separator">•</span>
              <span className="proof-metric"><strong>100%</strong> Verified College Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Platform Capabilities</span>
            <h2 className="section-title">Designed for Modern University Communities</h2>
            <p className="section-subtitle">
              Structured modules engineered to make alumni guidance accessible, transparent, and impactful.
            </p>
          </div>

          <div className="features-grid">
            <Card className="feature-card" hoverable>
              <div className="feature-icon-wrapper" aria-hidden="true">🤝</div>
              <h3 className="feature-card-title">1-on-1 Mentorship</h3>
              <p className="feature-card-desc">
                Book tailored advisory sessions directly with graduates working in software architecture,
                finance, research, and technical leadership.
              </p>
              <Link to="/student" className="feature-link">
                Browse available mentors →
              </Link>
            </Card>

            <Card className="feature-card" hoverable>
              <div className="feature-icon-wrapper" aria-hidden="true">💼</div>
              <h3 className="feature-card-title">Direct Job Referrals</h3>
              <p className="feature-card-desc">
                Skip anonymous resume screening. Request warm internal referrals from alumni
                currently working inside top industry tech organizations.
              </p>
              <Link to="/student" className="feature-link">
                View open referrals →
              </Link>
            </Card>

            <Card className="feature-card" hoverable>
              <div className="feature-icon-wrapper" aria-hidden="true">🎓</div>
              <h3 className="feature-card-title">Alumni Engagement</h3>
              <p className="feature-card-desc">
                Give back effortlessly with customizable office-hour availability slots, mentee request filters,
                and targeted batch networking.
              </p>
              <Link to="/alumni" className="feature-link">
                Visit Alumni Portal →
              </Link>
            </Card>

            <Card className="feature-card" hoverable>
              <div className="feature-icon-wrapper" aria-hidden="true">🛡️</div>
              <h3 className="feature-card-title">Institutional Oversight</h3>
              <p className="feature-card-desc">
                Verified college domain validation and role-based access control (RBAC) ensure safety,
                credibility, and institutional integrity.
              </p>
              <Link to="/admin" className="feature-link">
                Admin Console preview →
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Pathway Strip */}
      <section className="pathways-section">
        <div className="container">
          <div className="pathways-card">
            <div className="pathway-col">
              <span className="pathway-role">For Current Students</span>
              <h3>Accelerate Your Career Transition</h3>
              <p>
                Get your resume reviewed, prep for technical interviews, and learn directly
                from those who graduated from your own department.
              </p>
              <Link to="/register">
                <Button variant="primary">Register as Student</Button>
              </Link>
            </div>

            <div className="pathway-divider" />

            <div className="pathway-col">
              <span className="pathway-role">For Graduated Alumni</span>
              <h3>Guide the Next Generation</h3>
              <p>
                Share industry wisdom, discover top talent for your hiring team, and stay
                meaningfully connected with your alma mater.
              </p>
              <Link to="/register">
                <Button variant="secondary">Join as Alumni</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
