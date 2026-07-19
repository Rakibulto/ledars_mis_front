'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

function getDefaultWorkItemDate(plan, index) {
  const baseDate = dayjs(plan?.start_date || plan?.end_date || new Date());

  if (!baseDate.isValid()) {
    return null;
  }

  return baseDate.add(index, 'day').format('YYYY-MM-DD');
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function buildFileQueryString(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function parseDownloadFileName(headers, fallbackName) {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);

  if (match?.[1]) {
    return decodeURIComponent(match[1].replace(/"/g, '').trim());
  }

  return fallbackName;
}

function triggerBrowserDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function extractAttachmentFileName(value) {
  if (!value) return '';

  const cleanedValue = decodeURIComponent(String(value)).split('?')[0].split('#')[0];
  const lastSegment = cleanedValue.split('/').pop()?.split('\\').pop() || '';

  return lastSegment.trim();
}

function getMeaningfulAttachmentName(attachment) {
  const preferredNames = [attachment?.original_name, attachment?.file_name, attachment?.name]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => value.toLowerCase() !== 'attachment');

  if (preferredNames.length) {
    return preferredNames[0];
  }

  return extractAttachmentFileName(attachment?.file_url || attachment?.file || '');
}

export function normalizePlanAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') return null;

      const resolvedFileName = getMeaningfulAttachmentName(attachment);

      return {
        id: attachment.id || attachment.key || null,
        plan: attachment.plan || attachment.plan_id || null,
        workItem: attachment.work_item || attachment.workItem || null,
        file: attachment.file || attachment.file_url || '',
        fileUrl: attachment.file_url || attachment.file || '',
        fileName: resolvedFileName || 'Attachment',
        fileSize: Number(attachment.file_size || 0),
        originalName: resolvedFileName || '',
        uploadedBy: attachment.uploaded_by
          ? {
              id: attachment.uploaded_by.id || null,
              username:
                attachment.uploaded_by.username || attachment.uploaded_by.name || 'Unknown user',
            }
          : null,
        createdAt: attachment.created_at || null,
        isDraft: Boolean(attachment.isDraft),
        fileObject: attachment.fileObject || null,
      };
    })
    .filter(Boolean);
}

export function normalizeAssignedUsers(users) {
  if (!Array.isArray(users)) return [];

  return users
    .map((user) => {
      if (typeof user === 'string') {
        return { id: user, username: user };
      }

      if (user && typeof user === 'object') {
        return {
          id: user.id || user.username,
          username: user.username || user.name || user.full_name || 'Unknown user',
        };
      }

      return null;
    })
    .filter(Boolean);
}

export function normalizeApprovalUser(user) {
  if (!user || typeof user !== 'object') return null;

  return {
    id: user.id || null,
    username: user.username || user.name || 'Unknown user',
  };
}

function normalizeExpenseItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: item.id || null,
    title: item.title || `Item ${index + 1}`,
    description: item.description || '',
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || item.unitPrice || 0),
    lineTotal: Number(item.line_total || item.lineTotal || 0),
    sortOrder: item.sort_order || item.sortOrder || index + 1,
  }));
}

function normalizeProjectMaterials(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: item.id || null,
    title: item.title || '',
    category: item.category || '',
    description: item.description || '',
    unit: item.unit || '',
    quantity: Number(item.quantity || 0),
    estimatedUnitCost: Number(item.estimated_unit_cost || item.estimatedUnitCost || 0),
    estimatedTotalCost: Number(item.estimated_total_cost || item.estimatedTotalCost || 0),
    preferredVendor: item.preferred_vendor || item.preferredVendor || '',
    requiredBy: item.required_by || item.requiredBy || '',
    notes: item.notes || '',
    sortOrder: item.sort_order || item.sortOrder || index + 1,
    planId: item.plan?.id || item.plan_id || null,
    planSerialNo: item.plan?.serial_no || item.plan_serial_no || null,
    planTitle: item.plan?.title || '',
  }));
}

function normalizeExpense(rawExpense) {
  const items = normalizeExpenseItems(rawExpense?.items);
  const totalAmount = Number(
    rawExpense?.total_amount || items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
  );

  return {
    id: rawExpense?.id || null,
    invoiceNumber: rawExpense?.invoice_number || '',
    title: rawExpense?.title || 'Untitled expense',
    description: rawExpense?.description || '',
    vendorName: rawExpense?.vendor_name || '',
    expenseDate: rawExpense?.expense_date || '',
    currency: rawExpense?.currency || 'BDT',
    status: rawExpense?.status || 'Draft',
    totalAmount,
    projectId: rawExpense?.project_id || rawExpense?.project?.id || null,
    projectTitle: rawExpense?.project_title || rawExpense?.project?.title || '—',
    planId: rawExpense?.plan_id || rawExpense?.plan?.id || null,
    planTitle: rawExpense?.plan_title || rawExpense?.plan?.title || '',
    items,
    submittedAt: rawExpense?.submitted_at || null,
    approvedAt: rawExpense?.approved_at || null,
    paidAt: rawExpense?.paid_at || null,
    approvedBy: normalizeApprovalUser(rawExpense?.approved_by),
    createdBy: normalizeApprovalUser(rawExpense?.created_by),
    createdAt: rawExpense?.created_at || null,
    updatedAt: rawExpense?.updated_at || null,
  };
}

