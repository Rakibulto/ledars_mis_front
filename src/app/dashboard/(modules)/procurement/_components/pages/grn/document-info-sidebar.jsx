'use client';

import { X, Eye, File, Download, FileText, FileImage, FileSpreadsheet, Paperclip } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

function resolveFileUrl(file) {
  if (!file) return null;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  return `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${file}`;
}

function getExt(file) {
  return (file || '').split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(ext) {
  switch (ext) {
    case 'pdf':
      return FileText;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return FileImage;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return FileSpreadsheet;
    default:
      return File;
  }
}

function getFileColor(ext) {
  switch (ext) {
    case 'pdf':
      return 'text-red-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'text-blue-500';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'text-green-500';
    default:
      return 'text-muted-foreground';
  }
}

function getDocumentTypeLabel(attachment) {
  if (attachment.document_type) return attachment.document_type;
  if (attachment.doc_type) return attachment.doc_type;
  if (attachment.type) return attachment.type;
  const ext = getExt(attachment.file ?? attachment.file_url ?? attachment.name ?? '');
  if (ext === 'pdf') return 'PDF Document';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'Image';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'Spreadsheet';
  if (['doc', 'docx'].includes(ext)) return 'Word Document';
  return 'Document';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (typeof bytes === 'string') return bytes;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleDownload(url, name) {
  if (!url) return;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function DocumentInfoSidebar({ workOrder, attachments, onClose }) {
  const docTypeGroups = attachments.reduce((groups, att) => {
    const type = getDocumentTypeLabel(att);
    if (!groups[type]) groups[type] = [];
    groups[type].push(att);
    return groups;
  }, {});

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 w-full cursor-default"
        onClick={onClose}
        aria-label="Close panel"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-4/5 sm:w-96 md:w-[420px] bg-card border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Document Information
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {workOrder?.workOrderNumber || workOrder?.wo_number || 'Work Order'}
          </p>
          <Badge variant="outline" className="mt-2">
            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
          </Badge>
        </div>

        {/* Attachments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {attachments.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No attachments found for this work order.
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(docTypeGroups).map(([docType, items]) => (
                <div key={docType}>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {docType}
                    </h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {items.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {items.map((attachment) => {
                      const fileUrl = resolveFileUrl(
                        attachment.file_url ?? attachment.file
                      );
                      const ext = getExt(
                        attachment.file_url ?? attachment.file ?? attachment.name ?? ''
                      );
                      const FileIcon = getFileIcon(ext);
                      const fileColor = getFileColor(ext);
                      const displayName =
                        attachment.name ||
                        attachment.file?.split('/').pop() ||
                        'Untitled document';
                      const fileSize = formatFileSize(attachment.size ?? attachment.file_size);

                      return (
                        <div
                          key={attachment.id || displayName}
                          className="p-3 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <FileIcon className={`w-4 h-4 ${fileColor}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate mb-0.5">
                                {displayName}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs text-muted-foreground uppercase">
                                  {ext || 'file'}
                                </p>
                                {fileSize && (
                                  <>
                                    <span className="text-xs text-muted-foreground">&bull;</span>
                                    <p className="text-xs text-muted-foreground">{fileSize}</p>
                                  </>
                                )}
                                {attachment.upload_date && (
                                  <>
                                    <span className="text-xs text-muted-foreground">&bull;</span>
                                    <p className="text-xs text-muted-foreground">
                                      {attachment.upload_date}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={() =>
                                fileUrl &&
                                window.open(fileUrl, '_blank', 'noopener,noreferrer')
                              }
                              disabled={!fileUrl}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={() => handleDownload(fileUrl, displayName)}
                              disabled={!fileUrl}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border shrink-0">
          <Button
            className="w-full"
            disabled={attachments.length === 0}
            onClick={() =>
              attachments.forEach((a) =>
                handleDownload(
                  resolveFileUrl(a.file_url ?? a.file),
                  a.name || 'download'
                )
              )
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>
    </>
  );
}
