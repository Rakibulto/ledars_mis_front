import { CONFIG } from 'src/config-global';

import { WorkspaceTabs } from 'src/sections/overview/app/view';
// import { HandleSavePathnameToLocalStorage } from 'src/utils/storage-available';
// import { RemoveSavedPathname } from 'src/utils/storage-available';
// import { HandleSavePathnameToLocalStorage, RemoveSavedPathname } from 'src/utils/storage-available';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <WorkspaceTabs />;
      {/* <HandleSavePathnameToLocalStorage />
      <RemoveSavedPathname /> */}
    </>
  );
}