function deriveProjectProgress(plans = [], fallbackStatus = 'Draft') {
  const normalizedPlans = Array.isArray(plans) ? plans : [];
  const totalPlans = normalizedPlans.length;

  const planCounts = normalizedPlans.reduce(
    (accumulator, plan) => {
      const status = plan?.status || 'Pending';

      if (status === 'Completed') accumulator.completed += 1;
      else if (status === 'On Hold') accumulator.onHold += 1;
      else if (status === 'In Progress' || status === 'Active') accumulator.inProgress += 1;
      else accumulator.pending += 1;

      return accumulator;
    },
    { completed: 0, inProgress: 0, onHold: 0, pending: 0 }
  );

  const workItemCounts = normalizedPlans.reduce(
    (accumulator, plan) => {
      normalizePlanWorkItems(plan.work_items, plan, plan.assigned_users || []).forEach((item) => {
        accumulator.total += 1;

        if (item.state === 'Done') accumulator.completed += 1;
        else if (item.state === 'Doing') accumulator.inProgress += 1;
        else accumulator.pending += 1;
      });

      return accumulator;
    },
    { total: 0, completed: 0, inProgress: 0, pending: 0 }
  );

  const totalPlanProgress = normalizedPlans.reduce((sum, plan) => {
    const planStatus = plan?.status || 'Pending';
    const planWorkItems = normalizePlanWorkItems(plan.work_items, plan, plan.assigned_users || []);

    if (planStatus === 'Completed') {
      return sum + 100;
    }

    if (planWorkItems.length) {
      const completedItems = planWorkItems.filter((item) => item.state === 'Done').length;
      return sum + Math.round((completedItems / planWorkItems.length) * 100);
    }

    if (planStatus === 'In Progress' || planStatus === 'Active') {
      return sum + 50;
    }

    return sum;
  }, 0);

  const progressPercent = totalPlans ? Math.round(totalPlanProgress / totalPlans) : 0;

  let derivedStatus = fallbackStatus || 'Draft';

  if (['Completed', 'Closed', 'On Hold', 'Planning', 'Draft'].includes(fallbackStatus)) {
    derivedStatus = fallbackStatus;
  } else if (!totalPlans) {
    derivedStatus = fallbackStatus || 'Draft';
  } else if (planCounts.completed === totalPlans) {
    derivedStatus = 'Completed';
  } else if (
    planCounts.onHold > 0 &&
    planCounts.inProgress === 0 &&
    workItemCounts.inProgress === 0
  ) {
    derivedStatus = 'On Hold';
  } else if (
    planCounts.inProgress > 0 ||
    workItemCounts.inProgress > 0 ||
    planCounts.completed > 0 ||
    workItemCounts.completed > 0
  ) {
    derivedStatus = 'Active';
  } else {
    derivedStatus = 'Planning';
  }

  const statusSummary = totalPlans
    ? `${planCounts.completed}/${totalPlans} steps complete • ${progressPercent}% done`
    : 'No roadmap steps yet';

  const statusDetailParts = [];

  if (workItemCounts.total) {
    statusDetailParts.push(`${workItemCounts.completed}/${workItemCounts.total} work items done`);
    if (workItemCounts.inProgress)
      statusDetailParts.push(`${workItemCounts.inProgress} in progress`);
    if (planCounts.onHold) statusDetailParts.push(`${planCounts.onHold} on hold`);
    else if (workItemCounts.pending) statusDetailParts.push(`${workItemCounts.pending} pending`);
  } else if (totalPlans) {
    if (planCounts.inProgress)
      statusDetailParts.push(
        `${planCounts.inProgress} active step${planCounts.inProgress > 1 ? 's' : ''}`
      );
    if (planCounts.onHold) statusDetailParts.push(`${planCounts.onHold} on hold`);
    if (planCounts.pending) statusDetailParts.push(`${planCounts.pending} pending`);
  }

  return {
    derivedStatus,
    progressPercent,
    planCounts,
    workItemCounts,
    statusSummary,
    statusDetail: statusDetailParts.join(' • ') || statusSummary,
  };
}

export function buildDefaultPlanWorkItems(plan, assignedUsers = []) {
  const primaryAssignee = assignedUsers[0] || null;
  const isCompleted = plan.status === 'Completed';
  const isOnHold = plan.status === 'On Hold';

  return [
    {
      id: null,
      title: `Review scope and expected output for ${plan.title || 'this task'}`,
      state: isCompleted ? 'Done' : isOnHold ? 'Todo' : 'Doing',
      notes: '',
      issues: '',
      sort_order: 1,
      scheduled_date: getDefaultWorkItemDate(plan, 0),
      scheduled_end_date: null,
      completed_at: null,
      assigned_to: primaryAssignee,
      isDemo: true,
    },
    {
      id: null,
      title: `Coordinate assigned work with ${primaryAssignee?.username || 'the assigned team member'}`,
      state: plan.status === 'Pending' || isOnHold ? 'Todo' : isCompleted ? 'Done' : 'Doing',
      notes: '',
      issues: '',
      sort_order: 2,
      scheduled_date: getDefaultWorkItemDate(plan, 1),
      scheduled_end_date: null,
      completed_at: null,
      assigned_to: primaryAssignee,
      isDemo: true,
    },
    {
      id: null,
      title: 'Submit status update, evidence, and follow-up note',
      state: isCompleted ? 'Done' : 'Todo',
      notes: '',
      issues: '',
      sort_order: 3,
      scheduled_date: getDefaultWorkItemDate(plan, 2),
      scheduled_end_date: null,
      completed_at: null,
      assigned_to: primaryAssignee,
      isDemo: true,
    },
  ];
}

