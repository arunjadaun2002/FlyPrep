import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/TechLogo.png';
import ContactModal from './ContactModal';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link to="/">
            <img src={logo} alt="FlyPrep Logo" />
            <span>FlyPrep</span>
          </Link>
        </div>
        <div className={styles.navLinks}>
          <Link to="/about">About</Link>
          <Link to="/group-discussion">Group Discussion</Link>
          <Link to="/mock-interview">Mock Interview</Link>
          <Link to="/report-bug">Report Bug</Link>
          <button 
            className={styles.contactBtn}
            onClick={() => setIsContactModalOpen(true)}
          >
            Contact Me
          </button>
        </div>
      </nav>
      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
};

export default Navbar; 