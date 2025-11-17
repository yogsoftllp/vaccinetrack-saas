import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Calendar,
  TrendingDown,
  Edit,
  Trash2,
  BarChart3,
  FileText
} from 'lucide-react';
import { inventoryAPI, InventoryItem, Vaccine, InventoryTransaction } from '../utils/inventoryAPI';
import { useFeatureFlag } from '../components/FeatureFlag';
import { toast } from 'sonner';

const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'expired'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const [expiredVaccines, setExpiredVaccines] = useState<Vaccine[]>([]);

  // Feature flags
  const { isEnabled: inventoryManagementEnabled } = useFeatureFlag('inventory_management');
  const { isEnabled: advancedInventoryEnabled } = useFeatureFlag('advanced_inventory_features');
  const { isEnabled: inventoryAnalyticsEnabled } = useFeatureFlag('inventory_analytics');

  useEffect(() => {
    if (inventoryManagementEnabled) {
      fetchInventoryData();
    }
  }, [inventoryManagementEnabled]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [items, vaccineList, lowStock, expired] = await Promise.all([
        inventoryAPI.getInventoryItems({ search: searchTerm, low_stock: statusFilter === 'low_stock' }),
        inventoryAPI.getVaccines({ is_active: true }),
        inventoryAPI.getLowStockAlerts(),
        inventoryAPI.getExpiredVaccines()
      ]);
      
      setInventoryItems(items);
      setVaccines(vaccineList);
      setLowStockAlerts(lowStock);
      setExpiredVaccines(expired);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchInventoryData();
  };

  const handleStatusFilter = (status: 'all' | 'low_stock' | 'expired') => {
    setStatusFilter(status);
    fetchInventoryData();
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return { status: 'out_of_stock', color: 'destructive' };
    if (item.current_stock <= item.reorder_point) return { status: 'low_stock', color: 'warning' };
    return { status: 'in_stock', color: 'success' };
  };

  const getStockStatusBadge = (item: InventoryItem) => {
    const stockStatus = getStockStatus(item);
    const statusLabels = {
      out_of_stock: 'Out of Stock',
      low_stock: 'Low Stock',
      in_stock: 'In Stock'
    };

    return (
      <Badge variant={stockStatus.color as any}>
        {statusLabels[stockStatus.status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!inventoryManagementEnabled) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management Disabled</h2>
          <p className="text-gray-600 mb-4">
            This feature is not available in your current subscription plan.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator to enable inventory management features.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="h-12 bg-gray-200 rounded-t-lg"></div>
            <div className="p-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccine Inventory</h1>
          <p className="text-gray-600">Manage your vaccine stock and track inventory levels</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockAlerts.length > 0 || expiredVaccines.length > 0) && (
        <div className="space-y-3">
          {lowStockAlerts.length > 0 && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-800">Low Stock Alert</h3>
                  <p className="text-sm text-yellow-700">
                    {lowStockAlerts.length} item{lowStockAlerts.length > 1 ? 's' : ''} need restocking
                  </p>
                </div>
              </div>
            </Card>
          )}
          {expiredVaccines.length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800">Expired Vaccines</h3>
                  <p className="text-sm text-red-700">
                    {expiredVaccines.length} vaccine{expiredVaccines.length > 1 ? 's' : ''} have expired
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search vaccines..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <option value="all">All Items</option>
            <option value="low_stock">Low Stock</option>
            <option value="expired">Expired</option>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <option value="">All Locations</option>
            <option value="main_storage">Main Storage</option>
            <option value="refrigerator">Refrigerator</option>
            <option value="freezer">Freezer</option>
          </Select>
        </div>
      </Card>

      {/* Analytics (if enabled) */}
      {inventoryAnalyticsEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockAlerts.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">{expiredVaccines.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(inventoryItems.reduce((sum, item) => 
                    sum + (item.current_stock * (item.vaccines?.unit_cost || 0)), 0))}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vaccine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {advancedInventoryEnabled && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.vaccines?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.vaccines?.abbreviation} • {item.vaccines?.manufacturer}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.current_stock} units
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minimum_stock} • Max: {item.maximum_stock}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.vaccines?.unit_cost || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(item.vaccines?.expiration_date || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockStatusBadge(item)}
                  </td>
                  {advancedInventoryEnabled && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowTransactionModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals would go here */}
      {/* AddModal, TransactionModal, etc. */}
    </div>
  );

  function handleDeleteItem(id: string) {
    // Implement delete logic
    toast.info('Delete functionality to be implemented');
  }
};

export default Inventory;