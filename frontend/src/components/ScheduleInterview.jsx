import React, { useState } from 'react';
import { FaBuilding, FaCalendarAlt, FaClock, FaComment, FaEnvelope, FaGraduationCap, FaInfoCircle, FaPhone, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './ScheduleInterview.module.css';

const ScheduleInterview = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    collegeYear: '',
    company: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create email body with all form details
    const emailBody = `
Interview Request Details:

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

Preferred Date: ${formData.preferredDate}
Preferred Time: ${formData.preferredTime}

College Year: ${formData.collegeYear}
College Name: ${formData.company}

Additional Information:
${formData.message}
    `;

    // Create mailto link
    const mailtoLink = `mailto:techengfly@gmail.com?subject=New Interview Request from ${formData.name}&body=${encodeURIComponent(emailBody)}`;
    
    // Open default email client
    window.location.href = mailtoLink;

    // Show success message
    toast.success('Opening email client with your details!');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      preferredDate: '',
      preferredTime: '',
      collegeYear: '',
      company: '',
      message: ''
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <div className={styles.title}>Schedule Mock Interview</div>
        <div className={styles.subtitle}>Take the next step in your career preparation</div>
        
        <div className={styles.scheduleNote}>
          <FaInfoCircle style={{ marginRight: '8px', color: '#4f46e5' }} />
          <span>
            <strong>Note:</strong> Interviews are available after 6:30 PM on Monday-Saturday, and any time on Sunday.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                <FaUser style={{ marginRight: 6, color: '#4f46e5' }} /> Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaEnvelope style={{ marginRight: 6, color: '#4f46e5' }} /> Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                <FaPhone style={{ marginRight: 6, color: '#4f46e5' }} /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaCalendarAlt style={{ marginRight: 6, color: '#4f46e5' }} /> Preferred Date
              </label>
              <input
                type="date"
                name="preferredDate"
                required
                value={formData.preferredDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                <FaClock style={{ marginRight: 6, color: '#4f46e5' }} /> Preferred Time
              </label>
              <input
                type="time"
                name="preferredTime"
                required
                value={formData.preferredTime}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaGraduationCap style={{ marginRight: 6, color: '#4f46e5' }} /> College Year
              </label>
              <select
                name="collegeYear"
                value={formData.collegeYear}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>
              <FaBuilding style={{ marginRight: 6, color: '#4f46e5' }} /> College Name
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Enter your college name"
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              <FaComment style={{ marginRight: 6, color: '#4f46e5' }} /> Additional Information
            </label>
            <textarea
              name="message"
              rows="3"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any additional information you'd like to share..."
            ></textarea>
          </div>
          <button type="submit" className={styles.submitButton}>
            Schedule Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterview;