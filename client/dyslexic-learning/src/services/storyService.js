import apiClient from './api';

export const storyService = {
  getStories: async (filters = {}) => {
    try {
      const response = await apiClient.get('/stories', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getStoryById: async (storyId) => {
    try {
      const response = await apiClient.get(`/stories/${storyId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getStoryAudio: async (storyId) => {
    try {
      const response = await apiClient.get(`/stories/${storyId}/audio`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getStoryText: async (storyId) => {
    try {
      const response = await apiClient.get(`/stories/${storyId}/text`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markStoryAsCompleted: async (storyId) => {
    try {
      const response = await apiClient.post(`/stories/${storyId}/complete`, {
        completedAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  saveReadingProgress: async (storyId, progress) => {
    try {
      const response = await apiClient.put(`/stories/${storyId}/progress`, {
        progress,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
