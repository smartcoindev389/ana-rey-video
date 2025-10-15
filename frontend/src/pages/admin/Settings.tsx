import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon,
  Save,
  Upload,
  Globe,
  Mail,
  Shield,
  Palette,
  FileText,
  Image,
  Bell,
  Database,
  Server
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  // Mock settings data - replace with real API calls
  const [settings, setSettings] = useState({
    general: {
      siteName: 'SACRART',
      siteDescription: 'Online Education Platform',
      defaultLanguage: 'en',
      timezone: 'UTC',
      maintenanceMode: false,
      registrationEnabled: true,
      publicRegistration: true
    },
    branding: {
      logo: '/logo.png',
      favicon: '/favicon.ico',
      primaryColor: '#a36464',
      secondaryColor: '#64748b',
      customCss: '',
      footerText: '© 2024 SACRART. All rights reserved.'
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'noreply@sacrart.com',
      smtpPassword: '••••••••',
      fromName: 'SACRART Team',
      fromEmail: 'noreply@sacrart.com'
    },
    security: {
      twoFactorAuth: false,
      passwordMinLength: 8,
      sessionTimeout: 24,
      ipWhitelist: '',
      rateLimitEnabled: true,
      sslEnabled: true
    },
    notifications: {
      emailNotifications: true,
      adminNotifications: true,
      userNotifications: true,
      maintenanceAlerts: true,
      securityAlerts: true,
      weeklyReports: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupLocation: 'cloud',
      lastBackup: '2024-01-20 14:30:00'
    }
  });

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Handle save logic here
    console.log('Saving settings:', settings);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={settings.general.siteName}
            onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="defaultLanguage">Default Language</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={settings.general.defaultLanguage}
            onChange={(e) => handleSettingChange('general', 'defaultLanguage', e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="siteDescription">Site Description</Label>
        <Textarea
          id="siteDescription"
          value={settings.general.siteDescription}
          onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">Enable maintenance mode to restrict access</p>
          </div>
          <Switch
            checked={settings.general.maintenanceMode}
            onCheckedChange={(checked) => handleSettingChange('general', 'maintenanceMode', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Registration Enabled</Label>
            <p className="text-sm text-muted-foreground">Allow new user registrations</p>
          </div>
          <Switch
            checked={settings.general.registrationEnabled}
            onCheckedChange={(checked) => handleSettingChange('general', 'registrationEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Public Registration</Label>
            <p className="text-sm text-muted-foreground">Allow public access to registration</p>
          </div>
          <Switch
            checked={settings.general.publicRegistration}
            onCheckedChange={(checked) => handleSettingChange('general', 'publicRegistration', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Logo</Label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
              <Image className="h-8 w-8" />
            </div>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Logo
            </Button>
          </div>
        </div>
        
        <div>
          <Label>Favicon</Label>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Favicon
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="primaryColor"
              value={settings.branding.primaryColor}
              onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
            />
            <div 
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: settings.branding.primaryColor }}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="secondaryColor"
              value={settings.branding.secondaryColor}
              onChange={(e) => handleSettingChange('branding', 'secondaryColor', e.target.value)}
            />
            <div 
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: settings.branding.secondaryColor }}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="footerText">Footer Text</Label>
        <Input
          id="footerText"
          value={settings.branding.footerText}
          onChange={(e) => handleSettingChange('branding', 'footerText', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="customCss">Custom CSS</Label>
        <Textarea
          id="customCss"
          value={settings.branding.customCss}
          onChange={(e) => handleSettingChange('branding', 'customCss', e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          placeholder="/* Add your custom CSS here */"
        />
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input
            id="smtpHost"
            value={settings.email.smtpHost}
            onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input
            id="smtpPort"
            type="number"
            value={settings.email.smtpPort}
            onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="smtpUsername">SMTP Username</Label>
          <Input
            id="smtpUsername"
            value={settings.email.smtpUsername}
            onChange={(e) => handleSettingChange('email', 'smtpUsername', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="smtpPassword">SMTP Password</Label>
          <Input
            id="smtpPassword"
            type="password"
            value={settings.email.smtpPassword}
            onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            value={settings.email.fromName}
            onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="fromEmail">From Email</Label>
          <Input
            id="fromEmail"
            type="email"
            value={settings.email.fromEmail}
            onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
          </div>
          <Switch
            checked={settings.security.twoFactorAuth}
            onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Rate Limiting</Label>
            <p className="text-sm text-muted-foreground">Enable rate limiting for API requests</p>
          </div>
          <Switch
            checked={settings.security.rateLimitEnabled}
            onCheckedChange={(checked) => handleSettingChange('security', 'rateLimitEnabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>SSL Enabled</Label>
            <p className="text-sm text-muted-foreground">Force HTTPS connections</p>
          </div>
          <Switch
            checked={settings.security.sslEnabled}
            onCheckedChange={(checked) => handleSettingChange('security', 'sslEnabled', checked)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={settings.security.passwordMinLength}
            onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
          />
        </div>
        
        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
        <Textarea
          id="ipWhitelist"
          value={settings.security.ipWhitelist}
          onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
          placeholder="192.168.1.1, 10.0.0.1"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Enable email notifications</p>
          </div>
          <Switch
            checked={settings.notifications.emailNotifications}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label>Admin Notifications</Label>
            <p className="text-sm text-muted-foreground">Notify admins of important events</p>
          </div>
          <Switch
            checked={settings.notifications.adminNotifications}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'adminNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>User Notifications</Label>
            <p className="text-sm text-muted-foreground">Send notifications to users</p>
          </div>
          <Switch
            checked={settings.notifications.userNotifications}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'userNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Maintenance Alerts</Label>
            <p className="text-sm text-muted-foreground">Alert users about maintenance</p>
          </div>
          <Switch
            checked={settings.notifications.maintenanceAlerts}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'maintenanceAlerts', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Security Alerts</Label>
            <p className="text-sm text-muted-foreground">Notify about security events</p>
          </div>
          <Switch
            checked={settings.notifications.securityAlerts}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'securityAlerts', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Weekly Reports</Label>
            <p className="text-sm text-muted-foreground">Send weekly analytics reports</p>
          </div>
          <Switch
            checked={settings.notifications.weeklyReports}
            onCheckedChange={(checked) => handleSettingChange('notifications', 'weeklyReports', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Automatic Backup</Label>
            <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
          </div>
          <Switch
            checked={settings.backup.autoBackup}
            onCheckedChange={(checked) => handleSettingChange('backup', 'autoBackup', checked)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="backupFrequency">Backup Frequency</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={settings.backup.backupFrequency}
            onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="retentionDays">Retention Days</Label>
          <Input
            id="retentionDays"
            type="number"
            value={settings.backup.retentionDays}
            onChange={(e) => handleSettingChange('backup', 'retentionDays', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="backupLocation">Backup Location</Label>
        <select 
          className="w-full p-2 border rounded-md"
          value={settings.backup.backupLocation}
          onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
        >
          <option value="local">Local Storage</option>
          <option value="cloud">Cloud Storage</option>
          <option value="ftp">FTP Server</option>
        </select>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Last Backup</h4>
            <p className="text-sm text-muted-foreground">{settings.backup.lastBackup}</p>
          </div>
          <Button variant="outline">
            <Server className="mr-2 h-4 w-4" />
            Create Backup Now
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'branding':
        return renderBrandingSettings();
      case 'email':
        return renderEmailSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'backup':
        return renderBackupSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage platform configuration and preferences</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center"
            >
              <Icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card className="p-6">
        {renderTabContent()}
      </Card>
    </div>
  );
};

export default Settings;
