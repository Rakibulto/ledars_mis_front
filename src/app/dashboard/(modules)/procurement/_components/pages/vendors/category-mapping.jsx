'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { Plus, Search, Building2, CheckCircle } from 'lucide-react';

import {
  Box,
  Table,
  Dialog,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useVendorList } from './use-vendor-api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from '../../../../../../../actions/ledars-hook';

export function VendorCategoryMapping() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);

  const { data: catApiData } = useGetRequest(endpoints.procurement_management.vendor_categories);
  const { data: vendorApiData } = useVendorList({ pageSize: 100, search: searchQuery });

  const categories = useMemo(() => {
    const results = Array.isArray(catApiData?.results)
      ? catApiData.results
      : Array.isArray(catApiData)
        ? catApiData
        : [];
    return results.map((c) => ({
      id: c.id,
      name: c.name || '',
      description: c.description || '',
      is_active: c.is_active ?? true,
      vendors: c.vendor_count ?? 0,
      icon: '📦',
    }));
  }, [catApiData]);

  const allVendors = useMemo(() => {
    const results = Array.isArray(vendorApiData?.results)
      ? vendorApiData.results
      : Array.isArray(vendorApiData)
        ? vendorApiData
        : [];
    return results.map((v) => ({
      id: v.id,
      name: v.name || '',
      categories: Array.isArray(v.categories) ? v.categories : [],
      status: v.status || 'active',
      rating: v.overall_rating ?? '-',
      orders: v.total_orders ?? 0,
    }));
  }, [vendorApiData]);

  const selectedCategoryObj =
    categories.find((c) => c.id === selectedCategory) || categories[0] || null;
  const selectedCategoryId = selectedCategoryObj?.id ?? null;

  const categoryVendors = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allVendors.filter((v) =>
      v.categories.some((cat) =>
        typeof cat === 'object' ? cat.id === selectedCategoryId : cat === selectedCategoryId
      )
    );
  }, [allVendors, selectedCategoryId]);

  const availableVendors = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allVendors.filter(
      (v) =>
        !v.categories.some((cat) =>
          typeof cat === 'object' ? cat.id === selectedCategoryId : cat === selectedCategoryId
        )
    );
  }, [allVendors, selectedCategoryId]);

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', is_active: true });
    setEditingCategory(null);
  };

  const openCategoryManager = () => {
    resetCategoryForm();
    setCategoryManagerOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await patchRequest(
          endpoints.procurement_management.vendor_category_by_id(editingCategory.id),
          categoryForm
        );
        toast.success('Category updated');
      } else {
        await createRequest(endpoints.procurement_management.vendor_categories, categoryForm);
        toast.success('Category created');
      }
      mutate(endpoints.procurement_management.vendor_categories);
      setCategoryManagerOpen(false);
      resetCategoryForm();
    } catch (error) {
      toast.error('Failed to save category');
      console.error(error);
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      is_active: category.is_active ?? true,
    });
    setCategoryManagerOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;

    try {
      await deleteRequest(endpoints.procurement_management.vendor_category_by_id(deleteCategoryId));
      toast.success('Category deleted');
      setDeleteCategoryId(null);
      mutate(endpoints.procurement_management.vendor_categories);
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Vendor Category Mapping
        </h1>
        <p className="text-muted-foreground">Manage vendor assignments to procurement categories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <Card>
          <CardHeader
            title="Categories"
            description="Procurement categories"
            action={
              <Button variant="outline" size="sm" onClick={openCategoryManager}>
                Manage categories
              </Button>
            }
          />
          <CardBody>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCategory(category.id);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedCategoryId === category.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Vendors</span>
                    <Badge variant="default" size="sm">
                      {category.vendors}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Assigned Vendors */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={`Vendors in ${selectedCategoryObj?.name ?? 'Category'}`}
              description="Currently assigned vendors"
              action={
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </Button>
              }
            />
            <CardBody>
              <div className="space-y-3">
                {categoryVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">{vendor.name}</h4>
                          <p className="text-xs text-muted-foreground">{vendor.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="text-sm font-semibold text-foreground">{vendor.rating}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Orders</p>
                        <p className="text-sm font-semibold text-foreground">{vendor.orders}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Categories</p>
                        <p className="text-sm font-semibold text-foreground">
                          {vendor.categories.length}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {vendor.categories.map((cat, idx) => {
                        const catName = typeof cat === 'object' ? cat.name : cat;
                        return (
                          <Badge key={idx} variant="default" size="sm">
                            {catName}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Available Vendors to Add */}
          <Card>
            <CardHeader title="Available Vendors" description="Add vendors to this category" />
            <CardBody>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {availableVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.id}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Dialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Manage Vendor Categories'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            <Typography variant="subtitle2">
              {editingCategory ? 'Update category details' : 'Create a new vendor category'}
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={categoryForm.is_active}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, is_active: e.target.checked })
                  }
                />
              }
              label={categoryForm.is_active ? 'Active' : 'Inactive'}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Category list
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Vendors</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || '—'}</TableCell>
                      <TableCell>{category.is_active ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{category.vendors}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEditCategory(category)}>
                          <Icon icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteCategoryId(category.id)}
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => {
              setCategoryManagerOpen(false);
              resetCategoryForm();
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveCategory}>
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCategoryId} onClose={() => setDeleteCategoryId(null)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this category? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outline" onClick={() => setDeleteCategoryId(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDeleteCategory}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
