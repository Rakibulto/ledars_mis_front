'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  X,
  Edit,
  Users,
  Phone,
  Clock,
  MapPin,
  ArrowLeft,
  Building2,
  Warehouse,
  DollarSign,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const TOKEN_KEY = 'jwt_access_token';
const API = 'http://127.0.0.1:8000/api';

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function OfficeDetail({ listHref = '/dashboard/procurement/settings/offices' }) {
  const { id } = useParams();
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API}/office_management/${id}/`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOffice(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Loading office details…</p>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="p-8">
        <Link
          href={listHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Offices
        </Link>
        <p className="text-muted-foreground">Office not found.</p>
      </div>
    );
  }

  const budgetAllocation = Number(office.budgetAllocation || 0);
  const budgetUtilized = Number(office.budgetUtilized || 0);
  const budgetAvailable = budgetAllocation - budgetUtilized;
  const budgetPct =
    budgetAllocation > 0 ? Math.round((budgetUtilized / budgetAllocation) * 100) : 0;

  const staff = Array.isArray(office.staff) ? office.staff : [];
  const warehouses = (Array.isArray(office.warehouses) ? office.warehouses : []).map(
    (warehouse) => ({
      ...warehouse,
      displayCapacity: warehouse.capacity_sqft ?? warehouse.capacity ?? '—',
      displayCode: warehouse.code ?? warehouse.id,
      displayLocationCount: warehouse.location_count ?? warehouse.itemCount ?? 0,
      displayStatus:
        typeof warehouse.is_active === 'boolean'
          ? warehouse.is_active
            ? 'active'
            : 'inactive'
          : (warehouse.status ?? 'unknown'),
      displayType: warehouse.warehouse_type_label ?? warehouse.warehouse_type ?? 'Warehouse',
    })
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={listHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Offices
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{office.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{office.code}</Badge>
                <Badge variant="info">
                  {office.type
                    ? office.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
                    : ''}
                </Badge>
                <Badge variant="success">{office.status}</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
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
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Location
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card>
          <CardBody>
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold">{office.staffCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Staff Members</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold">
                ৳{(budgetAllocation / 1_000_000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground">Budget Allocation</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold">{budgetPct}%</p>
              <p className="text-xs text-muted-foreground">Budget Utilized</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <Warehouse className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-semibold">{warehouses.length}</p>
              <p className="text-xs text-muted-foreground">Linked Warehouses</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Staff */}
          <Card>
            <CardHeader
              title="Assigned Staff"
              description="Staff members working at this office"
              action={
                <Badge variant="outline">
                  {staff.length} of {office.staffCount ?? 0} shown
                </Badge>
              }
            />
            <CardBody>
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No staff assigned to this office
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                          Name
                        </th>
                        <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                          Role
                        </th>
                        <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                          Email
                        </th>
                        <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((s) => (
                        <tr key={s.id} className="border-b border-border">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {(s.username || s.email || '??').slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {s.username}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-sm text-foreground">{s.role ?? '—'}</td>
                          <td className="py-3 pr-3 text-sm text-muted-foreground">{s.email}</td>
                          <td className="py-3">
                            <Badge variant="success" size="sm">
                              active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Linked Warehouses */}
          <Card>
            <CardHeader title="Linked Warehouses" />
            <CardBody>
              {warehouses.length > 0 ? (
                <div className="space-y-3">
                  {warehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Warehouse className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{wh.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {wh.displayCode} · {wh.displayType} · {wh.displayCapacity} sqft ·{' '}
                            {wh.displayLocationCount} locations
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={wh.displayStatus === 'active' ? 'success' : 'outline'}
                        size="sm"
                      >
                        {wh.displayStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No warehouses linked to this office
                </p>
              )}
            </CardBody>
          </Card>

          {/* Recent Activity — not yet available from API */}
          <Card>
            <CardHeader title="Recent Activity" />
            <CardBody>
              <div className="flex items-center gap-2 py-4 justify-center">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Activity tracking coming soon</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Office Details" />
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Office ID</p>
                  <p className="text-sm font-medium">{office.office_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Office Code</p>
                  <p className="text-sm font-medium">{office.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">District</p>
                  <p className="text-sm font-medium">{office.district ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Division</p>
                  <p className="text-sm font-medium">{office.division ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-medium">{office.address ?? '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <p>—</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── EDIT MODAL ────────────────────────────────────────────────── */}
      {showEdit && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEdit(false)} />
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl relative z-10 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Edit Office</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEditSubmitting(true);
                try {
                  const res = await fetch(`${API}/office_management/${id}/`, {
                    method: 'PATCH',
                    headers: authHeaders(),
                    body: JSON.stringify({
                      ...editForm,
                      budgetAllocation: editForm.budgetAllocation || 0,
                      budgetUtilized: editForm.budgetUtilized || 0,
                    }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setOffice(updated);
                    setShowEdit(false);
                  } else {
                    console.error('Update failed:', await res.text());
                  }
                } finally {
                  setEditSubmitting(false);
                }
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['name', 'Office Name', 'e.g. Dhaka Head Office'],
                    ['code', 'Office Code', 'e.g. DHK-HQ'],
                    ['district', 'District', 'e.g. Dhaka'],
                    ['phone', 'Phone', '+880 1X XX XXX XXX'],
                    ['email', 'Email', 'office@example.com'],
                    ['headOfOffice', 'Head of Office', 'Full name'],
                  ].map(([field, label, ph]) => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        placeholder={ph}
                        value={editForm[field]}
                        onChange={(e) => setEditForm((c) => ({ ...c, [field]: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Division</label>
                    <div className="relative">
                      <select
                        value={editForm.division}
                        onChange={(e) => setEditForm((c) => ({ ...c, division: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none cursor-pointer"
                      >
                        <option value="">Select Division</option>
                        {[
                          'Dhaka',
                          'Chattogram',
                          'Rajshahi',
                          'Khulna',
                          'Barishal',
                          'Sylhet',
                          'Rangpur',
                          'Mymensingh',
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <div className="relative">
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm((c) => ({ ...c, type: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none cursor-pointer"
                      >
                        {[
                          { value: 'office', label: 'Office' },
                          { value: 'warehouse', label: 'Warehouse' },
                        ].map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div className="relative">
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((c) => ({ ...c, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground appearance-none cursor-pointer"
                      >
                        {[
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                          { value: 'closed', label: 'Closed' },
                        ].map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  {[
                    ['budgetAllocation', 'Budget Allocation (৳)'],
                    ['budgetUtilized', 'Budget Utilized (৳)'],
                  ].map(([field, label]) => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={editForm[field]}
                        onChange={(e) => setEditForm((c) => ({ ...c, [field]: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Address</label>
                  <textarea
                    rows={2}
                    placeholder="Full address"
                    value={editForm.address}
                    onChange={(e) => setEditForm((c) => ({ ...c, address: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
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
