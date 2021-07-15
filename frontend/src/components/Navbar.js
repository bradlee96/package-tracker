import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import './Navbar.css';

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);
  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  }

  useEffect(() => {
    showButton()}
  , []);

  window.addEventListener('resize', showButton);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
            TEST <i className='fab fa-typo3' />
          </Link>
          <div className="menu-icon" onClick={handleClick}>
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>
          <ul className={click ? 'nav-menu-active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                Bar 1
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/services' className='nav-links' onClick={closeMobileMenu}>
                Bar 2
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/products' className='nav-links' onClick={closeMobileMenu}>
                Bar 3
              </Link>
            </li>
            <li className='nav-item'>
              <Link to='/sign-up' className='nav-links-mobile' onClick={closeMobileMenu}>
                Bar 4
              </Link>
            </li>
          </ul>
          {button && <Button buttonStyle='btn--outline'>Bar 4</Button>}
        </div>
      </nav>
    </>
  )
}

export default Navbar
