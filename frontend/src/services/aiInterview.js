// This service will handle all AI interview related API calls
// For now, we'll use mock data, but this will be replaced with actual API calls

export const aiInterviewService = {
  // Upload resume and start interview
  startInterview: async (resumeFile) => {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Interview started successfully'
        });
      }, 2000);
    });
  },

  // Generate questions based on resume
  generateQuestions: async (resumeContent) => {
    // TODO: Replace with actual API call to AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            question: "Can you tell me more about your experience with React?",
            type: "technical"
          },
          {
            id: 2,
            question: "What was your role in the e-commerce project mentioned in your resume?",
            type: "experience"
          },
          {
            id: 3,
            question: "How did you handle the performance optimization challenges in your previous role?",
            type: "problem-solving"
          }
        ]);
      }, 1500);
    });
  },

  // Analyze user's answer
  analyzeAnswer: async (question, answer) => {
    // TODO: Replace with actual API call to AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          score: Math.floor(Math.random() * 10) + 1,
          feedback: {
            strengths: [
              "Good technical knowledge",
              "Clear communication"
            ],
            areas: [
              "Could provide more specific examples",
              "Consider elaborating on your problem-solving approach"
            ],
            suggestions: "Try to include more concrete examples from your experience"
          }
        });
      }, 1500);
    });
  },

  // Get interview summary
  getInterviewSummary: async (interviewId) => {
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalQuestions: 5,
          averageScore: 7.5,
          strengths: [
            "Technical knowledge",
            "Communication skills",
            "Problem-solving abilities"
          ],
          areas: [
            "Need more specific examples",
            "Could improve time management"
          ],
          recommendations: [
            "Practice with more technical questions",
            "Work on providing concrete examples",
            "Focus on time management during answers"
          ]
        });
      }, 1000);
    });
  }
}; 