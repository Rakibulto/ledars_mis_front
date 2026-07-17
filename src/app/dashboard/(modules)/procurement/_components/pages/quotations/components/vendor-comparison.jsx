'use client';

import {
  Star,
  Award,
  Clock,
  Shield,
  DollarSign,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Card, CardBody, CardHeader } from '../../../components/ui/card';

export function VendorComparison({ vendors }) {
  if (!vendors || vendors.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No vendor data available.
      </div>
    );
  }
  // Sort vendors by rank
  const sortedVendors = [...vendors].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  // Find min and max prices
  const prices = vendors.map((v) => v.totalPrice ?? 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Find max scores
  const maxTechnicalScore = Math.max(...vendors.map((v) => v.technicalScore ?? 0));
  const maxFinancialScore = Math.max(...vendors.map((v) => v.financialScore ?? 0));
  const maxOverallScore = Math.max(...vendors.map((v) => v.overallScore ?? 0));
  return (
    <div className="space-y-6">
      {/* Overall Ranking */}
      <Card>
        <CardHeader
          title="Overall Ranking"
          description="Vendors ranked by combined document score (50%) and financial score (50%)"
        />
        <CardBody>
          <div className="space-y-4">
            {sortedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className={`p-4 border rounded-lg ${
                  vendor.rank === 1 ? 'border-warning bg-warning/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${
                        vendor.rank === 1
                          ? 'bg-warning text-warning-foreground'
                          : vendor.rank === 2
                            ? 'bg-muted text-foreground'
                            : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {vendor.rank === 1 && <Award className="w-5 h-5" />}
                      {vendor.rank !== 1 && `#${vendor.rank}`}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{vendor.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={vendor.status === 'compliant' ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {vendor.status === 'compliant' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {vendor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                    <p
                      className={`text-2xl font-semibold ${
                        vendor.overallScore === maxOverallScore ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {vendor.overallScore}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Documents</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${vendor.technicalScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-8 text-right">
                        {vendor.technicalScore ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Financial</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${vendor.financialScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-8 text-right">
                        {vendor.financialScore}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                    <p
                      className={`text-sm font-semibold ${
                        (vendor.totalPrice ?? 0) === minPrice ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      BDT {(vendor.totalPrice ?? 0).toLocaleString()}
                      {(vendor.totalPrice ?? 0) === minPrice && (
                        <TrendingDown className="inline w-3 h-3 ml-1" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Price Comparison */}
      <Card>
        <CardHeader title="Price Comparison" description="Visual comparison of vendor pricing" />
        <CardBody>
          <div className="space-y-4">
            {sortedVendors.map((vendor) => {
              const pricePercentage =
                ((vendor.totalPrice - minPrice) / (maxPrice - minPrice)) * 100;
              const isLowest = vendor.totalPrice === minPrice;
              return (
                <div key={vendor.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{vendor.name}</span>
                      {isLowest && (
                        <Badge variant="success" className="text-xs">
                          Lowest Price
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      BDT {(vendor.totalPrice ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-end px-3 transition-all ${
                        isLowest ? 'bg-success' : 'bg-primary/70'
                      }`}
                      style={{
                        width: minPrice === maxPrice ? '100%' : `${Math.max(pricePercentage, 20)}%`,
                      }}
                    >
                      {isLowest && <TrendingDown className="w-4 h-4 text-success-foreground" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Score Comparison Matrix */}
      <Card>
        <CardHeader title="Detailed Score Comparison" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Vendor
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Doc Score
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Financial
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Overall
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Total Price
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className={`border-b border-border ${vendor.rank === 1 ? 'bg-warning/5' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {vendor.rank === 1 && <Award className="w-4 h-4 text-warning" />}
                        <span className="text-sm font-medium text-foreground">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={vendor.rank === 1 ? 'default' : 'outline'}>
                        #{vendor.rank}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-sm font-semibold ${
                          vendor.technicalScore === maxTechnicalScore
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {vendor.technicalScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-sm font-semibold ${
                          vendor.financialScore === maxFinancialScore
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {vendor.financialScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-sm font-semibold ${
                          vendor.overallScore === maxOverallScore
                            ? 'text-success'
                            : 'text-foreground'
                        }`}
                      >
                        {vendor.overallScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          (vendor.totalPrice ?? 0) === minPrice ? 'text-success' : 'text-foreground'
                        }`}
                      >
                        BDT {(vendor.totalPrice ?? 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={vendor.status === 'compliant' ? 'success' : 'destructive'}>
                        {vendor.status === 'compliant' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {vendor.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Terms Comparison */}
      <Card>
        <CardHeader title="Commercial Terms Comparison" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Vendor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Delivery Time
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Warranty
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Payment Terms
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-border">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-foreground">{vendor.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-foreground">
                        {vendor.financial.deliveryTime}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-foreground">
                        {vendor.financial.warrantyPeriod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-foreground">
                        {vendor.financial.paymentTerms}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <Star className="w-5 h-5 text-success mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Recommended Vendor</p>
              <p className="text-sm text-muted-foreground mb-2">
                Based on the evaluation criteria (Technical: 60%, Financial: 40%), the recommended
                vendor is:
              </p>
              <p className="text-base font-semibold text-success">
                {sortedVendors[0].name} - Overall Score: {sortedVendors[0].overallScore ?? '—'}/100
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Price: BDT {(sortedVendors[0].totalPrice ?? 0).toLocaleString()}</span>
                <span>•</span>
                <span>Technical Score: {sortedVendors[0].technicalScore ?? '—'}/100</span>
                <span>•</span>
                <span>Financial Score: {sortedVendors[0].financialScore ?? '—'}/100</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