export function normalizePlanWorkItems(workItems, plan = {}, assignedUsers = []) {
  if (!Array.isArray(workItems) || !workItems.length) {
    return [];
  }

  return workItems.map((item, index) => ({
    id: item.id || null,
    clientKey: item.clientKey || item.key || null,
    title: item.title || `Work item ${index + 1}`,
    state: item.state || 'Todo',
    notes: item.notes || '',
    issues: item.issues || '',
    sort_order: item.sort_order || index + 1,
    scheduled_date: item.scheduled_date || getDefaultWorkItemDate(plan, index),
    scheduled_end_date: item.scheduled_end_date || null,
    completed_at: item.completed_at || null,
    approval_status: item.approval_status || 'Pending Approval',
    approved_by: normalizeApprovalUser(item.approved_by),
    approved_at: item.approved_at || null,
    approvalStatus: item.approval_status || 'Pending Approval',
    approvedBy: normalizeApprovalUser(item.approved_by),
    approvedAt: item.approved_at || null,
    assigned_to: item.assigned_to
      ? {
          id: item.assigned_to.id || item.assigned_to.username,
          username: item.assigned_to.username || item.assigned_to.name || 'Unknown user',
        }
      : null,
    attachments: normalizePlanAttachments(item.attachments),
    pendingFiles: Array.isArray(item.pendingFiles) ? item.pendingFiles : [],
    isDemo: false,
  }));
}

function enrichPlan(plan, index = 0) {
  const assignedUsers = normalizeAssignedUsers(plan.assigned_users);

  return {
    ...plan,
    assigned_users: assignedUsers,
    work_items: normalizePlanWorkItems(plan.work_items, plan, assignedUsers),
    attachments: normalizePlanAttachments(plan.attachments),
    approval_status: plan.approval_status || 'Pending Approval',
    approved_by: normalizeApprovalUser(plan.approved_by),
    approved_at: plan.approved_at || null,
    duration_days: Number(plan.duration_days || 0),
    serial_no: plan.serial_no || index + 1,
  };
}

function enrichProject(raw) {
  const plans = Array.isArray(raw.plans)
    ? raw.plans.map((plan, index) => enrichPlan(plan, index))
    : [];
  const materials = normalizeProjectMaterials(raw.materials);
  const progress = deriveProjectProgress(plans, raw.status);

  return {
    ...raw,
    budgetAmount: Number(raw.budget_amount || 0),
    donorName: raw.donor_name || '—',
    projectManagerName: raw.project_manager_name || '—',
    assignedUsersText: (raw.assigned_users || []).map((user) => user.username).join(', '),
    plans,
    plansCount: plans.length,
    derivedStatus: progress.derivedStatus,
    progressPercent: progress.progressPercent,
    planStatusCounts: progress.planCounts,
    workItemStatusCounts: progress.workItemCounts,
    progressSummary: progress.statusSummary,
    progressDetail: progress.statusDetail,
    materials,
    materialsCount: materials.length,
    materialsEstimatedTotal: materials.reduce(
      (sum, item) => sum + Number(item.estimatedTotalCost || 0),
      0
    ),
    materialsExpenseId: raw.materials_expense_id || null,
    materialsExpenseInvoiceNumber: raw.materials_expense_invoice_number || '',
  };
}

export function flattenProjectTasks(projects) {
  return projects.flatMap((project) =>
    (project.plans || []).map((plan, index) => {
      const assignedUsers = normalizeAssignedUsers(plan.assigned_users);
      const workItems = normalizePlanWorkItems(plan.work_items, plan, assignedUsers);
      const workItemsWithRemarks = workItems.filter((item) => String(item.notes || '').trim());
      const latestRemarkItem = workItemsWithRemarks.length
        ? [...workItemsWithRemarks].sort(
            (left, right) => (right.sort_order || 0) - (left.sort_order || 0)
          )[0]
        : null;

      return {
        id: plan.id || `${project.id}-${index + 1}`,
        serialNo: plan.serial_no || index + 1,
        title: plan.title || 'Untitled Task',
        description: plan.description || '',
        status: plan.status || 'Pending',
        approvalStatus: plan.approval_status || 'Pending Approval',
        approvedBy: normalizeApprovalUser(plan.approved_by),
        approvedAt: plan.approved_at || null,
        durationDays: Number(plan.duration_days || 0),
        startDate: plan.start_date || '',
        endDate: plan.end_date || '',
        assignedUsers,
        workItems,
        attachments: normalizePlanAttachments(plan.attachments),
        remarksCount: workItemsWithRemarks.length,
        latestRemark: latestRemarkItem?.notes || '',
        latestRemarkBy: latestRemarkItem?.assigned_to?.username || 'Assigned user',
        remarksSearchText: workItemsWithRemarks.map((item) => item.notes).join(' '),
        assignedUsersText: assignedUsers.length
          ? assignedUsers.map((user) => user.username).join(', ')
          : 'Unassigned',
        projectId: project.id,
        projectTitle: project.title,
        projectCode: project.code,
        projectStatus: project.status,
      };
    })
  );
}

