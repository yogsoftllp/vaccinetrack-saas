// Simple landing page for development
import React from 'react';

function App() {
  const handleParentLogin = () => {
    window.location.href = '/parent-login.html';
  };

  const handleClinicLogin = () => {
    window.location.href = '/clinic-login.html';
  };

  return React.createElement('div', { className: 'container' },
    React.createElement('h1', null, 'Pediatric Clinic Management System'),
    React.createElement('p', null, 'Welcome to our comprehensive vaccination tracking and clinic management platform.'),
    
    React.createElement('div', { className: 'section' },
      React.createElement('h2', null, 'For Parents'),
      React.createElement('p', null, 'Track your child\'s vaccination schedule, receive reminders, and manage appointments.'),
      React.createElement('button', { 
        className: 'button', 
        onClick: handleParentLogin 
      }, 'Parent Login / Sign Up'),
      React.createElement('p', null, 
        React.createElement('strong', null, 'Demo: '),
        'demo.parent@vaccinetrack.com / DemoParent123!'
      )
    ),
    
    React.createElement('div', { className: 'section' },
      React.createElement('h2', null, 'For Clinics'),
      React.createElement('p', null, 'Manage patient records, vaccination schedules, and clinic operations.'),
      React.createElement('button', { 
        className: 'button', 
        onClick: handleClinicLogin 
      }, 'Clinic Login'),
      React.createElement('p', null, 'Access your clinic dashboard and patient management tools.')
    ),
    
    React.createElement('div', { className: 'section' },
      React.createElement('h2', null, 'Features'),
      React.createElement('ul', null,
        React.createElement('li', null, 'AI-powered vaccination scheduling'),
        React.createElement('li', null, 'Automated reminders and notifications'),
        React.createElement('li', null, 'Multi-tenant clinic management'),
        React.createElement('li', null, 'Comprehensive reporting and analytics'),
        React.createElement('li', null, 'Secure patient data management')
      )
    )
  );
}

export default App;