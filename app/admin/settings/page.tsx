'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/instant';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  Globe,
  Bell,
  Database,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

/**
 * Admin Settings Page
 *
 * System configuration and settings management
 */
export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Note: System config would be stored in a systemConfig entity in production
  // For now, we'll use local state for settings management
  const isLoading = false;

  // Settings sections
  const sections = [
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic application configuration',
      icon: Settings,
      color: 'pink',
    },
    {
      id: 'security',
      title: 'Security & Authentication',
      description: 'Security policies and authentication settings',
      icon: Shield,
      color: 'blue',
    },
    {
      id: 'urls',
      title: 'URL Management',
      description: 'URL shortening and validation rules',
      icon: Globe,
      color: 'green',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Email and alert configuration',
      icon: Bell,
      color: 'purple',
    },
    {
      id: 'database',
      title: 'Database & Storage',
      description: 'Data retention and backup settings',
      icon: Database,
      color: 'gray',
    },
  ];

  // Settings data (in production, this would come from a systemConfig entity)
  const settings = useMemo(() => {
    return {
      general: {
        siteName: 'HotURL',
        siteDescription: 'Fast and reliable URL shortening service',
        defaultTheme: 'light',
        maintenanceMode: false,
      },
      security: {
        requireEmailVerification: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        mfaEnabled: false,
      },
      urls: {
        maxUrlLength: 2048,
        allowCustomSlugs: true,
        autoGenerateLength: 6,
        expireInactiveUrls: false,
        inactivityDays: 365,
      },
      notifications: {
        emailNotifications: true,
        adminAlerts: true,
        suspiciousActivityAlerts: true,
        weeklyReports: true,
      },
      database: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 90,
        analyticsRetention: 365,
      },
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate save (in production, this would update systemConfig)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Saved</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Error</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Settings Management</p>
              <p className="text-sm text-blue-700 mt-1">
                Changes to these settings will affect the entire application. Be careful when modifying security and database settings.
              </p>
            </div>
          </div>
        </Card>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                <p className="text-sm text-gray-600">Basic application configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <Input
                  type="text"
                  defaultValue={settings.general.siteName}
                  className="max-w-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <Input
                  type="text"
                  defaultValue={settings.general.siteDescription}
                  className="max-w-2xl"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable public access</p>
                </div>
                <Badge className={settings.general.maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                  {settings.general.maintenanceMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Security & Authentication</h3>
                <p className="text-sm text-gray-600">Security policies and authentication settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Email Verification</p>
                  <p className="text-sm text-gray-600">Require users to verify their email</p>
                </div>
                <Badge className={settings.security.requireEmailVerification ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {settings.security.requireEmailVerification ? 'Required' : 'Optional'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.security.sessionTimeout}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Login Attempts
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.security.maxLoginAttempts}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Multi-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Require MFA for admin accounts</p>
                </div>
                <Badge className={settings.security.mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {settings.security.mfaEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* URL Management */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">URL Management</h3>
                <p className="text-sm text-gray-600">URL shortening and validation rules</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max URL Length
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.urls.maxUrlLength}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Code Length
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.urls.autoGenerateLength}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Custom Slugs</p>
                  <p className="text-sm text-gray-600">Allow users to create custom short codes</p>
                </div>
                <Badge className={settings.urls.allowCustomSlugs ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {settings.urls.allowCustomSlugs ? 'Allowed' : 'Disabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Auto-Expire Inactive URLs</p>
                  <p className="text-sm text-gray-600">Delete URLs after {settings.urls.inactivityDays} days of inactivity</p>
                </div>
                <Badge className={settings.urls.expireInactiveUrls ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                  {settings.urls.expireInactiveUrls ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">Email and alert configuration</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(settings.notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                  </div>
                  <Badge className={enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {enabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Database & Storage */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Database & Storage</h3>
                <p className="text-sm text-gray-600">Data retention and backup settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">Automatic Backups</p>
                  <p className="text-sm text-gray-600">Daily automated database backups</p>
                </div>
                <Badge className={settings.database.autoBackup ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {settings.database.autoBackup ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Retention (days)
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.database.retentionDays}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analytics Retention (days)
                  </label>
                  <Input
                    type="number"
                    defaultValue={settings.database.analyticsRetention}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom save button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-pink-600 hover:bg-pink-700 text-white"
            size="lg"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
