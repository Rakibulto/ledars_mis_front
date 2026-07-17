'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';
import { X, Plus, Edit, Users, Trash2, Search, GitBranch } from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  useCreateMutation,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const moduleOptions = [
  'Material Requisition',
  'Purchase Requisition',
  'RFQ',
  'Comparative Statement',
  'Award',
  'Work Order',
  'Payment Requisition',
  'GRN',
];

const approverRoleOptions = [
  'Department Head',
  'Operations Manager',
  'IT Manager',
  'Procurement Manager',
  'Finance Manager',
  'Treasury Officer',
  'CFO',
  'CEO',
  'Board of Directors',
];

const approvalModeOptions = [
  {
    value: 'all_approvers',
    label: 'Unanimous Approval',
    description: 'All approvers must approve before advancing',
  },
  {
    value: 'any_approver',
    label: 'Independent Approval',
    description: 'First approver to act (approve or reject) finalises this level',
  },
];

const emptyForm = {
  module: '',
  department: 'all',
  amountFrom: '0',
  amountTo: '',
  approvalMode: 'all_approvers',
  level1: '',
  level1Users: [],
  level2: '',
  level2Users: [],
  level3: '',
  level3Users: [],
  isActive: true,
};

function formatAmount(value) {
  return Number(value || 0).toLocaleString();
}

function buildGroupKey(rule) {
  return [rule.module, rule.min_amount ?? 0, rule.max_amount ?? '', rule.department ?? 'all'].join(
    '|'
  );
}

function getRuleLabel(rule) {
  const parts = [];
  if (rule.approver_role) parts.push(rule.approver_role);
  if (rule.approver_name) parts.push(rule.approver_name);
  if (Array.isArray(rule.approvers_info) && rule.approvers_info.length > 0) {
    const names = rule.approvers_info.map((a) => a.employee_name).join(', ');
    parts.push(names);
  }
  return parts.join(' / ') || '-';
}

