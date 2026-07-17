'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const getItemLabel = (item) => {
  if (item.item_name) return item.item_name;
  if (item.remarks?.startsWith('Item: ')) {
    return item.remarks.split(' | ')[0].replace('Item: ', '');
  }
  return 'GRN line item';
};

const getItemNotes = (item) => {
  if (!item.remarks) return '';
  if (item.remarks.includes(' | ')) return item.remarks.split(' | ').slice(1).join(' | ');
  if (item.remarks.startsWith('Item: ')) return '';
  return item.remarks;
};

const inferDecision = (item, existingStatus) => {
  if (existingStatus) return existingStatus;
  if (item.condition === 'Damaged' || Number(item.rejected_quantity) > 0) return 'Failed';
  if (item.condition === 'Partial') return 'Conditional';
  return 'Passed';
};

export function ReceiverVerificationView() {
  const { id } = useParams();
  const router = useRouter();
  const [decisions, setDecisions] = useState({});
  const [findings, setFindings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { data: grn, loading } = useGetRequest(
    id ? endpoints.procurement_management.grn_by_id(id) : null
  );
  const { data: verificationResponse } = useGetRequest(
    id ? `${endpoints.procurement_management.grn_verifications}?pagination=false&grn=${id}` : null
  );

  const existingVerifications = useMemo(() => toList(verificationResponse), [verificationResponse]);
  const existingByItem = useMemo(() => {
    const map = new Map();
    existingVerifications.forEach((verification) => {
      if (!map.has(verification.grn_item)) {
        map.set(verification.grn_item, verification);
      }
    });
    return map;
  }, [existingVerifications]);

  useEffect(() => {
    if (!grn?.grn_items?.length) return;

    const nextDecisions = {};
    const nextFindings = {};

    grn.grn_items.forEach((item) => {
      const existing = existingByItem.get(item.id);
      nextDecisions[item.id] = inferDecision(item, existing?.status);
      nextFindings[item.id] = existing?.findings || getItemNotes(item);
    });

    setDecisions(nextDecisions);
    setFindings(nextFindings);
  }, [existingByItem, grn]);

  const counts = useMemo(() => {
    const values = Object.values(decisions);
    return {
      passed: values.filter((value) => value === 'Passed').length,
      failed: values.filter((value) => value === 'Failed').length,
      conditional: values.filter((value) => value === 'Conditional').length,
    };
  }, [decisions]);

  const determineGrnStatus = () => {
    const values = Object.values(decisions);
    if (!values.length) return 'Pending Verification';
    if (values.every((value) => value === 'Passed')) return 'Verified';
    if (values.every((value) => value === 'Failed')) return 'Rejected';
    return 'Partially Verified';
  };

  const handleSave = async () => {
    if (!grn?.id || !grn.grn_items?.length) return;

    try {
      setSubmitting(true);

      await Promise.all(
        grn.grn_items.map(async (item) => {
          const decision = decisions[item.id] || 'Passed';
          const decisionFindings = findings[item.id] || '';
          const existing = existingByItem.get(item.id);

          const verificationPayload = {
            grn: grn.id,
            grn_item: item.id,
            inspection_date: new Date().toISOString(),
            status: decision,
            findings: decisionFindings,
          };

          if (existing?.id) {
            await patchRequest(
              endpoints.procurement_management.grn_verification_by_id(existing.id),
              verificationPayload
            );
          } else {
            await createRequest(
              endpoints.procurement_management.grn_verifications,
              verificationPayload
            );
          }

          const receivedQuantity = Number(item.received_quantity) || 0;
          const itemPayload =
            decision === 'Failed'
              ? {
                  accepted_quantity: 0,
                  rejected_quantity: receivedQuantity,
                  condition: 'Damaged',
                  remarks: item.remarks,
                }
              : decision === 'Conditional'
                ? {
                    accepted_quantity: Number(item.accepted_quantity) || receivedQuantity,
                    rejected_quantity: Number(item.rejected_quantity) || 0,
                    condition: 'Partial',
                    remarks: item.remarks,
                  }
                : {
                    accepted_quantity: receivedQuantity,
                    rejected_quantity: 0,
                    condition: 'Good',
                    remarks: item.remarks,
                  };

          await patchRequest(endpoints.procurement_management.grn_item_by_id(item.id), itemPayload);
        })
      );

      await patchRequest(endpoints.procurement_management.grn_by_id(grn.id), {
        status: determineGrnStatus(),
      });

      await Promise.all([
        mutate(endpoints.procurement_management.grn_summary),
        mutate(`${endpoints.procurement_management.grns}?pagination=false`),
        mutate(endpoints.procurement_management.grn_by_id(grn.id)),
        mutate(
          `${endpoints.procurement_management.grn_verifications}?pagination=false&grn=${grn.id}`
        ),
      ]);

      toast.success('GRN verification saved successfully.');
      router.push(paths.dashboard.procurement.grn.detail(grn.id));
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading GRN verification...
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!grn?.id) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <Card>
          <CardBody>
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Goods receive note not found.</p>
              <Link href={paths.dashboard.procurement.grn.list}>
                <Button variant="outline">Back to list</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href={paths.dashboard.procurement.grn.detail(grn.id)}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Verification - {grn.grn_number}
          </h1>
          <p className="text-muted-foreground text-sm">
            Review each received line and record inspection findings.
          </p>
        </div>
        <Badge variant="warning" className="sm:ml-auto">
          {grn.status}
        </Badge>
      </div>

      <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="font-semibold text-foreground">Verification required</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Update the inspection outcome for each GRN item. The overall GRN status will be
          recalculated from these decisions.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Received Value</p>
            <p className="text-lg font-semibold">{formatBDT(grn.total_received_value)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Passed</p>
            <p className="text-lg font-semibold text-success">{counts.passed}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Conditional</p>
            <p className="text-lg font-semibold text-warning">{counts.conditional}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Failed</p>
            <p className="text-lg font-semibold text-error">{counts.failed}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Item Verification"
          description="Persist decisions as GRN verification records"
        />
        <CardBody>
          <div className="space-y-4">
            {grn.grn_items?.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_120px_120px_180px] gap-4 items-start mb-4">
                  <div>
                    <p className="font-medium text-foreground">{getItemLabel(item)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getItemNotes(item) || 'No notes recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ordered</p>
                    <p className="font-medium text-foreground">{item.ordered_quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Received</p>
                    <p className="font-medium text-foreground">{item.received_quantity}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Decision</label>
                    <select
                      value={decisions[item.id] || 'Passed'}
                      onChange={(event) =>
                        setDecisions((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="Passed">Passed</option>
                      <option value="Conditional">Conditional</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={findings[item.id] || ''}
                  onChange={(event) =>
                    setFindings((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  placeholder="Inspection findings for this item"
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-error text-error hover:bg-error/10"
          onClick={() => {
            const next = {};
            grn.grn_items?.forEach((item) => {
              next[item.id] = 'Failed';
            });
            setDecisions(next);
          }}
          disabled={submitting}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Mark All Failed
        </Button>
        <Button type="button" onClick={handleSave} disabled={submitting}>
          <Save className="w-4 h-4 mr-2" />
          {submitting ? 'Saving...' : 'Save Verification'}
        </Button>
      </div>
    </div>
  );
}
