import styles from './InterviewSummary.module.css';

const InterviewSummary = ({ summary, onStartNew }) => {
  if (!summary) return null;

  return (
    <div className={styles.container}>
      <h2>Interview Summary</h2>
      
      <div className={styles.scoreSection}>
        <div className={styles.scoreBox}>
          <h3>Overall Score</h3>
          <div className={styles.score}>{summary.averageScore}/10</div>
        </div>
        <div className={styles.statsBox}>
          <div className={styles.stat}>
            <span>Total Questions</span>
            <span>{summary.totalQuestions}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Strengths</h3>
        <ul className={styles.list}>
          {summary.strengths.map((strength, index) => (
            <li key={index} className={styles.listItem}>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3>Areas for Improvement</h3>
        <ul className={styles.list}>
          {summary.areas.map((area, index) => (
            <li key={index} className={styles.listItem}>
              {area}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3>Recommendations</h3>
        <ul className={styles.list}>
          {summary.recommendations.map((recommendation, index) => (
            <li key={index} className={styles.listItem}>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.actions}>
        <button className={styles.button}>Download Report</button>
        <button className={styles.button} onClick={onStartNew}>
          Start New Interview
        </button>
      </div>
    </div>
  );
};

export default InterviewSummary; 