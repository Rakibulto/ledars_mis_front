import axiosInstance from 'src/utils/axios';

function getFilenameFromDisposition(disposition, fallbackName) {
  if (!disposition) return fallbackName;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  return fallbackName;
}

export async function downloadFileFromEndpoint(url, fallbackName) {
  const response = await axiosInstance.get(url, { responseType: 'blob' });
  const filename = getFilenameFromDisposition(
    response.headers['content-disposition'],
    fallbackName
  );
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);

  return filename;
}
