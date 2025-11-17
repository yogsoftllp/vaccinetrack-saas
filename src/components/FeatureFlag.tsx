import React, { useEffect, useState } from 'react';
import { useFeatureStore } from '../stores/featureStore';

interface FeatureFlagProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({ 
  feature, 
  fallback = null, 
  children 
}) => {
  const { isFeatureEnabled, checkFeature } = useFeatureStore();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFeatureStatus = async () => {
      try {
        // First check local store
        const localEnabled = isFeatureEnabled(feature);
        if (localEnabled) {
          setIsEnabled(true);
        } else {
          // If not in local store, check with API
          const apiEnabled = await checkFeature(feature);
          setIsEnabled(apiEnabled);
        }
      } catch (error) {
        console.error('Error checking feature:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureStatus();
  }, [feature, isFeatureEnabled, checkFeature]);

  if (loading) {
    return null; // Or a loading spinner if preferred
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

interface FeatureToggleProps {
  feature: string;
  onEnabled?: () => void;
  onDisabled?: () => void;
  children: React.ReactNode;
}

export const FeatureToggle: React.FC<FeatureToggleProps> = ({ 
  feature, 
  onEnabled, 
  onDisabled, 
  children 
}) => {
  const { isFeatureEnabled, checkFeature } = useFeatureStore();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const checkFeatureStatus = async () => {
      try {
        const localEnabled = isFeatureEnabled(feature);
        if (localEnabled) {
          setIsEnabled(true);
          onEnabled?.();
        } else {
          const apiEnabled = await checkFeature(feature);
          setIsEnabled(apiEnabled);
          if (apiEnabled) {
            onEnabled?.();
          } else {
            onDisabled?.();
          }
        }
      } catch (error) {
        console.error('Error checking feature:', error);
        setIsEnabled(false);
        onDisabled?.();
      }
    };

    checkFeatureStatus();
  }, [feature, isFeatureEnabled, checkFeature, onEnabled, onDisabled]);

  return isEnabled ? <>{children}</> : null;
};

// Hook for feature flag checking
export const useFeatureFlag = (feature: string) => {
  const { isFeatureEnabled, checkFeature } = useFeatureStore();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFeatureStatus = async () => {
      try {
        const localEnabled = isFeatureEnabled(feature);
        if (localEnabled) {
          setIsEnabled(true);
        } else {
          const apiEnabled = await checkFeature(feature);
          setIsEnabled(apiEnabled);
        }
      } catch (error) {
        console.error('Error checking feature:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureStatus();
  }, [feature, isFeatureEnabled, checkFeature]);

  return { isEnabled, loading };
};