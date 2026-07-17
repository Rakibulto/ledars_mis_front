'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Divider,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { getAmountInWords } from 'src/utils/amountInWords';

import { CONFIG } from 'src/config-global';
import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

import GinApprovalInfo from './gin-approval-info';
import GinDecisionDialog from './gin-decision-dialog';
import GinApprovalSummary from './gin-approval-summary';
import IssueDocumentChallanPDF from './issue-document-challan-pdf';
import { getIssueDocumentModuleConfig } from './issue-document-module-config';
import { revalidateInventoryLogInsights } from '../inventory-log/inventory-log-utils';
import {
  EMPTY_TRANSPORT,
  createDecisionLineItems,
  normalizeDecisionLineItems,
} from './gin-decision-utils';
import {
  computeGinWorkflowInfo,
  GIN_APPROVAL_WORKFLOW_URL,
  NO_WORKFLOW_LEVEL_MESSAGE,
} from './gin-approval-workflow';

const EP = endpoints.storeInventory;

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function formatActorLabel({ name, email, id, fallback = 'Not captured' }) {
  const parts = [name, email].filter(Boolean);

  if (parts.length) {
    return parts.join(' • ');
  }

  if (id) {
    return `User #${id}`;
  }

  return fallback;
}

function getStatusTransitionLabel(entry) {
  const fromStatus =
    entry?.status_from && entry.status_from !== '_' ? entry.status_from : 'Created';
  const toStatus = entry?.status_to || 'Unknown';

  return `${fromStatus} -> ${toStatus}`;
}

function getStatusAccentColor(status) {
  switch (normalizeStatus(status)) {
    case 'issued':
      return '#0f766e';
    case 'approved':
      return '#15803d';
    case 'pending approval':
      return '#d97706';
    case 'cancelled':
      return '#dc2626';
    case 'draft':
      return '#64748b';
    default:
      return '#2563eb';
  }
}

function getStockChipProps(quantity) {
  const amount = Number(quantity || 0);

  if (amount <= 0) {
    return { color: 'error', label: 'Out of stock' };
  }

  if (amount <= 5) {
    return { color: 'warning', label: 'Low stock' };
  }

  return { color: 'success', label: 'Available' };
}

function getStatusChipProps(status) {
  switch (normalizeStatus(status)) {
    case 'issued':
      return { color: 'secondary', label: 'Issued' };
    case 'pending approval':
      return { color: 'warning', label: 'Pending Approval' };
    case 'approved':
      return { color: 'success', label: 'Approved' };
    case 'draft':
      return { color: 'default', label: 'Draft' };
    case 'cancelled':
      return { color: 'error', label: 'Cancelled' };
    default:
      return { color: 'default', label: status || 'Unknown' };
  }
}

function DetailField({ label, value, helper }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.disabled">
          {helper}
        </Typography>
      ) : null}
    </Stack>
  );
}

function MetricPanel({ label, value, helper, children }) {
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.12)',
        minHeight: 118,
      }}
    >
      <Stack spacing={1} justifyContent="space-between" sx={{ height: '100%' }}>
        <Typography variant="caption" sx={{ opacity: 0.82 }}>
          {label}
        </Typography>
        {children || (
          <Typography variant="h4" fontWeight={700} color="common.white">
            {value}
          </Typography>
        )}
        <Typography variant="body2" sx={{ opacity: 0.84 }}>
          {helper}
        </Typography>
      </Stack>
    </Box>
  );
}

