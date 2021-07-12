import React, {useState, useEffect} from 'react';
import '../../App.css';

export default function Services() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api")
    .then((res) => res.json())
    .then((data) => setData(data.message));
  }, [])

  return (
    <div>
      <h1 className='services'>SERVICES</h1>
      <p>{!data ? "Loading" : data}</p>
    </div>
  );
}