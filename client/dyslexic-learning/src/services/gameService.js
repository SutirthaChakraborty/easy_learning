import apiClient from './api';

export const gameService = {
  getGames: async () => {
    try {
      const response = await apiClient.get('/games');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getGameById: async (gameId) => {
    try {
      const response = await apiClient.get(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  submitGameScore: async (gameId, score, difficulty) => {
    try {
      const response = await apiClient.post(`/games/${gameId}/score`, {
        score,
        difficulty,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getGameLeaderboard: async (gameId, limit = 10) => {
    try {
      const response = await apiClient.get(`/games/${gameId}/leaderboard`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
