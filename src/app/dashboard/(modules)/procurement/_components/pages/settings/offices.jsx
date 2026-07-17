'use client';

import { mutate } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import {
  X,
  Eye,
  Plus,
  Edit,
  Mail,
  Users,
  Phone,
  MapPin,
  Search,
  Trash2,
  Building2,
  CheckCircle,
  ChevronDown,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';

const DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];
const TYPE_OPTIONS = [
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'closed', label: 'Closed' },
];
const EMPTY_FORM = {
  name: '',
  code: '',
  district: '',
  division: '',
  address: '',
  phone: '',
  email: '',
  type: 'office',
  status: 'active',
  headOfOffice: '',
  budgetAllocation: '',
  budgetUtilized: '',
};

// ─── Labeled Field wrapper (matches your screenshot style) ────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

export function OfficeManagement({ detailBasePath = '/dashboard/procurement/settings/offices' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('office');
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Staff state — lazy-loaded when modal opens
  const [usersUrl, setUsersUrl] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // ── READ (SWR) ───────────────────────────────────────────────────────────
  const officeListUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    }

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    return params.toString()
      ? `${endpoints.procurement_management.office_management}?${params.toString()}`
      : endpoints.procurement_management.office_management;
  }, [searchQuery, typeFilter]);

  const { data: officeData, loading } = useGetRequest(officeListUrl);
  const offices = Array.isArray(officeData) ? officeData : (officeData?.results ?? []);

  // Lazy user list — only fetched after modal opens
  const { data: rawUsers } = useGetRequest(usersUrl);
  const userOptions = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.results ?? []);

  // ── OPEN MODAL — trigger user fetch ─────────────────────────────────────
  function openCreateModal() {
    setShowCreate(true);
    setActiveTab('basic');
    setForm(EMPTY_FORM);
    setSelectedUserIds([]);
    setUsersUrl(endpoints.auth.simpleUsers);
  }

  // ── SUBMIT (3-step: office → staff → warehouses) ─────────────────────
  async function handleCreateSubmit(e) {
    e.preventDefault();

    setSubmitting(true);

    try {
      const newOffice = await createRequest(endpoints.procurement_management.office_management, {
        ...form,
        budgetAllocation: form.budgetAllocation || 0,
        budgetUtilized: form.budgetUtilized || 0,
      });

      if (selectedUserIds.length > 0) {
        await createRequest(endpoints.procurement_management.office_staff, {
          office: newOffice.id,
          user_ids: selectedUserIds,
          status: 'active',
        });
      }

      await mutate(
        (key) =>
          typeof key === 'string' &&
          key.startsWith(endpoints.procurement_management.office_management)
      );

      setShowCreate(false);
      toast.success(
        form.type === 'warehouse'
          ? 'Warehouse created successfully.'
          : 'Office created successfully.'
      );
    } catch (error) {
      const message = extractErrorMessage(error) || 'Failed to create office.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── DELETE ──────────────────────────────────────────────────────────────
  async function deleteOffice(id) {
    if (!window.confirm('Delete this office?')) return;

    await deleteRequest(endpoints.procurement_management.office_management_by_id(id));
    mutate(endpoints.procurement_management.office_management);
  }

  // ── UPDATE ──────────────────────────────────────────────────────────────
  async function updateOffice(id, payload) {
    await patchRequest(endpoints.procurement_management.office_management_by_id(id), payload);
    mutate(endpoints.procurement_management.office_management);
  }

  function openEditModal(office) {
    setEditingOffice(office);
    setEditForm({
      name: office.name ?? '',
      code: office.code ?? '',
      district: office.district ?? '',
      division: office.division ?? '',
      address: office.address ?? '',
      phone: office.phone ?? '',
      email: office.email ?? '',
      type: office.type ?? 'office',
      status: office.status ?? 'active',
      headOfOffice: office.headOfOffice ?? '',
      budgetAllocation: office.budgetAllocation ?? '',
      budgetUtilized: office.budgetUtilized ?? '',
    });
    setShowEdit(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await updateOffice(editingOffice.id, {
        ...editForm,
        budgetAllocation: editForm.budgetAllocation || 0,
        budgetUtilized: editForm.budgetUtilized || 0,
      });
      setShowEdit(false);
      setEditingOffice(null);
    } finally {
      setEditSubmitting(false);
    }
  }

  // ── FILTER ──────────────────────────────────────────────────────────────
  const filtered = offices.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (o.name ?? '').toLowerCase().includes(q) ||
      (o.district ?? '').toLowerCase().includes(q) ||
      (o.code ?? '').toLowerCase().includes(q);
    return matchSearch && (typeFilter === 'all' || o.type === typeFilter);
  });

  const totalStaff = offices.reduce((s, o) => s + (o.staffCount || 0), 0);
  const totalBudget = offices.reduce((s, o) => s + Number(o.budgetAllocation || 0), 0);

  // ── STAFF toggle ────────────────────────────────────────────────────────
  function toggleUser(id) {
    setSelectedUserIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'staff', label: `Staff${selectedUserIds.length ? ` (${selectedUserIds.length})` : ''}` },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Office & Location Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage AAB offices across Dhaka, Cox's Bazar, Ukhiya, and Teknaf
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Office
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Offices" value={offices.length} icon={Building2} color="blue" />
        <StatCard title="Total Staff" value={totalStaff} icon={Users} color="green" />
        <StatCard
          title="Linked Warehouses"
          value={offices.reduce(
            (s, o) => s + (Array.isArray(o.warehouses) ? o.warehouses.length : 0),
            0
          )}
          icon={WarehouseIcon}
          color="purple"
        />
        <StatCard
          title="Total Budget"
          value={`৳${(totalBudget / 1_000_000).toFixed(1)}M`}
          icon={Building2}
          color="orange"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, code, or district…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-4 pr-8 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </CardBody>
      </Card>

      {loading && <p className="text-center text-muted-foreground py-10">Loading…</p>}

      {/* Office Cards */}
      <div className="grid grid-cols-2 gap-6">
        {filtered.map((office) => (
          <Card key={office.id} hover>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{office.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" size="sm">
                        {office.code}
                      </Badge>
                      <Badge variant={office.type === 'warehouse' ? 'info' : 'primary'} size="sm">
                        {office.type === 'warehouse' ? 'Warehouse' : 'Office'}
                      </Badge>
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {office.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link href={`${detailBasePath}/${office.id}`}>
                    <button className="p-1.5 hover:bg-muted rounded transition-colors">
                      <Eye className="w-4 h-4 text-primary" />
                    </button>
                  </Link>
                  <button
                    onClick={() => openEditModal(office)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteOffice(office.id)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{office.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {office.phone}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {office.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Head of Office</p>
                  <p className="text-sm font-medium text-foreground">
                    {office.headOfOffice ?? '—'}
                  </p>
                </div>
                <div className="p-2.5 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Staff Count</p>
                  <p className="text-sm font-medium text-foreground">
                    {office.staffCount ?? 0} members
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    ৳{(Number(office.budgetAllocation || 0) / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground">Budget</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {Array.isArray(office.warehouses) ? office.warehouses.length : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Warehouses</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── CREATE MODAL ───────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl relative z-10 flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Add New Location</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {/* ── TAB: Basic Info ──────────────────────────────── */}
                {activeTab === 'basic' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Office Name" required>
                        <input
                          required
                          placeholder="e.g. Dhaka Head Office"
                          value={form.name}
                          onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Office Code" required>
                        <input
                          required
                          placeholder="e.g. DHK-HQ"
                          value={form.code}
                          onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="District">
                        <input
                          placeholder="e.g. Dhaka"
                          value={form.district}
                          onChange={(e) => setForm((c) => ({ ...c, district: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Division">
                        <div className="relative">
                          <select
                            value={form.division}
                            onChange={(e) => setForm((c) => ({ ...c, division: e.target.value }))}
                            className={selectCls}
                          >
                            <option value="">Select Division</option>
                            {DIVISIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </Field>
                      <Field label="Phone">
                        <input
                          placeholder="+880 1X XX XXX XXX"
                          value={form.phone}
                          onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          type="email"
                          placeholder="office@example.com"
                          value={form.email}
                          onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <Field label="Address">
                      <textarea
                        rows={2}
                        placeholder="Full address"
                        value={form.address}
                        onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Type" required>
                        <div className="relative">
                          <select
                            required
                            value={form.type}
                            onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
                            className={selectCls}
                          >
                            {TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </Field>
                      <Field label="Status">
                        <div className="relative">
                          <select
                            value={form.status}
                            onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                            className={selectCls}
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </Field>
                      <Field label="Head of Office" required>
                        <input
                          required
                          placeholder="Full name"
                          value={form.headOfOffice}
                          onChange={(e) => setForm((c) => ({ ...c, headOfOffice: e.target.value }))}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Budget Allocation (৳)">
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={form.budgetAllocation}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, budgetAllocation: e.target.value }))
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Budget Utilized (৳)">
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={form.budgetUtilized}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, budgetUtilized: e.target.value }))
                          }
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* ── TAB: Staff ───────────────────────────────────── */}
                {activeTab === 'staff' && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select users to assign to this office. You can also add staff later from the
                      office detail page.
                    </p>
                    {userOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No users found. Check the users endpoint in the code.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {userOptions.map((u) => (
                          <label
                            key={u.id}
                            className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={() => toggleUser(u.id)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {u.full_name || u.username}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="flex gap-1">
                  {TABS.map((tab, i) => (
                    <div
                      key={tab.id}
                      className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-5 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {submitting
                      ? 'Creating…'
                      : form.type === 'warehouse'
                        ? 'Create Warehouse'
                        : 'Create Office'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────────── */}
      {showEdit && editingOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowEdit(false);
              setEditingOffice(null);
            }}
          />
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl relative z-10 flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Edit Office</h3>
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditingOffice(null);
                }}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Office Name" required>
                    <input
                      required
                      placeholder="e.g. Dhaka Head Office"
                      value={editForm.name}
                      onChange={(e) => setEditForm((c) => ({ ...c, name: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Office Code" required>
                    <input
                      required
                      placeholder="e.g. DHK-HQ"
                      value={editForm.code}
                      onChange={(e) => setEditForm((c) => ({ ...c, code: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="District">
                    <input
                      placeholder="e.g. Dhaka"
                      value={editForm.district}
                      onChange={(e) => setEditForm((c) => ({ ...c, district: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Division">
                    <div className="relative">
                      <select
                        value={editForm.division}
                        onChange={(e) => setEditForm((c) => ({ ...c, division: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="">Select Division</option>
                        {DIVISIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Phone">
                    <input
                      placeholder="+880 1X XX XXX XXX"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((c) => ({ ...c, phone: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      placeholder="office@example.com"
                      value={editForm.email}
                      onChange={(e) => setEditForm((c) => ({ ...c, email: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea
                    rows={2}
                    placeholder="Full address"
                    value={editForm.address}
                    onChange={(e) => setEditForm((c) => ({ ...c, address: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Type" required>
                    <div className="relative">
                      <select
                        required
                        value={editForm.type}
                        onChange={(e) => setEditForm((c) => ({ ...c, type: e.target.value }))}
                        className={selectCls}
                      >
                        {TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Status">
                    <div className="relative">
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((c) => ({ ...c, status: e.target.value }))}
                        className={selectCls}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Head of Office" required>
                    <input
                      required
                      placeholder="Full name"
                      value={editForm.headOfOffice}
                      onChange={(e) => setEditForm((c) => ({ ...c, headOfOffice: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Budget Allocation (৳)">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={editForm.budgetAllocation}
                      onChange={(e) =>
                        setEditForm((c) => ({ ...c, budgetAllocation: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Budget Utilized (৳)">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={editForm.budgetUtilized}
                      onChange={(e) =>
                        setEditForm((c) => ({ ...c, budgetUtilized: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false);
                    setEditingOffice(null);
                  }}
                  className="px-5 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
