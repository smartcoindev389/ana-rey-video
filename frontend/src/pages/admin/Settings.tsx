import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RefreshCw, 
  Settings as SettingsIcon,
  Home,
  Globe,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, SiteSetting, SettingsUpdateRequest } from '@/services/settingsApi';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, SiteSetting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (groupName: string) => {
    try {
      setSaving(true);
      const groupSettings = settings[groupName] || [];
      
      const updateData: SettingsUpdateRequest[] = groupSettings.map(setting => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        group: setting.group,
        label: setting.label,
        description: setting.description,
      }));

      const response = await settingsApi.bulkUpdate(updateData);
      if (response.success) {
        toast.success(`${groupName} settings updated successfully`);
        await fetchSettings(); // Refresh to get updated data
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (groupName: string, settingKey: string, newValue: string) => {
    setSettings(prev => ({
      ...prev,
      [groupName]: prev[groupName]?.map(setting => 
        setting.key === settingKey 
          ? { ...setting, value: newValue }
          : setting
      ) || []
    }));
  };

  const renderSettingField = (setting: SiteSetting, groupName: string) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={setting.key}
              checked={setting.value === '1' || setting.value === 'true'}
              onChange={(e) => updateSetting(groupName, setting.key, e.target.checked ? '1' : '0')}
              className="rounded border-gray-300"
            />
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            <Input
              id={setting.key}
              type="number"
              value={setting.value}
              onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
              className="w-full"
            />
            {setting.description && (
              <p className="text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        );
      
      default: // text
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            {setting.key.includes('disclaimer') || setting.key.includes('description') ? (
              <Textarea
                id={setting.key}
                value={setting.value}
                onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
                className="w-full min-h-[100px]"
                placeholder={setting.description || ''}
              />
            ) : (
              <Input
                id={setting.key}
                value={setting.value}
                onChange={(e) => updateSetting(groupName, setting.key, e.target.value)}
                className="w-full"
                placeholder={setting.description || ''}
              />
            )}
            {setting.description && (
              <p className="text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        );
    }
  };

  const renderSettingsGroup = (groupName: string, groupSettings: SiteSetting[]) => {
    return (
      <div className="space-y-6">
        {groupSettings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            {renderSettingField(setting, groupName)}
          </div>
        ))}
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={() => handleSaveSettings(groupName)}
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save {groupName} Settings
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration</p>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration and content</p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero" className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Settings */}
        <TabsContent value="hero" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Hero Section Settings</h2>
            {settings.hero ? renderSettingsGroup('hero', settings.hero) : (
              <p className="text-muted-foreground">No hero settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">General Settings</h2>
            {settings.general ? renderSettingsGroup('general', settings.general) : (
              <p className="text-muted-foreground">No general settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Footer Settings</h2>
            {settings.footer ? renderSettingsGroup('footer', settings.footer) : (
              <p className="text-muted-foreground">No footer settings found.</p>
            )}
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Settings</h2>
            <div className="space-y-6">
              {/* Show contact-related settings from general group */}
              {settings.general?.filter(s => s.key.includes('contact') || s.key.includes('email') || s.key.includes('phone')).map((setting) => (
                <div key={setting.id} className="space-y-2">
                  {renderSettingField(setting, 'general')}
                </div>
              ))}
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSettings('general')}
                  disabled={saving}
                  className="flex items-center"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Contact Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;