export function buildProjectManagementOverview(projects = []) {
  const projectList = Array.isArray(projects) ? projects : [];
  const today = dayjs().endOf('day');

  const base = {
    totalProjects: projectList.length,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    planningProjects: 0,
    pendingProjects: 0,
    closedProjects: 0,
    totalBudget: 0,
    totalPlans: 0,
    completedPlans: 0,
    inProgressPlans: 0,
    onHoldPlans: 0,
    pendingPlans: 0,
    totalWorkItems: 0,
    completedWorkItems: 0,
    inProgressWorkItems: 0,
    pendingWorkItems: 0,
    overduePlans: 0,
    overdueWorkItems: 0,
    unassignedPlans: 0,
    recentProjects: [],
    projectProgressRows: [],
    donorRows: [],
    priorityActions: [],
    statusDistribution: [],
  };

  const donorBudgetMap = new Map();

  const overview = projectList.reduce((accumulator, project, index) => {
    const derivedStatus = project.derivedStatus || project.status || 'Draft';
    const plans = Array.isArray(project.plans) ? project.plans : [];
    const projectOverduePlans = plans.filter(
      (plan) =>
        plan?.end_date && plan.status !== 'Completed' && dayjs(plan.end_date).isBefore(today, 'day')
    ).length;

    const projectWorkItems = plans.flatMap((plan) =>
      normalizePlanWorkItems(plan.work_items, plan, plan.assigned_users || [])
    );

    const projectCompletedPlans = plans.filter((plan) => plan.status === 'Completed').length;
    const projectInProgressPlans = plans.filter(
      (plan) => plan.status === 'In Progress' || plan.status === 'Active'
    ).length;
    const projectOnHoldPlans = plans.filter((plan) => plan.status === 'On Hold').length;
    const projectPendingPlans = plans.filter(
      (plan) => !['Completed', 'In Progress', 'Active', 'On Hold'].includes(plan.status)
    ).length;

    const projectCompletedWorkItems = projectWorkItems.filter(
      (item) => item.state === 'Done'
    ).length;
    const projectInProgressWorkItems = projectWorkItems.filter(
      (item) => item.state === 'Doing'
    ).length;
    const projectPendingWorkItems = projectWorkItems.filter(
      (item) => item.state !== 'Done' && item.state !== 'Doing'
    ).length;
    const projectOverdueWorkItems = projectWorkItems.filter(
      (item) =>
        item?.scheduled_date &&
        item.state !== 'Done' &&
        dayjs(item.scheduled_date).isBefore(today, 'day')
    ).length;
    const projectUnassignedPlans = plans.filter(
      (plan) => !Array.isArray(plan.assigned_users) || !plan.assigned_users.length
    ).length;

    if (derivedStatus === 'Completed') accumulator.completedProjects += 1;
    else if (derivedStatus === 'Active') accumulator.activeProjects += 1;
    else if (derivedStatus === 'On Hold') accumulator.onHoldProjects += 1;
    else if (derivedStatus === 'Closed') accumulator.closedProjects += 1;
    else {
      accumulator.planningProjects += 1;
      accumulator.pendingProjects += 1;
    }

    accumulator.totalBudget += Number(project.budgetAmount || 0);
    accumulator.totalPlans += plans.length;
    accumulator.completedPlans += projectCompletedPlans;
    accumulator.inProgressPlans += projectInProgressPlans;
    accumulator.onHoldPlans += projectOnHoldPlans;
    accumulator.pendingPlans += projectPendingPlans;
    accumulator.totalWorkItems += projectWorkItems.length;
    accumulator.completedWorkItems += projectCompletedWorkItems;
    accumulator.inProgressWorkItems += projectInProgressWorkItems;
    accumulator.pendingWorkItems += projectPendingWorkItems;
    accumulator.overduePlans += projectOverduePlans;
    accumulator.overdueWorkItems += projectOverdueWorkItems;
    accumulator.unassignedPlans += projectUnassignedPlans;

    accumulator.projectProgressRows.push({
      id: project.id,
      title: project.title,
      donorName: project.donorName,
      projectManagerName: project.projectManagerName,
      budgetAmount: Number(project.budgetAmount || 0),
      derivedStatus,
      progressPercent: Number(project.progressPercent || 0),
      progressSummary: project.progressSummary || 'No progress summary',
      progressDetail: project.progressDetail || 'No detail available',
      plansCount: plans.length,
      completedPlans: projectCompletedPlans,
      totalWorkItems: projectWorkItems.length,
      completedWorkItems: projectCompletedWorkItems,
      overdueCount: projectOverduePlans + projectOverdueWorkItems,
      startDate: project.start_date || null,
      endDate: project.end_date || null,
      sortIndex: index,
    });

    if (index < 5) {
      accumulator.recentProjects.push({
        id: project.id,
        title: project.title,
        donorName: project.donorName,
        projectManagerName: project.projectManagerName,
        budgetAmount: Number(project.budgetAmount || 0),
        derivedStatus,
        progressPercent: Number(project.progressPercent || 0),
        progressSummary: project.progressSummary || 'No progress summary',
      });
    }

    if (project.donorName && project.donorName !== '—') {
      const existing = donorBudgetMap.get(project.donorName) || {
        donorName: project.donorName,
        projects: 0,
        budgetAmount: 0,
        completedProjects: 0,
        activeProjects: 0,
      };

      existing.projects += 1;
      existing.budgetAmount += Number(project.budgetAmount || 0);
      if (derivedStatus === 'Completed') existing.completedProjects += 1;
      if (derivedStatus === 'Active') existing.activeProjects += 1;
      donorBudgetMap.set(project.donorName, existing);
    }

    return accumulator;
  }, base);

  overview.projectCompletionRate = overview.totalProjects
    ? Math.round((overview.completedProjects / overview.totalProjects) * 100)
    : 0;
  overview.planCompletionRate = overview.totalPlans
    ? Math.round((overview.completedPlans / overview.totalPlans) * 100)
    : 0;
  overview.workItemCompletionRate = overview.totalWorkItems
    ? Math.round((overview.completedWorkItems / overview.totalWorkItems) * 100)
    : 0;

  overview.statusDistribution = [
    { label: 'Active', count: overview.activeProjects, color: 'success' },
    { label: 'Completed', count: overview.completedProjects, color: 'info' },
    { label: 'On Hold', count: overview.onHoldProjects, color: 'warning' },
    { label: 'Pending', count: overview.pendingProjects, color: 'default' },
  ].filter((item) => item.count > 0 || overview.totalProjects === 0);

  overview.projectProgressRows = overview.projectProgressRows
    .sort((left, right) => {
      if (right.progressPercent !== left.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }

      return left.sortIndex - right.sortIndex;
    })
    .slice(0, 8);

  overview.donorRows = Array.from(donorBudgetMap.values())
    .sort((left, right) => right.budgetAmount - left.budgetAmount)
    .slice(0, 6);

  if (overview.overdueWorkItems) {
    overview.priorityActions.push(
      `Resolve ${overview.overdueWorkItems} overdue work item${overview.overdueWorkItems > 1 ? 's' : ''} queued past schedule.`
    );
  }

  if (overview.onHoldProjects) {
    overview.priorityActions.push(
      `Review ${overview.onHoldProjects} on-hold project${overview.onHoldProjects > 1 ? 's' : ''} and confirm restart dates.`
    );
  }

  if (overview.unassignedPlans) {
    overview.priorityActions.push(
      `Assign owners to ${overview.unassignedPlans} roadmap step${overview.unassignedPlans > 1 ? 's' : ''} still unassigned.`
    );
  }

  if (overview.planningProjects) {
    overview.priorityActions.push(
      `Break down ${overview.planningProjects} planning project${overview.planningProjects > 1 ? 's' : ''} into active roadmap steps.`
    );
  }

  if (!overview.priorityActions.length) {
    overview.priorityActions.push(
      'Delivery portfolio looks healthy. Keep monitoring task approvals and upcoming schedules.'
    );
  }

  return overview;
}

