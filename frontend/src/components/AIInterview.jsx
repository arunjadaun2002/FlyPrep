import { useRef, useState } from 'react';
import { aiInterviewService } from '../services/aiInterview';
import styles from './AIInterview.module.css';
import InterviewSummary from './InterviewSummary';

const AIInterview = () => {
  const [step, setStep] = useState(1); // 1: Upload Resume, 2: Interview, 3: Summary
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewSummary, setInterviewSummary] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      setError(null);
    } else {
      setError('Please upload a PDF file');
    }
  };

  const startInterview = async () => {
    if (!resume) {
      setError('Please upload your resume first');
      return;
    }

    setIsLoading(true);
    try {
      // Start the interview
      const response = await aiInterviewService.startInterview(resume);
      if (response.success) {
        // Generate questions based on resume
        const generatedQuestions = await aiInterviewService.generateQuestions(resume);
        setQuestions(generatedQuestions);
        setCurrentQuestion(generatedQuestions[0].question);
        setStep(2);
        setInterviewStarted(true);
      } else {
        throw new Error(response.message || 'Failed to start interview');
      }
    } catch (err) {
      setError('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setIsLoading(true);
    try {
      // Analyze the answer
      const analysis = await aiInterviewService.analyzeAnswer(
        currentQuestion,
        userAnswer
      );

      setFeedback({
        score: analysis.score,
        comments: analysis.feedback.strengths.join(', '),
        suggestions: analysis.feedback.suggestions
      });

      // Move to next question after a delay
      setTimeout(async () => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentQuestion(questions[currentQuestionIndex + 1].question);
          setUserAnswer('');
          setFeedback(null);
        } else {
          // Interview completed, get summary
          const summary = await aiInterviewService.getInterviewSummary('current-interview');
          setInterviewSummary(summary);
          setStep(3);
        }
      }, 2000);
    } catch (err) {
      setError('Failed to process answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewInterview = () => {
    setStep(1);
    setResume(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(null);
    setUserAnswer('');
    setFeedback(null);
    setInterviewSummary(null);
    setInterviewStarted(false);
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      {step === 1 && (
        <div className={styles.uploadSection}>
          <h2>Upload Your Resume</h2>
          <p>Please upload your resume in PDF format to start the AI interview</p>
          
          <div className={styles.uploadBox}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className={styles.fileInput}
            />
            <button 
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </button>
            {resume && <p className={styles.fileName}>{resume.name}</p>}
          </div>

          <button 
            className={styles.startButton}
            onClick={startInterview}
            disabled={!resume || isLoading}
          >
            {isLoading ? 'Starting Interview...' : 'Start Interview'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.interviewSection}>
          <div className={styles.questionBox}>
            <h3>Question {currentQuestionIndex + 1} of {questions.length}:</h3>
            <p>{currentQuestion}</p>
          </div>

          <div className={styles.answerBox}>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className={styles.answerInput}
            />
            <button 
              className={styles.submitButton}
              onClick={handleAnswerSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Submit Answer'}
            </button>
          </div>

          {feedback && (
            <div className={styles.feedbackBox}>
              <h3>Feedback:</h3>
              <div className={styles.score}>Score: {feedback.score}/10</div>
              <p>{feedback.comments}</p>
              <p className={styles.suggestions}>{feedback.suggestions}</p>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <InterviewSummary 
          summary={interviewSummary} 
          onStartNew={handleStartNewInterview}
        />
      )}
    </div>
  );
};

export default AIInterview; 