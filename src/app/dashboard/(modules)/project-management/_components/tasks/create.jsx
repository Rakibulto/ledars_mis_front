'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { PRIORITY_OPTIONS } from '../constants';

const EP = endpoints.pm;

export default function TaskCreate() {
  const { data: rawStatuses } = useGetRequest(EP.statuses);
  const { data: rawUsers } = useGetRequest('/api/employees/');
  const { data: rawLists } = useGetRequest(EP.lists);
  const { data: rawTags } = useGetRequest(EP.tags);
  const { data: rawTasks } = useGetRequest(EP.tasks);
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const { data: rawCustomFields } = useGetRequest(EP.custom_fields);

  const STATUSES = Array.isArray(rawStatuses) ? rawStatuses : rawStatuses?.results || [];
  const USERS = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
  const LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];
  const TAGS = Array.isArray(rawTags) ? rawTags : rawTags?.results || [];
  const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks?.results || [];
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const CUSTOM_FIELDS = Array.isArray(rawCustomFields)
    ? rawCustomFields
    : rawCustomFields?.results || [];
  const [form, setForm] = useState({
    title: '',
    description: '',
    list_id: '',
    status_id: 1,
    priority: 'normal',
    assignees: [],
    tags: [],
    start_date: '',
    due_date: '',
    time_estimate: '',
    story_points: '',
    parent_id: '',
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [dependencies, setDependencies] = useState([]);
  const [newDep, setNewDep] = useState({ task_id: '', type: 'finish_to_start' });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState('weekly');
  const [customFields, setCustomFields] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [watchers, setWatchers] = useState([]);
  const [saved, setSaved] = useState(false);

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((p) => [...p, { id: Date.now(), title: newSubtask, done: false }]);
    setNewSubtask('');
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist((p) => [...p, { id: Date.now(), text: newCheckItem, done: false }]);
    setNewCheckItem('');
  };

  const addDependency = () => {
    if (!newDep.task_id) return;
    setDependencies((p) => [...p, { ...newDep, id: Date.now() }]);
    setNewDep({ task_id: '', type: 'finish_to_start' });
  };

  const removeItem = (list, setList, id) => setList((p) => p.filter((x) => x.id !== id));

  const handleSave = async () => {
    try {
      await axiosInstance.post(EP.tasks, {
        ...form,
        list: form.list_id || undefined,
        status: form.status_id,
        parent: form.parent_id || undefined,
      });
      mutate(EP.tasks);
      toast.success('Task created successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to create task');
      console.error('Failed to create task:', err);
    }
  };

  const selectedSpace = form.list_id
    ? LISTS.find((l) => l.id === Number(form.list_id))?.space_id
    : null;
  const spaceCustomFields = CUSTOM_FIELDS.filter(
    (f) => f.space_id === selectedSpace || !f.space_id
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Create Task
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            onClick={handleSave}
          >
            Create Task
          </Button>
        </Stack>
      </Stack>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Task created successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Task Title"
                  fullWidth
                  required
                  value={form.title}
                  onChange={handleChange('title')}
                  placeholder="Enter task title"
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={form.description}
                  onChange={handleChange('description')}
                  placeholder="Describe the task in detail... (supports markdown)"
                  helperText="Supports markdown formatting"
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      label="List / Folder"
                      fullWidth
                      value={form.list_id}
                      onChange={handleChange('list_id')}
                    >
                      {LISTS.map((l) => {
                        const space = SPACES.find((s) => s.id === l.space_id || s.id === l.space);
                        return (
                          <MenuItem key={l.id} value={l.id}>
                            {space?.name} → {l.name}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      select
                      label="Status"
                      fullWidth
                      value={form.status_id}
                      onChange={handleChange('status_id')}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: s.color || '#3b82f6',
                              }}
                            />
                            <span>{s.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      select
                      label="Priority"
                      fullWidth
                      value={form.priority}
                      onChange={handleChange('priority')}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }}
                            />
                            <span>{p.label}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      type="date"
                      label="Start Date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.start_date}
                      onChange={handleChange('start_date')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      type="date"
                      label="Due Date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={form.due_date}
                      onChange={handleChange('due_date')}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Autocomplete
                      multiple
                      options={USERS}
                      getOptionLabel={(o) => o.name || o.first_name || 'User'}
                      value={USERS.filter((u) => form.assignees.includes(u.id))}
                      onChange={(_, val) =>
                        setForm((p) => ({ ...p, assignees: val.map((v) => v.id) }))
                      }
                      renderInput={(params) => <TextField {...params} label="Assignees" />}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((user, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={user.id}
                            avatar={
                              <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                                {(user.name || user.first_name || 'U')[0]}
                              </Avatar>
                            }
                            label={user.name || user.first_name || 'User'}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete
                      multiple
                      options={TAGS}
                      getOptionLabel={(o) => o.name}
                      value={TAGS.filter((t) => form.tags.includes(t.id))}
                      onChange={(_, val) => setForm((p) => ({ ...p, tags: val.map((v) => v.id) }))}
                      renderInput={(params) => <TextField {...params} label="Tags" />}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((tag, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{ bgcolor: `${tag.color}20`, color: tag.color }}
                          />
                        ))
                      }
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="Time Estimate (hours)"
                      type="number"
                      fullWidth
                      value={form.time_estimate}
                      onChange={handleChange('time_estimate')}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Story Points"
                      type="number"
                      fullWidth
                      value={form.story_points}
                      onChange={handleChange('story_points')}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      select
                      label="Parent Task (optional)"
                      fullWidth
                      value={form.parent_id}
                      onChange={handleChange('parent_id')}
                    >
                      <MenuItem value="">None (Top-level task)</MenuItem>
                      {TASKS.filter((t) => !t.parent_id && !t.parent).map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.task_id || t.id} - {t.title}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Subtasks */}
                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>
                  Subtasks
                </Typography>
                <Stack spacing={0.5}>
                  {subtasks.map((st) => (
                    <Stack key={st.id} direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        size="small"
                        checked={st.done}
                        onChange={() =>
                          setSubtasks((p) =>
                            p.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x))
                          )
                        }
                      />
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}
                      >
                        {st.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(subtasks, setSubtasks, st.id)}
                      >
                        <Iconify icon="solar:close-circle-bold" width={16} />
                      </IconButton>
                    </Stack>
                  ))}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add subtask..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addSubtask();
                      }}
                    />
                    <Button size="small" onClick={addSubtask}>
                      Add
                    </Button>
                  </Stack>
                </Stack>

                {/* Checklist */}
                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>
                  Checklist
                </Typography>
                <Stack spacing={0.5}>
                  {checklist.map((item) => (
                    <Stack key={item.id} direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        size="small"
                        checked={item.done}
                        onChange={() =>
                          setChecklist((p) =>
                            p.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                          )
                        }
                      />
                      <Typography
                        variant="body2"
                        sx={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none' }}
                      >
                        {item.text}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(checklist, setChecklist, item.id)}
                      >
                        <Iconify icon="solar:close-circle-bold" width={16} />
                      </IconButton>
                    </Stack>
                  ))}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add checklist item..."
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCheckItem();
                      }}
                    />
                    <Button size="small" onClick={addCheckItem}>
                      Add
                    </Button>
                  </Stack>
                </Stack>

                {/* Advanced Options toggle */}
                <Button
                  startIcon={
                    <Iconify
                      icon={showAdvanced ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                    />
                  }
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Advanced Options
                </Button>

                <Collapse in={showAdvanced}>
                  <Stack spacing={2}>
                    {/* Dependencies */}
                    <Typography variant="subtitle2" fontWeight={600}>
                      Dependencies
                    </Typography>
                    {dependencies.map((dep) => {
                      const depTask = TASKS.find((t) => t.id === Number(dep.task_id));
                      return (
                        <Stack key={dep.id} direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={`${dep.type.replace(/_/g, ' ')} → ${depTask?.task_id || dep.task_id}`}
                            onDelete={() => removeItem(dependencies, setDependencies, dep.id)}
                            size="small"
                          />
                        </Stack>
                      );
                    })}
                    <Stack direction="row" spacing={1}>
                      <TextField
                        select
                        size="small"
                        value={newDep.task_id}
                        onChange={(e) => setNewDep((p) => ({ ...p, task_id: e.target.value }))}
                        label="Task"
                        sx={{ flex: 1 }}
                      >
                        {TASKS.filter((t) => !t.parent_id && !t.parent).map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.task_id || t.id} - {t.title}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        value={newDep.type}
                        onChange={(e) => setNewDep((p) => ({ ...p, type: e.target.value }))}
                        label="Type"
                        sx={{ width: 180 }}
                      >
                        <MenuItem value="finish_to_start">Finish to Start</MenuItem>
                        <MenuItem value="start_to_start">Start to Start</MenuItem>
                        <MenuItem value="finish_to_finish">Finish to Finish</MenuItem>
                        <MenuItem value="start_to_finish">Start to Finish</MenuItem>
                      </TextField>
                      <Button size="small" onClick={addDependency}>
                        Add
                      </Button>
                    </Stack>

                    {/* Recurring */}
                    <Divider />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                        />
                      }
                      label="Recurring Task"
                    />
                    {isRecurring && (
                      <TextField
                        select
                        size="small"
                        value={recurFreq}
                        onChange={(e) => setRecurFreq(e.target.value)}
                        label="Frequency"
                        sx={{ width: 200 }}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Bi-weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </TextField>
                    )}

                    {/* Watchers */}
                    <Divider />
                    <Autocomplete
                      multiple
                      options={USERS}
                      getOptionLabel={(o) => o.name || o.first_name || 'User'}
                      value={USERS.filter((u) => watchers.includes(u.id))}
                      onChange={(_, val) => setWatchers(val.map((v) => v.id))}
                      renderInput={(params) => <TextField {...params} label="Watchers" />}
                      size="small"
                    />

                    {/* Custom Fields */}
                    {spaceCustomFields.length > 0 && (
                      <>
                        <Divider />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Custom Fields
                        </Typography>
                        <Grid container spacing={2}>
                          {spaceCustomFields.map((field) => (
                            <Grid item xs={6} key={field.id}>
                              {field.field_type === 'dropdown' ? (
                                <TextField
                                  select
                                  size="small"
                                  fullWidth
                                  label={field.name}
                                  value={customFields[field.name] || ''}
                                  onChange={(e) =>
                                    setCustomFields((p) => ({ ...p, [field.name]: e.target.value }))
                                  }
                                >
                                  {field.options?.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                      {opt}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              ) : field.field_type === 'checkbox' ? (
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={Boolean(customFields[field.name])}
                                      onChange={(e) =>
                                        setCustomFields((p) => ({
                                          ...p,
                                          [field.name]: e.target.checked,
                                        }))
                                      }
                                    />
                                  }
                                  label={field.name}
                                />
                              ) : (
                                <TextField
                                  size="small"
                                  fullWidth
                                  label={field.name}
                                  type={
                                    field.field_type === 'number' || field.field_type === 'currency'
                                      ? 'number'
                                      : 'text'
                                  }
                                  value={customFields[field.name] || ''}
                                  onChange={(e) =>
                                    setCustomFields((p) => ({ ...p, [field.name]: e.target.value }))
                                  }
                                />
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}
                  </Stack>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Attachments
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
                  }}
                >
                  <Iconify
                    icon="solar:cloud-upload-bold-duotone"
                    width={40}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Drag & drop files here
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    or click to browse
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Quick Templates
                </Typography>
                <Stack spacing={0.5}>
                  {[
                    { icon: 'solar:bug-bold', label: 'Bug Report', color: '#ef4444' },
                    { icon: 'solar:star-bold', label: 'Feature Request', color: '#8b5cf6' },
                    { icon: 'solar:document-text-bold', label: 'Documentation', color: '#06b6d4' },
                    { icon: 'solar:test-tube-bold', label: 'Testing Task', color: '#22c55e' },
                  ].map((tpl) => (
                    <Box
                      key={tpl.label}
                      sx={{
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon={tpl.icon} width={18} sx={{ color: tpl.color }} />
                        <Typography variant="body2">{tpl.label}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Tips
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    • Double-click titles to rename inline
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Use @ to mention team members
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Drag tasks between columns on the board
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Set dependencies to track blockers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Enable recurring for repeating tasks
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
