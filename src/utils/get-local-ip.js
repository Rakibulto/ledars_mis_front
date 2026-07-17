// Returns a Promise that resolves to an array of local IP addresses (IPv4) using WebRTC
export async function getLocalIPs() {
  const ips = new Set();

  return new Promise((resolve, reject) => {
    try {
      const pc = new window.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Create data channel
      pc.createDataChannel('');

      // Create offer and set local description
      (async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
        } catch (err) {
          console.error('Error in offer/setLocalDescription:', err);
        }
      })();

      // Listen for ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const { candidate } = event.candidate;
          const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          if (ipMatch) {
            const ip = ipMatch[0];
            // Filter out certain IPs
            if (!ip.startsWith('0.') && !ip.startsWith('169.254.')) {
              ips.add(ip);
            }
          }
        }
      };

      // Wait for ICE candidates
      setTimeout(() => {
        pc.close();
        const ipArr = Array.from(ips);
        resolve(ipArr);
      }, 3000);
    } catch (error) {
      console.error('Error in getLocalIPs:', error);
      reject(error);
    }
  });
}

// Alternative method for older browsers (WebRTC fallback)
export function getLocalIPFallback() {
  return new Promise((resolve, reject) => {
    const RTCPeerConnection =
      window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      reject(new Error('WebRTC not supported'));
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: [] });
    const ips = [];

    pc.createDataChannel('');
    pc.createOffer().then((offer) => pc.setLocalDescription(offer));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (ipMatch && ips.indexOf(ipMatch[0]) === -1) {
          ips.push(ipMatch[0]);
        }
      }
    };

    setTimeout(() => {
      pc.close();
      resolve(ips);
    }, 1000);
  });
}

export async function getLocalIP() {
  try {
    const ips = (await getLocalIPs()) || (await getLocalIPFallback());

    if (ips.length > 0) {
      // Return an object with both local and public IPs
      // The first IP is considered local and the last one is public
      return {
        localIP: ips[0] || '',
        publicIP: ips[ips.length - 1] || '',
        allIPs: ips,
      };
    }

    return { localIP: '', publicIP: '', allIPs: [] };
  } catch (error) {
    console.error('Error in getLocalIP:', error);
    return { localIP: '', publicIP: '', allIPs: [] };
  }
}
