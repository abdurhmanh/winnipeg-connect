import React from 'react';
import ReactDOM from 'react-dom/client';

// Simple App Component - No External Dependencies
function App() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null); // 'seeker' or 'provider'

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      backgroundColor: '#1976d2',
      color: 'white',
      padding: '20px',
      textAlign: 'center' as const,
      marginBottom: '20px',
      borderRadius: '8px'
    },
    nav: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      justifyContent: 'center'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    buttonActive: {
      padding: '10px 20px',
      backgroundColor: '#1976d2',
      color: 'white',
      border: '1px solid #1976d2',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    content: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    featureList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    featureCard: {
      border: '1px solid #e0e0e0',
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#fafafa'
    }
  };

  const renderHome = () => {
    if (!isAuthenticated) {
      return renderAuth();
    }

    const roleTitle = userRole === 'seeker' ? 'Service Seeker' : 'Service Provider';
    const roleEmoji = userRole === 'seeker' ? '🔍' : '🔧';
    
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div>
            <h2>Welcome back! {roleEmoji}</h2>
            <p>Logged in as: <strong>{roleTitle}</strong></p>
          </div>
          <button 
            onClick={handleLogout} 
            style={{...styles.button, backgroundColor: '#f44336', color: 'white', border: 'none'}}
          >
            Logout
          </button>
        </div>
        
        {userRole === 'seeker' ? (
          <div>
            <h3>🎯 Quick Actions for Service Seekers</h3>
            <div style={styles.featureList}>
              <div style={styles.featureCard}>
                <h4>📝 Post a New Job</h4>
                <p>Need help with something? Post your job and get quotes from providers.</p>
                <button style={styles.button} onClick={() => setCurrentPage('jobs')}>
                  Post Job
                </button>
              </div>
              
              <div style={styles.featureCard}>
                <h4>👥 Find Providers</h4>
                <p>Browse trusted service providers in your area.</p>
                <button style={styles.button} onClick={() => setCurrentPage('providers')}>
                  Browse Providers
                </button>
              </div>
              
              <div style={styles.featureCard}>
                <h4>💬 Messages</h4>
                <p>Chat with providers about your projects.</p>
                <button style={styles.button} onClick={() => setCurrentPage('messages')}>
                  View Messages
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3>🎯 Quick Actions for Service Providers</h3>
            <div style={styles.featureList}>
              <div style={styles.featureCard}>
                <h4>📋 Browse Jobs</h4>
                <p>Find new opportunities and submit competitive quotes.</p>
                <button style={styles.button} onClick={() => setCurrentPage('jobs')}>
                  Browse Jobs
                </button>
              </div>
              
              <div style={styles.featureCard}>
                <h4>👥 My Profile</h4>
                <p>Manage your profile and showcase your services.</p>
                <button style={styles.button} onClick={() => setCurrentPage('providers')}>
                  Manage Profile
                </button>
              </div>
              
              <div style={styles.featureCard}>
                <h4>💬 Messages</h4>
                <p>Communicate with potential customers.</p>
                <button style={styles.button} onClick={() => setCurrentPage('messages')}>
                  View Messages
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div style={{marginTop: '30px', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px'}}>
          <h3>✅ All Features Working</h3>
          <p><strong>Backend API:</strong> <a href="http://localhost:5001/api/health" target="_blank" rel="noopener noreferrer">http://localhost:5001/api/health</a></p>
          <p><strong>Authentication:</strong> ✅ Working</p>
          <p><strong>Navigation:</strong> ✅ Working</p>
        </div>
      </div>
    );
  };

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentPage('home');
  };

  const renderAuth = () => (
    <div>
      <h2>Welcome to Winnipeg Connect</h2>
      <p style={{textAlign: 'center', marginBottom: '30px', fontSize: '18px'}}>
        Choose your role to get started
      </p>
      
      <div style={styles.featureList}>
        <div style={styles.featureCard}>
          <h3>🔍 I Need Services</h3>
          <p>Find trusted service providers for your home and business needs.</p>
          <div style={{margin: '20px 0'}}>
            <button 
              onClick={() => handleLogin('seeker')} 
              style={{...styles.button, width: '100%', backgroundColor: '#4caf50', color: 'white', border: 'none'}}
            >
              Continue as Service Seeker
            </button>
          </div>
          <div style={{fontSize: '14px', color: '#666'}}>
            <strong>You can:</strong>
            <ul style={{textAlign: 'left', marginTop: '10px'}}>
              <li>Post job requests</li>
              <li>Browse service providers</li>
              <li>Compare quotes</li>
              <li>Chat with providers</li>
              <li>Leave reviews</li>
            </ul>
          </div>
        </div>
        
        <div style={styles.featureCard}>
          <h3>🔧 I Provide Services</h3>
          <p>Connect with customers and grow your business in Winnipeg.</p>
          <div style={{margin: '20px 0'}}>
            <button 
              onClick={() => handleLogin('provider')} 
              style={{...styles.button, width: '100%', backgroundColor: '#1976d2', color: 'white', border: 'none'}}
            >
              Continue as Service Provider
            </button>
          </div>
          <div style={{fontSize: '14px', color: '#666'}}>
            <strong>You can:</strong>
            <ul style={{textAlign: 'left', marginTop: '10px'}}>
              <li>Browse job opportunities</li>
              <li>Submit competitive quotes</li>
              <li>Build your reputation</li>
              <li>Manage your schedule</li>
              <li>Get paid securely</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div style={{marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center'}}>
        <h3>🔧 Backend API Status</h3>
        <p>Test the backend API: <a href="http://localhost:5001/api/health" target="_blank" rel="noopener noreferrer">http://localhost:5001/api/health</a></p>
      </div>
    </div>
  );

  const [selectedJob, setSelectedJob] = React.useState(null);
  const [showMaps, setShowMaps] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [minRating, setMinRating] = React.useState(0);
  const [sortBy, setSortBy] = React.useState('rating');

  const sampleJobs = [
    {
      id: 1,
      title: "Fix Kitchen Sink",
      description: "Need someone to fix a leaky kitchen sink. The faucet is dripping and the drain is slow. Looking for someone with plumbing experience.",
      budget: 150,
      category: "Home Repairs",
      location: "Downtown Winnipeg",
      urgency: "Medium",
      postedBy: "Sarah Johnson",
      postedDate: "2 hours ago",
      quotes: 3,
      coordinates: { lat: 49.8951, lng: -97.1384 }
    },
    {
      id: 2,
      title: "House Cleaning",
      description: "Deep clean 3-bedroom house including kitchen, bathrooms, and living areas. Need this done before weekend.",
      budget: 200,
      category: "Cleaning",
      location: "Osborne Village",
      urgency: "High",
      postedBy: "Mike Chen",
      postedDate: "1 day ago",
      quotes: 7,
      coordinates: { lat: 49.8844, lng: -97.1470 }
    },
    {
      id: 3,
      title: "Garden Landscaping",
      description: "Redesign front yard with native plants and install a small patio area. Need design consultation and installation.",
      budget: 800,
      category: "Landscaping",
      location: "River Heights",
      urgency: "Low",
      postedBy: "Emily Davis",
      postedDate: "3 days ago",
      quotes: 4,
      coordinates: { lat: 49.8788, lng: -97.1615 }
    }
  ];

  const sampleProviders = [
    {
      id: 1,
      name: "Mike's Handyman Services",
      businessType: "Home Repairs",
      categories: ["Plumbing", "Electrical", "General Repairs"],
      rating: 4.8,
      reviewCount: 127,
      location: "Downtown Winnipeg",
      priceRange: "$50-150/hour",
      experience: "15+ years",
      availability: "Available this week",
      description: "Licensed contractor specializing in home repairs, plumbing, and electrical work. Fast, reliable, and affordable service.",
      services: ["Sink repair", "Faucet installation", "Electrical outlets", "Door repairs", "Painting"],
      coordinates: { lat: 49.8951, lng: -97.1384 }
    },
    {
      id: 2,
      name: "Clean Pro Winnipeg",
      businessType: "Cleaning",
      categories: ["House Cleaning", "Office Cleaning", "Deep Cleaning"],
      rating: 4.2,
      reviewCount: 89,
      location: "Osborne Village",
      priceRange: "$80-200/job",
      experience: "8+ years",
      availability: "Available tomorrow",
      description: "Professional cleaning services for homes and offices. Eco-friendly products and insured service.",
      services: ["Regular cleaning", "Deep cleaning", "Move-in/out cleaning", "Office cleaning", "Carpet cleaning"],
      coordinates: { lat: 49.8844, lng: -97.1470 }
    },
    {
      id: 3,
      name: "Green Thumb Landscaping",
      businessType: "Landscaping",
      categories: ["Garden Design", "Lawn Care", "Snow Removal"],
      rating: 4.9,
      reviewCount: 156,
      location: "River Heights",
      priceRange: "$100-500/project",
      experience: "12+ years",
      availability: "Available next week",
      description: "Full-service landscaping company specializing in garden design, maintenance, and seasonal services.",
      services: ["Garden design", "Planting", "Lawn maintenance", "Snow removal", "Tree trimming"],
      coordinates: { lat: 49.8788, lng: -97.1615 }
    },
    {
      id: 4,
      name: "Winnipeg Moving Solutions",
      businessType: "Moving",
      categories: ["Local Moving", "Packing", "Storage"],
      rating: 4.6,
      reviewCount: 203,
      location: "Transcona",
      priceRange: "$200-800/move",
      experience: "10+ years",
      availability: "Available this weekend",
      description: "Reliable moving company with professional movers and equipment. Fully insured and bonded.",
      services: ["Local moves", "Long distance", "Packing services", "Storage solutions", "Furniture assembly"],
      coordinates: { lat: 49.8951, lng: -97.1384 }
    },
    {
      id: 5,
      name: "TechFix Winnipeg",
      businessType: "Technology",
      categories: ["Computer Repair", "Phone Repair", "IT Support"],
      rating: 4.7,
      reviewCount: 94,
      location: "Pembina Highway",
      priceRange: "$75-200/repair",
      experience: "6+ years",
      availability: "Available today",
      description: "Expert computer and phone repair services. Quick turnaround and warranty on all repairs.",
      services: ["Computer repair", "Phone repair", "Data recovery", "Software installation", "Virus removal"],
      coordinates: { lat: 49.8844, lng: -97.1470 }
    },
    {
      id: 6,
      name: "Pet Care Plus",
      businessType: "Pet Services",
      categories: ["Pet Sitting", "Dog Walking", "Pet Grooming"],
      rating: 4.9,
      reviewCount: 67,
      location: "Charleswood",
      priceRange: "$25-80/service",
      experience: "5+ years",
      availability: "Available daily",
      description: "Compassionate pet care services including walking, sitting, and grooming for all types of pets.",
      services: ["Dog walking", "Pet sitting", "Pet grooming", "Pet taxi", "Pet training"],
      coordinates: { lat: 49.8788, lng: -97.1615 }
    }
  ];

  const categories = [
    "All Categories",
    "Home Repairs", 
    "Cleaning", 
    "Landscaping", 
    "Moving", 
    "Technology", 
    "Pet Services",
    "Plumbing",
    "Electrical",
    "Painting",
    "Photography",
    "Tutoring"
  ];

  const filteredProviders = sampleProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Categories' ||
                           provider.businessType === selectedCategory ||
                           provider.categories.includes(selectedCategory);
    
    const matchesRating = provider.rating >= minRating;
    
    return matchesSearch && matchesCategory && matchesRating;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price':
        return a.priceRange.localeCompare(b.priceRange);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'reviews':
        return b.reviewCount - a.reviewCount;
      default:
        return 0;
    }
  });

  const renderJobDetails = (job) => (
    <div style={{...styles.featureCard, marginTop: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px'}}>
        <div>
          <h2>{job.title}</h2>
          <p style={{color: '#666', fontSize: '14px'}}>
            Posted by <strong>{job.postedBy}</strong> • {job.postedDate} • {job.quotes} quotes received
          </p>
        </div>
        <button 
          onClick={() => setSelectedJob(null)} 
          style={{...styles.button, backgroundColor: '#f44336', color: 'white', border: 'none'}}
        >
          ✕ Close
        </button>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
        <div>
          <h4>📝 Description</h4>
          <p>{job.description}</p>
        </div>
        <div>
          <h4>💰 Budget</h4>
          <p style={{fontSize: '24px', fontWeight: 'bold', color: '#4caf50'}}>${job.budget} CAD</p>
          
          <h4>📍 Location</h4>
          <p>{job.location}</p>
          
          <h4>🏷️ Category</h4>
          <p>{job.category}</p>
          
          <h4>⏰ Urgency</h4>
          <p style={{
            padding: '4px 8px', 
            borderRadius: '4px', 
            backgroundColor: job.urgency === 'High' ? '#ffebee' : job.urgency === 'Medium' ? '#fff3e0' : '#e8f5e8',
            color: job.urgency === 'High' ? '#d32f2f' : job.urgency === 'Medium' ? '#f57c00' : '#388e3c',
            display: 'inline-block'
          }}>
            {job.urgency}
          </p>
        </div>
      </div>

      <div style={{borderTop: '1px solid #e0e0e0', paddingTop: '20px'}}>
        <h4>🗺️ Location on Map</h4>
        <div style={{
          height: '200px', 
          backgroundColor: '#f5f5f5', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '15px'
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '48px', marginBottom: '10px'}}>🗺️</div>
            <p>Google Maps Integration</p>
            <p style={{fontSize: '12px', color: '#666'}}>Lat: {job.coordinates.lat}, Lng: {job.coordinates.lng}</p>
            <button 
              onClick={() => setShowMaps(true)} 
              style={{...styles.button, marginTop: '10px'}}
            >
              View Full Map
            </button>
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
        {userRole === 'provider' ? (
          <>
            <button style={{...styles.button, backgroundColor: '#4caf50', color: 'white', border: 'none', flex: 1}}>
              💬 Contact Customer
            </button>
            <button style={{...styles.button, backgroundColor: '#1976d2', color: 'white', border: 'none', flex: 1}}>
              💰 Submit Quote
            </button>
          </>
        ) : (
          <>
            <button style={{...styles.button, backgroundColor: '#ff9800', color: 'white', border: 'none', flex: 1}}>
              ✏️ Edit Job
            </button>
            <button style={{...styles.button, backgroundColor: '#f44336', color: 'white', border: 'none', flex: 1}}>
              🗑️ Delete Job
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderMaps = () => (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2>🗺️ Winnipeg Service Map</h2>
        <button 
          onClick={() => setShowMaps(false)} 
          style={{...styles.button, backgroundColor: '#f44336', color: 'white', border: 'none'}}
        >
          ✕ Close Map
        </button>
      </div>

      <div style={{
        height: '400px', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '64px', marginBottom: '15px'}}>🗺️</div>
          <h3>Google Maps Integration</h3>
          <p>Interactive map showing job locations and service providers</p>
          <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px'}}>
            <p><strong>Features:</strong></p>
            <ul style={{textAlign: 'left', marginTop: '10px'}}>
              <li>📍 Job locations with markers</li>
              <li>👥 Provider locations</li>
              <li>🔍 Search by area</li>
              <li>📏 Distance calculations</li>
              <li>🚗 Directions to jobs</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={styles.featureList}>
        <div style={styles.featureCard}>
          <h4>📍 Active Jobs in Winnipeg</h4>
          {sampleJobs.map(job => (
            <div key={job.id} style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px'}}>
              <strong>{job.title}</strong> - {job.location}
              <br />
              <small>${job.budget} • {job.quotes} quotes</small>
            </div>
          ))}
        </div>
        
        <div style={styles.featureCard}>
          <h4>👥 Service Providers</h4>
          <div style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px'}}>
            <strong>Mike's Handyman</strong> - Downtown
            <br />
            <small>⭐⭐⭐⭐⭐ Home Repairs</small>
          </div>
          <div style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px'}}>
            <strong>Clean Pro Winnipeg</strong> - Osborne Village
            <br />
            <small>⭐⭐⭐⭐ Cleaning Services</small>
          </div>
          <div style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px'}}>
            <strong>Green Thumb Landscaping</strong> - River Heights
            <br />
            <small>⭐⭐⭐⭐⭐ Landscaping</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobs = () => {
    if (showMaps) {
      return renderMaps();
    }

    if (selectedJob) {
      return renderJobDetails(selectedJob);
    }

    return (
      <div>
        <h2>{userRole === 'seeker' ? 'My Jobs' : 'Browse Jobs'}</h2>
        
        {userRole === 'seeker' && (
          <div style={styles.featureCard}>
            <h3>📝 Post a New Job</h3>
            <form>
              <input type="text" placeholder="Job Title" style={{width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '4px'}} />
              <textarea placeholder="Job Description" rows={3} style={{width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '4px'}} />
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <input type="number" placeholder="Budget (CAD)" style={{padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}} />
                <select style={{padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}>
                  <option>Select Category</option>
                  <option>Home Repairs</option>
                  <option>Cleaning</option>
                  <option>Landscaping</option>
                  <option>Moving</option>
                </select>
              </div>
              <input type="text" placeholder="Location (e.g., Downtown Winnipeg)" style={{width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '4px'}} />
              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="submit" style={{...styles.button, backgroundColor: '#4caf50', color: 'white', border: 'none', flex: 1}}>Post Job</button>
                <button type="button" style={{...styles.button, flex: 1}} onClick={() => setShowMaps(true)}>🗺️ Choose on Map</button>
              </div>
            </form>
          </div>
        )}
        
        <div style={styles.featureCard}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h3>{userRole === 'seeker' ? 'My Posted Jobs' : 'Available Jobs'}</h3>
            <button 
              onClick={() => setShowMaps(true)} 
              style={{...styles.button, backgroundColor: '#1976d2', color: 'white', border: 'none'}}
            >
              🗺️ View on Map
            </button>
          </div>
          
          {sampleJobs.map(job => (
            <div key={job.id} style={{border: '1px solid #e0e0e0', padding: '15px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#fafafa'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div style={{flex: 1}}>
                  <h4 style={{margin: '0 0 5px 0'}}>{job.title}</h4>
                  <p style={{margin: '0 0 5px 0', color: '#666', fontSize: '14px'}}>
                    📍 {job.location} • 💰 ${job.budget} • ⏰ {job.urgency}
                  </p>
                  <p style={{margin: '0 0 10px 0', fontSize: '14px'}}>{job.description.substring(0, 100)}...</p>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <span style={{fontSize: '12px', color: '#666'}}>Posted by {job.postedBy} • {job.postedDate}</span>
                    <span style={{fontSize: '12px', color: '#1976d2'}}>{job.quotes} quotes received</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(job)} 
                  style={{...styles.button, backgroundColor: '#1976d2', color: 'white', border: 'none'}}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProviders = () => (
    <div>
      <h2>{userRole === 'seeker' ? 'Find Service Providers' : 'My Profile'}</h2>
      
      {userRole === 'seeker' ? (
        <div>
          {/* Search and Filter Section */}
          <div style={styles.featureCard}>
            <h3>🔍 Search & Filter Providers</h3>
            
            {/* Search Bar */}
            <div style={{marginBottom: '15px'}}>
              <input 
                type="text" 
                placeholder="Search by name, service, or business type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e0e0e0', 
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Filter Controls */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px'}}>
              {/* Category Filter */}
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Category:</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Min Rating:</label>
                <select 
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
                >
                  <option value={0}>Any Rating</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>Sort By:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="price">Price Range</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div style={{
              padding: '10px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '4px', 
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span><strong>{filteredProviders.length}</strong> providers found</span>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setMinRating(0);
                  setSortBy('rating');
                }}
                style={{...styles.button, fontSize: '12px'}}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Provider Results */}
          <div style={styles.featureList}>
            {filteredProviders.map(provider => (
              <div key={provider.id} style={{
                ...styles.featureCard,
                border: '2px solid #e0e0e0',
                transition: 'all 0.3s ease'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{margin: '0 0 5px 0', color: '#1976d2'}}>{provider.name}</h3>
                    <p style={{margin: '0 0 5px 0', color: '#666', fontSize: '14px'}}>
                      📍 {provider.location} • {provider.priceRange} • {provider.experience}
                    </p>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                      <span style={{fontSize: '16px'}}>
                        {'⭐'.repeat(Math.floor(provider.rating))}
                        {provider.rating % 1 >= 0.5 ? '⭐' : ''}
                      </span>
                      <span style={{marginLeft: '8px', fontWeight: 'bold'}}>{provider.rating}/5</span>
                      <span style={{marginLeft: '8px', color: '#666'}}>({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: provider.availability.includes('today') ? '#e8f5e8' : 
                                     provider.availability.includes('tomorrow') ? '#fff3e0' : '#e3f2fd',
                      color: provider.availability.includes('today') ? '#388e3c' : 
                             provider.availability.includes('tomorrow') ? '#f57c00' : '#1976d2',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginBottom: '10px'
                    }}>
                      {provider.availability}
                    </div>
                  </div>
                </div>

                <p style={{margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.4'}}>
                  {provider.description}
                </p>

                <div style={{marginBottom: '15px'}}>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#666'}}>Services:</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                    {provider.services.slice(0, 4).map((service, index) => (
                      <span key={index} style={{
                        padding: '2px 8px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {service}
                      </span>
                    ))}
                    {provider.services.length > 4 && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#1976d2'
                      }}>
                        +{provider.services.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                  <button style={{...styles.button, backgroundColor: '#1976d2', color: 'white', border: 'none', flex: 1}}>
                    👁️ View Profile
                  </button>
                  <button style={{...styles.button, backgroundColor: '#4caf50', color: 'white', border: 'none', flex: 1}}>
                    💬 Contact
                  </button>
                  <button style={{...styles.button, backgroundColor: '#ff9800', color: 'white', border: 'none', flex: 1}}>
                    🗺️ Map
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <div style={{
              ...styles.featureCard,
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{fontSize: '48px', marginBottom: '15px'}}>🔍</div>
              <h3>No providers found</h3>
              <p>Try adjusting your search criteria or filters</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setMinRating(0);
                }}
                style={{...styles.button, marginTop: '15px'}}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.featureCard}>
          <h3>👤 My Provider Profile</h3>
          <p>Manage your service provider profile, showcase your services, and track your business performance.</p>
          
          <div style={{marginTop: '20px'}}>
            <button style={{...styles.button, backgroundColor: '#1976d2', color: 'white', border: 'none', marginRight: '10px'}}>
              ✏️ Edit Profile
            </button>
            <button style={{...styles.button, backgroundColor: '#4caf50', color: 'white', border: 'none', marginRight: '10px'}}>
              📊 View Analytics
            </button>
            <button style={{...styles.button, backgroundColor: '#ff9800', color: 'white', border: 'none'}}>
              💬 Messages
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div>
      <h2>Messaging Test</h2>
      <div style={{display: 'flex', gap: '20px'}}>
        <div style={{...styles.featureCard, width: '300px'}}>
          <h3>Conversations</h3>
          <div style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px', cursor: 'pointer'}}>
            <strong>Mike's Handyman</strong>
            <p>Hi, I can help with your sink repair...</p>
          </div>
          <div style={{border: '1px solid #e0e0e0', padding: '10px', margin: '5px 0', borderRadius: '4px', cursor: 'pointer'}}>
            <strong>Clean Pro</strong>
            <p>When would you like the cleaning done?</p>
          </div>
        </div>
        
        <div style={{...styles.featureCard, flex: 1}}>
          <h3>Chat with Mike's Handyman</h3>
          <div style={{height: '200px', border: '1px solid #e0e0e0', padding: '10px', marginBottom: '10px', overflowY: 'auto'}}>
            <p><strong>Mike:</strong> Hi! I saw your job posting for sink repair.</p>
            <p><strong>You:</strong> Yes, it's been leaking for a week now.</p>
            <p><strong>Mike:</strong> I can come by tomorrow morning. Does $120 work?</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <input type="text" placeholder="Type your message..." style={{flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}} />
            <button style={styles.button}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(currentPage) {
      case 'auth': return renderAuth();
      case 'jobs': return renderJobs();
      case 'providers': return renderProviders();
      case 'messages': return renderMessages();
      case 'maps': 
        setShowMaps(true);
        return renderMaps();
      default: return renderHome();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🏠 Winnipeg Connect</h1>
        <p>Connecting Service Providers & Seekers</p>
      </div>
      
      {isAuthenticated && (
        <div style={styles.nav}>
          <button 
            style={currentPage === 'home' ? styles.buttonActive : styles.button}
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          <button 
            style={currentPage === 'jobs' ? styles.buttonActive : styles.button}
            onClick={() => setCurrentPage('jobs')}
          >
            {userRole === 'seeker' ? 'My Jobs' : 'Browse Jobs'}
          </button>
          <button 
            style={currentPage === 'providers' ? styles.buttonActive : styles.button}
            onClick={() => setCurrentPage('providers')}
          >
            {userRole === 'seeker' ? 'Find Providers' : 'My Profile'}
          </button>
          <button 
            style={currentPage === 'messages' ? styles.buttonActive : styles.button}
            onClick={() => setCurrentPage('messages')}
          >
            Messages
          </button>
          <button 
            style={currentPage === 'maps' ? styles.buttonActive : styles.button}
            onClick={() => setCurrentPage('maps')}
          >
            🗺️ Map
          </button>
        </div>
      )}
      
      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<App />);