function normalizeDashboardProjectRow(row = {}) {
  return {
    id: row.id || null,
    title: row.title || 'Untitled project',
    code: row.code || '',
    donorName: row.donorName || '—',
    projectManagerName: row.projectManagerName || 'Unassigned',
    budgetAmount: Number(row.budgetAmount || 0),
    currency: row.currency || 'BDT',
    derivedStatus: row.derivedStatus || 'Planning',
    progressPercent: Number(row.progressPercent || 0),
    progressSummary: row.progressSummary || 'No progress summary',
    progressDetail: row.progressDetail || 'No progress detail',
    plansCount: Number(row.plansCount || 0),
    completedPlans: Number(row.completedPlans || 0),
    totalWorkItems: Number(row.totalWorkItems || 0),
    completedWorkItems: Number(row.completedWorkItems || 0),
    overdueCount: Number(row.overdueCount || 0),
    startDate: row.startDate || null,
    endDate: row.endDate || null,
    updatedAt: row.updatedAt || null,
  };
}

function normalizeProjectManagementDashboard(rawOverview = {}) {
  return {
    totalProjects: Number(rawOverview.totalProjects || 0),
    activeProjects: Number(rawOverview.activeProjects || 0),
    completedProjects: Number(rawOverview.completedProjects || 0),
    onHoldProjects: Number(rawOverview.onHoldProjects || 0),
    planningProjects: Number(rawOverview.planningProjects || 0),
    pendingProjects: Number(rawOverview.pendingProjects || rawOverview.planningProjects || 0),
    closedProjects: Number(rawOverview.closedProjects || 0),
    totalBudget: Number(rawOverview.totalBudget || 0),
    totalPlans: Number(rawOverview.totalPlans || 0),
    completedPlans: Number(rawOverview.completedPlans || 0),
    inProgressPlans: Number(rawOverview.inProgressPlans || 0),
    onHoldPlans: Number(rawOverview.onHoldPlans || 0),
    pendingPlans: Number(rawOverview.pendingPlans || 0),
    totalWorkItems: Number(rawOverview.totalWorkItems || 0),
    completedWorkItems: Number(rawOverview.completedWorkItems || 0),
    inProgressWorkItems: Number(rawOverview.inProgressWorkItems || 0),
    pendingWorkItems: Number(rawOverview.pendingWorkItems || 0),
    overduePlans: Number(rawOverview.overduePlans || 0),
    overdueWorkItems: Number(rawOverview.overdueWorkItems || 0),
    unassignedPlans: Number(rawOverview.unassignedPlans || 0),
    projectCompletionRate: Number(rawOverview.projectCompletionRate || 0),
    planCompletionRate: Number(rawOverview.planCompletionRate || 0),
    workItemCompletionRate: Number(rawOverview.workItemCompletionRate || 0),
    totalTrackedAttachments: Number(rawOverview.totalTrackedAttachments || 0),
    recentProjects: Array.isArray(rawOverview.recentProjects)
      ? rawOverview.recentProjects.map(normalizeDashboardProjectRow)
      : [],
    projectProgressRows: Array.isArray(rawOverview.projectProgressRows)
      ? rawOverview.projectProgressRows.map(normalizeDashboardProjectRow)
      : [],
    donorRows: Array.isArray(rawOverview.donorRows)
      ? rawOverview.donorRows.map((row) => ({
          donorName: row.donorName || 'Unknown donor',
          projects: Number(row.projects || 0),
          budgetAmount: Number(row.budgetAmount || 0),
          completedProjects: Number(row.completedProjects || 0),
          activeProjects: Number(row.activeProjects || 0),
        }))
      : [],
    priorityActions: Array.isArray(rawOverview.priorityActions) ? rawOverview.priorityActions : [],
    statusDistribution: Array.isArray(rawOverview.statusDistribution)
      ? rawOverview.statusDistribution.map((row) => ({
          label: row.label || 'Unknown',
          count: Number(row.count || 0),
          color: row.color || 'default',
        }))
      : [],
    teamLoadRows: Array.isArray(rawOverview.teamLoadRows)
      ? rawOverview.teamLoadRows.map((row) => ({
          username: row.username || 'Unassigned',
          total: Number(row.total || 0),
          done: Number(row.done || 0),
          doing: Number(row.doing || 0),
          todo: Number(row.todo || 0),
          approved: Number(row.approved || 0),
          progress: Number(row.progress || 0),
        }))
      : [],
    timelineHealth: {
      onTrack: Number(rawOverview.timelineHealth?.onTrack || 0),
      atRisk: Number(rawOverview.timelineHealth?.atRisk || 0),
      overdue: Number(rawOverview.timelineHealth?.overdue || 0),
      blocked: Number(rawOverview.timelineHealth?.blocked || 0),
    },
    upcomingDeadlines: Array.isArray(rawOverview.upcomingDeadlines)
      ? rawOverview.upcomingDeadlines.map((row) => ({
          id: row.id || null,
          title: row.title || 'Untitled item',
          projectId: row.projectId || null,
          projectTitle: row.projectTitle || 'Untitled project',
          planId: row.planId || null,
          planTitle: row.planTitle || 'Untitled task',
          assignee: row.assignee || 'Unassigned',
          scheduledDate: row.scheduledDate || null,
          daysLeft: Number(row.daysLeft || 0),
          state: row.state || 'Todo',
        }))
      : [],
  };
}

