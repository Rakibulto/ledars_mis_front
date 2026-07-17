'use client';

import { X, Eye, File, Download, FileText, FileImage, FileSpreadsheet } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

function resolveFileUrl(file) {
  if (!file) return null;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  return `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${file}`;
}
function getExt(file) {
  return (file || '').split('.').pop()?.toLowerCase() || '';
}
function getFileIcon(type) {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'image':
    case 'jpg':
    case 'png':
      return FileImage;
    case 'excel':
    case 'xlsx':
      return FileSpreadsheet;
    default:
      return File;
  }
}
function getFileColor(type) {
  switch (type) {
    case 'pdf':
      return 'text-destructive';
    case 'image':
    case 'jpg':
    case 'png':
      return 'text-info';
    case 'excel':
    case 'xlsx':
      return 'text-success';
    default:
      return 'text-muted-foreground';
  }
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
    // CORS / network fallback – open in new tab so user can save manually
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function AttachmentPanel({ vendor, onClose }) {
  console.log('Rendering AttachmentPanel with vendor:', vendor);
  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 w-full cursor-default"
        onClick={onClose}
        aria-label="Close panel"
      />

      {/* Panel – 80% right on mobile, fixed right sidebar on sm+ */}
      <div className="fixed inset-y-0 right-0 w-4/5 sm:w-80 md:w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 mt-12 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Attachments</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground truncate">{vendor.name}</p>
          <Badge variant="outline" className="mt-2">
            {vendor.attachments.length} {vendor.attachments.length === 1 ? 'file' : 'files'}
          </Badge>
        </div>

        {/* Attachments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {vendor.attachments.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No attachments uploaded.
            </div>
          ) : (
            <div className="space-y-3">
              {vendor.attachments.map((attachment) => {
                const fileUrl = resolveFileUrl(attachment.file ?? attachment.file_url);
                const ext = getExt(attachment.file ?? attachment.file_url ?? '');
                const FileIcon = getFileIcon(ext);
                const fileColor = getFileColor(ext);
                return (
                  <div
                    key={attachment.id}
                    className="p-3 sm:p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${fileColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate mb-0.5">
                          {attachment.name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-muted-foreground uppercase">
                            {attachment.type}
                          </p>
                          {attachment.size && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground truncate max-w-30">
                                {attachment.size}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons – always visible on mobile touch, hover-reveal on desktop */}
                    <div className="flex items-center gap-2 mt-3 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() =>
                          fileUrl && window.open(fileUrl, '_blank', 'noopener,noreferrer')
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
                        onClick={() => handleDownload(fileUrl, attachment.name)}
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border">
          <Button
            className="w-full"
            disabled={vendor.attachments.length === 0}
            onClick={() =>
              vendor.attachments.forEach((a) =>
                handleDownload(resolveFileUrl(a.file ?? a.file_url), a.name)
              )
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Files
          </Button>
        </div>
      </div>
    </>
  );
}
