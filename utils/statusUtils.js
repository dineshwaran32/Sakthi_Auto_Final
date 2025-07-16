import { theme } from './theme';

export const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return theme.colors.success;
    case 'rejected': return theme.colors.error;
    case 'implementing': return theme.colors.tertiary;
    case 'implemented': return theme.colors.success;
    default: return theme.colors.secondary;
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'implementing': return 'Implementing';
    case 'implemented': return 'Implemented';
    default: return 'Under Review';
  }
};
