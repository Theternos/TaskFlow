import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import taskmanagementdashboard from '../images/analytics.webp';
import analyticsImage from '../images/analytic.webp';

const Home = () => {
  const navigate = useNavigate();
  const [animateFeatures, setAnimateFeatures] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimateFeatures(true);
    }, 500);

    // Rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(testimonialInterval);
  }, []);

  const handleStaffClick = () => {
    navigate('/stafflogin');
  };

  const handleAdminClick = () => {
    navigate('/AdminLogin');
  };

  const handleDemoClick = () => {
    // Future demo mode functionality
    alert('Demo mode coming soon!');
  };

  // Sample testimonials
  const testimonials = [
    {
      text: "This task management system has increased our team productivity by 35% in just two months.",
      author: "Sarah Johnson, Product Manager",
      company: "TechCorp Solutions"
    },
    {
      text: "The intuitive interface and powerful features have transformed how we handle project deadlines.",
      author: "Michael Chen, Team Lead",
      company: "Innovative Systems"
    },
    {
      text: "The analytics dashboard provides insights that have helped us optimize our workflow significantly.",
      author: "Jessica Williams, Operations Director",
      company: "Global Enterprises"
    },
    {
      text: "Task dependencies and priority settings have eliminated bottlenecks in our development process.",
      author: "David Rodriguez, Engineering Manager",
      company: "FutureTech Labs"
    },
    {
      text: "The reporting features help us identify performance trends and distribute workload more effectively.",
      author: "Amanda Parker, Team Supervisor",
      company: "Creative Solutions Inc."
    }
  ];

  // Primary features list (shown in feature cards)
  const features = [
    {
      title: "Task Assignment & Management",
      description: "Create, assign and track tasks with customizable priorities, deadlines, and status workflows",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M8 12L11 15L16 9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Role-Based Access Control",
      description: "Secure authentication with role-based permissions for admins, managers, and team members",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M16 11l2 2 4-4" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Task Dependencies",
      description: "Link related tasks to ensure proper sequencing and workflow management",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="6" height="6" rx="1" stroke="#4CAF50" strokeWidth="1.5"/>
          <rect x="14" y="6" width="6" height="6" rx="1" stroke="#4CAF50" strokeWidth="1.5"/>
          <rect x="9" y="14" width="6" height="6" rx="1" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M10 9H14" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M12 12V14" stroke="#4CAF50" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      title: "Team Collaboration",
      description: "Comment, share files, and communicate within tasks for seamless team coordination",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="3" stroke="#4CAF50" strokeWidth="1.5"/>
          <circle cx="16" cy="16" r="3" stroke="#4CAF50" strokeWidth="1.5"/>
          <circle cx="16" cy="8" r="3" stroke="#4CAF50" strokeWidth="1.5"/>
          <circle cx="8" cy="16" r="3" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M8 11v2" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 11v2" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11 8h2" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11 16h2" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: "Analytics Dashboard",
      description: "Visualize task distribution, completion rates, and identify workflow bottlenecks",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 18L7 12L11 14L16 8L21 12V18H3Z" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M3 18H21" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: "Calendar & Notifications",
      description: "Sync tasks with calendars and receive real-time alerts for updates and deadlines",
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="5" width="16" height="16" rx="2" stroke="#4CAF50" strokeWidth="1.5"/>
          <path d="M16 3v4" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 3v4" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4 11h16" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="18" cy="7" r="3" fill="#ff9800" stroke="#ff9800" strokeWidth="0"/>
        </svg>
      )
    }
  ];

  // Secondary features for the expanded features section
  const secondaryFeatures = [
    {
      title: "Advanced Search & Filtering",
      description: "Locate specific tasks quickly using keywords, assignee, priority, or status filters",
      icon: "🔍"
    },
    {
      title: "Third-Party Integrations",
      description: "Connect with project management tools, communication platforms, and calendars",
      icon: "🔄"
    },
    {
      title: "Time Tracking",
      description: "Monitor time spent on tasks for productivity analysis and billing purposes",
      icon: "⏱️"
    },
    {
      title: "Customizable Workflows",
      description: "Define status progressions that match your team's unique processes",
      icon: "⚙️"
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Task Management Module</h1>
          <p className="hero-subtitle">Streamline workflows, enhance collaboration, and boost productivity with our comprehensive task management solution</p>
          
          <div className="hero-buttons">
            <button 
              onClick={handleStaffClick} 
              className="btn btn-primary"
            >
              <span className="btn-icon staff-icon"></span>
              Staff Portal
            </button>

            <button 
              onClick={handleAdminClick} 
              className="btn btn-secondary"
            >
              <span className="btn-icon admin-icon"></span>
              Admin Portal
            </button>
            
            <button 
              onClick={handleDemoClick} 
              className="btn btn-outline"
            >
              Try Demo
            </button>
          </div>
        </div>
        
        <div className="hero-illustration">
          <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            {/* Main board background */}
            <rect x="50" y="30" width="300" height="220" rx="8" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="2"/>
            
            {/* Header bar */}
            <rect x="50" y="30" width="300" height="40" rx="8" fill="#4CAF50" strokeWidth="0"/>
            <rect x="50" y="30" width="300" height="40" rx="8 8 0 0" fill="#4CAF50" strokeWidth="0"/>
            
            {/* Task list items */}
            <rect x="70" y="90" width="260" height="35" rx="4" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
            <rect x="80" y="100" width="15" height="15" rx="2" fill="#4CAF50"/>
            <path d="M83 107L88 112L94 103" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="105" y="97" width="150" height="8" rx="2" fill="#333"/>
            <rect x="105" y="111" width="100" height="6" rx="2" fill="#888"/>
            <rect x="295" y="100" width="25" height="15" rx="7.5" fill="#e6f7e7"/>
            <text x="300" y="111" fontSize="10" fill="#4CAF50">High</text>
            
            <rect x="70" y="135" width="260" height="35" rx="4" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
            <rect x="80" y="145" width="15" height="15" rx="2" fill="#4CAF50" fillOpacity="0.2" stroke="#4CAF50" strokeWidth="1"/>
            <rect x="105" y="142" width="170" height="8" rx="2" fill="#333"/>
            <rect x="105" y="156" width="120" height="6" rx="2" fill="#888"/>
            <rect x="295" y="145" width="25" height="15" rx="7.5" fill="#fff4e5"/>
            <text x="298" y="156" fontSize="10" fill="#ff9800">Med</text>
            
            <rect x="70" y="180" width="260" height="35" rx="4" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
            <rect x="80" y="190" width="15" height="15" rx="2" fill="#4CAF50" fillOpacity="0.2" stroke="#4CAF50" strokeWidth="1"/>
            <rect x="105" y="187" width="130" height="8" rx="2" fill="#333"/>
            <rect x="105" y="201" width="80" height="6" rx="2" fill="#888"/>
            <rect x="295" y="190" width="25" height="15" rx="7.5" fill="#e8eaf6"/>
            <text x="300" y="201" fontSize="10" fill="#3f51b5">Low</text>
            
            {/* Progress bar */}
            <rect x="70" y="230" width="260" height="10" rx="5" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1"/>
            <rect x="70" y="230" width="150" height="10" rx="5" fill="#4CAF50" strokeWidth="0"/>
            
            {/* Navigation icons */}
            <circle cx="65" cy="50" r="8" fill="white" fillOpacity="0.2"/>
            <circle cx="90" cy="50" r="8" fill="white" fillOpacity="0.2"/>
            <circle cx="115" cy="50" r="8" fill="white" fillOpacity="0.2"/>
            
            {/* Title text */}
            <text x="150" y="55" fontSize="16" fill="white" fontWeight="bold">Project Tasks</text>
            
            {/* People dots */}
            <circle cx="315" cy="50" r="8" fill="white"/>
            <path d="M315 46 A4 4 0 0 0 315 54 A4 4 0 0 0 315 46" fill="#4CAF50"/>
            <circle cx="295" cy="50" r="8" fill="white"/>
            <path d="M295 46 A4 4 0 0 0 295 54 A4 4 0 0 0 295 46" fill="#ff9800"/>
            <circle cx="275" cy="50" r="8" fill="white"/>
            <path d="M275 46 A4 4 0 0 0 275 54 A4 4 0 0 0 275 46" fill="#f44336"/>
          </svg>
        </div>
      </div>

      {/* Problem statement section */}
      <div className="problems-section">
        <div className="section-container">
          <h2 className="section-title">Solving Your Task Management Challenges</h2>
          <div className="problems-grid">
            <div className="problem-card">
              <div className="problem-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="#f44336" strokeWidth="2"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Lack of Visibility</h3>
              <p>Our dashboard provides complete transparency into task status and team workloads</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9h18M3 15h18" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 5v14M17 5v14" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Poor Prioritization</h3>
              <p>Flexible priority settings help teams focus on the most important tasks first</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="#f44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Communication Gaps</h3>
              <p>Task-specific comments and file sharing ensure everyone stays informed</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="3" width="12" height="18" rx="2" stroke="#f44336" strokeWidth="2"/>
                  <path d="M13 8l4 4-4 4" stroke="#f44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 12h10" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Scalability Issues</h3>
              <p>Our system handles tasks across multiple teams and projects with ease</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Features Section */}
      <div className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-container">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${animateFeatures ? 'animate' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Features Section */}
      <div className="expanded-features-section">
        <div className="section-container">
          <h2 className="section-title">Everything You Need for Task Management</h2>
          
          <div className="expanded-features-grid">
            <div className="expanded-feature-image">
              <img src={taskmanagementdashboard} alt="Task Management Dashboard" />
            </div>
            
            <div className="expanded-feature-content">
              <h3>Complete Task Lifecycle Management</h3>
              <p>Our comprehensive solution handles every aspect of task management from creation to completion, with powerful tools for tracking, collaboration, and analysis.</p>
              
              <div className="secondary-features">
                {secondaryFeatures.map((feature, index) => (
                  <div key={index} className="secondary-feature">
                    <div className="secondary-feature-icon">{feature.icon}</div>
                    <div>
                      <h4>{feature.title}</h4>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Highlight Section */}
      <div className="analytics-section">
        <div className="section-container">
          <h2 className="section-title">Actionable Analytics</h2>
          
          <div className="analytics-grid">
            <div className="analytics-content">
              <h3>Make Data-Driven Decisions</h3>
              <p>Turn task data into actionable insights with our comprehensive analytics dashboard.</p>
              
              <ul className="analytics-features">
                <li>
                  <span className="analytics-icon">📊</span>
                  <div>
                    <h4>Task Completion Metrics</h4>
                    <p>Track completion rates and identify on-time vs. delayed tasks</p>
                  </div>
                </li>
                <li>
                  <span className="analytics-icon">⚖️</span>
                  <div>
                    <h4>Workload Distribution</h4>
                    <p>Visualize team capacity and balance assignments effectively</p>
                  </div>
                </li>
                <li>
                  <span className="analytics-icon">📈</span>
                  <div>
                    <h4>Performance Tracking</h4>
                    <p>Measure team efficiency and track improvement over time</p>
                  </div>
                </li>
                <li>
                  <span className="analytics-icon">🔍</span>
                  <div>
                    <h4>Bottleneck Analysis</h4>
                    <p>Identify workflow stages where tasks frequently stall</p>
                  </div>
                </li>
                <li>
                  <span className="analytics-icon">📉</span>
                  <div>
                    <h4>Trend Analysis</h4>
                    <p>Discover patterns in task creation and completion over time</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="analytics-image">
              <img src={analyticsImage} alt="Analytics Dashboard"/>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-circle">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#006400"
                strokeWidth="2"
                strokeDasharray="85, 100"
              />
            </svg>
            <span className="stat-value">85%</span>
          </div>
          <h3 className="stat-title">Efficiency Increase</h3>
        </div>
        
        <div className="stat-item">
          <div className="stat-circle">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3f51b5"
                strokeWidth="2"
                strokeDasharray="92, 100"
              />
            </svg>
            <span className="stat-value">92%</span>
          </div>
          <h3 className="stat-title">User Satisfaction</h3>
        </div>
        
        <div className="stat-item">
          <div className="stat-circle">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#ff9800"
                strokeWidth="2"
                strokeDasharray="68, 100"
              />
            </svg>
            <span className="stat-value">68%</span>
          </div>
          <h3 className="stat-title">Time Saved</h3>
        </div>
        
        <div className="stat-item">
          <div className="stat-circle">
            <svg viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f44336"
                strokeWidth="2"
                strokeDasharray="78, 100"
              />
            </svg>
            <span className="stat-value">78%</span>
          </div>
          <h3 className="stat-title">Deadline Compliance</h3>
        </div>
      </div>

      {/* Notification Features Section */}
      <div className="notification-section">
        <div className="section-container">
          <h2 className="section-title">Stay Informed with Smart Notifications</h2>
          
          <div className="notification-grid">
            <div className="notification-item">
              <div className="notification-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>In-App Notifications</h3>
              <p>Real-time alerts for task updates, comments, and approaching deadlines</p>
            </div>
            
            <div className="notification-item">
              <div className="notification-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6l-10 7L2 6" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Email Notifications</h3>
              <p>Stay informed of task assignments and status changes even when offline</p>
            </div>
            
            <div className="notification-item">
              <div className="notification-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Automatic Reminders</h3>
              <p>Never miss a deadline with timely reminders for approaching due dates</p>
            </div>
            
            <div className="notification-item">
              <div className="notification-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15l-9-9-9 9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Collaborative Messaging</h3>
              <p>Direct notifications when you're mentioned or receive comments on tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonial-carousel">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className={`testimonial-card ${index === currentTestimonial ? 'active' : ''}`}
            >
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.author.split(' ')[0][0]}{testimonial.author.split(' ')[1][0]}
                  </div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.author}</div>
                    <div className="author-company">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(index)}
              ></span>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to transform your workflow?</h2>
          <p>Start managing tasks more efficiently today</p>
          <div className="cta-buttons">
            <button onClick={handleStaffClick} className="btn btn-primary">Get Started</button>
            <button onClick={handleDemoClick} className="btn btn-outline">View Demo</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">Task Management Module</div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Features</a>
            <a href="#">Documentation</a>
            <a href="#">Support</a>
          </div>
          <div className="footer-copyright">© 2025 Task Management System. All rights reserved.</div>
        </div>
      </footer>


      <style jsx="true">{`
/* Global Styles */
:root {
  --primary-color: #4CAF50;
  --secondary-color: #3f51b5;
  --accent-color: #ff9800;
  --danger-color: #f44336;
  --text-dark: #333333;
  --text-light: #666666;
  --background-light: #f5f5f5;
  --white: #ffffff;
  --border-radius: 8px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --transition-speed: 0.3s;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-dark);
  line-height: 1.6;
  background-color: var(--white);
}

.home-container {
  width: 100%;
  overflow-x: hidden;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-speed) ease;
}

a:hover {
  color: rgba(76, 175, 80, 0.8);
}

/* Button Styles */
.btn {
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
}

.btn-primary:hover {
  background-color: rgba(76, 175, 80, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.2);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: var(--white);
}

.btn-secondary:hover {
  background-color: rgba(63, 81, 181, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(63, 81, 181, 0.2);
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: rgba(76, 175, 80, 0.05);
  transform: translateY(-2px);
}

// .btn-icon {
//   width: 20px;
//   height: 20px;
//   display: inline-block;
// }

/* Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  padding: 80px 5%;
  min-height: 600px;
  position: relative;
  background: linear-gradient(135deg, rgba(247, 251, 247, 1) 0%, rgba(230, 247, 231, 1) 100%);
}

.hero-content {
  flex: 1;
  padding-right: 40px;
}

.hero-title {
  font-size: 3.2rem;
  margin-bottom: 20px;
  line-height: 1.2;
  color: var(--text-dark);
  position: relative;
  display: inline-block;
}

.hero-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 60px;
  height: 4px;
  background-color: var(--primary-color);
  border-radius: 2px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-light);
  margin-bottom: 40px;
  max-width: 600px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-illustration {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

/* Problem Section */
.problems-section {
  background-color: var(--white);
  padding: 80px 5%;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.4rem;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  padding-bottom: 15px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background-color: var(--primary-color);
  border-radius: 2px;
}

.problems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.problem-card {
  background-color: var(--white);
  padding: 30px;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: transform var(--transition-speed) ease;
}

.problem-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.problem-icon {
  margin-bottom: 20px;
}

.problem-card h3 {
  font-size: 1.4rem;
  margin-bottom: 16px;
}

.problem-card p {
  color: var(--text-light);
}

/* Features Section */
.features-section {
  background-color: var(--background-light);
  padding: 80px 5%;
  overflow: hidden;
}

.features-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background-color: var(--white);
  padding: 30px;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: all var(--transition-speed) ease;
  text-align: center;
  opacity: 0;
  transform: translateY(30px);
}

.feature-card.animate {
  opacity: 1;
  transform: translateY(0);
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  margin-bottom: 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-size: 1.3rem;
  margin-bottom: 16px;
  color: var(--text-dark);
}

.feature-description {
  color: var(--text-light);
  font-size: 0.95rem;
}

/* Expanded Features Section */
.expanded-features-section {
  padding: 80px 5%;
  background-color: var(--white);
}

.expanded-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}

.expanded-feature-image img {
  width: 100%;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.expanded-feature-content h3 {
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.expanded-feature-content > p {
  color: var(--text-light);
  margin-bottom: 30px;
}

.secondary-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.secondary-feature {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.secondary-feature-icon {
  font-size: 1.8rem;
}

.secondary-feature h4 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.secondary-feature p {
  color: var(--text-light);
  font-size: 0.9rem;
}

/* Analytics Section */
.analytics-section {
  padding: 80px 5%;
  background-color: var(--background-light);
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}

.analytics-content h3 {
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.analytics-content > p {
  color: var(--text-light);
  margin-bottom: 30px;
}

.analytics-features {
  list-style: none;
}

.analytics-features li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 15px;
}

.analytics-icon {
  font-size: 1.8rem;
}

.analytics-features h4 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.analytics-features p {
  color: var(--text-light);
  font-size: 0.9rem;
}

.analytics-image img {
  width: 100%;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

/* Stats Section */
.stats-section {
  padding: 80px 5%;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  background-color: var(--primary-color);
}

.stat-item {
  text-align: center;
  padding: 20px;
  min-width: 200px;
}

.stat-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
}

.stat-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.stat-circle svg path {
  stroke-linecap: round;
}

.stat-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--white);
}

.stat-title {
  color: var(--white);
  font-size: 1.2rem;
}

/* Notification Section */
.notification-section {
  padding: 80px 5%;
  background-color: var(--white);
}

.notification-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.notification-item {
  padding: 30px;
  border-radius: var(--border-radius);
  background-color: var(--white);
  box-shadow: var(--box-shadow);
  transition: transform var(--transition-speed) ease;
}

.notification-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.notification-icon {
  margin-bottom: 20px;
}

.notification-item h3 {
  font-size: 1.3rem;
  margin-bottom: 12px;
}

.notification-item p {
  color: var(--text-light);
}

/* Testimonials Section */
.testimonials-section {
  padding: 80px 5%;
  background-color: var(--background-light);
}

.testimonial-carousel {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  overflow: hidden;
  padding: 20px 0 60px;
}

.testimonial-card {
  position: absolute;
  width: 100%;
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.6s ease;
  padding: 0 20px;
}

.testimonial-card.active {
  position: relative;
  opacity: 1;
  transform: translateX(0);
}

.testimonial-content {
  background-color: var(--white);
  padding: 40px;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  position: relative;
}

.quote-mark {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 5rem;
  color: rgba(76, 175, 80, 0.1);
  font-family: Georgia, serif;
  line-height: 0;
}

.testimonial-text {
  font-size: 1.1rem;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-weight: bold;
}

.author-name {
  font-weight: bold;
  font-size: 1rem;
}

.author-company {
  color: var(--text-light);
  font-size: 0.9rem;
}

.testimonial-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 30px;
}

.dot {
  width: 12px;
  height: 12px;
  background-color: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dot.active {
  background-color: var(--primary-color);
}

/* Call to Action Section */
.cta-section {
  padding: 80px 5%;
  background: linear-gradient(135deg, var(--primary-color) 0%, #2E7D32 100%);
  text-align: center;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2.2rem;
  color: var(--white);
  margin-bottom: 16px;
}

.cta-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin-bottom: 40px;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.cta-section .btn-primary {
  background-color: var(--white);
  color: var(--primary-color);
}

.cta-section .btn-primary:hover {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.cta-section .btn-outline {
  border-color: var(--white);
  color: var(--white);
}

.cta-section .btn-outline:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Footer */
.footer {
  background-color: #333;
  color: var(--white);
  padding: 60px 5% 40px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 30px;
}

.footer-links {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.8);
  transition: color var(--transition-speed) ease;
}

.footer-links a:hover {
  color: var(--white);
}

.footer-copyright {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

/* Media Queries */
@media (max-width: 1024px) {
  .hero-section {
    flex-direction: column;
    padding: 60px 5%;
  }
  
  .hero-content {
    padding-right: 0;
    margin-bottom: 40px;
    text-align: center;
  }
  
  .hero-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .hero-subtitle {
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .expanded-features-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .expanded-feature-image,
  .analytics-image {
    order: -1;
  }
  
  .secondary-features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.6rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .features-container {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  
  .stats-section {
    padding: 60px 5%;
  }
  
  .stat-item {
    min-width: 150px;
    flex: 1 0 40%;
    margin-bottom: 30px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .testimonial-content {
    padding: 30px 20px;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
}
`}</style>

    </div>
  );
};




export default Home;