function StatusHistoryItem({ entry, isLast }) {
  const statusChip = getStatusChipProps(entry?.status_to);
  const actorLabel = formatActorLabel({
    name: entry?.name,
    email: entry?.email,
    fallback: 'System',
  });
  const accentColor = getStatusAccentColor(entry?.status_to);

  return (
    <Stack direction="row" spacing={2} alignItems="stretch">
      <Stack alignItems="center" sx={{ minWidth: 20 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: accentColor,
            boxShadow: `0 0 0 4px ${accentColor}20`,
            mt: 0.85,
          }}
        />
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: '#e2e8f0',
              borderRadius: 999,
              my: 0.5,
            }}
          />
        )}
      </Stack>

      <Box sx={{ flex: 1, pb: isLast ? 0 : 2.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
          alignItems={{ sm: 'center' }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
            {getStatusTransitionLabel(entry)}
          </Typography>
          <Chip size="small" color={statusChip.color} label={statusChip.label} variant="soft" />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {actorLabel}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {entry?.gin_code || 'Reference unavailable'}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function GoodsIssueNoteDetails({ moduleKey = 'goodsIssueNote' }) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const confirm = useBoolean();
  const moduleConfig = getIssueDocumentModuleConfig(moduleKey);
  const workflowEnabled = moduleConfig.showApproveAction;
  const showsIssueToField = moduleConfig.showIssueToField !== false;
  const usesWarehouseParties = moduleConfig.partySelectionMode === 'warehouse';
  const usesOfficeParties = moduleConfig.partySelectionMode === 'office';
  const ginId = moduleConfig.paramKeys
    .map((key) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    })
    .find(Boolean);

  const {
    data: gin,
    loading,
    error,
  } = useGetRequest(ginId ? moduleConfig.detailEndpoint(ginId) : null);
  const { data: rawWorkflow } = useGetRequest(workflowEnabled ? GIN_APPROVAL_WORKFLOW_URL : null);

  const [deleting, setDeleting] = useState(false);
  const [downloadingChallan, setDownloadingChallan] = useState(false);
  const [downloadingGatePass, setDownloadingGatePass] = useState(false);
  const [decisionDialog, setDecisionDialog] = useState(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  const lineItems = useMemo(() => (Array.isArray(gin?.line_items) ? gin.line_items : []), [gin]);
  const statusLogEntries = useMemo(
    () => (Array.isArray(gin?.status_log) ? gin.status_log : []),
    [gin]
  );

  const lineItemMetrics = useMemo(
    () => ({
      items: Number(gin?.item_count || lineItems.length || 0),
      requested: lineItems.reduce((total, row) => total + Number(row.requested_qty || 0), 0),
      issued: Number(
        gin?.issued_qty_total ||
          lineItems.reduce((total, row) => total + Number(row.issued_qty || 0), 0)
      ),
      current: lineItems.reduce((total, row) => total + Number(row.item_current_quantity || 0), 0),
    }),
    [gin, lineItems]
  );
  const hasCurrentStockColumn = useMemo(
    () =>
      lineItems.some(
        (line) => line.item_current_quantity !== null && line.item_current_quantity !== undefined
      ),
    [lineItems]
  );
  const requestedByEntry = statusLogEntries[0];
  const approvedByEntry =
    statusLogEntries.find((entry) => normalizeStatus(entry?.status_to) === 'approved') ||
    statusLogEntries.find((entry) => normalizeStatus(entry?.status_to) === 'issued');
  const latestStatusEntry = statusLogEntries.at(-1);
  const requestedByLabel = formatActorLabel({
    name: gin?.requested_by_name || requestedByEntry?.name,
    email: gin?.requested_by_email || requestedByEntry?.email,
    id: gin?.requested_by,
  });
  const approvedByLabel = formatActorLabel({
    name: gin?.approved_by_name || approvedByEntry?.name,
    email: gin?.approved_by_email || approvedByEntry?.email,
    id: gin?.approved_by,
    fallback: normalizeStatus(gin?.status) === 'draft' ? 'Pending approval' : 'Not captured',
  });
  const wfInfo = useMemo(
    () => (workflowEnabled && gin ? computeGinWorkflowInfo(gin, rawWorkflow, user?.email) : null),
    [workflowEnabled, gin, rawWorkflow, user?.email]
  );

  const isIssued = normalizeStatus(gin?.status) === 'issued';
  const isApproved = normalizeStatus(gin?.status) === 'approved';
  const canModifyDocument = !isApproved && !isIssued;
  const showNoWorkflowWarning =
    workflowEnabled &&
    normalizeStatus(gin?.status) === 'pending approval' &&
    wfInfo?.noMatchWarning;

  const decisionWorkflowInfo = useMemo(
    () =>
      workflowEnabled && decisionDialog?.target
        ? computeGinWorkflowInfo(decisionDialog.target, rawWorkflow, user?.email)
        : null,
    [workflowEnabled, decisionDialog?.target, rawWorkflow, user?.email]
  );

  const statusChip = getStatusChipProps(gin?.status);
  const latestTransitionLabel = latestStatusEntry
    ? getStatusTransitionLabel(latestStatusEntry)
    : statusChip.label;
  const latestTransitionActor = latestStatusEntry
    ? formatActorLabel({
        name: latestStatusEntry?.name,
        email: latestStatusEntry?.email,
        fallback: 'System',
      })
    : 'No status history yet';

  const handleDelete = async () => {
    if (!ginId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRequest(moduleConfig.detailEndpoint(ginId));
      toast.success(moduleConfig.deletedToast);
      await Promise.all([
        mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint)),
        revalidateInventoryLogInsights(),
      ]);
      router.push(moduleConfig.listPath);
    } catch (requestError) {
      toast.error(moduleConfig.deleteError);
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  const handleDownloadChallan = async () => {
    if (!gin) {
      return;
    }

    setDownloadingChallan(true);

    try {
      const blob = await pdf(
        <IssueDocumentChallanPDF
          documentData={gin}
          moduleConfig={moduleConfig}
          lineItems={lineItems}
        />
      ).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `${gin?.gin_number || moduleConfig.singularTitle}-challan.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Challan PDF downloaded.');
    } catch (downloadError) {
      toast.error('Failed to prepare challan PDF.');
    } finally {
      setDownloadingChallan(false);
    }
  };

  const handleApproveRequest = () => {
    if (!gin) {
      return;
    }

    setDecisionDialog({
      mode: 'approve',
      target: gin,
      lineItems: createDecisionLineItems(gin),
    });
  };

  const handleIssueRequest = () => {
    if (!gin) {
      return;
    }

    setDecisionDialog({
      mode: 'issue',
      target: gin,
      lineItems: createDecisionLineItems(gin),
      transport: { ...EMPTY_TRANSPORT },
    });
  };

  const handleTransportChange = (field, value) => {
    setDecisionDialog((prev) => ({
      ...prev,
      transport: { ...prev.transport, [field]: value },
    }));
  };

  const handleDecisionLineItemChange = (localId, value) => {
    setDecisionDialog((current) => {
      if (!current || current.mode !== 'approve') {
        return current;
      }

      return {
        ...current,
        lineItems: current.lineItems.map((line) => {
          if (line.localId !== localId) {
            return line;
          }

          const maxIssuedQty = Number(line.item_current_quantity || 0);
          const nextIssuedQty = Number(value || 0);

          if (value !== '' && maxIssuedQty > 0 && nextIssuedQty > maxIssuedQty) {
            toast.error('Issued quantity must be under the current stock for the selected item.');
            return line;
          }

          return {
            ...line,
            issued_qty: value,
            requested_qty: value,
          };
        }),
      };
    });
  };

  const handleDecision = async (nextStatus) => {
    if (!decisionDialog?.target?.id) {
      return;
    }

    const normalizedLineItems =
      nextStatus === 'Approved' ? normalizeDecisionLineItems(decisionDialog.lineItems) : null;

    if (nextStatus === 'Approved' && !normalizedLineItems) {
      return;
    }

    setDecisionSubmitting(true);

    try {
      if (nextStatus === 'Approved' && workflowEnabled) {
        await axiosInstance.post(EP.gin_approve(decisionDialog.target.id), {
          line_items: normalizedLineItems,
        });
      } else if (nextStatus === 'Issued' && workflowEnabled && decisionDialog.transport) {
        const t = decisionDialog.transport;
        await axiosInstance.post(EP.gin_issue(decisionDialog.target.id), {
          transport_person: t.transport_person || null,
          transport_phone: t.transport_phone || null,
          transport_address: t.transport_address || null,
          vehicle_number: t.vehicle_number || null,
          dispatch_date: t.dispatch_date ? dayjs(t.dispatch_date).format('YYYY-MM-DD') : null,
        });
      } else {
        const payload = { status: nextStatus };

        if (nextStatus === 'Approved') {
          payload.approval_level = Number(
            decisionDialog.target.total_levels || decisionDialog.target.approval_level || 0
          );
          payload.line_items = normalizedLineItems;
        }

        if (nextStatus === 'Issued' && decisionDialog.transport) {
          const t = decisionDialog.transport;
          payload.transport_person = t.transport_person || null;
          payload.transport_phone = t.transport_phone || null;
          payload.transport_address = t.transport_address || null;
          payload.vehicle_number = t.vehicle_number || null;
          payload.dispatch_date = t.dispatch_date
            ? dayjs(t.dispatch_date).format('YYYY-MM-DD')
            : null;
        }

        await patchRequest(moduleConfig.detailEndpoint(decisionDialog.target.id), payload);
      }

      toast.success(
        nextStatus === 'Approved'
          ? moduleConfig.approvedToast
          : nextStatus === 'Issued'
            ? moduleConfig.issuedToast || `${moduleConfig.singularTitle} marked as issued.`
            : `${moduleConfig.singularTitle} marked as cancelled.`
      );

      await Promise.all([
        mutate(moduleConfig.detailEndpoint(decisionDialog.target.id)),
        mutate((key) => typeof key === 'string' && key.startsWith(moduleConfig.listEndpoint)),
        revalidateInventoryLogInsights(),
      ]);

      setDecisionDialog(null);
    } catch (requestError) {
      const fallbackMessage =
        nextStatus === 'Approved'
          ? moduleConfig.approveError
          : nextStatus === 'Issued'
            ? moduleConfig.issueError ||
              `Failed to mark the selected ${moduleConfig.recordSingular} as issued.`
            : `Failed to mark the selected ${moduleConfig.recordSingular} as cancelled.`;

      toast.error(
        extractErrorMessage(requestError?.response?.data || requestError) || fallbackMessage
      );
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleDownloadGatePass = async () => {
    if (!gin) {
      return;
    }

    setDownloadingGatePass(true);

    try {
      const blob = await pdf(
        <IssueDocumentChallanPDF
          documentData={gin}
          moduleConfig={moduleConfig}
          lineItems={lineItems}
          docType="gate_pass"
        />
      ).toBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `GatePass-${gin?.gin_number || gin?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Gate Pass downloaded.');
    } catch {
      toast.error('Failed to prepare Gate Pass PDF.');
    } finally {
      setDownloadingGatePass(false);
    }
  };

  const amountInwords = getAmountInWords(gin?.total_value);
  const handlePrintGIN = () => {
    /* ── helpers ─────────────────────────────────────────────────── */

    const baseUrl = CONFIG.appDomainUrl.replace(/\/+$/, '');
    const escape = (v) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const fmtDate = (d) => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('en-GB');
      } catch {
        return String(d);
      }
    };

    const fmtNum = (v) => {
      const n = Number(v);

      return Number.isNaN(n)
        ? ''
        : n.toLocaleString('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
    };
    /* ── derived header values ───────────────────────────────────── */
    const projectName = escape(gin?.project ?? '');
    const reqNo = escape(gin?.gin_number ?? '');
    const issueDate = fmtDate(gin?.issue_date);
    const totalValue = fmtNum(gin?.total_value);
    const requesterName = escape(gin?.requested_by_name ?? '');
    const verifiedBy = escape(gin?.issued_by_name ?? '');
    const approvedBy = escape(gin?.approved_by_name ?? '');

    /* ── first table : Particulars/Budget Items ──────────────────── */
    const MIN_PART_ROWS = 12;
    const lineItemss = gin?.line_items ?? [];
    const paddedPart = [
      ...lineItems,
      ...Array(Math.max(0, MIN_PART_ROWS - lineItemss.length)).fill(null),
    ];

    const partRows = paddedPart
      .map((item, i) => {
        const lineAmt = item
          ? fmtNum(
              Number(item.unit_price ?? 0) * Number(item.issued_qty ?? item.requested_qty ?? 0)
            )
          : '';
        return `
      <tr>
        <td class="tc">${item ? i + 1 : ''}</td>
        <td>${item ? escape(item.item_name || item.product_name || '') : ''}</td>
        <td class="tc">${item ? escape(item.item_code ?? '') : ''}</td>
        <td class="tr">${item ? lineAmt : ''}</td>
        <td>${item ? escape(item.remarks ?? '') : ''}</td>
      </tr>`;
      })
      .join('');

    /* ── second table : Cheque details (blank rows — no cheque data) */
    const MIN_CHQ_ROWS = 8;
    const chequeItems = gin?.cheque_items ?? [];
    const paddedChq = [
      ...chequeItems,
      ...Array(Math.max(0, MIN_CHQ_ROWS - chequeItems.length)).fill(null),
    ];

    const chequeRows = paddedChq
      .map(
        (item, i) => `
      <tr>
        <td class="tc">${item ? i + 1 : ''}</td>
        <td>${item ? escape(item.account_name ?? '') : ''}</td>
        <td class="tc">${item ? escape(item.cheque_number ?? '') : ''}</td>
        <td class="tr">${item ? fmtNum(item.total_amount ?? 0) : ''}</td>
      </tr>`
      )
      .join('');

    /* ── full HTML ───────────────────────────────────────────────── */
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reqNo} — Cheque Issue Requisition Form</title>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap"
  >
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, 'Noto Sans Bengali', sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 22px 28px;
    }

    /* ════════════════════════════════════════════
       ORG HEADER  (shared template — do not change)
    ════════════════════════════════════════════ */
    .org-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 3px;
    }
    .org-logo {
      width: 66px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .org-logo img {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    .org-center {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .org-spacer { width: 66px; flex-shrink: 0; }
    .org-name-img {
      max-height: 56px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .org-web {
      font-size: 10px;
      text-decoration: underline;
      color: #0000cc;
      margin-top: 2px;
    }
    .rule { border-top: 3px solid #000; margin: 5px 0 10px; }

    /* ════════════════════════════════════════════
       FORM TITLE
    ════════════════════════════════════════════ */
    .title-wrap { text-align: center; margin-bottom: 14px; }
    .title-box {
      display: inline-block;
      background: #1c1c1c;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      padding: 5px 24px;
      border-radius: 5px;
      letter-spacing: 0.4px;
    }

    /* ════════════════════════════════════════════
       INFO FIELDS  (dotted underline style)
    ════════════════════════════════════════════ */
    .info-row {
      display: flex;
      align-items: baseline;
      gap: 24px;
      margin-bottom: 7px;
    }
    .info-field {
      display: flex;
      align-items: baseline;
      flex: 1;
    }
    .i-lbl {
      font-size: 11px;
      font-weight: 400;
      white-space: nowrap;
    }
    .i-dots {
      flex: 1;
      border-bottom: 1.5px dotted #333;
      padding-left: 3px;
      padding-bottom: 1px;
      font-size: 11px;
      min-width: 50px;
    }

    /* ════════════════════════════════════════════
       SHARED TABLE STYLES
    ════════════════════════════════════════════ */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    table th, table td {
      border: 1px solid #555;
      padding: 3px 5px;
      font-size: 11px;
    }
    table th {
      background: #d8d8d8;
      font-weight: 700;
      text-align: center;
    }
    /* blank data rows always render as visible lines */
    table tbody td { height: 22px; vertical-align: middle; }

    .tc  { text-align: center; }
    .tr  { text-align: right;  }
    .tl  { text-align: left;   }
    .bold { font-weight: 700;  }

    /* ── Particulars table column widths ── */
    .col-sl1   { width: 38px; }
    .col-part  { }
    .col-bcode { width: 96px; }
    .col-amt1  { width: 130px; }
    .col-rem   { width: 90px; }

    /* Grand Total row */
    .grand-row td { font-weight: 700; background: #f0f0f0; }

    /* ── Cheque table column widths ── */
    .col-sl2   { width: 50px; }
    .col-acc   { }
    .col-chqno { width: 130px; }
    .col-amt2  { width: 140px; }

    /* Amount in words field */
    .amt-words-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 10px;
    }
    .amt-words-lbl  { font-size: 11px; white-space: nowrap; }
    .amt-words-dots {
      flex: 1;
      border-bottom: 1.5px dotted #333;
      padding-left: 3px;
      padding-bottom: 1px;
      font-size: 11px;
    }

    /* ════════════════════════════════════════════
       SIGNATURE FOOTER
    ════════════════════════════════════════════ */
    .sig-section {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      gap: 10px;
    }
    .sig-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .sig-line {
      width: 100%;
      border-top: 1.5px dotted #333;
      margin-bottom: 5px;
    }
    .sig-name  { font-size: 11px; font-weight: 700; }
    .sig-value { font-size: 10px; color: #333; margin-top: 2px; }

    /* ════════════════════════════════════════════
       PRINT
    ════════════════════════════════════════════ */
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 1.1cm 1.2cm; }
    }
  </style>
</head>
<body>

  <!-- ═══════════════════ ORG HEADER (shared template) ═══════════════════ -->
  <div class="org-wrap">
    <div class="org-logo">
      <img
      src="${baseUrl}/icons/logo.png"
        alt="LEDARS Logo"
        onerror="this.style.display='none'"
      >
    </div>
    <div class="org-center">
      <img
        class="org-name-img"
        src="${baseUrl}/icons/name_img.png"
        alt="LEDARS — Shyamnagar, Satkhira."
        onerror="this.style.display='none'"
      >
      <div class="org-web">www.ledars.org</div>
    </div>
    <div class="org-spacer"></div>
  </div>
  <div class="rule"></div>

  <!-- ═══════════════════ FORM TITLE ═══════════════════ -->
  <div class="title-wrap">
    <span class="title-box">Cheque Issue Requisition Form</span>
  </div>

  <!-- ═══════════════════ INFO FIELDS ═══════════════════ -->

  <!-- Project Name — full width -->
  <div class="info-row">
    <div class="info-field">
      <span class="i-lbl">Project Name :</span>
      <span class="i-dots">${projectName}</span>
    </div>
  </div>

  <!-- Requisition No (left) | Date (right) -->
  <div class="info-row" style="margin-bottom:12px;">
    <div class="info-field">
      <span class="i-lbl">Requisition No :</span>
      <span class="i-dots">${reqNo}</span>
    </div>
    <div class="info-field">
      <span class="i-lbl">Date :</span>
      <span class="i-dots">${issueDate}</span>
    </div>
  </div>

  <!-- ═══════════════════ PARTICULARS / BUDGET ITEMS TABLE ═══════════════════ -->
  <table>
    <thead>
      <tr>
        <th class="col-sl1">Sl.No</th>
        <th class="col-part">Particulars/Budget Items</th>
        <th class="col-bcode">Budget Code</th>
        <th class="col-amt1">Total Amount (BDT)</th>
        <th class="col-rem">Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${partRows}
    </tbody>
    <tfoot>
      <tr class="grand-row">
        <td colspan="3" class="tr bold" style="padding-right:8px;">Grand Total =</td>
        <td class="tr bold">${totalValue}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <!-- ═══════════════════ AMOUNT IN WORDS ═══════════════════ -->
  <div class="amt-words-row">
    <span class="amt-words-lbl">Amount in words :</span>
    <span class="amt-words-dots">${amountInwords}</span>
  </div>

  <!-- ═══════════════════ CHEQUE TABLE ═══════════════════ -->
  <table>
    <thead>
      <tr>
        <th class="col-sl2">Sl. No</th>
        <th class="col-acc">Account Name</th>
        <th class="col-chqno">Cheque Number</th>
        <th class="col-amt2">Total Amount (BDT)</th>
      </tr>
    </thead>
    <tbody>
      ${chequeRows}
    </tbody>
  </table>

  <!-- ═══════════════════ SIGNATURE FOOTER ═══════════════════ -->
  <div class="sig-section">

    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Requested By</div>
      <div class="sig-value">${requesterName}</div>
    </div>

    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Verified By</div>
      <div class="sig-value">${verifiedBy}</div>
    </div>

    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">Approved By</div>
      <div class="sig-value">${approvedBy}</div>
    </div>

  </div>

</body>
</html>`;

    /* ── open print window ─────────────────────────────────────── */
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    /* wait for images + font to load before triggering print */
    setTimeout(() => win.print(), 900);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Link href={moduleConfig.listPath} passHref>
              <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />}>
                {moduleConfig.backToListLabel}
              </Button>
            </Link>
            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {gin?.gin_number || moduleConfig.detailHeadingFallback}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {moduleConfig.detailDescription}
              </Typography>
            </Box>
          </Stack>

          {!loading && !error && gin && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
            >
              <Chip
                size="medium"
                color={statusChip.color}
                label={statusChip.label}
                variant="soft"
              />
              {showNoWorkflowWarning ? (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Iconify icon="solar:danger-triangle-bold-duotone" width={16} />}
                  onClick={() =>
                    toast.warning(NO_WORKFLOW_LEVEL_MESSAGE, {
                      duration: 8000,
                      description: 'Approval Workflow not configured',
                    })
                  }
                >
                  No Workflow
                </Button>
              ) : null}
              {workflowEnabled && wfInfo?.canApprove ? (
                <Button
                  variant="contained"
                  color="success"
                  disabled={decisionSubmitting}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                  onClick={handleApproveRequest}
                >
                  {moduleConfig.approveActionLabel}
                </Button>
              ) : null}
              {workflowEnabled && wfInfo?.canIssue ? (
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={decisionSubmitting}
                  startIcon={<Iconify icon="solar:delivery-bold" />}
                  onClick={handleIssueRequest}
                >
                  {moduleConfig.issueActionLabel || 'Issue'}
                </Button>
              ) : null}
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:printer-bold" />}
                onClick={handlePrintGIN}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
                disabled={downloadingChallan}
                onClick={handleDownloadChallan}
              >
                {downloadingChallan ? 'Preparing Challan...' : 'Download Challan'}
              </Button>
              {gin?.status === 'Issued' && (
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<Iconify icon="solar:document-bold-duotone" />}
                  disabled={downloadingGatePass}
                  onClick={handleDownloadGatePass}
                >
                  {downloadingGatePass ? 'Preparing...' : 'Gate Pass'}
                </Button>
              )}
              {canModifyDocument ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="solar:pen-bold" />}
                    onClick={() => router.push(moduleConfig.editPath(ginId))}
                  >
                    {moduleConfig.editLabel}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                    onClick={confirm.onTrue}
                  >
                    {moduleConfig.deleteLabel}
                  </Button>
                </>
              ) : null}
            </Stack>
          )}
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={320} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {moduleConfig.detailLoadError}
          </Alert>
        )}

        {!loading && !error && gin && (
          <Stack spacing={3}>
            {workflowEnabled && !isIssued ? (
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                  alignItems={{ md: 'center' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                      Approval Workflow
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Review approval progress, next approver, and pending users for this GIN.
                    </Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <GinApprovalInfo wfInfo={wfInfo} />
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {showNoWorkflowWarning ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<Iconify icon="solar:danger-triangle-bold-duotone" width={14} />}
                        onClick={() =>
                          toast.warning(NO_WORKFLOW_LEVEL_MESSAGE, {
                            duration: 8000,
                            description: 'Approval Workflow not configured',
                          })
                        }
                      >
                        No Workflow
                      </Button>
                    ) : null}
                    {wfInfo?.canApprove ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
                        onClick={handleApproveRequest}
                        disabled={decisionSubmitting}
                      >
                        {moduleConfig.approveActionLabel}
                      </Button>
                    ) : null}
                    {wfInfo?.canIssue ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<Iconify icon="solar:delivery-bold" width={16} />}
                        onClick={handleIssueRequest}
                        disabled={decisionSubmitting}
                      >
                        {moduleConfig.issueActionLabel || 'Issue'}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Card>
            ) : null}

            <Card
              sx={{
                p: 3.5,
                borderRadius: 4,
                color: 'common.white',
                background: 'linear-gradient(145deg, #0f172a 0%, #1d4ed8 42%, #0891b2 100%)',
                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>
                      {moduleConfig.singularTitle} snapshot
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                      {gin.gin_number}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1, maxWidth: 760 }}>
                      {showsIssueToField
                        ? `${moduleConfig.issueFromLabel} ${gin.issue_from || moduleConfig.issueFromFallback} to ${gin.issued_to || moduleConfig.issueToFallback}`
                        : `${moduleConfig.issueFromLabel} ${gin.issue_from || moduleConfig.issueFromFallback}`}
                      {gin.department ? ` • ${gin.department}` : ''}
                      {gin.project ? ` • ${gin.project}` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1.25, maxWidth: 760 }}>
                      {gin.purpose || 'No purpose was recorded for this document.'}
                    </Typography>
                  </Box>

                  <Stack spacing={1.25} alignItems={{ lg: 'flex-end' }}>
                    <Chip
                      color={statusChip.color}
                      label={statusChip.label}
                      size="medium"
                      variant="filled"
                    />
                    {workflowEnabled && wfInfo?.approvalProgress ? (
                      <Chip
                        label={`Approval ${wfInfo.approvalProgress}`}
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'common.white' }}
                      />
                    ) : (
                      <Chip
                        label={`Approval ${gin.approval_level || 0}/${gin.total_levels || 1}`}
                        sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'common.white' }}
                      />
                    )}
                    <Typography variant="body2" sx={{ opacity: 0.84 }}>
                      {latestTransitionLabel}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {latestTransitionActor}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricPanel
                      label="Line Items"
                      value={formatNumber(lineItemMetrics.items)}
                      helper="Instant API item count"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricPanel
                      label="Issued Qty Total"
                      value={formatNumber(lineItemMetrics.issued)}
                      helper="Issued quantity across all lines"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricPanel
                      label="Current Stock Now"
                      value={formatNumber(lineItemMetrics.current)}
                      helper="Sum of line-level current quantity"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricPanel
                      label="Document Value"
                      value={formatCurrency(gin.total_value)}
                      helper="Total issued value from the document"
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Document Context
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {usesOfficeParties
                        ? 'Primary routing, issuing office/warehouse, destination project, and approval context from the live document payload.'
                        : 'Primary routing, warehouse linkage, ownership, and approval context from the live document payload.'}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField
                          label={moduleConfig.issueFromLabel}
                          value={gin.issue_from || moduleConfig.issueFromFallback}
                        />
                      </Grid>
                      {showsIssueToField && (
                        <Grid size={{ xs: 12, md: 3 }}>
                          <DetailField
                            label={moduleConfig.issueToLabel}
                            value={gin.issued_to || moduleConfig.issueToFallback}
                          />
                        </Grid>
                      )}
                      {!usesOfficeParties && (
                        <Grid size={{ xs: 12, md: 3 }}>
                          <DetailField label="Linked Warehouse" value={gin.warehouse_name} />
                        </Grid>
                      )}
                      {usesOfficeParties && gin.office_location_name && (
                        <Grid size={{ xs: 12, md: 3 }}>
                          <DetailField
                            label="Issue Location"
                            value={gin.office_location_name}
                            helper={
                              gin.office_location_type
                                ? `Type: ${gin.office_location_type}`
                                : undefined
                            }
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Issue Date" value={formatDate(gin.issue_date)} />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Department" value={gin.department} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Project" value={gin.project} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Requested By" value={requestedByLabel} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Approved By" value={approvedByLabel} />
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField
                          label="Approval Flow"
                          value={
                            workflowEnabled && wfInfo?.approvalProgress
                              ? wfInfo.approvalProgress
                              : `${gin.approval_level || 0}/${gin.total_levels || 1}`
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Created At" value={formatDateTime(gin.created_at)} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Updated At" value={formatDateTime(gin.updated_at)} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <DetailField label="Latest Transition" value={latestTransitionLabel} />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Purpose
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="#0f172a"
                        sx={{ mt: 0.75 }}
                      >
                        {gin.purpose || 'No purpose was captured for this document.'}
                      </Typography>
                    </Box>
                  </Card>

                  <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>
                        {moduleConfig.lineItemsTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Requested, issued, current stock, remarks, and line value pulled directly
                        from the live line-item payload.
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell>Item</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Requested</TableCell>
                            <TableCell align="right">Issued</TableCell>
                            {hasCurrentStockColumn && (
                              <TableCell align="center">Current Stock</TableCell>
                            )}
                            <TableCell>Unit</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Line Value</TableCell>
                            <TableCell>Remarks</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lineItems.map((line) => {
                            const stockChip = getStockChipProps(line.item_current_quantity);
                            const lineValue =
                              Number(line.issued_qty || 0) * Number(line.unit_price || 0);

                            return (
                              <TableRow key={line.id} hover>
                                <TableCell>
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                                      {line.item_name || line.item_code || 'Unnamed item'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {line.item_code || 'Code not recorded'} • Line #{line.id}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack spacing={0.35}>
                                    <Typography variant="body2" color="#0f172a">
                                      {line.product_name || 'Unlinked product'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Product ID #{line.product || 'N/A'}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  {formatNumber(line.requested_qty)}
                                </TableCell>
                                <TableCell align="right">{formatNumber(line.issued_qty)}</TableCell>
                                {hasCurrentStockColumn && (
                                  <TableCell align="center">
                                    <Stack spacing={0.75} alignItems="center">
                                      <Chip
                                        size="small"
                                        color={stockChip.color}
                                        label={stockChip.label}
                                        variant="soft"
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {formatNumber(line.item_current_quantity)}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                )}
                                <TableCell>{line.unit || 'N/A'}</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(line.unit_price)}
                                </TableCell>
                                <TableCell align="right">{formatCurrency(lineValue)}</TableCell>
                                <TableCell>{line.remarks || 'No remarks'}</TableCell>
                              </TableRow>
                            );
                          })}

                          {!lineItems.length && (
                            <TableRow>
                              <TableCell
                                colSpan={hasCurrentStockColumn ? 9 : 8}
                                align="center"
                                sx={{ py: 6 }}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  {moduleConfig.noLineItemsDescription}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {!!lineItems.length && (
                      <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc' }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, md: 3 }}>
                            <DetailField
                              label="Line Items"
                              value={formatNumber(lineItemMetrics.items)}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 3 }}>
                            <DetailField
                              label="Requested Qty"
                              value={formatNumber(lineItemMetrics.requested)}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 3 }}>
                            <DetailField
                              label="Issued Qty"
                              value={formatNumber(lineItemMetrics.issued)}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 3 }}>
                            <DetailField
                              label="Current Stock Now"
                              value={formatNumber(lineItemMetrics.current)}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 3 }}>
                            <DetailField
                              label="Document Value"
                              value={formatCurrency(gin.total_value)}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Card>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  {workflowEnabled && wfInfo?.matchedLevel ? (
                    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                      <GinApprovalSummary wfInfo={wfInfo} />
                    </Card>
                  ) : null}

                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Status History
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Lifecycle transitions captured in `status_log` for this GIN.
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {statusLogEntries.length ? (
                      <Stack>
                        {statusLogEntries.map((entry, index) => (
                          <StatusHistoryItem
                            key={`${entry.gin_code || gin.gin_number}-${index}-${entry.status_to}`}
                            entry={entry}
                            isLast={index === statusLogEntries.length - 1}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        No status history has been recorded for this document yet.
                      </Alert>
                    )}
                  </Card>

                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      System Snapshot
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      Raw identifiers and linkage values carried by the current API response.
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                        <DetailField
                          label="Document ID"
                          value={String(gin.id)}
                          helper="Primary GIN record id"
                        />
                      </Grid>
                      {!usesOfficeParties && (
                        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                          <DetailField
                            label="Warehouse ID"
                            value={gin.warehouse ? String(gin.warehouse) : 'Not linked'}
                            helper={gin.warehouse_name || 'Warehouse name unavailable'}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                        <DetailField
                          label="Requested By ID"
                          value={gin.requested_by ? String(gin.requested_by) : 'Not assigned'}
                          helper={requestedByLabel}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                        <DetailField
                          label="Approved By ID"
                          value={gin.approved_by ? String(gin.approved_by) : 'Not assigned'}
                          helper={approvedByLabel}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={moduleConfig.deleteTitle}
        content={moduleConfig.deleteContent}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />

      <GinDecisionDialog
        open={Boolean(decisionDialog)}
        onClose={() => {
          if (!decisionSubmitting) {
            setDecisionDialog(null);
          }
        }}
        decisionDialog={decisionDialog}
        decisionSubmitting={decisionSubmitting}
        moduleConfig={moduleConfig}
        workflowEnabled={workflowEnabled}
        decisionWorkflowInfo={decisionWorkflowInfo}
        showsIssueToField={showsIssueToField}
        usesOfficeParties={usesOfficeParties}
        onDecision={handleDecision}
        onLineItemChange={handleDecisionLineItemChange}
        onTransportChange={handleTransportChange}
      />
    </Box>
  );
}
