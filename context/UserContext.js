import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const UserContext = createContext();

const userReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

// Utility to detect web vs native
const isWeb = typeof window !== 'undefined' && window.localStorage;

const storage = {
  async getItem(key) {
    if (isWeb) {
      return Promise.resolve(window.localStorage.getItem(key));
    } else {
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    if (isWeb) {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    } else {
      return AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    if (isWeb) {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    } else {
      return AsyncStorage.removeItem(key);
    }
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const checkAuthState = useCallback(async () => {
    try {
      const userData = await storage.getItem('user');
      const token = await storage.getItem('token');
      
      if (userData && token) {
        const user = JSON.parse(userData);
        // Ensure the user object has the token
        const userWithToken = { ...user, token };
        dispatch({ type: 'LOGIN', payload: userWithToken });
      } else if (userData) {
        // If we have user data but no separate token, check if token is in user data
        const user = JSON.parse(userData);
        if (user.token) {
          dispatch({ type: 'LOGIN', payload: user });
        }
      }
    } catch (error) {
      // Error checking auth state
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const login = useCallback(async (loginResponse) => {
    try {
      const { token, user } = loginResponse.data;
      
      if (!token || !user) {
        return false;
      }
      
      const userWithToken = { ...user, token };
      
      await storage.setItem('user', JSON.stringify(userWithToken));
      await storage.setItem('token', token);
      dispatch({ type: 'LOGIN', payload: userWithToken });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (isWeb) {
      window.localStorage.clear(); // Clear all localStorage on web
    } else {
      await AsyncStorage.clear(); // Clear all AsyncStorage on native
    }
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await storage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Fetch fresh user data from the server
        const response = await api.get('/app/api/auth/profile');
        
        if (response.data.success) {
          const updatedUser = { ...response.data.data.user, token: user.token };
          
          await storage.setItem('user', JSON.stringify(updatedUser));
          dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        } else {
        }
      } else {
      }
    } catch (error) {
    }
  }, []);

  return (
    <UserContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};