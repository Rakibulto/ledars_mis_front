export function normalizeCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function normalizeBooleanValue(value) {
  return value === true || value === 'true';
}

export function createChecklistItem() {
  return { item: '', mandatory: true };
}

export function normalizeChecklistEntries(checklist) {
  if (!Array.isArray(checklist)) {
    return [];
  }

  return checklist
    .map((entry) => {
      if (typeof entry === 'string') {
        return { item: entry.trim(), mandatory: false };
      }

      return {
        item: String(entry?.item || '').trim(),
        mandatory: Boolean(entry?.mandatory),
      };
    })
    .filter((entry) => entry.item);
}

export function buildChecklistFormItems(checklist) {
  const items = normalizeChecklistEntries(checklist);

  return items.length ? items : [createChecklistItem()];
}

export function serializeChecklistForPayload(checklist) {
  return normalizeChecklistEntries(checklist);
}

export function getTemplateChecklistCount(template) {
  if (typeof template?.checklist_count === 'number') {
    return template.checklist_count;
  }

  return normalizeChecklistEntries(template?.checklist).length;
}

export function getTemplateMandatoryCount(template) {
  if (typeof template?.mandatory_item_count === 'number') {
    return template.mandatory_item_count;
  }

  return normalizeChecklistEntries(template?.checklist).filter((entry) => entry.mandatory).length;
}

export function getTemplateOptionalCount(template) {
  if (typeof template?.optional_item_count === 'number') {
    return template.optional_item_count;
  }

  return Math.max(getTemplateChecklistCount(template) - getTemplateMandatoryCount(template), 0);
}

export function getChecklistPreview(checklist, limit = 2) {
  const labels = normalizeChecklistEntries(checklist).map((entry) => entry.item);

  if (!labels.length) {
    return 'No checklist items configured';
  }

  const preview = labels.slice(0, limit).join(', ');

  return labels.length > limit ? `${preview}, ...` : preview;
}

export function getTemplateNarrative(template) {
  const checklistCount = getTemplateChecklistCount(template);
  const mandatoryCount = getTemplateMandatoryCount(template);

  if (!template?.is_active) {
    return 'This template is inactive. Keep it out of live inspections until the checklist is ready and the status is switched back to active.';
  }

  if (!checklistCount) {
    return 'Add at least one checklist step before assigning this template to quality inspections.';
  }

  if (!mandatoryCount) {
    return 'No mandatory steps are defined yet. Confirm whether core release criteria should be marked as required.';
  }

  if (checklistCount <= 2) {
    return 'This checklist is very short. Review whether it covers the minimum inspection evidence your warehouse process needs.';
  }

  return 'The template is ready for live use. Keep checklist steps aligned with the category and update them when control requirements change.';
}
