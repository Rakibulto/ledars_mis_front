"use client";
import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetRequest } from "@/hooks/ledars-hook";
import axiosInstance, { endpoints } from "@/utils/axios";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: number;
  item_name: string;
  specification?: string;
  specifications?: string;
  quantity: number;
  unit: string;
  estimated_unit_price: string;
}

interface ComplianceRow {
  offered_spec: string;
  compliant: "Yes" | "Partial" | "No";
}

interface FinancialItem {
  unit_price: string;
}

interface FormValues {
  // Technical
  company_experience: string;
  methodology: string;
  delivery_lead_time_days: string;
  warranty_period: string;
  compliance: Record<string, ComplianceRow>; // keyed by String(line_item.id)
  // Financial
  financial: Record<string, FinancialItem>; // keyed by String(line_item.id)
  vat: string;
  ait: string;
  delivery_charge: string;
  quotation_validity_days: string;
  payment_terms: string;
  additional_remarks: string;
  // Documents
  documents: Record<string, FileList | null>; // keyed by doc name
  // Checklist (UI only)
  checklist: Record<string, boolean>;
  // Declaration
  declaration: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManualSubmitQuotation() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit_quotationId");
  const isEditMode = !!editId;
  const [activeSection, setActiveSection] = useState<"technical" | "financial">(
    "technical",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch RFQ ──────────────────────────────────────────────────────────────
  const { data: rfq, loading } = useGetRequest(
    id ? endpoints.procurement_management.rfq_by_id(id as string) : null,
  );

  // ─── Fetch existing submission (edit mode) ──────────────────────────────────
  const { data: existingSubmission, loading: submissionLoading } =
    useGetRequest(
      editId
        ? endpoints.procurement_management.vendor_rfq_submission_by_id(editId)
        : null,
    );

  const lineItems: LineItem[] = (rfq?.line_items ?? []).map((item: LineItem) => ({
    ...item,
    specification: item.specifications || item.specification || "",
  }));
  const requiredDocs: string[] = rfq?.required_documents ?? [];

  // ─── React Hook Form ────────────────────────────────────────────────────────
  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      company_experience: "",
      methodology: "",
      delivery_lead_time_days: "",
      warranty_period: "",
      compliance: {},
      financial: {},
      vat: "",
      ait: "",
      delivery_charge: "",
      quotation_validity_days: "",
      payment_terms: "100% after delivery & inspection",
      additional_remarks: "",
      documents: {},
      checklist: {},
      declaration: false,
    },
  });

  // ─── Pre-fill form when editing an existing draft ───────────────────────────
  useEffect(() => {
    // Wait until both data sources are fully loaded before filling
    if (!isEditMode || !existingSubmission || !rfq) return;

    const tp = existingSubmission.technical_proposal ?? {};
    const fp = existingSubmission.financial_proposal ?? {};

    // Compliance: key by String(line_item_id)
    const complianceMap: Record<string, ComplianceRow> = {};
    const complianceSource = Array.isArray(tp.compliance) ? tp.compliance : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    complianceSource.forEach((c: any) => {
      complianceMap[String(c.line_item_id)] = {
        offered_spec: c.offered_spec ?? "",
        compliant: c.compliant ?? "Yes",
      };
    });

    // Financial: key by String(line_item_id)
    const financialMap: Record<string, FinancialItem> = {};
    const financialItemsArr = Array.isArray(fp.items) ? fp.items : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    financialItemsArr.forEach((fi: any) => {
      financialMap[String(fi.line_item_id)] = {
        unit_price: String(fi.unit_price ?? ""),
      };
    });

    reset({
      company_experience: tp.company_experience ?? "",
      methodology: tp.methodology ?? "",
      // delivery_lead_time_days lives in financial_proposal, not top-level
      delivery_lead_time_days:
        fp.delivery_lead_time_days != null
          ? String(fp.delivery_lead_time_days)
          : "",
      warranty_period: existingSubmission.warranty_period ?? "",
      compliance: complianceMap,
      financial: financialMap,
      // Use != null to avoid String(null) = "null"
      vat: fp.vat != null ? String(fp.vat) : "",
      ait: fp.ait != null ? String(fp.ait) : "",
      delivery_charge:
        fp.delivery_charge != null ? String(fp.delivery_charge) : "",
      quotation_validity_days:
        fp.quotation_validity_days != null
          ? String(fp.quotation_validity_days)
          : "",
      payment_terms: fp.payment_terms ?? "100% after delivery & inspection",
      additional_remarks: existingSubmission.additional_remarks ?? "",
      // Files cannot be pre-loaded into <input type="file">, keep empty
      documents: {},
      checklist: {},
      // API returns a real boolean
      declaration: existingSubmission.declaration === true,
    });
    // Re-run whenever either data source finishes loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSubmission, rfq]);

  // ─── Computed totals via watch ───────────────────────────────────────────────
  const watchedFinancial = useWatch({ control, name: "financial" });
  const watchedVat = useWatch({ control, name: "vat" });
  const watchedAit = useWatch({ control, name: "ait" });
  const watchedDelivery = useWatch({ control, name: "delivery_charge" });
  const watchedDeclaration = useWatch({ control, name: "declaration" });
  const watchedExperience = useWatch({ control, name: "company_experience" });
  const watchedCompliance = useWatch({ control, name: "compliance" });
  const watchedDocuments = useWatch({ control, name: "documents" });
  const watchedValidity = useWatch({
    control,
    name: "quotation_validity_days",
  });

  // ─── Already-uploaded docs from existing submission (edit mode) ─────────────
  const existingDocNames = new Set<string>(
    isEditMode && Array.isArray(existingSubmission?.documents)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingSubmission.documents.map((d: any) => d.doc_name as string)
      : [],
  );

  // ─── Auto-checklist derived from real form values ────────────────────────────
  const autoChecklist = {
    technical_capability_statement: !!(
      watchedExperience && watchedExperience.trim().length > 0
    ),
    spec_compliance:
      lineItems.length === 0 ||
      lineItems.every(
        (item) => !!watchedCompliance?.[item.id]?.offered_spec?.trim(),
      ),
    documents_uploaded:
      requiredDocs.length === 0 ||
      requiredDocs.every((doc) => {
        // In edit mode, already-uploaded docs count as satisfied
        if (isEditMode && existingDocNames.has(doc)) return true;
        const fl = watchedDocuments?.[doc] as FileList | null | undefined;
        return !!(fl && fl[0]);
      }),
    financial_filled:
      lineItems.length === 0 ||
      lineItems.every((item) => {
        const price = parseFloat(
          watchedFinancial?.[item.id]?.unit_price || "0",
        );
        return price > 0;
      }),
    vat_delivery:
      watchedVat !== "" &&
      watchedVat !== undefined &&
      watchedDelivery !== "" &&
      watchedDelivery !== undefined &&
      watchedValidity !== "" &&
      watchedValidity !== undefined,
    declaration: !!watchedDeclaration,
  };

  const checklistItems: { key: keyof typeof autoChecklist; label: string }[] = [
    {
      key: "technical_capability_statement",
      label: "Technical capability statement",
    },
    { key: "spec_compliance", label: "Spec compliance table filled" },
    { key: "financial_filled", label: "Unit prices entered (financial)" },
    { key: "vat_delivery", label: "VAT / delivery / validity declared" },
    { key: "declaration", label: "Declaration accepted" },
  ];

  const allChecklistPassed = checklistItems.every(
    (item) => autoChecklist[item.key],
  );
  const completedCount = checklistItems.filter(
    (item) => autoChecklist[item.key],
  ).length;

  const subTotal = lineItems.reduce((acc, item) => {
    const price = parseFloat(watchedFinancial?.[item.id]?.unit_price || "0");
    return acc + price * item.quantity;
  }, 0);

  const grandTotal =
    subTotal +
    parseFloat(watchedVat || "0") +
    parseFloat(watchedAit || "0") +
    parseFloat(watchedDelivery || "0");

  // ─── Build FormData payload ──────────────────────────────────────────────────
  function buildFormData(data: FormValues, status: "draft" | "submitted") {
    const fd = new FormData();

    // ── RFQ Reference
    fd.append("rfq", String(rfq?.id ?? ""));
    fd.append("rfq_number", rfq?.rfq_number ?? "");
    fd.append("status", status);

    // ── Technical Proposal
    fd.append("company_experience", data.company_experience);
    fd.append("methodology", data.methodology);
    fd.append(
      "delivery_lead_time_days",
      data.delivery_lead_time_days ? String(data.delivery_lead_time_days) : "",
    );
    fd.append("warranty_period", data.warranty_period);

    // ── Compliance (JSON)
    const compliancePayload = lineItems.map((item) => ({
      line_item_id: item.id,
      item_name: item.item_name,
      required_spec: item.specification,
      offered_spec: data.compliance?.[item.id]?.offered_spec ?? "",
      compliant: data.compliance?.[item.id]?.compliant ?? "Yes",
    }));
    fd.append("compliance", JSON.stringify(compliancePayload));

    // ── Financial Items (JSON)
    const financialItems = lineItems.map((item) => {
      const unitPrice = parseFloat(
        data.financial?.[item.id]?.unit_price || "0",
      );
      return {
        line_item_id: item.id,
        item_name: item.item_name,
        description: item.specification,
        qty: item.quantity,
        unit: item.unit,
        unit_price: unitPrice,
        total: unitPrice * item.quantity,
      };
    });
    fd.append("items", JSON.stringify(financialItems));

    // ── Totals
    fd.append("sub_total", String(subTotal));
    fd.append("vat", data.vat || "0");
    fd.append("ait", data.ait || "0");
    fd.append("delivery_charge", data.delivery_charge || "0");
    fd.append("grand_total", String(grandTotal));
    fd.append(
      "quotation_validity_days",
      data.quotation_validity_days ? String(data.quotation_validity_days) : "",
    );
    fd.append("payment_terms", data.payment_terms);
    fd.append("additional_remarks", data.additional_remarks);

    // ── Documents (File objects)
    requiredDocs.forEach((docName) => {
      const fileList = data.documents?.[docName];
      if (fileList && fileList[0]) {
        fd.append(`documents[${docName}]`, fileList[0]);
      }
    });

    // ── Declaration
    fd.append("declaration", String(data.declaration));

    // ── Vendor / Submission Info
    fd.append("vendor_id", String(user?.id ?? ""));
    fd.append("vendor_name", user?.username ?? "");
    fd.append("designation", "");

    return fd;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const onSaveDraft = handleSubmit((data) => {
    const fd = buildFormData(data, "draft");

    postSubmission(fd, "draft");
  });

  const onSubmit = handleSubmit(
    (data) => {
      if (!data.declaration) {
        toast.info("Please accept the declaration before submitting.");
        return;
      }
      const fd = buildFormData(data, "submitted");

      postSubmission(fd, "submitted");
    },
    (formErrors) => {
      console.error(" Validation errors:", formErrors);
    },
  );

  async function patchRfQInvitationSubmittedStatus() {
    if (!user?.id || !rfq) return;

    type InvitationEntry = {
      id?: number | string;
      invitation_id?: number | string;
      rfq_invitation_id?: number | string;
      vendor?: {
        user?: { id?: number | string };
        user_id?: number | string;
      };
      user?: { id?: number | string };
      user_id?: number | string;
    };

    const invitedEntries: InvitationEntry[] = Array.isArray(rfq.invited_vendors)
      ? rfq.invited_vendors
      : Array.isArray(rfq.vendors)
        ? rfq.vendors
        : [];

    const match = invitedEntries.find((entry) => {
      const vendor = entry.vendor ?? entry;
      const vendorUserId = vendor?.user?.id ?? vendor?.user_id;
      return String(vendorUserId) === String(user.id);
    });

    const invitationId =
      match?.id ?? match?.invitation_id ?? match?.rfq_invitation_id;
    if (!invitationId) return;

    try {
      await axiosInstance.patch(`/api/rfq_invitation/${invitationId}/`, {
        submitted_status: true,
      });
      return true;
    } catch (err) {
      console.error("❌ Invitation patch failed:", err);
      return false;
    }
  }

  async function postSubmission(fd: FormData, status: "draft" | "submitted") {
    setIsSubmitting(true);
    try {
      if (isEditMode && editId) {
        await axiosInstance.patch(
          endpoints.procurement_management.vendor_rfq_submission_by_id(editId),
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        await axiosInstance.post(
          endpoints.procurement_management.vendor_rfq_submissions,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      }

      if (status === "submitted") {
        await patchRfQInvitationSubmittedStatus();
      }

      toast.success(
        isEditMode
          ? "Proposal updated successfully!"
          : "Proposal submitted successfully!",
      );
      router.push("/vendor-portal/quotations");
    } catch (err) {
      console.error("❌ API Error:", err);
      toast.error("Failed to submit proposal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Loading / Not Found ─────────────────────────────────────────────────────
  if (loading || (isEditMode && submissionLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8">
        <Link
          href="/vendor-portal/rfqs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to RFQs
        </Link>
        <p className="text-muted-foreground">RFQ not found.</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/vendor-portal/rfqs/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to RFQ
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Submit Proposal
            </h1>
            <p className="text-muted-foreground">
              {rfq.rfq_number} &mdash; {rfq.rfq_title ?? rfq.title}
            </p>
          </div>
          <Badge variant="info" size="sm">
            <Shield className="w-3 h-3 mr-1" />
            Two-Envelope System
          </Badge>
        </div>
      </div>

      {/* Two-Envelope Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Two-Envelope Submission (Technical &amp; Financial)
            </p>
            <p className="text-xs text-blue-700 mt-1">
              As per AAB procurement policy, proposals are submitted in two
              separate envelopes. The Technical Proposal is evaluated first.
              Only technically qualified vendors&apos; Financial Proposals are
              opened and evaluated.
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveSection("technical")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === "technical" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 1: Technical Proposal
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("financial")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === "financial" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 2: Financial Proposal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* ── TECHNICAL PROPOSAL ─────────────────────────────────────────── */}
          {activeSection === "technical" && (
            <>
              <Card>
                <CardHeader
                  title="Technical Proposal"
                  description="Company qualifications, methodology, and compliance with specifications"
                />
                <CardBody>
                  <div className="space-y-4">
                    {/* Company Experience */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Company Experience &amp; Capability Statement{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your company's experience with similar projects, capacity to deliver the required quantities, and relevant past performance with Ledars NGO or similar organizations..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        {...register("company_experience", { required: true })}
                      />
                    </div>

                    {/* Methodology */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Technical Methodology / Approach{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe your approach to fulfilling this order: sourcing, quality control, packaging, delivery logistics..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        {...register("methodology", { required: true })}
                      />
                    </div>

                    {/* Compliance Table */}
                    {lineItems.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Compliance with Technical Specifications
                        </label>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr className="text-left">
                                <th className="px-4 py-2 text-xs font-semibold">
                                  #
                                </th>
                                <th className="px-4 py-2 text-xs font-semibold">
                                  Item
                                </th>
                                <th className="px-4 py-2 text-xs font-semibold">
                                  Required Specs
                                </th>
                                <th className="px-4 py-2 text-xs font-semibold">
                                  Your Offered Specs
                                </th>
                                <th className="px-4 py-2 text-xs font-semibold text-center">
                                  Compliant?
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineItems.map((item, idx) => (
                                <tr
                                  key={item.id}
                                  className="border-t border-border"
                                >
                                  <td className="px-4 py-2 text-sm">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {item.item_name}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-muted-foreground">
                                    {item.specification || "—"}
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      placeholder="Your specification"
                                      className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                      {...register(
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        `compliance.${item.id}.offered_spec` as any,
                                      )}
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <select
                                      className="px-2 py-1 text-xs border border-input rounded"
                                      {...register(
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        `compliance.${item.id}.compliant` as any,
                                      )}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="Partial">Partial</option>
                                      <option value="No">No</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Delivery & Warranty */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Delivery Lead Time (days){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder={
                            rfq.delivery_commitment_days
                              ? `Required: ${rfq.delivery_commitment_days} days`
                              : "e.g. 15"
                          }
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          {...register("delivery_lead_time_days", {
                            required: true,
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Warranty Period
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12 months"
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          {...register("warranty_period")}
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Required Documents */}
              {requiredDocs.length > 0 && (
                <Card>
                  <CardHeader
                    title="Required Documents Upload"
                    description="Upload documents specified in the RFQ. All fields are optional — you may submit with partial or no uploads."
                  />
                  <CardBody>
                    <div className="space-y-3">
                      {requiredDocs.map((doc, i) => (
                        <Controller
                          key={i}
                          control={control}
                          name={`documents.${doc}`}
                          render={({ field }) => {
                            const fileList = field.value as FileList | null;
                            const newFileName = fileList?.[0]?.name;
                            const alreadyUploaded =
                              isEditMode && existingDocNames.has(doc);
                            // Find the existing doc URL for display
                            const existingDoc = isEditMode
                              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                existingSubmission?.documents?.find(
                                  (d: any) => d.doc_name === doc,
                                )
                              : null;
                            return (
                              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-sm truncate">
                                    {doc}
                                  </span>
                                  {newFileName ? (
                                    <span className="text-xs text-green-600 ml-2 shrink-0">
                                      ✓ {newFileName}
                                    </span>
                                  ) : alreadyUploaded ? (
                                    <span className="text-xs text-blue-600 ml-2 shrink-0">
                                      ✓ already uploaded
                                      {existingDoc?.file_url && (
                                        <a
                                          href={existingDoc.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ml-1 underline"
                                        >
                                          view
                                        </a>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                                <label className="border-2 border-dashed border-border rounded px-4 py-1.5 text-xs text-muted-foreground cursor-pointer hover:border-primary/30 shrink-0">
                                  <Upload className="w-3 h-3 inline mr-1" />
                                  {alreadyUploaded && !newFileName
                                    ? "Replace"
                                    : newFileName
                                      ? "Re Upload"
                                      : "Upload"}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                      field.onChange(e.target.files)
                                    }
                                  />
                                </label>
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* ── FINANCIAL PROPOSAL ─────────────────────────────────────────── */}
          {activeSection === "financial" && (
            <>
              <Card>
                <CardHeader
                  title="Financial Proposal — Item Pricing"
                  description="All prices in BDT, inclusive of applicable VAT/Tax"
                />
                <CardBody>
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold uppercase w-10">
                          #
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase">
                          Description
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase text-center">
                          Qty
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Unit Price (BDT)
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Total (BDT)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => {
                        const price = parseFloat(
                          watchedFinancial?.[item.id]?.unit_price || "0",
                        );
                        const rowTotal = price * item.quantity;
                        return (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-3 pr-3 text-sm font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3 pr-3">
                              <p className="text-sm text-foreground">
                                {item.item_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.specification || "—"}
                              </p>
                            </td>
                            <td className="py-3 pr-3 text-sm text-center">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <input
                                type="number"
                                placeholder="0.00"
                                className="w-28 px-2 py-1.5 border border-input rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                {
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  ...register(
                                    `financial.${item.id}.unit_price` as any,
                                  )
                                }
                              />
                            </td>
                            <td className="py-3 text-sm font-medium text-right">
                              {price > 0
                                ? rowTotal.toLocaleString("en-BD", {
                                    minimumFractionDigits: 2,
                                  })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-border">
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-3 text-sm font-semibold text-right"
                        >
                          Sub Total (BDT):
                        </td>
                        <td className="pt-3 text-sm font-semibold text-right">
                          {subTotal > 0
                            ? subTotal.toLocaleString("en-BD", {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-1 text-sm text-right text-muted-foreground"
                        >
                          VAT (if applicable):
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register("vat")}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-1 text-sm text-right text-muted-foreground"
                        >
                          AIT (if applicable):
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register("ait")}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-1 text-sm text-right text-muted-foreground"
                        >
                          Transportation / Delivery Charge:
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                            {...register("delivery_charge")}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={4}
                          className="pt-2 text-sm font-bold text-right"
                        >
                          Grand Total (BDT):
                        </td>
                        <td className="pt-2 text-sm font-bold text-right text-primary">
                          {grandTotal > 0
                            ? grandTotal.toLocaleString("en-BD", {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Payment &amp; Validity" />
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Quotation Validity (days){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register("quotation_validity_days", {
                          required: true,
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Payment Terms <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register("payment_terms", { required: true })}
                      >
                        <option>100% after delivery &amp; inspection</option>
                        <option>Net 30 after delivery</option>
                        <option>Net 15 after delivery</option>
                        <option>50% advance, 50% delivery</option>
                      </select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Additional Remarks" />
                <CardBody>
                  <textarea
                    rows={3}
                    placeholder="Any conditions, discounts for early payment, bulk pricing notes..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    {...register("additional_remarks")}
                  />
                </CardBody>
              </Card>
            </>
          )}

          {/* Declaration */}
          <Card>
            <CardBody>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border"
                  {...register("declaration")}
                />
                <span className="text-sm text-foreground leading-relaxed">
                  I hereby confirm that the information in both the Technical
                  and Financial proposals are accurate, the goods/services meet
                  the stated specifications, and I accept the terms and
                  conditions outlined in the RFQ document. I understand that
                  Ledars NGO reserves the right to accept or reject any
                  proposal.
                </span>
              </label>
            </CardBody>
          </Card>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSaveDraft}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? "Update Draft" : "Save Draft"}
                </Button>
                <Button
                  variant="primary"
                  className="w-full"
                  type="button"
                  disabled={
                    !watchedDeclaration || isSubmitting || !allChecklistPassed
                  }
                  onClick={onSubmit}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Submitting..."
                    : isEditMode
                      ? "Update & Submit"
                      : "Submit Proposal"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Both technical &amp; financial envelopes will be submitted
                together
              </p>
            </CardBody>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    Important Notes
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1.5">
                    <li>&bull; Technical proposal must NOT include pricing</li>
                    <li>&bull; All prices in BDT, inclusive of taxes</li>
                    <li>&bull; Delivery cost should be declared separately</li>
                    <li>&bull; Late submissions will not be accepted</li>
                    <li>&bull; Once submitted, proposal cannot be modified</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* RFQ Summary */}
          <Card>
            <CardHeader title="RFQ Summary" />
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RFQ ID</span>
                  <span className="font-medium">{rfq.rfq_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="default" size="sm">
                    {rfq.category_name ?? rfq.category ?? "—"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Date</span>
                  <span className="font-semibold text-orange-600">
                    {formatDate(rfq.submission_deadline)}
                  </span>
                </div>
                {rfq.delivery_commitment_days && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Days</span>
                    <span className="font-medium">
                      {rfq.delivery_commitment_days} days
                    </span>
                  </div>
                )}
                {rfq.urgency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Urgency</span>
                    <Badge
                      variant={rfq.urgency === "Urgent" ? "danger" : "default"}
                      size="sm"
                    >
                      {rfq.urgency}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Value</span>
                  <span className="font-medium">
                    BDT{" "}
                    {parseFloat(
                      rfq.total_estimated_value ?? "0",
                    ).toLocaleString("en-BD")}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Submission Checklist */}
          <Card>
            <CardHeader title="Submission Checklist" />
            <CardBody>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">
                    {completedCount} / {checklistItems.length} completed
                  </span>
                  {allChecklistPassed ? (
                    <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Ready to submit
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-orange-500">
                      {checklistItems.length - completedCount} item(s) pending
                    </span>
                  )}
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      allChecklistPassed ? "bg-green-500" : "bg-orange-400"
                    }`}
                    style={{
                      width: `${(completedCount / checklistItems.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item) => {
                  const done = autoChecklist[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        done
                          ? "bg-green-50 text-green-800"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          done ? "bg-green-500" : "bg-orange-300"
                        }`}
                      >
                        {done ? (
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        )}
                      </div>
                      <span
                        className={
                          done ? "line-through opacity-60" : "font-medium"
                        }
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* Documents row — optional, shown as informational only */}
                {requiredDocs.length > 0 && (
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs bg-blue-50 text-blue-700">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-blue-300">
                      {autoChecklist.documents_uploaded ? (
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                      )}
                    </div>
                    <span>
                      Documents uploaded{" "}
                      <span className="font-normal opacity-70">(optional)</span>
                    </span>
                  </div>
                )}
              </div>

              {!allChecklistPassed && (
                <p className="mt-3 text-[10px] text-orange-600 text-center">
                  Complete all items above to enable submission.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
