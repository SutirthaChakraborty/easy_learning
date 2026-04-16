import apiClient from './api';

export const quizService = {
  getQuizzes: async (difficulty = 'all') => {
    try {
      const response = await apiClient.get('/quizzes', {
        params: { difficulty }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getQuizById: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getQuestions: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  submitQuizAnswers: async (quizId, answers) => {
    try {
      const response = await apiClient.post(`/quizzes/${quizId}/submit`, {
        answers,
        completedAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getQuizResults: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}/results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserQuizHistory: async () => {
    try {
      const response = await apiClient.get('/quizzes/history');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
