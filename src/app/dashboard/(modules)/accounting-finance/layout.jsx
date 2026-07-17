import { CurrencyProvider } from './_components/currency-context';

export default function AccountingFinanceLayout({ children }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
