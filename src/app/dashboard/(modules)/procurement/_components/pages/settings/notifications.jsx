'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
} from 'src/actions/ledars-hook';

import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatLabel(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function NotificationSettings() {
  const [draftSettings, setDraftSettings] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: settingsData, loading } = useGetRequest(
    endpoints.procurement_management.notification_settings
  );

  const notificationSettings = useMemo(() => {
    if (Array.isArray(settingsData?.results)) {
      return settingsData.results;
    }

    return Array.isArray(settingsData) ? settingsData : [];
  }, [settingsData]);

  useEffect(() => {
    const nextDraft = {};
    notificationSettings.forEach((setting) => {
      nextDraft[setting.id] = {
        email_enabled: !!setting.email_enabled,
        in_app_enabled: !!setting.in_app_enabled,
        sms_enabled: !!setting.sms_enabled,
      };
    });
    setDraftSettings(nextDraft);
  }, [notificationSettings]);

  const notificationGroups = useMemo(() => {
    const groups = new Map();

    notificationSettings.forEach((setting) => {
      if (!groups.has(setting.module)) {
        groups.set(setting.module, []);
      }

      const draft = draftSettings[setting.id] || {
        email_enabled: !!setting.email_enabled,
        in_app_enabled: !!setting.in_app_enabled,
        sms_enabled: !!setting.sms_enabled,
      };

      groups.get(setting.module).push({
        ...setting,
        ...draft,
        name: formatLabel(setting.event_name),
        description: `Notification preference for ${formatLabel(setting.module)} events.`,
      });
    });

    return Array.from(groups.entries()).map(([category, notifications]) => ({
      category,
      notifications,
    }));
  }, [draftSettings, notificationSettings]);

  const hasChanges = useMemo(
    () =>
      notificationSettings.some((setting) => {
        const draft = draftSettings[setting.id];
        if (!draft) {
          return false;
        }

        return (
          draft.email_enabled !== !!setting.email_enabled ||
          draft.in_app_enabled !== !!setting.in_app_enabled ||
          draft.sms_enabled !== !!setting.sms_enabled
        );
      }),
    [draftSettings, notificationSettings]
  );

  const handleToggle = (id, field, checked) => {
    setDraftSettings((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: checked,
      },
    }));
  };

  const handleReset = () => {
    const nextDraft = {};
    notificationSettings.forEach((setting) => {
      nextDraft[setting.id] = {
        email_enabled: !!setting.email_enabled,
        in_app_enabled: !!setting.in_app_enabled,
        sms_enabled: !!setting.sms_enabled,
      };
    });
    setDraftSettings(nextDraft);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const changedSettings = notificationSettings.filter((setting) => {
        const draft = draftSettings[setting.id];
        if (!draft) {
          return false;
        }

        return (
          draft.email_enabled !== !!setting.email_enabled ||
          draft.in_app_enabled !== !!setting.in_app_enabled ||
          draft.sms_enabled !== !!setting.sms_enabled
        );
      });

      await Promise.all(
        changedSettings.map((setting) =>
          patchRequest(endpoints.procurement_management.notification_setting_by_id(setting.id), {
            module: setting.module,
            event_name: setting.event_name,
            email_enabled: !!draftSettings[setting.id]?.email_enabled,
            in_app_enabled: !!draftSettings[setting.id]?.in_app_enabled,
            sms_enabled: !!draftSettings[setting.id]?.sms_enabled,
            is_active: !!setting.is_active,
          })
        )
      );

      await mutate(endpoints.procurement_management.notification_settings);
      toast.success('Notification settings updated successfully.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update notification settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">Configure notification preferences and channels</p>
      </div>

      <div className="space-y-6">
        {loading && (
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground">Loading notification settings...</p>
            </CardBody>
          </Card>
        )}

        {notificationGroups.map((group) => (
          <Card key={group.category}>
            <CardHeader
              title={group.category}
              description={`${group.notifications.length} notification types`}
            />
            <CardBody>
              <div className="space-y-1">
                {group.notifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">{notif.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{notif.description}</p>
                      </div>
                      <div className="flex gap-6 ml-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground mb-2">Email</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!notif.email_enabled}
                              onChange={(event) =>
                                handleToggle(notif.id, 'email_enabled', event.target.checked)
                              }
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                          </label>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground mb-2">In-App</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!notif.in_app_enabled}
                              onChange={(event) =>
                                handleToggle(notif.id, 'in_app_enabled', event.target.checked)
                              }
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                          </label>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground mb-2">SMS</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!notif.sms_enabled}
                              onChange={(event) =>
                                handleToggle(notif.id, 'sms_enabled', event.target.checked)
                              }
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}

        {!loading && notificationGroups.length === 0 && (
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground">
                No notification settings are configured yet.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
            Reset to Current
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
