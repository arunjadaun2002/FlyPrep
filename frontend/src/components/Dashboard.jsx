import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Welcome to FlyPrep</h1>
      <p className={styles.subtitle}>Choose your preparation mode</p>
      
      <div className={styles.optionsContainer}>
        <Link to="/group-discussion" className={styles.option}>
          <div className={styles.optionContent}>
            <h2>Group Discussion</h2>
            <p>Practice group discussions with your peers</p>
          </div>
        </Link>

        <Link to="/mock-interview" className={styles.option}>
          <div className={styles.optionContent}>
            <h2>Mock Interview</h2>
            <p>Practice one-on-one interviews</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 