'use client';

import { forwardRef } from 'react';

import { Iconify } from 'src/components/iconify';

function createIcon(icon) {
  return forwardRef(({ className, ...props }, ref) => (
    <Iconify ref={ref} icon={icon} className={className} {...props} />
  ));
}

export const AlertCircle = createIcon('solar:danger-circle-bold');
export const AlertTriangle = createIcon('solar:danger-triangle-bold');
export const ArrowLeft = createIcon('solar:alt-arrow-left-bold');
export const ArrowRight = createIcon('solar:alt-arrow-right-bold');
export const Award = createIcon('solar:medal-star-bold');
export const Barcode = createIcon('solar:barcode-bold');
export const BarChart3 = createIcon('solar:chart-2-bold');
export const Bell = createIcon('solar:bell-bing-bold');
export const Box = createIcon('solar:box-bold');
export const Boxes = createIcon('solar:boxes-minimalistic-bold');
export const Building = createIcon('solar:buildings-bold');
export const Building2 = createIcon('solar:buildings-2-bold');
export const Calendar = createIcon('solar:calendar-mark-bold');
export const Calculator = createIcon('solar:calculator-bold');
export const CheckCircle = createIcon('solar:check-circle-bold');
export const Clipboard = createIcon('solar:clipboard-list-bold');
export const Clock = createIcon('solar:clock-circle-bold');
export const CreditCard = createIcon('solar:card-bold');
export const DollarSign = createIcon('solar:dollar-bold');
export const Download = createIcon('solar:download-bold');
export const Edit = createIcon('solar:pen-bold');
export const Eye = createIcon('solar:eye-bold');
export const FileText = createIcon('solar:document-text-bold');
export const GitBranch = createIcon('solar:code-square-bold');
export const Grid = createIcon('solar:widget-5-bold');
export const Hash = createIcon('solar:hashtag-bold');
export const Image = createIcon('solar:gallery-bold');
export const Link = createIcon('solar:link-bold');
export const Mail = createIcon('solar:letter-bold');
export const MapPin = createIcon('solar:map-point-bold');
export const MessageSquare = createIcon('solar:chat-round-dots-bold');
export const Package = createIcon('solar:box-minimalistic-bold');
export const Phone = createIcon('solar:phone-bold');
export const Plus = createIcon('solar:add-circle-bold');
export const Printer = createIcon('solar:printer-bold');
export const QrCode = createIcon('solar:qr-code-bold');
export const Save = createIcon('solar:diskette-bold');
export const Search = createIcon('solar:magnifer-bold');
export const Send = createIcon('solar:plain-bold');
export const Shield = createIcon('solar:shield-check-bold');
export const Trash2 = createIcon('solar:trash-bin-trash-bold');
export const TrendingDown = createIcon('solar:graph-down-bold');
export const TrendingUp = createIcon('solar:graph-up-bold');
export const Truck = createIcon('solar:delivery-bold');
export const Upload = createIcon('solar:upload-bold');
export const User = createIcon('solar:user-bold');
export const UserCheck = createIcon('solar:user-check-bold');
export const UserX = createIcon('solar:user-cross-bold');
export const Users = createIcon('solar:users-group-rounded-bold');
export const X = createIcon('solar:close-circle-bold');
export const XCircle = createIcon('solar:close-circle-bold');
