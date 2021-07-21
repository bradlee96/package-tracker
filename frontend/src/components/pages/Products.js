import React from 'react';
import '../../App.css';
import GoogleButton from 'react-google-button';

export default function Products() {

  return (
    <div className="product">
      <GoogleButton
        onClick={() => window.open('http://localhost:3001/oauth2', 'auth', 'toolbar=0,status=0,width=548,height=548')}
      />
      <h1 className='products'>Test</h1>
    </div>
  )
}