import { FaEnvelope, FaLinkedin, FaTimes } from 'react-icons/fa';
import styles from './ContactModal.module.css';

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <h2 className={styles.title}>Contact Us</h2>
        <div className={styles.contactOptions}>
          <a 
            href="https://www.linkedin.com/in/techeng-fly-3ba5a8361/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.contactOption}
          >
            <FaLinkedin className={styles.icon} />
            <span className={styles.contactText}>Connect on LinkedIn</span>
          </a>
          <a 
            href="mailto:techengfly@gmail.com"
            className={styles.contactOption}
          >
            <FaEnvelope className={styles.icon} />
            <span className={styles.contactText}>techengfly@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactModal; 