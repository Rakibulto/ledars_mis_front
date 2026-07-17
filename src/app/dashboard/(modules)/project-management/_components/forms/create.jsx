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
  Switch,
  Divider,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useCreateMutation } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: 'solar:text-field-bold' },
  { value: 'textarea', label: 'Long Text', icon: 'solar:text-bold' },
  { value: 'number', label: 'Number', icon: 'solar:hashtag-bold' },
  { value: 'email', label: 'Email', icon: 'solar:letter-bold' },
  { value: 'date', label: 'Date', icon: 'solar:calendar-bold' },
  { value: 'dropdown', label: 'Dropdown', icon: 'solar:list-down-bold' },
  { value: 'checkbox', label: 'Checkbox', icon: 'solar:check-square-bold' },
  { value: 'file', label: 'File Upload', icon: 'solar:upload-bold' },
  { value: 'rating', label: 'Rating', icon: 'solar:star-bold' },
];

function FormCreate() {
  const router = useRouter();
  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];
  const { data: rawLists } = useGetRequest(EP.lists);
  const ALL_LISTS = Array.isArray(rawLists) ? rawLists : rawLists?.results || [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [targetList, setTargetList] = useState('');
  const [fields, setFields] = useState([
    { id: 1, label: 'Title', type: 'text', required: true },
    { id: 2, label: 'Description', type: 'textarea', required: true },
  ]);

  const addField = () => {
    const id = Math.max(...fields.map((f) => f.id), 0) + 1;
    setFields([...fields, { id, label: '', type: 'text', required: false }]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const [saving, setSaving] = useState(false);
  const lists = spaceId
    ? ALL_LISTS.filter((l) => (l.space_id || l.space) === Number(spaceId))
    : ALL_LISTS;

  const createPayload = {
    name,
    description,
    space: spaceId || null,
    target_list: targetList || null,
    is_active: true,
    is_public: false,
    fields_data: fields.map((f, i) => ({
      label: f.label,
      field_type: f.type,
      required: f.required,
      position: i,
    })),
  };
  const { trigger: doCreate, isMutating: isCreating } = useCreateMutation(EP.forms, createPayload);

  const handlePublish = async () => {
    if (!name) {
      toast.error('Form name is required');
      return;
    }
    setSaving(true);
    try {
      await doCreate();
      mutate(EP.forms);
      toast.success(`Form "${name}" published successfully!`);
      router.push(paths.dashboard.projectManagement.forms.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to publish form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Create Form
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined">Preview</Button>
          <Button
            variant="contained"
            disabled={!name || fields.length === 0 || saving}
            onClick={handlePublish}
          >
            {saving ? 'Publishing...' : 'Publish Form'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Form Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Form Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bug Report Form"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="Describe the purpose of this form"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Form Fields
                </Typography>
                <Button
                  size="small"
                  startIcon={<Icon icon="solar:add-circle-bold" />}
                  onClick={addField}
                >
                  Add Field
                </Button>
              </Box>

              {fields.map((field, idx) => (
                <Card key={field.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field Label"
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Type"
                        value={field.type}
                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      >
                        {FIELD_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Icon icon={t.icon} width={16} />
                              {t.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <FormControlLabel
                        label="Required"
                        control={
                          <Switch
                            size="small"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                          />
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeField(field.id)}
                        disabled={fields.length <= 1}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Settings
              </Typography>
              <TextField
                select
                fullWidth
                label="Space"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">All Spaces</MenuItem>
                {SPACES.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Auto-create tasks in"
                value={targetList}
                onChange={(e) => setTargetList(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">Select List</MenuItem>
                {lists.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
                  </MenuItem>
                ))}
              </TextField>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                label="Require login to submit"
                control={<Switch defaultChecked />}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                label="Send confirmation email"
                control={<Switch defaultChecked />}
                sx={{ mb: 1 }}
              />
              <FormControlLabel label="Allow file attachments" control={<Switch />} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FormCreate;
