import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Scan,
  LayoutDashboard,
  FileDown,
  FileUp,
  Search,
  Settings,
  ChevronRight,
  Printer,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User as UserIcon,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Bell,
  Menu,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Barcode from 'react-barcode';
import { InventoryItem, ViewState, User, AuditLog } from './types';
import { api } from './utils/api';
import { cn, formatDate, formatCurrency } from './lib/utils';

const CATEGORIES = ['CABLE', 'COMMUNICATION', 'SOUND', 'PEREPHERALS', 'NETWORK', 'MONITOR'];
const STATUS_TYPES = ['CHURCH', 'DONATION'];

const Scanner = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode("reader");

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
            html5QrCode.stop().catch(() => {});
          },
          () => {}
        );
        scanner = html5QrCode;
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Camera access denied');
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Scan QR Code</h2>
          <p className="text-zinc-400 text-sm">Align the QR code within the frame</p>
        </div>

        {loading && !error && (
          <div className="w-full aspect-square flex items-center justify-center">
            <div className="text-white">Loading camera...</div>
          </div>
        )}

        {error && (
          <div className="w-full p-4 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-zinc-400 text-sm">Please allow camera access in your browser settings</p>
          </div>
        )}

        <div id="reader" className="w-full"></div>
      </div>
    </div>
  );
};