// ── Employee multi-select dropdown ───────────────────────────────────────────
function EmployeeMultiSelect({ employees, selected, onChange, placeholder = 'Select approvers' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.designation || '').toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (emp) => selected.some((s) => s.id === emp.id);

  const toggle = (emp) => {
    if (isSelected(emp)) {
      onChange(selected.filter((s) => s.id !== emp.id));
    } else {
      onChange([...selected, emp]);
    }
  };

  const remove = (emp) => onChange(selected.filter((s) => s.id !== emp.id));

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags + trigger */}
      <div
        className="min-h-[38px] w-full flex flex-wrap gap-1 px-2 py-1.5 border border-input rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-primary bg-background"
        onClick={() => setOpen((v) => !v)}
      >
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground self-center">{placeholder}</span>
        )}
        {selected.map((emp) => (
          <span
            key={emp.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
          >
            {emp.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(emp);
              }}
              className="hover:text-error"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Users className="w-4 h-4 text-muted-foreground self-center ml-auto" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2 px-2 py-1 border border-input rounded-md bg-white dark:bg-zinc-800">
              <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <input
                autoFocus
                className="flex-1 text-sm outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto bg-white dark:bg-zinc-900">
            {filtered.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-3">No employees found</p>
            )}
            {filtered.map((emp) => (
              <label
                key={emp.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected(emp)}
                  onChange={() => toggle(emp)}
                  className="rounded"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {emp.name}
                  </span>
                  {emp.designation && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {emp.designation}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ApprovalMatrix() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroupKey, setEditingGroupKey] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyGroupKey, setBusyGroupKey] = useState(null);

  const { data: approvalMatrixData, loading } = useGetRequest(
    endpoints.procurement_management.approval_matrix
  );
  const { data: departmentData } = useGetRequest(endpoints.departments);
  const { data: formOptionsData } = useGetRequest(
    endpoints.procurement_management.approval_matrix_form_options
  );
  const { trigger: createRule } = useCreateMutation(
    endpoints.procurement_management.approval_matrix
  );

  const employeeOptions = useMemo(() => {
    if (Array.isArray(formOptionsData?.employees)) return formOptionsData.employees;
    return [];
  }, [formOptionsData]);

  const approvalRules = useMemo(() => {
    if (Array.isArray(approvalMatrixData?.results)) {
      return approvalMatrixData.results;
    }

    return Array.isArray(approvalMatrixData) ? approvalMatrixData : [];
  }, [approvalMatrixData]);

  const departmentOptions = useMemo(() => {
    if (Array.isArray(departmentData?.results)) {
      return departmentData.results;
    }
    return Array.isArray(departmentData) ? departmentData : [];
  }, [departmentData]);

  const groupedRules = useMemo(() => {
    const grouped = new Map();

    approvalRules.forEach((rule) => {
      const key = buildGroupKey(rule);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          module: rule.module,
          amountFrom: Number(rule.min_amount || 0),
          amountTo:
            rule.max_amount === null || rule.max_amount === undefined
              ? null
              : Number(rule.max_amount),
          departmentId: rule.department || null,
          department: rule.department_name || 'All Departments',
          levels: {},
          levelUsers: {},
          approvalMode: rule.approval_mode || 'all_approvers',
          entries: [],
          isActive: true,
        });
      }

      const group = grouped.get(key);
      group.entries.push(rule);
      group.levels[rule.approval_level] = getRuleLabel(rule);
      group.levelUsers[rule.approval_level] = Array.isArray(rule.approvers_info)
        ? rule.approvers_info
        : [];
      group.approvalMode = rule.approval_mode || 'all_approvers';
      group.isActive = group.isActive && !!rule.is_active;
    });

    return Array.from(grouped.values()).sort((left, right) => {
      if (left.module !== right.module) {
        return left.module.localeCompare(right.module);
      }
      return left.amountFrom - right.amountFrom;
    });
  }, [approvalRules]);

  const refreshRules = () => mutate(endpoints.procurement_management.approval_matrix);

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingGroupKey(null);
    setForm(emptyForm);
  };

  const openCreateModal = () => {
    setEditingGroupKey(null);
    setForm(emptyForm);
    setShowCreateModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroupKey(group.key);

    // Map approvers_info [{id, employee_name, designation}] → [{id, name, designation}]
    const mapUsers = (levelNum) =>
      (group.levelUsers[levelNum] || []).map((a) => ({
        id: a.id,
        name: a.employee_name,
        designation: a.designation || '',
      }));

    setForm({
      module: group.module,
      department: group.departmentId || 'all',
      amountFrom: String(group.amountFrom ?? 0),
      amountTo: group.amountTo === null ? '' : String(group.amountTo),
      approvalMode: group.approvalMode || 'all_approvers',
      level1: group.entries.find((e) => e.approval_level === 1)?.approver_role || '',
      level1Users: mapUsers(1),
      level2: group.entries.find((e) => e.approval_level === 2)?.approver_role || '',
      level2Users: mapUsers(2),
      level3: group.entries.find((e) => e.approval_level === 3)?.approver_role || '',
      level3Users: mapUsers(3),
      isActive: group.isActive,
    });
    setShowCreateModal(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.module || (!form.level1 && form.level1Users.length === 0)) {
      toast.error('Module type and approval level 1 are required.');
      return;
    }

    setSaving(true);
    try {
      const existingGroup = groupedRules.find((group) => group.key === editingGroupKey);
      const existingByLevel = new Map(
        (existingGroup?.entries || []).map((entry) => [entry.approval_level, entry])
      );

      const basePayload = {
        module: form.module,
        min_amount: Number(form.amountFrom || 0),
        max_amount: form.amountTo === '' ? null : Number(form.amountTo),
        department: form.department === 'all' ? null : Number(form.department),
        is_active: !!form.isActive,
      };

      const nextLevels = [
        { level: 1, value: form.level1, users: form.level1Users },
        { level: 2, value: form.level2, users: form.level2Users },
        { level: 3, value: form.level3, users: form.level3Users },
      ];

      for (const { level, value, users } of nextLevels) {
        const existing = existingByLevel.get(level);

        if (!value && users.length === 0 && existing) {
          await deleteRequest(endpoints.procurement_management.approval_matrix_by_id(existing.id));
          continue;
        }

        if (!value && users.length === 0) {
          continue;
        }

        const payload = {
          ...basePayload,
          approval_level: level,
          approver_role: value || null,
          approver: null,
          approver_ids: users.map((u) => u.id),
          approval_mode: form.approvalMode || 'all_approvers',
        };

        if (existing) {
          await patchRequest(
            endpoints.procurement_management.approval_matrix_by_id(existing.id),
            payload
          );
          continue;
        }

        await createRule(payload);
      }

      await refreshRules();
      toast.success(editingGroupKey ? 'Approval rule updated.' : 'Approval rule created.');
      closeModal();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to save approval rule.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    setBusyGroupKey(group.key);
    try {
      for (const entry of group.entries) {
        await deleteRequest(endpoints.procurement_management.approval_matrix_by_id(entry.id));
      }
      await refreshRules();
      toast.success('Approval rule deleted.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete approval rule.'));
    } finally {
      setBusyGroupKey(null);
    }
  };

  const handleToggleActive = async (group, checked) => {
    setBusyGroupKey(group.key);
    try {
      for (const entry of group.entries) {
        await patchRequest(endpoints.procurement_management.approval_matrix_by_id(entry.id), {
          module: entry.module,
          approval_level: entry.approval_level,
          min_amount: entry.min_amount,
          max_amount: entry.max_amount,
          approver_role: entry.approver_role,
          approver: entry.approver,
          department: entry.department,
          is_active: checked,
        });
      }
      await refreshRules();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update rule status.'));
    } finally {
      setBusyGroupKey(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Approval Matrix</h1>
          <p className="text-muted-foreground">
            Configure approval workflows based on module, amount, and department
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Approval Rule
        </Button>
      </div>

      {/* Approval Rules Table */}
      <Card>
        <CardHeader
          title={`Approval Rules (${groupedRules.length})`}
          description="Manage approval hierarchies and thresholds"
        />
        <CardBody>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading approval rules...</p>
          ) : groupedRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approval rules configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-sm font-semibold text-foreground">Module Type</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Amount Range</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Department</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Approval Level 1</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Approval Level 2</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Approval Level 3</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Mode</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                    <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRules.map((rule) => (
                    <tr key={rule.key} className="border-b border-border">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">{rule.module}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">
                          <span className="font-mono text-foreground">
                            BDT {formatAmount(rule.amountFrom)} - BDT{' '}
                            {rule.amountTo === null ? '∞' : formatAmount(rule.amountTo)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-foreground">{rule.department}</td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="primary" size="sm">
                            L1:{' '}
                            {rule.entries.find((e) => e.approval_level === 1)?.approver_role || '—'}
                          </Badge>
                          {rule.levelUsers[1]?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rule.levelUsers[1].map((u) => (
                                <span
                                  key={u.id}
                                  className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                                >
                                  {u.employee_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {rule.entries.find((e) => e.approval_level === 2) ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="success" size="sm">
                              L2:{' '}
                              {rule.entries.find((e) => e.approval_level === 2)?.approver_role ||
                                '—'}
                            </Badge>
                            {rule.levelUsers[2]?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rule.levelUsers[2].map((u) => (
                                  <span
                                    key={u.id}
                                    className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded-full"
                                  >
                                    {u.employee_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        {rule.entries.find((e) => e.approval_level === 3) ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="warning" size="sm">
                              L3:{' '}
                              {rule.entries.find((e) => e.approval_level === 3)?.approver_role ||
                                '—'}
                            </Badge>
                            {rule.levelUsers[3]?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rule.levelUsers[3].map((u) => (
                                  <span
                                    key={u.id}
                                    className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded-full"
                                  >
                                    {u.employee_name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                            rule.approvalMode === 'any_approver'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {rule.approvalMode === 'any_approver' ? 'Independent' : 'Unanimous'}
                        </span>
                      </td>
                      <td className="py-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={rule.isActive}
                            disabled={busyGroupKey === rule.key}
                            onChange={(event) => handleToggleActive(rule, event.target.checked)}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                        </label>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-muted rounded transition-colors">
                            <Edit
                              className="w-4 h-4 text-primary"
                              onClick={() => openEditModal(rule)}
                            />
                          </button>
                          <button
                            className="p-2 hover:bg-muted rounded transition-colors"
                            onClick={() => handleDeleteGroup(rule)}
                            disabled={busyGroupKey === rule.key}
                          >
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Approval Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader title="Add Approval Rule" description="Configure approval workflow" />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Module Type *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.module}
                      onChange={(event) => handleFieldChange('module', event.target.value)}
                    >
                      <option value="">Select module</option>
                      {moduleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.department}
                      onChange={(event) => handleFieldChange('department', event.target.value)}
                    >
                      <option value="all">All Departments</option>
                      {departmentOptions.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Amount Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        From Amount (BDT) *
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.amountFrom}
                        onChange={(event) => handleFieldChange('amountFrom', event.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        To Amount (BDT)
                      </label>
                      <input
                        type="number"
                        placeholder="Leave blank for unlimited"
                        value={form.amountTo}
                        onChange={(event) => handleFieldChange('amountTo', event.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Approval Mode</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Applies to the entire rule across all levels.
                  </p>
                  <div className="flex gap-3">
                    {approvalModeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-1 flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                          form.approvalMode === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="approvalMode"
                          value={opt.value}
                          checked={form.approvalMode === opt.value}
                          onChange={() => handleFieldChange('approvalMode', opt.value)}
                          className="mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Approval Levels</h3>
                  <div className="space-y-4">
                    {/* Level 1 */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                      <label className="block text-sm font-medium text-primary">
                        Approval Level 1 *
                      </label>
                      <EmployeeMultiSelect
                        employees={employeeOptions}
                        selected={form.level1Users}
                        onChange={(val) => handleFieldChange('level1Users', val)}
                        placeholder="Select users for level 1"
                      />
                    </div>

                    {/* Level 2 */}
                    <div className="p-4 bg-success/5 border border-success/20 rounded-lg space-y-3">
                      <label className="block text-sm font-medium text-success">
                        Approval Level 2
                      </label>
                      <EmployeeMultiSelect
                        employees={employeeOptions}
                        selected={form.level2Users}
                        onChange={(val) => handleFieldChange('level2Users', val)}
                        placeholder="Select users for level 2 (optional)"
                      />
                    </div>

                    {/* Level 3 */}
                    <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg space-y-3">
                      <label className="block text-sm font-medium text-warning">
                        Approval Level 3
                      </label>
                      <EmployeeMultiSelect
                        employees={employeeOptions}
                        selected={form.level3Users}
                        onChange={(val) => handleFieldChange('level3Users', val)}
                        placeholder="Select users for level 3 (optional)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">
                      Enable this approval rule immediately
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.isActive}
                      onChange={(event) => handleFieldChange('isActive', event.target.checked)}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editingGroupKey ? 'Update Rule' : 'Create Rule'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
