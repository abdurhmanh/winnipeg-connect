import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>
        🎉 Winnipeg Connect is Working!
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        React is compiling successfully!
      </p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Next Steps:</h2>
        <p>✅ Frontend: Running on port 3000</p>
        <p>🔄 Backend: Should be on port 5001</p>
        <p>
          <a 
            href="http://localhost:5001/api/health" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            Test Backend API →
          </a>
        </p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(<App />);
