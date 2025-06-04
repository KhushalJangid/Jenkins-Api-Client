import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const StartupRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isConfigured = localStorage.getItem('jenkinsConfigured') === 'true';
    const selectedFolder = localStorage.getItem('selectedFolder');
    const target = isConfigured ? `/folder/${selectedFolder}` : '/setup';

    // Only navigate if not already at target
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [navigate, location.pathname]);

  return null; // no UI
};

export default StartupRedirect;
