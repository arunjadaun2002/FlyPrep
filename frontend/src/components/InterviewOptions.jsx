import { Link } from 'react-router-dom';
import styles from './InterviewOptions.module.css';

const InterviewOptions = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Choose Your Interview Type</h1>
      <p className={styles.subtitle}>Select the type of interview you want to practice</p>
      
      <div className={styles.optionsContainer}>
        <Link to="/ai-interview" className={styles.option}>
          <div className={styles.optionContent}>
            <h2>AI-Based Interview</h2>
            <p>Upload your resume and get interviewed by our AI</p>
            <ul className={styles.features}>
              <li>Personalized questions based on your resume</li>
              <li>Instant feedback on your answers</li>
              <li>Practice at your own pace</li>
            </ul>
          </div>
        </Link>

        <Link to="/schedule-interview" className={styles.option}>
          <div className={styles.optionContent}>
            <h2>Schedule Mock Interview</h2>
            <p>Book a one-on-one interview with a real interviewer</p>
            <ul className={styles.features}>
              <li>Personalized feedback from experienced interviewers</li>
              <li>Real-time interaction and guidance</li>
              <li>Flexible scheduling options</li>
            </ul>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default InterviewOptions; 