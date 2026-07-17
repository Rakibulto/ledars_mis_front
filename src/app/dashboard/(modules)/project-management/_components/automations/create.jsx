'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Button,
  Divider,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

const EP = endpoints.pm;

const TRIGGERS = [
  'When status changes',
  'When task is created',
  'When task is assigned',
  'When tag is added',
  'When due date passes',
  'When priority changes',
  'Every day at a specific time',
  'When moved to a list',
];

const ACTIONS = [
  'Change status',
  'Assign to user',
  'Add tag',
  'Remove tag',
  'Set priority',
  'Send email notification',
  'Move to list',
  'Create subtask',
  'Add comment',
];

export function AutomationCreate() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', trigger: '', triggerValue: '' });
  const [actions, setActions] = useState([{ type: '', value: '' }]);

  const addAction = () => setActions([...actions, { type: '', value: '' }]);
  const removeAction = (i) => setActions(actions.filter((_, idx) => idx !== i));

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Automation name is required');
      return;
    }
    if (!form.trigger) {
      toast.error('Please select a trigger');
      return;
    }
    setSaving(true);
    try {
      const triggerMap = {
        'When status changes': 'status_change',
        'When task is created': 'task_created',
        'When task is assigned': 'task_assigned',
        'When tag is added': 'tag_added',
        'When due date passes': 'due_date_passed',
        'When priority changes': 'priority_change',
        'Every day at a specific time': 'scheduled',
        'When moved to a list': 'list_change',
      };
      const actionMap = {
        'Change status': 'change_status',
        'Assign to user': 'assign_user',
        'Add tag': 'add_tag',
        'Remove tag': 'remove_tag',
        'Set priority': 'set_priority',
        'Send email notification': 'send_notification',
        'Move to list': 'move_to_list',
        'Create subtask': 'create_subtask',
        'Add comment': 'add_comment',
      };
      const res = await axiosInstance.post(EP.automations, {
        name: form.name,
        trigger_type: triggerMap[form.trigger] || 'status_change',
        trigger_config: {},
        conditions: [],
        is_active: true,
      });
      await Promise.all(
        actions
          .map((act, i) => ({ act, i }))
          .filter(({ act }) => act.type)
          .map(({ act, i }) =>
            axiosInstance.post(EP.automation_actions, {
              automation: res.data.id,
              action_type: actionMap[act.type] || 'change_status',
              action_config: {},
              position: i,
            })
          )
      );
      mutate(EP.automations);
      toast.success(`Automation "${form.name}" created successfully!`);
      router.push(paths.dashboard.projectManagement.automations.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to create automation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Create Automation
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Automation Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={{ mb: 3 }}
              />

              {/* Trigger */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  <Icon
                    icon="solar:play-circle-bold"
                    width={18}
                    style={{ verticalAlign: 'middle', marginRight: 6 }}
                  />
                  When this happens (Trigger)
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={form.trigger}
                  onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                  label="Select trigger"
                >
                  {TRIGGERS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Actions */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    <Icon
                      icon="solar:bolt-circle-bold"
                      width={18}
                      style={{ verticalAlign: 'middle', marginRight: 6 }}
                    />
                    Then do this (Actions)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Icon icon="solar:add-circle-linear" />}
                    onClick={addAction}
                  >
                    Add Action
                  </Button>
                </Box>
                {actions.map((action, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                      {idx + 1}.
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      value={action.type}
                      label="Action"
                      onChange={(e) => {
                        const updated = [...actions];
                        updated[idx].type = e.target.value;
                        setActions(updated);
                      }}
                    >
                      {ACTIONS.map((a) => (
                        <MenuItem key={a} value={a}>
                          {a}
                        </MenuItem>
                      ))}
                    </TextField>
                    <IconButton
                      size="small"
                      onClick={() => removeAction(idx)}
                      disabled={actions.length === 1}
                    >
                      <Icon icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                  startIcon={<Icon icon="solar:check-circle-bold" />}
                >
                  {saving ? 'Creating...' : 'Create Automation'}
                </Button>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
