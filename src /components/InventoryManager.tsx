/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Grid, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Tag, 
  X,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Product } from '../types';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  showAddFormByDefault?: boolean;
  onFormCloseDefault?: () => void;
}

export default function InventoryManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  showAddFormByDefault = false,
  onFormCloseDefault
}: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal/Form toggle states
  const [showForm, setShowForm] = useState(showAddFormByDefault);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsn, setHsn] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState<'pcs' | 'kgs' | 'ltrs' | 'box' | 'pack' | 'bags'>('pcs');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0);
  const [category, setCategory] = useState('Groceries');
  const [supplierName, setSupplierName] = useState('');

  // Trigger Edit Form
  const triggerEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setHsn(p.hsn || '');
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice);
    setSalePrice(p.salePrice);
    setGstRate(p.gstRate);
    setCategory(p.category);
    setSupplierName(p.supplierName || '');
    setShowForm(true);
  };

  // Trigger Add Form
  const triggerAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setHsn('');
    setStock(0);
    setMinStockAlert(5);
    setUnit('pcs');
    setPurchasePrice(0);
    setSalePrice(0);
    setGstRate(0);
    setCategory('Groceries');
    setSupplierName('');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    if (onFormCloseDefault) onFormCloseDefault();
  };

  // Submit Product Add/Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const targetProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim() || undefined,
      hsn: hsn.trim() || undefined,
      stock,
      minStockAlert,
      unit,
      purchasePrice,
      salePrice,
      gstRate,
      category,
      supplierName: supplierName.trim() || undefined
    };

    if (editingProduct) {
      onUpdateProduct(targetProduct);
    } else {
      onAddProduct(targetProduct);
    }

    handleClose();
  };

  // Categories list
  const categories = ['All', 'Groceries', 'Oil & Ghee', 'Household', 'Dairy & Bakery', 'Snacks & Packaged', 'Personal Care', 'Other'];

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.hsn && p.hsn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-3.5 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search by Product Name, SKU code, HSN tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg py-3 pl-10 pr-4 focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700 bg-white shadow-xs"
          />
        </div>

        {/* Action Button */}
        <button 
          onClick={triggerAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={16} /> Add Product Master
        </button>
      </div>

      {/* Category Pills Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Database Inventory Table List */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] text-slate-405 font-bold uppercase tracking-wider">
                <th className="p-4">SKU / HSN</th>
                <th className="p-4">Product Name & Supplier</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">In Stock & Status</th>
                <th className="p-4 text-right">Purchase (Cr)</th>
                <th className="p-4 text-right">Sales (Dr)</th>
                <th className="p-4 text-center">GST</th>
                <th className="p-4 text-center">Gross Profit Margin</th>
                <th className="p-4 text-center">Reorder Suggestion</th>
                <th className="p-4 text-center w-[12%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((p) => {
                const markup = p.salePrice - p.purchasePrice;
                const marginPercent = p.salePrice > 0 ? Math.round((markup / p.salePrice) * 100) : 0;
                const isLowStock = p.stock <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* SKU Codes */}
                    <td className="p-4">
                      {p.sku ? <div className="font-mono font-bold text-slate-700">{p.sku}</div> : <div className="text-slate-350 italic">No SKU</div>}
                      {p.hsn && <div className="text-[9px] text-slate-400 font-mono mt-0.5">HSN: {p.hsn}</div>}
                    </td>

                    {/* Name & Supplier info */}
                    <td className="p-4 font-bold text-slate-800">
                      <div>{p.name}</div>
                      {p.supplierName ? (
                        <div className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Supplier: {p.supplierName}</div>
                      ) : (
                        <div className="text-[10px] text-slate-350 italic font-sans mt-0.5">No supplier tag</div>
                      )}
                    </td>

                    {/* Category Label */}
                    <td className="p-4 text-slate-500 font-medium col-span-1">
                      <span className="flex items-center gap-1">
                        <Tag size={12} className="text-slate-420" />
                        {p.category}
                      </span>
                    </td>

                    {/* Available Stock levels */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-1 rounded font-bold font-mono text-xs ${
                          p.stock <= 0 ? 'bg-rose-50 text-rose-700' :
                          isLowStock ? 'bg-amber-50 text-amber-700 animate-pulse' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                        
                        {p.stock <= 0 ? (
                          <span className="text-[9px] text-rose-600 font-bold mt-1 uppercase">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-[9px] text-amber-600 font-semibold mt-1 flex items-center gap-0.5">
                            <AlertTriangle size={10} /> Low Stock Alert
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-600 font-semibold mt-1">Stock Safe</span>
                        )}
                      </div>
                    </td>

                    {/* Cost price */}
                    <td className="p-4 text-right font-mono font-medium text-slate-605">
                      ₹{p.purchasePrice.toFixed(2)}
                    </td>

                    {/* Retail price */}
                    <td className="p-4 text-right font-mono font-bold text-slate-800">
                      ₹{p.salePrice.toFixed(2)}
                    </td>

                    {/* Tax bracket */}
                    <td className="p-4 text-center font-mono font-medium text-slate-550">
                      {p.gstRate}%
                    </td>

                    {/* Profit margin */}
                    <td className="p-4 text-center font-mono">
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                        <TrendingUp size={11} className="shrink-0" />
                        {marginPercent}% (₹{markup.toFixed(0)})
                      </span>
                    </td>

                    {/* Reorder Suggestions info */}
                    <td className="p-4 text-center">
                      {isLowStock ? (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-indigo-750 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded block">
                            Reorder {p.minStockAlert * 3} {p.unit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold">-</span>
                      )}
                    </td>

                    {/* Options actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => triggerEdit(p)}
                          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-650 transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to retire ${p.name} from inventory?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded-md text-slate-350 hover:text-rose-600 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    No products matching filter. Click 'Add Product Master' to expand catalogue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlay Drawer Form for Add/Edit Product */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border text-left border-slate-150 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-slate-55 border-b border-slate-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600 animate-pulse" size={18} />
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingProduct ? `Edit Stock: ${editingProduct.name}` : 'Catalog New Product Entry'}
                </h3>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fortune Mustard Oil (1 Ltr)"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700 bg-white"
                />
              </div>

              {/* SKU & HSN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">SKU / Item Code</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. OIL-FOR-01"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">HSN Code (GST Class)</label>
                  <input 
                    type="text" 
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value)}
                    placeholder="e.g. 1514"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Initial Stock *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono font-bold text-slate-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Safety Min Alert *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono text-slate-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Stock Unit *</label>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-600 bg-white font-medium shadow-xs"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kgs">kgs (Kilograms)</option>
                    <option value="ltrs">ltrs (Litres)</option>
                    <option value="box">box (Boxes)</option>
                    <option value="pack">pack (Packets)</option>
                    <option value="bags">bags (Sacks/Bags)</option>
                  </select>
                </div>
              </div>

              {/* Financial values */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Cost Price (₹ PP) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono font-semibold text-slate-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Sale Price (₹ SP) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 font-mono font-bold text-slate-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">GST Bracket *</label>
                  <select 
                    value={gstRate}
                    onChange={(e) => setGstRate(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-650 bg-white"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Category & Category Selector */}
              <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Category Group</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-650 bg-white"
                  >
                    <option value="Groceries">Groceries & Grains</option>
                    <option value="Oil & Ghee">Oils, Ghee & Packaged Fats</option>
                    <option value="Household">Household Detergent, cleaning</option>
                    <option value="Dairy & Bakery">Fresh Dairy & Fresh Bakery</option>
                    <option value="Snacks & Packaged">Snacks, Namkeen & Biscuit packs</option>
                    <option value="Personal Care">Soaps, Crest & Personal Hygiene</option>
                    <option value="Other">General Store Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Supplier Name</label>
                  <input 
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. RK Distributors, Jaipur"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white"
                  />
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="text-xs bg-slate-50 hover:bg-slate-100 font-semibold py-2.5 px-4 rounded-lg border border-slate-200 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 font-bold py-2.5 px-6 rounded-lg text-white shadow-xs"
                >
                  {editingProduct ? 'Save Stock Profile' : 'Catalog Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
