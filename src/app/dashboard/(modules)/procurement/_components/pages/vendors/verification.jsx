'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { X, Eye, Clock, XCircle, FileText, Download, Building2, CheckCircle } from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { UserDialog } from '../../components/create-user-dialog';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { useGetRequest } from '../../../../../../../actions/ledars-hook';

export function VendorVerification() {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [openApproveUserDialog, setOpenApproveUserDialog] = useState(false);
  const [approveUserPrefill, setApproveUserPrefill] = useState(null);
  const [approvingVendorId, setApprovingVendorId] = useState(null);
  const [ApprovedNotes, setApprovedNotes] = useState('');

  // console.log('selected vendor   ddddddddddddd:', selectedVendor);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [rejectNotes, setRejectNotes] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null); // { url, name }
  const [docRejectData, setDocRejectData] = useState({ docId: null, reason: '' });

  // const { data: apiData } = useVendorVerifications({ page: page + 1, pageSize: rowsPerPage });
  const { data: apiData } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}simple_VendorProfile/?pagination=true&page=${page + 1}&page_size=${rowsPerPage}`
  );

  // selectedVendor is already the full verification object set on click
  // console.log('selected verification:', selectedVendor);
  console.log('selected vedotid:', selectedVendor?.id, selectedVendor?.id);

  const { data: vendorData } = useGetRequest(
    selectedVendor?.id
      ? endpoints.procurement_management.vendors_management_by_id(selectedVendor?.id)
      : null
  );
  console.log('vendor data data:', vendorData);

  const { data: summaryData } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}status-summary/`
  );

  const { data: rolesData } = useGetRequest('/api/user-roles/');
  const { data: departmentsData } = useGetRequest('/api/departments/');

  const uniqueRoles = useMemo(() => rolesData ?? [], [rolesData]);
  const uniqueDepartments = useMemo(() => departmentsData ?? [], [departmentsData]);

  const handleOpenApproveUserDialog = () => {
    const email = vendorData?.email || '';
    const emailPrefix = email.split('@')[0] || 'vendor';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const username = `${emailPrefix}${randomDigits}`;

    // Generate password that satisfies schema: uppercase + lowercase + digit, min 8 chars
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const all = upper + lower + digits;
    const rand = (s) => s[Math.floor(Math.random() * s.length)];
    const base = Array.from({ length: 8 }, () => rand(all)).join('');
    const password = rand(upper) + rand(lower) + rand(digits) + base;

    const vendorRole = uniqueRoles.find((r) => r.name?.toLowerCase() === 'vendor');

    setApproveUserPrefill({
      name: vendorData?.contact_person || vendorData?.name || '',
      email,
      username,
      password,
      re_password: password,
      phone: vendorData?.phone || '',
      role: vendorRole ? String(vendorRole.id) : '',
      department: '',
      status: 'active',
    });
    setApprovingVendorId(selectedVendor?.id);
    setOpenApproveUserDialog(true);
  };

  const [reviewing, setReviewing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const existingVendorUser = !!vendorData?.user?.id;
  const uncheckDocuments =
    vendorData?.documents?.length > 0 &&
    vendorData.documents.find((doc) => doc.review_status?.toLowerCase() === 'Pending');

  const handleReviewDocument = async (docId, reviewPayload) => {
    setReviewing(true);
    try {
      await axiosInstance.patch(
        endpoints.procurement_management.vendor_document_review(docId),
        reviewPayload
      );
      toast.success('Document review updated');
    } catch (error) {
      toast.error('Failed to update document review');
    } finally {
      setReviewing(false);
      mutate(endpoints.procurement_management.vendors_management_by_id(selectedVendor?.id));
      mutate(
        `${endpoints.procurement_management.vendor_verifications}?pagination=true&page=${page + 1}&page_size=${rowsPerPage}`
      );
    }
  };

  const handleApproveVendor = async (vendorId, notes) => {
    setApproving(true);

    try {
      await axiosInstance.patch(
        endpoints.procurement_management.vendors_management_by_id(vendorId),
        {
          status: 'Approved',
          notes: notes || ApprovedNotes,
        }
      );
      toast.success('Vendor approved successfully');
      mutate(endpoints.procurement_management.vendors_management_by_id(vendorId));
      mutate(
        `${endpoints.procurement_management.vendor_verifications}?pagination=true&page=${page + 1}&page_size=${rowsPerPage}`
      );
    } catch (error) {
      toast.error('Failed to approve vendor');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveButtonClick = () => {
    if (!selectedVendor?.id) return;
    if (existingVendorUser) {
      handleApproveVendor(selectedVendor.id, ApprovedNotes);
      return;
    }
    handleOpenApproveUserDialog();
  };

  const handleRejectVendor = async (vendorId, notesData) => {
    setRejecting(true);
    try {
      await axiosInstance.patch(
        endpoints.procurement_management.vendors_management_by_id(vendorId),
        {
          status: 'Rejected',
          notes: notesData?.notes || rejectNotes,
        }
      );
      toast.success('Vendor rejected successfully');
      mutate(endpoints.procurement_management.vendors_management_by_id(vendorId));
      mutate(
        `${endpoints.procurement_management.vendor_verifications}?pagination=true&page=${page + 1}&page_size=${rowsPerPage}`
      );
    } catch (error) {
      toast.error('Failed to reject vendor');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );

      case 'rejected':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Vendor Verification
        </h1>
        <p className="text-muted-foreground">Review and verify vendor applications</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl sm:text-3xl font-bold text-warning">
              {summaryData?.Pending ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">In Progress</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {summaryData?.Pending ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">Verified Today</p>
            <p className="text-2xl sm:text-3xl font-bold text-success">
              {summaryData?.Approved ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-error">
          <CardBody>
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl sm:text-3xl font-bold text-error">
              {summaryData?.Rejected ?? 0}
            </p>
          </CardBody>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Vendors List */}
        <Card>
          <CardHeader title="Pending Vendors" description="Awaiting verification" />
          <CardBody>
            <div className="space-y-3">
              {apiData?.results?.map((vendor) => (
                <div
                  key={vendor?.id}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedVendor?.id === vendor?.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {vendor?.name || vendor?.company_name_bn}
                      </h4>
                      <p className="text-xs text-muted-foreground">{vendor?.code}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Submitted </span>
                      <span className="text-foreground">{vendor?.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Documents</span>
                      <span className="font-semibold text-foreground">
                        {
                          (vendor?.documents || []).filter((d) => d.review_status !== 'pending')
                            .length
                        }
                        /{(vendor?.documents || []).length}
                      </span>
                    </div>
                    <Badge
                      variant={
                        vendor?.status === 'Pending'
                          ? 'warning'
                          : vendor?.status === 'Rejected'
                            ? 'danger'
                            : 'primary'
                      }
                      size="sm"
                      className="w-full justify-center"
                    >
                      {vendor?.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
          <TablePagination
            component="div"
            count={apiData?.count ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Card>

        {/* Verification Details */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {selectedVendor ? (
            <>
              {/* Vendor Information */}
              <Card>
                <CardHeader
                  title="Vendor Information"
                  description="Company details for verification"
                />
                <CardBody>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.name || '—'}
                        {vendorData?.company_name_bn && (
                          <span className="block text-xs text-muted-foreground">
                            {vendorData.company_name_bn}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Legal Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.legal_name || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trade License No.</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.trade_license_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Organization Type</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.organization_type || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.contact_person || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Designation</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.designation || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.email || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Year Established</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.year_established || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Annual Turnover</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.annual_turnover || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tax ID / TIN</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.tax_id || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BIN Number</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.bin_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NID / Passport</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.nid_passport || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">District / Division</p>
                      <p className="text-sm font-medium text-foreground">
                        {[vendorData?.district, vendorData?.division, vendorData?.country]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium text-foreground">
                        {vendorData?.address || '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Categories</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(vendorData?.categories || []).map((cat) => (
                          <Badge key={cat?.id ?? cat} variant="default">
                            {typeof cat === 'object' ? cat.name : cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Document Verification */}
              <Card>
                <CardHeader
                  title="Document Verification"
                  description="Review submitted documents"
                />
                <CardBody>
                  <div className="space-y-3">
                    {vendorData?.documents?.map((doc) => (
                      <div key={doc.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {doc.doc_type}
                              </h4>
                              {doc.reviewer_name && (
                                <p className="text-xs text-muted-foreground">
                                  Reviewed by {doc.reviewer_name} on {doc.review_date}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.review_status)}
                            <button
                              type="button"
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              onClick={() =>
                                setViewingDoc({ url: doc.file_url || doc.file, name: doc.doc_type })
                              }
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          </div>
                        </div>

                        {doc.notes && (
                          <div
                            className={`p-3 rounded-lg text-xs ${
                              doc.review_status === 'rejected'
                                ? 'bg-error/10 text-error'
                                : 'bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            <span className="font-medium">Notes: </span>
                            {doc.notes}
                          </div>
                        )}

                        {doc.review_status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              className="flex-1"
                              disabled={reviewing}
                              onClick={() =>
                                handleReviewDocument(doc.id, { review_status: 'Verified' })
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={reviewing}
                              onClick={() => setDocRejectData({ docId: doc.id, reason: '' })}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Verification Actions */}
              <Card>
                <CardHeader
                  title="Verification Decision"
                  description="Approve or reject vendor application"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <p className="block text-sm font-medium text-foreground mb-2">
                        Verification Notes
                      </p>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Add notes about the verification process..."
                        value={ApprovedNotes}
                        onChange={(e) => setApprovedNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        className="flex-1"
                        disabled={approving || uncheckDocuments}
                        onClick={handleApproveButtonClick}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {existingVendorUser
                          ? vendorData?.status === 'Approved'
                            ? 'Already approved'
                            : 'Approve Vendor'
                          : 'Approve & Create User'}{' '}
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 border-error text-error hover:bg-error hover:text-white"
                        onClick={() => setShowRejectModal(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Once approved, the vendor will be activated and can
                        participate in RFQs. Rejecting will notify the vendor and archive the
                        application.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">No Vendor Selected</p>
                  <p className="text-sm text-muted-foreground">
                    Select a vendor from the list to review their application
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground capitalize">
                  {viewingDoc.name?.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto min-h-0">
              {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(viewingDoc.url) ? (
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.name}
                  className="w-full h-auto object-contain p-4"
                />
              ) : (
                <iframe
                  src={viewingDoc.url}
                  title={viewingDoc.name}
                  className="w-full h-full min-h-[70vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Document Reject Modal */}
      {docRejectData.docId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader
              title="Reject Document"
              description="Provide a rejection reason for this document"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="block text-sm font-medium text-foreground mb-2">Rejection Reason</p>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    value={docRejectData.reason}
                    onChange={(e) =>
                      setDocRejectData((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="Write the rejection reason for this document"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDocRejectData({ docId: null, reason: '' })}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-error hover:bg-error/90"
                  disabled={reviewing || !docRejectData.reason.trim()}
                  onClick={() => {
                    handleReviewDocument(docRejectData.docId, {
                      review_status: 'Rejected',
                      rejection_reason: docRejectData.reason,
                      notes: docRejectData.reason,
                    }).then(() => {
                      setDocRejectData({ docId: null, reason: '' });
                    });
                  }}
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader
              title="Reject Vendor Application"
              description="Please provide rejection reason"
            />
            <CardBody>
              <div className="space-y-4">
                {/* <div>
                  <p className="block text-sm font-medium text-foreground mb-2">
                    Rejection Reason *
                  </p>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="">Select reason</option>
                    <option value="incomplete-docs">Incomplete Documents</option>
                    <option value="invalid-docs">Invalid Documents</option>
                    <option value="failed-verification">Failed Verification</option>
                    <option value="duplicate">Duplicate Registration</option>
                    <option value="other">Other</option>
                  </select>
                </div> */}
                <div>
                  <p className="block text-sm font-medium text-foreground mb-2">Rejection Notes</p>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-error hover:bg-error/90"
                  disabled={rejecting}
                  onClick={() =>
                    handleRejectVendor(selectedVendor?.id, {
                      notes: rejectNotes,
                    }).then(() => {
                      setShowRejectModal(false);

                      setRejectNotes('');
                    })
                  }
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      {/* Approve Vendor — creates system user first, then marks vendor Active */}
      <UserDialog
        key={approvingVendorId ? `approve-${approvingVendorId}` : 'approve-vendor'}
        open={openApproveUserDialog}
        onClose={() => {
          setOpenApproveUserDialog(false);
          setApproveUserPrefill(null);
          setApprovingVendorId(null);
        }}
        initialValues={approveUserPrefill}
        uniqueRoles={uniqueRoles}
        uniqueDepartments={uniqueDepartments}
        onSuccess={() => {
          handleApproveVendor(approvingVendorId, ApprovedNotes);
        }}
      />
    </div>
  );
}
