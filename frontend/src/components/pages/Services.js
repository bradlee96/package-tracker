import React, {useState, useEffect} from 'react';
import '../../App.css';
import GoogleLogin from 'react-google-login';

export default function Services() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api")
    .then((res) => res.json())
    .then((data) => setData(data.message));
  }, [])

  const handleLogin = async googleData => {
    console.log(googleData);
    console.log(googleData.tokenId);

    const res = await fetch("http://localhost:3001/api/v1/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        token: googleData.tokenId
      })
    });

    const data = await res.json();
    console.log(data); // do something with this data
  }

  return (
    <div>
      <GoogleLogin
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        buttonText="Sign in with Google"
        onSuccess={handleLogin}
        onFailure={handleLogin}
        cookiePolicy={'single_host_origin'}
      />
      <h1 className='services'>Test</h1>
      <p>{!data ? "Loading" : data}</p>
    </div>
  );
}