export async function updateProjectManagementPlan(id, payload) {
  const { data } = await axiosInstance.patch(endpoints.projectManagements.planById(id), payload);

  await mutate(endpoints.projectManagements.planById(id));
  await mutate(`${endpoints.projectManagements.projects}?ordering=-created_at`);
  await mutate(endpoints.projectManagements.dashboard);

  if (data?.project_id) {
    await mutate(endpoints.projectManagements.projectById(data.project_id));
  }

  return data;
}

export async function approveProjectManagementWorkItem(
  id,
  { planId = null, projectId = null } = {}
) {
  const { data } = await axiosInstance.post(endpoints.projectManagements.approveWorkItem(id));

  await mutate(endpoints.projectManagements.workItemById(id));

  if (planId) {
    await mutate(endpoints.projectManagements.planById(planId));
  }

  await mutate(`${endpoints.projectManagements.projects}?ordering=-created_at`);
  await mutate(endpoints.projectManagements.dashboard);

  if (projectId) {
    await mutate(endpoints.projectManagements.projectById(projectId));
  }

  return data;
}

export async function approveProjectManagementPlan(id, projectId = null) {
  const { data } = await axiosInstance.post(endpoints.projectManagements.approvePlan(id));

  await mutate(endpoints.projectManagements.planById(id));
  await mutate(`${endpoints.projectManagements.projects}?ordering=-created_at`);
  await mutate(endpoints.projectManagements.dashboard);

  if (projectId) {
    await mutate(endpoints.projectManagements.projectById(projectId));
  }

  return data;
}

