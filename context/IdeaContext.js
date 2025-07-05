import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../utils/api';

const IdeaContext = createContext();

const ideaReducer = (state, action) => {
  switch (action.type) {
    case 'SET_IDEAS':
      return {
        ...state,
        ideas: action.payload,
      };
    case 'ADD_IDEA':
      return {
        ...state,
        ideas: [action.payload, ...state.ideas],
      };
    case 'UPDATE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea._id === action.payload._id ? action.payload : idea
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CLEAR_IDEAS':
      return {
        ...state,
        ideas: [],
      };
    default:
      return state;
  }
};

const initialState = {
  ideas: [],
  loading: false,
};

export const IdeaProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ideaReducer, initialState);

  // Callback to refresh user data (will be set by UserProvider)
  let refreshUserCallback = null;

  const setRefreshUserCallback = useCallback((callback) => {
    refreshUserCallback = callback;
  }, []);

  const loadIdeas = useCallback(async () => {
    try {
      console.log('🔄 Loading ideas...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const res = await api.get('/api/ideas');
      
      // Handle different possible response structures
      let ideasData = [];
      if (res.data && res.data.data && res.data.data.ideas) {
        ideasData = res.data.data.ideas;
      } else if (res.data && res.data.ideas) {
        ideasData = res.data.ideas;
      } else if (Array.isArray(res.data)) {
        ideasData = res.data;
      } else {
        console.warn('⚠️ Unexpected API response structure:', res.data);
        ideasData = [];
      }
      
      console.log(`✅ Loaded ${ideasData.length} ideas`);
      dispatch({ type: 'SET_IDEAS', payload: ideasData });
      
    } catch (error) {
      console.error('❌ Error loading ideas:', error.message);
      // Don't throw error, just log it and keep empty ideas array
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearIdeas = useCallback(() => {
    dispatch({ type: 'CLEAR_IDEAS' });
  }, []);

  const submitIdea = useCallback(async (ideaData) => {
    try {
      console.log('🚀 Submitting idea...');
      const res = await api.post('/api/ideas', ideaData);
      console.log('✅ Idea submitted successfully');
      
      // Force reload ideas to get the latest data
      await loadIdeas();
      
      // Refresh user data to update credit points
      if (refreshUserCallback) {
        await refreshUserCallback();
      }
      
      return res.data.data.idea;
    } catch (error) {
      console.error('❌ Error submitting idea:', error.message);
      throw error;
    }
  }, [loadIdeas, refreshUserCallback]);

  const updateIdeaStatus = useCallback(async (ideaId, statusData) => {
    try {
      const res = await api.put(`/api/ideas/${ideaId}/status`, statusData);
      dispatch({ type: 'UPDATE_IDEA', payload: res.data.data.idea });
      // Refresh user data to update credit points
      if (refreshUserCallback) {
        await refreshUserCallback();
      }
      return res.data.data.idea;
    } catch (error) {
      console.error('Error updating idea status:', error);
      throw error;
    }
  }, [refreshUserCallback]);

  const editIdea = useCallback(async (ideaId, updatedData) => {
    try {
      const res = await api.put(`/api/ideas/${ideaId}`, updatedData);
      await loadIdeas();
      return res.data.data.idea;
    } catch (error) {
      console.error('Error editing idea:', error);
      throw error;
    }
  }, [loadIdeas]);

  const deleteIdea = useCallback(async (ideaId) => {
    try {
      const response = await api.delete(`/api/ideas/${ideaId}`);
      
      if (response.data.success) {
        // Remove the deleted idea from the local state immediately
        dispatch({ 
          type: 'SET_IDEAS', 
          payload: state.ideas.filter(idea => idea._id !== ideaId) 
        });
        // Refresh user data to update credit points
        if (refreshUserCallback) {
          await refreshUserCallback();
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete idea');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  }, [state.ideas, refreshUserCallback]);

  // Manual refresh function for debugging
  const refreshIdeas = useCallback(async () => {
    await loadIdeas();
  }, [loadIdeas]);

  return (
    <IdeaContext.Provider value={{
      ...state,
      submitIdea,
      updateIdeaStatus,
      loadIdeas,
      editIdea,
      deleteIdea,
      clearIdeas,
      setRefreshUserCallback,
      refreshIdeas
    }}>
      {children}
    </IdeaContext.Provider>
  );
};

export const useIdeas = () => {
  const context = useContext(IdeaContext);
  if (!context) {
    throw new Error('useIdeas must be used within an IdeaProvider');
  }
  return context;
};