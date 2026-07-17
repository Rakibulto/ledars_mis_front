'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2, Package, ArrowLeft, Warehouse, ShieldCheck } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function StockIssueTransfer() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState('issue');
  const [transactionDate, setTransactionDate] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [generateChallan, setGenerateChallan] = useState(false);
  const [generateWaybill, setGenerateWaybill] = useState(false);
  const [generateReleaseNote, setGenerateReleaseNote] = useState(true);
  const [items, setItems] = useState([
    { id: '1', inventoryId: '', itemName: '', availableStock: 0, quantity: 0 },
  ]);
  // BD-localized mock inventory
  const mockInventory = [
    { id: 'INV-AAB-2026-0045', name: 'A4 Paper (80gsm, 500 sheet ream)', stock: 450 },
    { id: 'INV-AAB-2026-0078', name: 'Toner Cartridge HP 26A (Black)', stock: 25 },
    { id: 'INV-AAB-2026-0090', name: 'Emergency Tarpaulin (12ft x 18ft)', stock: 45 },
    { id: 'INV-AAB-2026-0091', name: 'Hygiene Kit (Family Pack)', stock: 28 },
    { id: 'INV-AAB-2026-0092', name: 'First Aid Kit (Standard)', stock: 12 },
    { id: 'INV-AAB-2026-0093', name: 'Solar Lantern (Rechargeable)', stock: 8 },
    { id: 'INV-AAB-2026-0094', name: 'Bottled Water (1.5L Case of 12)', stock: 320 },
    { id: 'INV-AAB-2026-0095', name: 'Blanket (Thermal, 5ft x 7ft)', stock: 180 },
  ];
  const handleItemSelect = (id, inventoryId) => {
    const selected = mockInventory.find((i) => i.id === inventoryId);
    if (selected) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                inventoryId: selected.id,
                itemName: selected.name,
                availableStock: selected.stock,
              }
            : item
        )
      );
    }
  };
  const handleQuantityChange = (id, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.min(quantity, item.availableStock) } : item
      )
    );
  };
  const addItem = () => {
    const newId = (parseInt(items[items.length - 1].id) + 1).toString();
    setItems([
      ...items,
      { id: newId, inventoryId: '', itemName: '', availableStock: 0, quantity: 0 },
    ]);
  };
  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id));
  };
  const handleSubmit = () => {
    if (!transactionDate || !fromLocation || !toLocation) {
      alert('Please fill in all required fields');
      return;
    }
    const hasItems = items.some((item) => item.inventoryId && item.quantity > 0);
    if (!hasItems) {
      alert('Please add at least one item with quantity');
      return;
    }
    const docs = [];
    if (generateReleaseNote) docs.push('Material Release Note');
    if (generateChallan) docs.push('Challan');
    if (generateWaybill) docs.push('Waybill');
    alert(
      `Stock ${transactionType} submitted successfully!\n${docs.length > 0 ? `Generated: ${docs.join(', ')}` : ''}`
    );
    router.push(paths.dashboard.procurement.inventory.movement);
  };
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={paths.dashboard.procurement.inventory.movement}>
            <button type="button" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Stock Issue / Transfer</h1>
            <p className="text-muted-foreground">
              Ledars NGO — Record stock out via release or inter-warehouse transfer. Generates
              Release Note, Challan & Waybill.
            </p>
          </div>
        </div>

        {/* Access Roles */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-2">Access:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
            Admin (Full)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Store Staff (Issue, Transfer)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            Programme Colleague (Request only)
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Transaction Type */}
        <Card>
          <CardHeader
            title="Transaction Type"
            description="Stock-out via release or inter-warehouse transfer"
          />
          <CardBody>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTransactionType('issue')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${transactionType === 'issue' ? 'border-warning bg-warning/5' : 'border-border hover:border-warning/50'}`}
              >
                <Package className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="font-semibold text-foreground">Issue Stock (Release)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Stock-out to camps, departments, or field offices
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('transfer')}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${transactionType === 'transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <Warehouse className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground">Transfer Stock</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Move between Ukhiya, Teknaf & Dhaka warehouses
                </p>
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader title="Transaction Details" description="Fill in transaction information" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  From Location (Warehouse/Store) *
                </label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select warehouse/store</option>
                  <option value="Dhaka HQ Store">Dhaka HQ Store</option>
                  <option value="Ukhiya Central Warehouse">Ukhiya Central Warehouse</option>
                  <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
                  <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {transactionType === 'issue'
                    ? 'Issued To (Camp/Department/Person) *'
                    : 'To Warehouse/Store *'}
                </label>
                {transactionType === 'transfer' ? (
                  <select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select destination warehouse</option>
                    <option value="Dhaka HQ Store">Dhaka HQ Store</option>
                    <option value="Ukhiya Central Warehouse">Ukhiya Central Warehouse</option>
                    <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
                    <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="e.g., Camp 4 (Kutupalong), Health Programme Team"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>
              {transactionType === 'issue' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                    placeholder="Person receiving the stock"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <div className={transactionType === 'issue' ? '' : 'col-span-full'}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Purpose / Reason
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Emergency shelter distribution, Monthly office supplies"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader
            title="Items to Issue/Transfer"
            description="Select items and quantities from selected warehouse"
            action={
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Item
              </Button>
            }
          />
          <CardBody>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border-2 border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-foreground">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-error hover:bg-error/10 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Select Item *
                      </label>
                      <select
                        value={item.inventoryId}
                        onChange={(e) => handleItemSelect(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Choose an item</option>
                        {mockInventory.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                        }
                        min="1"
                        max={item.availableStock}
                        disabled={!item.inventoryId}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                  {item.inventoryId && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Available Stock</p>
                        <p className="text-sm font-semibold text-foreground">
                          {item.availableStock} units
                        </p>
                      </div>
                      {item.quantity > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">After Transaction</p>
                          <p className="text-sm font-semibold text-primary">
                            {item.availableStock - item.quantity} units
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Document Generation */}
        <Card>
          <CardHeader
            title="Document Generation"
            description="Auto-generate required warehouse documents"
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${generateReleaseNote ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  type="checkbox"
                  checked={generateReleaseNote}
                  onChange={(e) => setGenerateReleaseNote(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">Material Release Note</p>
                  <p className="text-xs text-muted-foreground">Goods release documentation</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${generateChallan ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  type="checkbox"
                  checked={generateChallan}
                  onChange={(e) => setGenerateChallan(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">Challan</p>
                  <p className="text-xs text-muted-foreground">Delivery challan for transport</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${generateWaybill ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  type="checkbox"
                  checked={generateWaybill}
                  onChange={(e) => setGenerateWaybill(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">Waybill</p>
                  <p className="text-xs text-muted-foreground">
                    Transport waybill for inter-warehouse
                  </p>
                </div>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader
            title="Additional Notes"
            description="Optional comments or special instructions"
          />
          <CardBody>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes, instructions, or comments about this transaction..."
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={paths.dashboard.procurement.inventory.movement} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="flex-1" onClick={handleSubmit}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Submit Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}
