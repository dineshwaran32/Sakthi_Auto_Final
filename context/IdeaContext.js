import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import io from 'socket.io-client';
import { getNetworkConfig } from '../utils/networkConfig';

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

  // --- WebSocket (socket.io) logic for real-time updates ---
  const socketRef = useRef(null);
  const isAuthenticatedRef = useRef(false); // To track auth state

  // Helper to connect socket
  const connectSocket = () => {
    if (socketRef.current) return;
    const { baseURL } = getNetworkConfig();
    // Convert http://host:port to ws://host:port
    const wsURL = baseURL.replace(/^http/, 'ws');
    socketRef.current = io(wsURL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    // Listen for idea update events
    socketRef.current.on('ideas_updated', () => {
      loadIdeas();
    });
    // You can add more events if needed (e.g., 'idea_added', 'idea_deleted')
  };

  // Helper to disconnect socket
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Effect: manage socket connection based on authentication
  useEffect(() => {
    // Try to detect if user is authenticated by checking token in AsyncStorage
    // (Or you can pass isAuthenticated as prop/context if available)
    let isMounted = true;
    import('@react-native-async-storage/async-storage').then(AsyncStorage => {
      AsyncStorage.default.getItem('token').then(token => {
        if (isMounted && token) {
          isAuthenticatedRef.current = true;
          connectSocket();
        } else {
          isAuthenticatedRef.current = false;
          disconnectSocket();
        }
      });
    });
    return () => {
      isMounted = false;
      disconnectSocket();
    };
  }, []); // Only run on mount/unmount

  const loadIdeas = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get network configuration with all available base URLs
      const { baseURLs = [], timeout = 30000 } = getNetworkConfig();

      // Get token from AsyncStorage
      let token = null;
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        token = await AsyncStorage.getItem('token');
        if (!token) {
          // No token found in AsyncStorage
        } else {
          // Token retrieved from AsyncStorage
        }
      } catch (tokenErr) {
        // Error retrieving token
      }

      let lastError = null;
      let ideasData = [];

      // Try each base URL until one works
      for (const baseURL of baseURLs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const url = `${baseURL}/app/api/ideas`;


          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();

          // Handle different possible response structures
          if (data && data.data && data.data.ideas) {
            ideasData = data.data.ideas;
          } else if (data && data.ideas) {
            ideasData = data.ideas;
          } else if (Array.isArray(data)) {
            ideasData = data;
          } else {
            ideasData = [];
          }

          break; // Exit loop on success

        } catch (error) {
          clearTimeout(timeoutId);

          lastError = error;
          // Continue to next URL
        }
      }



      dispatch({ type: 'SET_IDEAS', payload: ideasData });
      return ideasData;

    } catch (error) {
      dispatch({ type: 'SET_IDEAS', payload: [] });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearIdeas = useCallback(() => {
    dispatch({ type: 'CLEAR_IDEAS' });
  }, []);

  const submitIdea = useCallback(async (ideaData) => {
    try {
      const res = await api.post('/app/api/ideas', ideaData);
      const submittedIdea = res.data.data.idea;

      // Create notification for admins about new idea submission
      try {
        await api.post('/app/api/notifications', {
          title: 'New Idea Submitted',
          message: `${ideaData.submittedBy || 'A user'} submitted a new idea: "${ideaData.title}"`,
          type: 'idea_submitted',
          ideaId: submittedIdea._id,
          targetRole: 'admin' // Notify all admins
        });
      } catch (notificationError) {
        // Don't fail the submission if notification creation fails
      }

      // Force reload ideas to get the latest data
      await loadIdeas();

      // Refresh user data to update credit points
      if (refreshUserCallback) {
        await refreshUserCallback();
      }

      return submittedIdea;
    } catch (error) {
      throw error;
    }
  }, [loadIdeas, refreshUserCallback]);

  const updateIdeaStatus = useCallback(async (ideaId, statusData) => {
    try {
      const res = await api.put(`/app/api/ideas/${ideaId}/status`, statusData);
      const updatedIdea = res.data.data.idea;
      dispatch({ type: 'UPDATE_IDEA', payload: updatedIdea });

      // Create notification for the idea submitter about status change
      try {
        const statusMessages = {
          'approved': 'Your idea has been approved! 🎉',
          'rejected': 'Your idea has been reviewed. Please check for feedback.',
          'implementing': 'Great news! Your idea is now being implemented! 🚀',
          'implemented': 'Congratulations! Your idea has been successfully implemented! ✅',
          'under_review': 'Your idea is now under review by our team.'
        };

        const message = statusMessages[statusData.status] || `Your idea status has been updated to: ${statusData.status}`;
        
        await api.post('/app/api/notifications', {
          title: 'Idea Status Update',
          message: `"${updatedIdea.title}" - ${message}`,
          type: 'status_update',
          ideaId: updatedIdea._id,
          targetUserId: updatedIdea.submittedBy?._id || updatedIdea.submittedBy,
          status: statusData.status
        });
      } catch (notificationError) {
        // Don't fail the status update if notification creation fails
      }

      // Refresh user data to update credit points
      if (refreshUserCallback) {
        await refreshUserCallback();
      }
      return updatedIdea;
    } catch (error) {
      throw error;
    }
  }, [refreshUserCallback]);

  const editIdea = useCallback(async (ideaId, updatedData) => {
    try {
      const res = await api.put(`/app/api/ideas/${ideaId}`, updatedData);
      await loadIdeas();
      return res.data.data.idea;
    } catch (error) {
      throw error;
    }
  }, [loadIdeas]);

  const deleteIdea = useCallback(async (ideaId) => {
    try {
      const response = await api.delete(`/app/api/ideas/${ideaId}`);
      
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