const StickerPreview = ({ item, onClose }: { item: InventoryItem, onClose: () => void }) => {
  const qrValue = `${item.name}|${item.category}|${item.type}|${item.serialNumber}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh] print:shadow-none print:rounded-none print:max-h-full"
      >
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between print:hidden">
          <h2 className="font-bold text-zinc-900">Sticker Preview (3" x 2")</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="p-8 flex justify-center bg-zinc-50 print:bg-white">
          <div
            id="sticker-canvas"
            className="w-[450px] h-[300px] bg-white border border-dashed border-zinc-300 shadow-lg flex p-4 print:border-none print:shadow-none"
          >
            <div className="w-1/3 flex items-center justify-center border-r border-zinc-100 pr-4">
              <QRCodeSVG value={qrValue} size={120} level="M" />
            </div>

            <div className="w-2/3 pl-6 flex flex-col justify-center gap-1 overflow-hidden">
              <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1">Asset Tag</div>
              <h1 className="text-2xl font-black text-zinc-900 leading-tight uppercase truncate">{item.name}</h1>
              <div className="flex gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-900 text-white rounded-sm uppercase">
                  {item.category}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-sm uppercase">
                  {item.type}
                </span>
              </div>

              <div className="mt-auto overflow-hidden">
                <Barcode
                  value={item.serialNumber}
                  width={1.5}
                  height={40}
                  fontSize={10}
                  margin={0}
                  background="transparent"
                />
              </div>

              <div className="mt-2 space-y-0.5 border-t border-zinc-100 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase w-12 text-right">Serial:</span>
                  <span className="text-xs font-mono font-bold text-zinc-900">{item.serialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase w-12 text-right">Date:</span>
                  <span className="text-xs font-medium text-zinc-700">{formatDate(item.dateAcquisition)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 border-t border-blue-100 print:hidden">
          <div className="flex gap-3">
            <div className="p-2 bg-blue-100 rounded-full h-fit">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Printing Tips</h4>
              <p className="text-blue-800/70 text-xs mt-1">
                For thermal printers, set your page size to 3" x 2" (76mm x 51mm) in the browser print dialog.
                Ensure "Headers and Footers" are unchecked.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [activeType, setActiveType] = useState('All');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '' });

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    description: '',
    serialNumber: '',
    quantity: 1,
    minStockLevel: 5,
    category: 'NETWORK',
    type: 'CHURCH',
    datePurchase: new Date().toISOString().split('T')[0],
    dateAcquisition: new Date().toISOString().split('T')[0],
    price: 0
  });

  useEffect(() => {
    const token = api.auth.getToken();
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token));
        if (tokenData.exp > Date.now()) {
          setUser({ id: tokenData.userId, email: tokenData.email, fullName: '' });
          setView('dashboard');
        }
      } catch {}
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, logsData] = await Promise.all([
        api.items.getAll(),
        api.logs.getAll()
      ]);
      setItems(itemsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const calculateStatus = (quantity: number, minLevel: number): 'IN' | 'OUT' | 'LOW' => {
    if (quantity <= 0) return 'OUT';
    if (quantity <= minLevel) return 'LOW';
    return 'IN';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.auth.login(loginForm.email, loginForm.password);
      setUser({ ...result.user, fullName: result.user.fullName || 'Admin' });
      setView('dashboard');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.auth.register(registerForm.email, registerForm.password, registerForm.fullName);
      setUser(result.user);
      setView('dashboard');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setView('login');
  };

  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) buffer = '';
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          handleScan(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  const validateItem = (item: Partial<InventoryItem>, isUpdate = false): boolean => {
    const errors: Record<string, string> = {};

    if (!item.name?.trim()) errors.name = 'Name is required';
    if (!item.serialNumber?.trim()) errors.serialNumber = 'Serial number is required';
    else {
      const isDuplicate = items.some(i =>
        i.serialNumber.toLowerCase() === item.serialNumber?.toLowerCase() &&
        (!isUpdate || i.id !== item.id)
      );
      if (isDuplicate) errors.serialNumber = 'Serial number already exists in inventory';
    }

    if (item.quantity === undefined || item.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }

    if (item.price === undefined || item.price < 0) {
      errors.price = 'Price cannot be negative';
    }

    if (!item.datePurchase) errors.datePurchase = 'Purchase date is required';
    if (!item.dateAcquisition) errors.dateAcquisition = 'Acquisition date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateItem(formData)) return;

    setLoading(true);
    try {
      const newItem: InventoryItem = {
        ...formData as InventoryItem,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: calculateStatus(formData.quantity || 0, formData.minStockLevel || 5)
      };

      await api.items.create(newItem);

      if (user) {
        await api.logs.create({
          userId: user.id,
          userFullName: user.fullName,
          action: 'ADD',
          itemId: newItem.id,
          itemName: newItem.name,
          details: `Initial quantity: ${newItem.quantity}`
        });
      }

      await loadData();
      setFormData({
        name: '',
        description: '',
        serialNumber: '',
        quantity: 1,
        minStockLevel: 5,
        category: 'NETWORK',
        type: 'CHURCH',
        datePurchase: new Date().toISOString().split('T')[0],
        dateAcquisition: new Date().toISOString().split('T')[0],
        price: 0
      });
      setFormErrors({});
      setView('dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!validateItem(selectedItem, true)) return;

    setLoading(true);
    try {
      const oldItem = items.find(i => i.id === selectedItem.id);
      const updatedItem = {
        ...selectedItem,
        status: calculateStatus(selectedItem.quantity, selectedItem.minStockLevel)
      };

      await api.items.update(updatedItem);

      if (user && oldItem) {
        if (oldItem.quantity !== updatedItem.quantity) {
          const action = updatedItem.quantity > oldItem.quantity ? 'STOCK_IN' : 'STOCK_OUT';
          await api.logs.create({
            userId: user.id,
            userFullName: user.fullName,
            action,
            itemId: updatedItem.id,
            itemName: updatedItem.name,
            details: `Quantity changed from ${oldItem.quantity} to ${updatedItem.quantity}`
          });
        } else {
          await api.logs.create({
            userId: user.id,
            userFullName: user.fullName,
            action: 'UPDATE',
            itemId: updatedItem.id,
            itemName: updatedItem.name,
            details: 'Record updated'
          });
        }
      }

      await loadData();
      setFormErrors({});
      setView('dashboard');
      setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.items.delete(id);

        if (user && itemToDelete) {
          await api.logs.create({
            userId: user.id,
            userFullName: user.fullName,
            action: 'DELETE',
            itemId: itemToDelete.id,
            itemName: itemToDelete.name,
            details: 'Item removed from system'
          });
        }

        await loadData();
        setView('dashboard');
        setSelectedItem(null);
      } catch (err: any) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  const handleScan = (data: string) => {
    setScannerActive(false);
    const parts = data.split('|');
    const sn = parts.length > 2 ? parts[2] : data;

    const found = items.find(item => item.serialNumber === sn || item.name === parts[0]);

    if (found) {
      setSelectedItem(found);
      setView('details');
    } else {
      alert(`Item not found for: ${sn}. Click "Add New" to register this serial number.`);
      setFormData(prev => ({ ...prev, serialNumber: sn }));
      setView('register');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const allLines = text.split('\n');

        const newItems: InventoryItem[] = [];
        let imported = 0;

        for (let i = 0; i < allLines.length; i++) {
          const rawLine = allLines[i];
          const line = rawLine.trim();

          if (!line) continue;
          if (line.startsWith('INVENTORY') || line.startsWith('Note:') || line.includes('Prepared by')) continue;
          if (line.includes('CHURCH =') || line.includes('DONATION =') || line.includes('PERSONAL =') || line.includes('TOTAL=')) continue;

          const values = line.split(',').map(v => v.trim());

          if (values.length >= 4) {
            const name = values[0];
            if (!name || name === 'ITEMS' || name === 'items') continue;

            const qty = parseInt(values[1]) || 1;
            const typeRaw = (values[2] || 'CHURCH').toUpperCase().trim();
            const categoryRaw = (values[3] || 'NETWORK').toUpperCase().trim();
            const dateAcq = values[5] || '';

            const categoryMap: Record<string, string> = {
              'CABLE': 'CABLE', 'COMMUNICATION': 'COMMUNICATION', 'SOUND': 'SOUND',
              'PEREPHERALS': 'PEREPHERALS', 'NETWORK': 'NETWORK', 'MONITOR': 'MONITOR',
              'PERSONAL': 'PEREPHERALS', 'PERIPHERALS': 'PEREPHERALS'
            };

            const typeValues = ['CHURCH', 'DONATION'];
            const cleanCategory = categoryMap[categoryRaw] || 'NETWORK';
            const cleanType = typeValues.includes(typeRaw) ? typeRaw : 'CHURCH';

            newItems.push({
              id: crypto.randomUUID(),
              name: name,
              description: '',
              serialNumber: `SN-${Date.now()}-${imported.toString().padStart(4, '0')}`,
              quantity: qty,
              minStockLevel: 5,
              category: cleanCategory,
              type: cleanType,
              datePurchase: dateAcq || new Date().toISOString().split('T')[0],
              dateAcquisition: dateAcq || new Date().toISOString().split('T')[0],
              price: 0,
              createdAt: new Date().toISOString(),
              status: calculateStatus(qty, 5)
            });
            imported++;
          }
        }

        if (newItems.length === 0) {
          alert('No valid items found. Please check CSV format.');
          return;
        }

        for (const item of newItems) {
          await api.items.create(item);
        }

        if (user) {
          await api.logs.create({
            userId: user.id,
            userFullName: user.fullName,
            action: 'UPDATE',
            itemId: 'BATCH_IMPORT',
            itemName: file.name,
            details: `Imported ${newItems.length} records via CSV`
          });
        }

        await loadData();
        alert(`Successfully imported ${newItems.length} items!`);
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to import CSV. Please check formatting.');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['id', 'name', 'description', 'serialNumber', 'quantity', 'minStockLevel', 'category', 'type', 'datePurchase', 'dateAcquisition', 'price', 'status', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...items.map(item =>
        headers.map(h => {
          const val = (item as any)[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeType === 'All' || item.category === activeType;
    return matchesSearch && matchesType;
  });

  const lowStockItems = items.filter(i => i.status === 'LOW' || i.status === 'OUT');

  const types = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0 flex overflow-hidden">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sticker-canvas, #sticker-canvas * { visibility: visible; }
          #sticker-canvas {
            position: fixed;
            left: 0;
            top: 0;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 flex-col z-40">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">QTrack Pro</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setView('dashboard')}
            className={cn(
              "w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
              view === 'dashboard'
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setView('inventory')}
            className={cn(
              "w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
              view === 'inventory'
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Menu className="w-5 h-5" /> Full Inventory
          </button>
          <button
            onClick={() => setView('audit_log')}
            className={cn(
              "w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
              view === 'audit_log'
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <History className="w-5 h-5" /> Audit Log
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                serialNumber: '',
                quantity: 1,
                minStockLevel: 5,
                category: 'NETWORK',
                type: 'CHURCH',
                datePurchase: new Date().toISOString().split('T')[0],
                dateAcquisition: new Date().toISOString().split('T')[0],
                price: 0
              });
              setView('register');
            }}
            className={cn(
              "w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
              view === 'register'
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Plus className="w-5 h-5" /> Register Item
          </button>
          <button
            onClick={() => setScannerActive(true)}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Scan className="w-5 h-5" /> Scan QR Code
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Data Management</h3>
            <button
              onClick={exportToCSV}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <FileDown className="w-4 h-4" /> Export Excel
            </button>
            <label className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all">
              <FileUp className="w-4 h-4" /> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System</h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-1 py-1 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {view === 'dashboard' || view === 'inventory' || view === 'audit_log' ? (
              <div className="relative w-full max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Universal search..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            ) : (
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest">
                {view === 'register' && 'Add New Asset'}
                {view === 'details' && 'Asset Configuration'}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-4 mr-4">
              <label className="p-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer" title="Import Excel/CSV">
                <FileUp className="w-5 h-5" />
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              <button
                onClick={exportToCSV}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                title="Export Excel"
              >
                <FileDown className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                if (view === 'dashboard') {
                  setFormData({
                    name: '',
                    description: '',
                    serialNumber: '',
                    quantity: 1,
                    minStockLevel: 5,
                    category: 'NETWORK',
                    type: 'CHURCH',
                    datePurchase: new Date().toISOString().split('T')[0],
                    dateAcquisition: new Date().toISOString().split('T')[0],
                    price: 0
                  });
                  setView('register');
                } else {
                  setView('dashboard');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 flex items-center gap-2"
            >
              {view === 'dashboard' ? <><Plus className="w-4 h-4" /> New Entry</> : 'Back to Dashboard'}
            </button>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-black text-xs text-blue-600 border-2 border-white shadow-sm">
              {user?.fullName.split(' ').map(n => n[0]).join('') || 'A'}
            </div>
          </div>
        </header>

        <section className="flex-1 p-4 md:p-8">
          <AnimatePresence>
            {lowStockItems.length > 0 && (view === 'dashboard' || view === 'inventory') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-rose-600 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-900 text-sm">Low Stock Alert</h4>
                      <p className="text-rose-700 text-xs">There are {lowStockItems.length} items that require restocking or are out of inventory.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSearch('status:low');
                      setActiveType('All');
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all"
                  >
                    Review Now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {view === 'dashboard' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[8px]">Assets</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{items.length}</h3>
                  <p className="text-xs text-slate-500 font-medium">Total registered products</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[8px]">Valuation</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{formatCurrency(items.reduce((acc, i) => acc + (i.price * i.quantity), 0))}</h3>
                  <p className="text-xs text-slate-500 font-medium">Total inventory value</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[8px]">Critical</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{items.filter(i => i.status === 'OUT').length}</h3>
                  <p className="text-xs text-slate-500 font-medium">Products currently out</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Bell className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[8px]">Attention</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{items.filter(i => i.status === 'LOW').length}</h3>
                  <p className="text-xs text-slate-500 font-medium">Items near restock level</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6">Category Distribution</h3>
                  <div className="space-y-4">
                    {CATEGORIES.map(category => {
                      const count = items.filter(i => i.category === category).length;
                      const percentage = Math.round((count / items.length) * 100) || 0;
                      return (
                        <div key={category} className="space-y-1.5 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded transition-colors" onClick={() => { setActiveType(category); setView('inventory'); }}>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">{category}</span>
                            <span className="text-slate-400">{count} Units ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-100">
                    <Scan className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 italic">Universal Scanning Ready</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-xs">Supports USB Barcode Readers and Camera-based QR/Barcode scanning instantly.</p>
                  <button
                    onClick={() => setScannerActive(true)}
                    className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    Open Scanner
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="flex flex-col gap-8">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                      <Menu className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-slate-800">Inventory Master Sheet</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      value={activeType}
                      onChange={(e) => setActiveType(e.target.value)}
                    >
                      {types.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                      <FileDown className="w-4 h-4" /> Download Excel
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Asset Identity</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Source / Type</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Serial Number</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">In Stock</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Value</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setView('details');
                          }}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 border-r border-slate-50">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 leading-tight">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{item.description || 'No description provided'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded uppercase">{item.category || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded uppercase">{item.type || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-500">{item.serialNumber}</td>
                          <td className="px-6 py-4 font-black text-slate-900">{item.quantity}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{formatCurrency(item.price * item.quantity)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                item.status === 'IN' ? "bg-emerald-100 text-emerald-700" :
                                item.status === 'LOW' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No items matching these criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'audit_log' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-white">
                      <History className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-slate-800">System Activity Audit</h2>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Showing latest 500 records</span>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timestamp</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">User</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600">
                                {log.userFullName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-bold text-slate-700">{log.userFullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-center block w-24",
                              log.action === 'ADD' ? "bg-emerald-100 text-emerald-700" :
                              log.action === 'STOCK_IN' ? "bg-blue-100 text-blue-700" :
                              log.action === 'STOCK_OUT' ? "bg-orange-100 text-orange-700" :
                              log.action === 'UPDATE' ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700"
                            )}>
                              {log.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900">{log.itemName}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium text-xs italic">"{log.details}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <History className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No activity logs recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(view === 'register' || view === 'details') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 leading-none">Asset Registration</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Item Identity & Logistics</p>
                    </div>
                  </div>
                  {view === 'details' && selectedItem && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setView('sticker')}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Label Preview
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={view === 'register' ? handleAddItem : handleUpdateItem} className="p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Asset Name</label>
                        <input
                          required
                          className={cn(
                            "w-full px-4 py-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold",
                            formErrors.name ? "border-rose-500 bg-rose-50" : "border-slate-200"
                          )}
                          value={view === 'register' ? formData.name : selectedItem?.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (view === 'register') setFormData({...formData, name: val});
                            else setSelectedItem(prev => prev ? {...prev, name: val} : null);
                            if (formErrors.name) setFormErrors(prev => {
                              const newErrs = {...prev};
                              delete newErrs.name;
                              return newErrs;
                            });
                          }}
                        />
                        {formErrors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{formErrors.name}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Category</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                          value={view === 'register' ? formData.category : selectedItem?.category}
                          onChange={(e) => view === 'register'
                            ? setFormData({...formData, category: e.target.value})
                            : setSelectedItem(prev => prev ? {...prev, category: e.target.value} : null)}
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Type / Source</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold appearance-none cursor-pointer"
                          value={view === 'register' ? formData.type : selectedItem?.type}
                          onChange={(e) => view === 'register'
                            ? setFormData({...formData, type: e.target.value})
                            : setSelectedItem(prev => prev ? {...prev, type: e.target.value} : null)}
                        >
                          {STATUS_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Internal Reference / Notes</label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                          value={view === 'register' ? formData.description : selectedItem?.description}
                          onChange={(e) => view === 'register'
                            ? setFormData({...formData, description: e.target.value})
                            : setSelectedItem(prev => prev ? {...prev, description: e.target.value} : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Serial Number</label>
                          <input
                            required
                            className={cn(
                              "w-full px-4 py-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs font-bold transition-all uppercase",
                              formErrors.serialNumber ? "border-rose-500 bg-rose-50" : "border-slate-200"
                            )}
                            value={view === 'register' ? formData.serialNumber : selectedItem?.serialNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (view === 'register') setFormData({...formData, serialNumber: val});
                              else setSelectedItem(prev => prev ? {...prev, serialNumber: val} : null);
                              if (formErrors.serialNumber) setFormErrors(prev => {
                                const newErrs = {...prev};
                                delete newErrs.serialNumber;
                                return newErrs;
                              });
                            }}
                          />
                          {formErrors.serialNumber && <p className="text-[10px] text-rose-500 font-bold ml-1 leading-tight">{formErrors.serialNumber}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Current Qty</label>
                          <input
                            required
                            type="number"
                            min="0"
                            className={cn(
                              "w-full px-4 py-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-black transition-all",
                              formErrors.quantity ? "border-rose-500 bg-rose-50" : "border-slate-200"
                            )}
                            value={view === 'register' ? formData.quantity : selectedItem?.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              if (view === 'register') setFormData({...formData, quantity: val});
                              else setSelectedItem(prev => prev ? {...prev, quantity: val} : null);
                              if (formErrors.quantity) setFormErrors(prev => {
                                const newErrs = {...prev};
                                delete newErrs.quantity;
                                return newErrs;
                              });
                            }}
                          />
                          {formErrors.quantity && <p className="text-[10px] text-rose-500 font-bold ml-1">{formErrors.quantity}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Min Level</label>
                          <input
                            required
                            type="number"
                            min="1"
                            placeholder="Low stock alert at..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-black transition-all"
                            value={view === 'register' ? formData.minStockLevel : selectedItem?.minStockLevel}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 5;
                              if (view === 'register') setFormData({...formData, minStockLevel: val});
                              else setSelectedItem(prev => prev ? {...prev, minStockLevel: val} : null);
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Purchased</label>
                          <input
                            type="date"
                            required
                            className={cn(
                              "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold transition-all text-xs",
                              formErrors.datePurchase ? "border-rose-500 bg-rose-50" : "border-slate-200"
                            )}
                            value={view === 'register' ? formData.datePurchase : selectedItem?.datePurchase}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (view === 'register') setFormData({...formData, datePurchase: val});
                              else setSelectedItem(prev => prev ? {...prev, datePurchase: val} : null);
                              if (formErrors.datePurchase) setFormErrors(prev => {
                                const newErrs = {...prev};
                                delete newErrs.datePurchase;
                                return newErrs;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Deployed</label>
                          <input
                            type="date"
                            required
                            className={cn(
                              "w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold transition-all text-xs",
                              formErrors.dateAcquisition ? "border-rose-500 bg-rose-50" : "border-slate-200"
                            )}
                            value={view === 'register' ? formData.dateAcquisition : selectedItem?.dateAcquisition}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (view === 'register') setFormData({...formData, dateAcquisition: val});
                              else setSelectedItem(prev => prev ? {...prev, dateAcquisition: val} : null);
                              if (formErrors.dateAcquisition) setFormErrors(prev => {
                                const newErrs = {...prev};
                                delete newErrs.dateAcquisition;
                                return newErrs;
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Valuation (PHP)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={cn(
                              "w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 font-black transition-all",
                              formErrors.price ? "border-rose-500 bg-rose-50" : "border-slate-200"
                            )}
                            value={view === 'register' ? formData.price : selectedItem?.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (view === 'register') setFormData({...formData, price: val});
                              else setSelectedItem(prev => prev ? {...prev, price: val} : null);
                              if (formErrors.price) setFormErrors(prev => {
                                const newErrs = {...prev};
                                delete newErrs.price;
                                return newErrs;
                              });
                            }}
                          />
                        </div>
                        {formErrors.price && <p className="text-[10px] text-rose-500 font-bold ml-1">{formErrors.price}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 -mx-8 -mb-8 p-8">
                    <div className="flex gap-4">
                      {view === 'details' && selectedItem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(selectedItem.id)}
                          className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                        >
                          <Trash2 className="w-4 h-4" /> Withdraw Asset
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setView('dashboard');
                          setSelectedItem(null);
                        }}
                        className="px-6 py-3 bg-white text-slate-500 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-3 bg-blue-600 text-white rounded-lg font-black tracking-tight hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-3 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {loading ? 'Processing...' : (view === 'register' ? 'Confirm Registration' : 'Update Record')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 h-full bg-slate-900 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <span className="text-white font-black">QTrack</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="p-4 space-y-2">
                <button
                  onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-3 font-bold text-sm"
                >
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </button>
                <button
                  onClick={() => { setView('inventory'); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-3 font-bold text-sm"
                >
                  <Menu className="w-5 h-5" /> Full Inventory
                </button>
                <button
                  onClick={() => { setView('audit_log'); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-3 font-bold text-sm"
                >
                  <History className="w-5 h-5" /> Audit Log
                </button>
                <button
                  onClick={() => { setView('register'); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-3 font-bold text-sm"
                >
                  <Plus className="w-5 h-5" /> Add New
                </button>
                <button
                  onClick={() => { exportToCSV(); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-3 font-bold text-sm"
                >
                  <FileDown className="w-5 h-5" /> Export Data
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-3 font-bold text-sm mt-8"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {scannerActive && <Scanner onScan={handleScan} onClose={() => setScannerActive(false)} />}
      {view === 'sticker' && selectedItem && <StickerPreview item={selectedItem} onClose={() => setView('details')} />}

      {view === 'login' && (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">QTrack Inventory</h1>
              <p className="text-slate-500 mt-2 font-medium">Please sign in to your professional account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@qtrack.io"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Authenticate'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">
                New to QTrack?{' '}
                <button onClick={() => setView('register-form')} className="text-blue-600 font-bold hover:underline">
                  Create Account
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {view === 'register-form' && (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Create Account</h1>
              <p className="text-slate-500 mt-2 font-medium">Get started with QTrack Inventory</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@qtrack.io"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}