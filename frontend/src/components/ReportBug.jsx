import { useState } from 'react';
import styles from './ReportBug.module.css';

const ReportBug = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create email content with formatted bug report
    const emailSubject = `Bug Report: ${title}`;
    const emailBody = `Bug Title: ${title}%0D%0A%0D%0ADescription:%0D%0A${description}%0D%0A%0D%0A`;
    
    // Open default email client with pre-filled content
    window.location.href = `mailto:techengfly@gmail.com?subject=${emailSubject}&body=${emailBody}`;
    
    // Reset form
    setTitle('');
    setDescription('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Report a Bug</h1>
        <p className={styles.subtitle}>Help us improve by reporting any issues you encounter</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>Issue Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a brief title for the issue"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Detailed Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail. Include steps to reproduce if possible."
              required
              className={styles.textarea}
              rows="6"
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Send Bug Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportBug; 