import { CurrencyProvider } from 'src/app/dashboard/(modules)/accounting-finance/_components/currency-context';

/**
 * Lean layout for standalone new-tab forms.
 * No dashboard sidebar, no AuthGuard, no last-visited-path redirect —
 * just the CurrencyProvider so form components have access to active currency.
 */
export default function StandaloneFormsLayout({ children }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
