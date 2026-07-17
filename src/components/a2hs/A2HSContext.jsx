'use client';

import { useMemo, useState, useEffect, useContext, createContext } from 'react';

const A2HSContext = createContext({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  installApp: () => {},
  dismissPrompt: () => {},
});

export function A2HSProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (typeof window !== 'undefined') {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      ) {
        setIsInstalled(true);
      }

      // Listen for the beforeinstallprompt event
      const handleBeforeInstallPrompt = (e) => {
        // Prevent Chrome 76+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setDeferredPrompt(e);
        // Update UI to notify the user they can add to home screen
        setIsInstallable(true);
      };

      // Listen for successful install
      const handleAppInstalled = () => {
        // Hide the prompt after successful installation
        setIsInstallable(false);
        setIsInstalled(true);
        setDeferredPrompt(null);
        // console.log('PWA was installed');
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
    return undefined;
  }, []);

  const contextValue = useMemo(() => {
    const installApp = async () => {
      if (!deferredPrompt) return;

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      // We no longer need the prompt. Clear it up
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        // console.log('User accepted the install prompt');
      } else {
        // console.log('User dismissed the install prompt');
      }
    };

    const dismissPrompt = () => {
      setIsInstallable(false);
    };

    return {
      deferredPrompt,
      isInstallable,
      isInstalled,
      installApp,
      dismissPrompt,
    };
  }, [deferredPrompt, isInstallable, isInstalled]);

  return <A2HSContext.Provider value={contextValue}>{children}</A2HSContext.Provider>;
}

export const useA2HS = () => useContext(A2HSContext);
