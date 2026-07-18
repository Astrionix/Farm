'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  ListFilter, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Layers,
  ShoppingBag,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { dbService, DBInventoryItem, DBInventoryTransaction } from '../services/db';

export default function InventoryModule() {
  const [inventory, setInventory] = useState<DBInventoryItem[]>([]);
  const [transactions, setTransactions] = useState<DBInventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [txType, setTxType] = useState<'Purchase' | 'Consumption'>('Purchase');
  const [quantity, setQuantity] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [formMsg, setFormMsg] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    loadInventoryData();
  }, []);

  async function loadInventoryData() {
    setLoading(true);
    try {
      const items = await dbService.getInventory();
      const txs = await dbService.getInventoryTransactions();
      setInventory(items);
      setTransactions(txs);
      if (items.length > 0) {
        setSelectedItemId(items[0].id);
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormError('');

    const qtyNum = Number(quantity);
    if (!selectedItemId || isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Please enter a valid quantity greater than zero.');
      return;
    }

    const selectedItem = inventory.find(i => i.id === selectedItemId);
    if (txType === 'Consumption' && selectedItem && selectedItem.stockLevel < qtyNum) {
      setFormError(`Insufficient stock. Only ${selectedItem.stockLevel} ${selectedItem.uom} available.`);
      return;
    }

    try {
      await dbService.addInventoryTransaction(
        selectedItemId,
        txType,
        qtyNum,
        remarks,
        reference
      );

      setFormMsg(`Transaction logged: ${txType} of ${qtyNum} recorded successfully.`);
      setQuantity('');
      setReference('');
      setRemarks('');
      
      // Reload inventory
      await loadInventoryData();
    } catch (err) {
      console.error('Transaction failed:', err);
      setFormError('An error occurred while saving the transaction.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Inventory & Stocks Ledger
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor farm feed reserves, vaccines, packaging boxes, and track purchases
          </p>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {inventory.map(item => {
          const isLow = item.stockLevel < item.reorderLevel;
          const isSuperOptimal = item.stockLevel > item.reorderLevel * 3;
          
          let cardBorder = 'border-slate-100 dark:border-slate-800';
          let statusBadgeColor = 'bg-primary/10 text-primary border-primary/20';
          let statusText = 'Optimal Stock';

          if (isLow) {
            cardBorder = 'border-l-4 border-l-red-500 border-red-100 dark:border-red-950/40';
            statusBadgeColor = 'bg-red-50 dark:bg-red-950/40 text-red-500 border-red-200/50 dark:border-red-900/30';
            statusText = 'Critically Low';
          } else if (isSuperOptimal) {
            statusBadgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            statusText = 'Well Stocked';
          }

          return (
            <div key={item.id} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border ${cardBorder} shadow-premium relative group flex flex-col justify-between min-h-40`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">{item.category}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${statusBadgeColor}`}>
                  {statusText}
                </span>
              </div>

              <div className="mt-3">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight truncate">{item.itemName}</h4>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {Math.round(item.stockLevel).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{item.uom}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-2.5 mt-3 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Reorder Qty: {item.reorderLevel} {item.uom}</span>
                {item.expiryDate && (
                  <span className="text-amber-500">Exp: {item.expiryDate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction & Stock Adjustment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Portal Form */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
              Log Stock Transaction
            </h3>
          </div>

          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            {formMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                {formMsg}
              </div>
            )}
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Select Item */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inventory Item</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                required
              >
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.category}] {item.itemName} ({Math.round(item.stockLevel)} {item.uom} left)
                  </option>
                ))}
              </select>
            </div>

            {/* Tx Type Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType('Purchase')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase ${
                    txType === 'Purchase'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Purchase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('Consumption')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase ${
                    txType === 'Consumption'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Consumption</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quantity</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reference / Doc ID</label>
              <input
                type="text"
                placeholder="e.g. Inv-9281, Shed-3 Use"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Remarks</label>
              <textarea
                placeholder="Details of purchase or usage..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary h-20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </form>
        </div>

        {/* Transaction History Ledger */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                Transaction Ledger
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Showing last 20 operations</span>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Item</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2 text-right">Quantity</th>
                  <th className="py-3 px-2">Ref</th>
                  <th className="py-3 px-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/40 font-semibold text-slate-700 dark:text-slate-300">
                {transactions.slice(0, 15).map(tx => {
                  const matchItem = inventory.find(i => i.id === tx.inventoryId);
                  const isPurchase = tx.transactionType === 'Purchase';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                      <td className="py-3 px-2 text-[10px] font-bold text-slate-400">{tx.date}</td>
                      <td className="py-3 px-2 leading-tight">
                        <span className="font-bold text-slate-800 dark:text-white">{matchItem?.itemName || 'Unknown Item'}</span>
                        <span className="block text-[9px] text-slate-400 font-semibold">{matchItem?.category}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          isPurchase ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-50 text-red-500 border border-red-100'
                        }`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-right font-black text-xs ${isPurchase ? 'text-primary' : 'text-red-500'}`}>
                        {isPurchase ? '+' : '-'}{Math.round(tx.quantity).toLocaleString()} {matchItem?.uom}
                      </td>
                      <td className="py-3 px-2 text-[10px] text-slate-400 max-w-[80px] truncate">{tx.reference || '—'}</td>
                      <td className="py-3 px-2 text-[10px] text-slate-400 max-w-[140px] truncate" title={tx.remarks}>{tx.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
