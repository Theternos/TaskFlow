import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function GoogleCallback() {
    const location = useLocation();
    const navigate = useNavigate();
  
    useEffect(() => {
      console.log("GoogleCallback component rendering with search params:", location.search);
      
      // This means the React app caught the callback directly - not ideal
      if (location.search.includes('code=')) {
        console.log("Direct OAuth code detected in React - redirecting to server handler");
        
        // Two options:
        // 1. Redirect to your server's callback handler (preferred)
        window.location.href = `/api/auth/google/callback${location.search}`;
        
        // OR
        
        // 2. Handle the code exchange on the client side
        const code = new URLSearchParams(location.search).get('code');
        const state = new URLSearchParams(location.search).get('state');
        
        // Send to your server's token exchange endpoint
        fetch('/api/exchange-google-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, state })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            navigate('/settings?calendarConnected=true&source=client');
          } else {
            navigate(`/settings?calendarConnected=false&error=${data.error}&source=client`);
          }
        })
        .catch(error => {
          navigate(`/settings?calendarConnected=false&error=exchange_error&source=client`);
        });
      } else {
        // Normal redirect from server with processed parameters
        navigate(location.pathname + location.search);
      }
    }, [location, navigate]);
  
    return <div>Processing authentication...</div>;
  }

export default GoogleCallback;