export async function uploadProjectManagementPlanAttachment(
  planId,
  file,
  projectId = null,
  workItemId = null
) {
  const formData = new FormData();
  formData.append('plan_id', planId);
  formData.append('file', file);
  if (workItemId) {
    formData.append('work_item_id', workItemId);
  }

  const { data } = await axiosInstance.post(endpoints.projectManagements.attachments, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  await mutate(endpoints.projectManagements.attachments);
  await mutate(`${endpoints.projectManagements.attachments}?plan=${planId}`);
  if (workItemId) {
    await mutate(`${endpoints.projectManagements.attachments}?work_item=${workItemId}`);
    await mutate(endpoints.projectManagements.workItemById(workItemId));
  }
  await mutate(endpoints.projectManagements.planById(planId));
  await mutate(`${endpoints.projectManagements.projects}?ordering=-created_at`);
  await mutate(endpoints.projectManagements.dashboard);

  if (projectId) {
    await mutate(endpoints.projectManagements.projectById(projectId));
  }

  return normalizePlanAttachments([data])[0] || data;
}

export async function deleteProjectManagementPlanAttachment(
  attachmentId,
  { planId = null, projectId = null } = {}
) {
  await axiosInstance.delete(endpoints.projectManagements.attachmentById(attachmentId));

  await mutate(endpoints.projectManagements.attachments);

  if (planId) {
    await mutate(`${endpoints.projectManagements.attachments}?plan=${planId}`);
    await mutate(endpoints.projectManagements.planById(planId));
  }

  await mutate(`${endpoints.projectManagements.projects}?ordering=-created_at`);
  await mutate(endpoints.projectManagements.dashboard);

  if (projectId) {
    await mutate(endpoints.projectManagements.projectById(projectId));
  }
}

export async function createProjectManagementExpense(payload) {
  const { data } = await axiosInstance.post(endpoints.projectManagements.expenses, payload);

  await mutate(`${endpoints.projectManagements.expenses}?ordering=-expense_date,-created_at`);
  return normalizeExpense(data);
}

export async function updateProjectManagementExpense(id, payload) {
  const { data } = await axiosInstance.patch(endpoints.projectManagements.expenseById(id), payload);

  await mutate(`${endpoints.projectManagements.expenses}?ordering=-expense_date,-created_at`);
  await mutate(endpoints.projectManagements.expenseById(id));
  return normalizeExpense(data);
}

export async function transitionProjectManagementExpense(id, status) {
  const { data } = await axiosInstance.post(endpoints.projectManagements.transitionExpense(id), {
    status,
  });

  await mutate(`${endpoints.projectManagements.expenses}?ordering=-expense_date,-created_at`);
  await mutate(endpoints.projectManagements.expenseById(id));
  return normalizeExpense(data);
}

export async function exportProjectManagementExpensePdf(id) {
  const response = await axiosInstance.get(endpoints.projectManagements.exportExpensePdf(id), {
    responseType: 'blob',
  });

  const fileName = parseDownloadFileName(response.headers, `expense-${id}.pdf`);
  triggerBrowserDownload(response.data, fileName);
}

export async function exportProjectManagementExpenseExcel(id) {
  const response = await axiosInstance.get(endpoints.projectManagements.exportExpenseExcel(id), {
    responseType: 'blob',
  });

  const fileName = parseDownloadFileName(response.headers, `expense-${id}.xlsx`);
  triggerBrowserDownload(response.data, fileName);
}

export async function exportProjectManagementExpensesExcel(filters = {}) {
  const query = buildFileQueryString(filters);
  const response = await axiosInstance.get(
    `${endpoints.projectManagements.exportExpensesExcel}${query}`,
    {
      responseType: 'blob',
    }
  );

  const fileName = parseDownloadFileName(response.headers, 'project-management-expenses.xlsx');
  triggerBrowserDownload(response.data, fileName);
}

export async function exportProjectManagementRoadmapExcel(id) {
  const response = await axiosInstance.get(
    endpoints.projectManagements.exportProjectRoadmapExcel(id),
    {
      responseType: 'blob',
    }
  );

  const fileName = parseDownloadFileName(response.headers, `project-${id}-roadmap.xlsx`);
  triggerBrowserDownload(response.data, fileName);
}

export function useProjectManagementsApi() {
  const projectsUrl = `${endpoints.projectManagements.projects}?ordering=-created_at`;
  const donorsUrl = `${endpoints.projectManagements.donors}?ordering=name`;
  const usersUrl = `${endpoints.auth.simpleUsers}?ordering=username`;
  const currenciesUrl = `${endpoints.projectManagements.currencies}?status=active&ordering=code`;

  const {
    data: rawProjects,
    isLoading: projectsLoading,
    error,
    isValidating,
  } = useSWR(projectsUrl, fetcher);
  const { data: rawDonors, isLoading: donorsLoading } = useSWR(donorsUrl, fetcher);
  const { data: rawUsers, isLoading: usersLoading } = useSWR(usersUrl, fetcher);
  const { data: rawCurrencies, isLoading: currenciesLoading } = useSWR(currenciesUrl, fetcher);

  const projects = useMemo(() => unwrapList(rawProjects).map(enrichProject), [rawProjects]);
  const tasks = useMemo(() => flattenProjectTasks(projects), [projects]);
  const overview = useMemo(() => buildProjectManagementOverview(projects), [projects]);
  const donors = useMemo(() => unwrapList(rawDonors), [rawDonors]);
  const users = useMemo(() => unwrapList(rawUsers), [rawUsers]);
  const currencies = useMemo(() => unwrapList(rawCurrencies), [rawCurrencies]);

  async function createProject(payload) {
    const { data } = await axiosInstance.post(endpoints.projectManagements.projects, payload);
    await mutate(projectsUrl);
    await mutate(endpoints.projectManagements.dashboard);
    return data;
  }

  async function updateProject(id, payload) {
    const { data } = await axiosInstance.patch(
      endpoints.projectManagements.projectById(id),
      payload
    );
    await mutate(projectsUrl);
    await mutate(endpoints.projectManagements.projectById(id));
    await mutate(endpoints.projectManagements.dashboard);
    return data;
  }

  async function deleteProject(id) {
    await axiosInstance.delete(endpoints.projectManagements.projectById(id));
    await mutate(projectsUrl);
    await mutate(endpoints.projectManagements.dashboard);
  }

  return {
    projects,
    tasks,
    overview,
    donors,
    users,
    currencies,
    isLoading: projectsLoading || donorsLoading || usersLoading || currenciesLoading,
    isValidating,
    error,
    actions: {
      createProject,
      updateProject,
      deleteProject,
    },
  };
}

export function useProjectManagementDashboard() {
  const { data, isLoading, error, isValidating } = useSWR(
    endpoints.projectManagements.dashboard,
    fetcher
  );

  const overview = useMemo(() => normalizeProjectManagementDashboard(data), [data]);

  return {
    overview,
    isLoading,
    error,
    isValidating,
  };
}

export function useProjectManagementExpenses() {
  const expensesUrl = `${endpoints.projectManagements.expenses}?ordering=-expense_date,-created_at`;
  const { data, isLoading, error, isValidating } = useSWR(expensesUrl, fetcher);

  const expenses = useMemo(() => unwrapList(data).map(normalizeExpense), [data]);
  const overview = useMemo(() => {
    const totals = expenses.reduce(
      (accumulator, expense) => {
        accumulator.total += 1;
        accumulator.totalAmount += Number(expense.totalAmount || 0);

        if (expense.status === 'Draft') accumulator.draft += 1;
        if (expense.status === 'Submitted') accumulator.submitted += 1;
        if (expense.status === 'Approved') accumulator.approved += 1;
        if (expense.status === 'Paid') accumulator.paid += 1;
        if (expense.status === 'Rejected') accumulator.rejected += 1;

        return accumulator;
      },
      {
        total: 0,
        totalAmount: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        paid: 0,
        rejected: 0,
      }
    );

    return totals;
  }, [expenses]);

  return {
    expenses,
    overview,
    isLoading,
    error,
    isValidating,
  };
}

export function useProjectManagementExpense(id) {
  const detailUrl = id ? endpoints.projectManagements.expenseById(id) : null;
  const listUrl = `${endpoints.projectManagements.expenses}?ordering=-expense_date,-created_at`;
  const {
    data: detailData,
    isLoading: detailLoading,
    error,
    isValidating,
  } = useSWR(detailUrl, fetcher);
  const { data: listData, isLoading: listLoading } = useSWR(listUrl, fetcher);

  const fallbackExpense = useMemo(() => {
    const items = unwrapList(listData);
    return items.find((item) => String(item.id) === String(id)) || null;
  }, [id, listData]);

  const resolvedExpense = detailData || fallbackExpense;
  const expense = useMemo(
    () => (resolvedExpense ? normalizeExpense(resolvedExpense) : null),
    [resolvedExpense]
  );

  return {
    expense,
    isLoading: detailLoading && listLoading,
    error,
    isValidating,
  };
}

export function useProjectManagementProject(id) {
  const projectsUrl = `${endpoints.projectManagements.projects}?ordering=-created_at`;
  const projectUrl = id ? endpoints.projectManagements.projectById(id) : null;
  const {
    data: detailData,
    isLoading: detailLoading,
    error,
    isValidating,
  } = useSWR(projectUrl, fetcher);
  const { data: listData, isLoading: listLoading } = useSWR(projectsUrl, fetcher);

  const fallbackProject = useMemo(() => {
    const items = unwrapList(listData);
    return items.find((item) => String(item.id) === String(id)) || null;
  }, [id, listData]);

  const resolvedProject = detailData || fallbackProject;
  const project = useMemo(
    () => (resolvedProject ? enrichProject(resolvedProject) : null),
    [resolvedProject]
  );

  return {
    project,
    isLoading: detailLoading && listLoading,
    error,
    isValidating,
  };
}

export function useProjectManagementTasks() {
  const { projects, isLoading, error, isValidating } = useProjectManagementsApi();

  const tasks = useMemo(() => flattenProjectTasks(projects), [projects]);

  return {
    tasks,
    projects,
    isLoading,
    error,
    isValidating,
  };
}

export function useProjectManagementTask(projectId, taskId) {
  const { projects, isLoading, error, isValidating } = useProjectManagementsApi();

  const task = useMemo(() => {
    const allTasks = flattenProjectTasks(projects);
    return (
      allTasks.find(
        (item) => String(item.projectId) === String(projectId) && String(item.id) === String(taskId)
      ) || null
    );
  }, [projectId, projects, taskId]);

  const project = useMemo(
    () => projects.find((item) => String(item.id) === String(projectId)) || null,
    [projectId, projects]
  );

  return {
    task,
    project,
    isLoading,
    error,
    isValidating,
  };
}
