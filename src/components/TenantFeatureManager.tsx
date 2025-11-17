import React, { useEffect, useState } from 'react';
import { useFeatureStore } from '../stores/featureStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface TenantFeatureManagerProps {
  className?: string;
}

export const TenantFeatureManager: React.FC<TenantFeatureManagerProps> = ({ className }) => {
  const { 
    features, 
    tenantFeatures, 
    loading, 
    error, 
    fetchFeatures, 
    fetchTenantFeatures, 
    bulkUpdateTenantFeatures 
  } = useFeatureStore();
  
  const { user } = useAuthStore();
  const [localFeatures, setLocalFeatures] = useState<{ [key: string]: boolean }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchFeatures();
      fetchTenantFeatures(user.tenant_id);
    }
  }, [user?.tenant_id, fetchFeatures, fetchTenantFeatures]);

  useEffect(() => {
    // Initialize local features state based on tenant features
    const featuresMap: { [key: string]: boolean } = {};
    tenantFeatures.forEach(tf => {
      featuresMap[tf.id] = tf.enabled;
    });
    // Also include features that don't have tenant-specific settings yet
    features.forEach(feature => {
      if (!(feature.id in featuresMap)) {
        featuresMap[feature.id] = false; // Default to disabled
      }
    });
    setLocalFeatures(featuresMap);
    setHasChanges(false);
  }, [features, tenantFeatures]);

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    setLocalFeatures(prev => ({
      ...prev,
      [featureId]: enabled
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!user?.tenant_id) return;

    setSaving(true);
    try {
      const featuresToUpdate = Object.entries(localFeatures).map(([feature_id, enabled]) => ({
        feature_id,
        enabled
      }));

      await bulkUpdateTenantFeatures(user.tenant_id, featuresToUpdate);
      
      // Refresh the features to get the updated state
      await fetchTenantFeatures(user.tenant_id);
      
      setHasChanges(false);
      toast.success('Features updated successfully');
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'core': 'bg-blue-100 text-blue-800',
      'medical': 'bg-green-100 text-green-800',
      'administrative': 'bg-purple-100 text-purple-800',
      'reporting': 'bg-orange-100 text-orange-800',
      'integration': 'bg-red-100 text-red-800',
      'advanced': 'bg-gray-100 text-gray-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as { [key: string]: typeof features });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <p>Failed to load features</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Management
            </CardTitle>
            <CardDescription>
              Enable or disable features for your clinic
            </CardDescription>
          </div>
          {hasChanges && (
            <Button 
              onClick={handleSaveChanges} 
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {category.replace(/_/g, ' ')}
              </h3>
              <div className="space-y-2">
                {categoryFeatures.map((feature) => (
                  <div 
                    key={feature.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{feature.name}</h4>
                        <Badge 
                          variant="secondary" 
                          className={getCategoryColor(feature.category)}
                        >
                          {feature.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!feature.configurable && (
                        <Badge variant="outline" className="text-xs">
                          Always Enabled
                        </Badge>
                      )}
                      <Switch
                        checked={localFeatures[feature.id] || false}
                        onCheckedChange={(checked: boolean) => handleFeatureToggle(feature.id, checked)}
                        disabled={!feature.configurable}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {features.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No features available</p>
            <p className="text-sm">Contact your system administrator</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};