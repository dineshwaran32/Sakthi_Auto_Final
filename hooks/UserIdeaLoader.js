import { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useIdeas } from '../context/IdeaContext';

export const useIdeaLoader = () => {
  const { isAuthenticated, loading: authLoading, user } = useUser();
  const { loadIdeas, clearIdeas } = useIdeas();
  const loadedForUser = useRef(null);

  useEffect(() => {
    // If authenticated and we haven't loaded for this user yet
    if (isAuthenticated && user && !authLoading && loadedForUser.current !== user.employeeNumber) {

      loadIdeas();
      loadedForUser.current = user.employeeNumber;
    } 
    // If not authenticated and we have loaded for some user before
    else if (!isAuthenticated && !authLoading && loadedForUser.current) {

      clearIdeas();
      loadedForUser.current = null;
    }
  }, [isAuthenticated, authLoading, user, loadIdeas, clearIdeas]);
}; 