import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import {
  TrendingUp, DollarSign, Users, ShoppingBag, RefreshCw, Download,
  MapPin, Calendar, Package, Star, PawPrint, Truck, Search, BarChart3,
  ArrowUp, ArrowDown, Loader2, Building, Heart, Clock
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

// Chart colors
const CHART_COLORS = {
  primary: '#9333ea',
  secondary: '#ec4899',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#a855f7',
  pink: '#f472b6',
  cities: ['#9333ea', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
};

// MetricCard component - defined outside ReportsManager to avoid re-creation on each render
const MetricCard = ({ title, value, icon: Icon, change, color = 'purple' }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </Card>
);

const ReportsManager = ({ authHeaders }) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [period, setPeriod] = useState('this_month');
  const [cityFilter, setCityFilter] = useState('');
  const [days, setDays] = useState(30);
  
  // Report data
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [revenueByCity, setRevenueByCity] = useState(null);
  const [dailySales, setDailySales] = useState(null);
  const [productPerformance, setProductPerformance] = useState(null);
  const [autoshipPerformance, setAutoshipPerformance] = useState(null);
  const [customerIntelligence, setCustomerIntelligence] = useState(null);
  const [petIntelligence, setPetIntelligence] = useState(null);
  const [operations, setOperations] = useState(null);
  const [reviewsReport, setReviewsReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  
  // Pillar Reports data
  const [pillarSummary, setPillarSummary] = useState(null);
  const [celebrateReport, setCelebrateReport] = useState(null);
  const [dineReport, setDineReport] = useState(null);
  const [stayReport, setStayReport] = useState(null);
  const [pillarComparison, setPillarComparison] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('summary');

  // Fetch pillar summary
  const fetchPillarSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/summary?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPillarSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch pillar summary:', error);
    }
  }, [authHeaders, period]);

  // Fetch celebrate report
  const fetchCelebrateReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/celebrate?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCelebrateReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch celebrate report:', error);
    }
  }, [authHeaders, period]);

  // Fetch dine report
  const fetchDineReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/dine?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDineReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch dine report:', error);
    }
  }, [authHeaders, period]);

  // Fetch stay report
  const fetchStayReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/stay?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStayReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch stay report:', error);
    }
  }, [authHeaders, period]);

  // Fetch pillar comparison
  const fetchPillarComparison = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/comparison?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPillarComparison(data);
      }
    } catch (error) {
      console.error('Failed to fetch pillar comparison:', error);
    }
  }, [authHeaders, period]);

  // Fetch executive summary
  const fetchExecutiveSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/executive-summary?period=${period}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setExecutiveSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch executive summary:', error);
    }
  }, [authHeaders, period]);

  // Fetch revenue by city
  const fetchRevenueByCity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/revenue-by-city`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setRevenueByCity(data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue by city:', error);
    }
  }, [authHeaders]);

  // Fetch daily sales
  const fetchDailySales = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('days', days);
      if (cityFilter) params.set('city', cityFilter);
      
      const res = await fetch(`${API_URL}/api/admin/reports/daily-sales?${params}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDailySales(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily sales:', error);
    }
  }, [authHeaders, days, cityFilter]);

  // Fetch product performance
  const fetchProductPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('days', days);
      if (cityFilter) params.set('city', cityFilter);
      
      const res = await fetch(`${API_URL}/api/admin/reports/product-performance?${params}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setProductPerformance(data);
      }
    } catch (error) {
      console.error('Failed to fetch product performance:', error);
    }
  }, [authHeaders, days, cityFilter]);

  // Fetch autoship performance
  const fetchAutoshipPerformance = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/autoship-performance`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAutoshipPerformance(data);
      }
    } catch (error) {
      console.error('Failed to fetch autoship performance:', error);
    }
  }, [authHeaders]);

  // Fetch customer intelligence
  const fetchCustomerIntelligence = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/customer-intelligence?days=${days}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCustomerIntelligence(data);
      }
    } catch (error) {
      console.error('Failed to fetch customer intelligence:', error);
    }
  }, [authHeaders, days]);

  // Fetch pet intelligence
  const fetchPetIntelligence = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pet-intelligence`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPetIntelligence(data);
      }
    } catch (error) {
      console.error('Failed to fetch pet intelligence:', error);
    }
  }, [authHeaders]);

  // Fetch operations
  const fetchOperations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/operations`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOperations(data);
      }
    } catch (error) {
      console.error('Failed to fetch operations:', error);
    }
  }, [authHeaders]);

  // Fetch reviews report
  const fetchReviewsReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/reviews`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setReviewsReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews report:', error);
    }
  }, [authHeaders]);

  // Fetch financial report
  const fetchFinancialReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/financial?days=${days}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setFinancialReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch financial report:', error);
    }
  }, [authHeaders, days]);

  // Fetch all reports
  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchExecutiveSummary(),
      fetchRevenueByCity(),
      fetchDailySales(),
      fetchProductPerformance(),
      fetchAutoshipPerformance(),
      fetchCustomerIntelligence(),
      fetchPetIntelligence(),
      fetchOperations(),
      fetchReviewsReport(),
      fetchFinancialReport(),
    ]);
    setLoading(false);
  }, [fetchExecutiveSummary, fetchRevenueByCity, fetchDailySales, fetchProductPerformance, fetchAutoshipPerformance, fetchCustomerIntelligence, fetchPetIntelligence, fetchOperations, fetchReviewsReport, fetchFinancialReport]);

  useEffect(() => {
    fetchAllReports();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchDailySales();
    fetchProductPerformance();
  }, [cityFilter, days, fetchDailySales, fetchProductPerformance]);

  useEffect(() => {
    fetchExecutiveSummary();
  }, [period, fetchExecutiveSummary]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Export to CSV
  const exportToCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = '';
    let filename = '';

    switch (activeTab) {
      case 'executive':
        filename = `executive_summary_${timestamp}.csv`;
        csvContent = 'Metric,Value\n';
        csvContent += `Total Revenue,${executiveSummary?.total_revenue || 0}\n`;
        csvContent += `Total Orders,${executiveSummary?.total_orders || 0}\n`;
        csvContent += `Active Autoship,${executiveSummary?.active_autoship || 0}\n`;
        csvContent += `Repeat Purchase Rate,${executiveSummary?.repeat_purchase_rate || 0}%\n`;
        csvContent += `Average Order Value,${executiveSummary?.average_order_value || 0}\n`;
        break;

      case 'revenue':
        filename = `revenue_report_${timestamp}.csv`;
        csvContent = 'City,Revenue,Orders,Avg Order Value\n';
        (revenueByCity?.by_city || []).forEach(city => {
          csvContent += `${city.city},${city.revenue},${city.orders},${city.avg_order_value}\n`;
        });
        csvContent += '\nDate,Revenue,Orders,Autoship Orders\n';
        (dailySales?.daily_sales || []).forEach(day => {
          csvContent += `${day.date},${day.revenue},${day.orders},${day.autoship_orders}\n`;
        });
        break;

      case 'products':
        filename = `product_performance_${timestamp}.csv`;
        csvContent = 'Product,Quantity Sold,Revenue,Orders,Autoship Count\n';
        (productPerformance?.top_products || []).forEach(p => {
          csvContent += `"${p.product}",${p.quantity_sold},${p.revenue},${p.orders},${p.autoship_count}\n`;
        });
        break;

      case 'autoship':
        filename = `autoship_report_${timestamp}.csv`;
        csvContent = 'Metric,Value\n';
        csvContent += `Active Subscribers,${autoshipPerformance?.subscribers?.active || 0}\n`;
        csvContent += `Paused Subscribers,${autoshipPerformance?.subscribers?.paused || 0}\n`;
        csvContent += `Cancelled Subscribers,${autoshipPerformance?.subscribers?.cancelled || 0}\n`;
        csvContent += `Revenue 30 Days,${autoshipPerformance?.revenue_30d || 0}\n`;
        csvContent += `Retention Rate,${autoshipPerformance?.retention_rate || 0}%\n`;
        csvContent += `Churn Rate,${autoshipPerformance?.churn_rate || 0}%\n`;
        break;

      case 'customers':
        filename = `customer_report_${timestamp}.csv`;
        csvContent = 'Metric,Value\n';
        csvContent += `New Customers,${customerIntelligence?.new_customers || 0}\n`;
        csvContent += `Returning Customers,${customerIntelligence?.returning_customers || 0}\n`;
        csvContent += `Inactive (60+ days),${customerIntelligence?.inactive_customers_60d || 0}\n`;
        csvContent += '\nHigh Value Customers\n';
        csvContent += 'Name,Email,Total Spent,Order Count\n';
        (customerIntelligence?.high_value_customers || []).forEach(c => {
          csvContent += `"${c.name}",${c.email},${c.total_spent},${c.order_count}\n`;
        });
        break;

      case 'petsoul':
        filename = `pet_intelligence_${timestamp}.csv`;
        csvContent = 'Popular Breeds\n';
        csvContent += 'Breed,Count\n';
        (petIntelligence?.popular_breeds || []).forEach(b => {
          csvContent += `${b.breed},${b.count}\n`;
        });
        csvContent += '\nUpcoming Birthdays (7 days)\n';
        csvContent += 'Pet Name,Birthday,Owner\n';
        (petIntelligence?.upcoming_birthdays_7d || []).forEach(p => {
          csvContent += `${p.name},${p.birthday},${p.owner_name || ''}\n`;
        });
        break;

      case 'operations':
        filename = `operations_report_${timestamp}.csv`;
        csvContent = 'Status,Count\n';
        Object.entries(operations?.orders_by_status || {}).forEach(([status, count]) => {
          csvContent += `${status},${count}\n`;
        });
        break;

      case 'reviews':
        filename = `reviews_report_${timestamp}.csv`;
        csvContent = 'Metric,Value\n';
        csvContent += `Total Reviews,${reviewsReport?.total_reviews || 0}\n`;
        csvContent += `Pending Approval,${reviewsReport?.pending_approval || 0}\n`;
        csvContent += `Average Rating,${reviewsReport?.average_rating || 0}\n`;
        break;

      case 'financial':
        filename = `financial_report_${timestamp}.csv`;
        csvContent = 'Metric,Value\n';
        csvContent += `Total Discounts,${financialReport?.total_discounts || 0}\n`;
        csvContent += `Shipping Revenue,${financialReport?.shipping_revenue || 0}\n`;
        csvContent += `Cancelled Orders Value,${financialReport?.cancelled_orders_value || 0}\n`;
        csvContent += `Discount Impact %,${financialReport?.discount_impact_percent || 0}%\n`;
        break;

      default:
        filename = `report_${timestamp}.csv`;
        csvContent = 'No data available for export';
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({ title: '📥 CSV Exported', description: `Downloaded ${filename}` });
  };

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Bangalore">Bangalore</SelectItem>
              <SelectItem value="Mumbai">Mumbai</SelectItem>
              <SelectItem value="Gurugram">Gurugram</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(days)} onValueChange={v => setDays(parseInt(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchAllReports} variant="outline" className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>

          <Button variant="outline" className="gap-2 ml-auto" onClick={exportToCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border flex-wrap h-auto p-1">
          <TabsTrigger value="executive" className="gap-1"><BarChart3 className="w-4 h-4" /> Executive</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1"><DollarSign className="w-4 h-4" /> Revenue</TabsTrigger>
          <TabsTrigger value="autoship" className="gap-1"><RefreshCw className="w-4 h-4" /> Autoship</TabsTrigger>
          <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" /> Products</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1"><Users className="w-4 h-4" /> Customers</TabsTrigger>
          <TabsTrigger value="pets" className="gap-1"><PawPrint className="w-4 h-4" /> Pet Soul</TabsTrigger>
          <TabsTrigger value="operations" className="gap-1"><Truck className="w-4 h-4" /> Operations</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1"><Star className="w-4 h-4" /> Reviews</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1"><TrendingUp className="w-4 h-4" /> Financial</TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="executive">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(executiveSummary?.metrics?.total_revenue || 0)}
              icon={DollarSign}
              color="green"
            />
            <MetricCard
              title="Total Orders"
              value={executiveSummary?.metrics?.total_orders || 0}
              icon={ShoppingBag}
              color="blue"
            />
            <MetricCard
              title="Active Autoship"
              value={executiveSummary?.metrics?.active_autoship_subscribers || 0}
              icon={RefreshCw}
              color="purple"
            />
            <MetricCard
              title="Repeat Rate"
              value={`${executiveSummary?.metrics?.repeat_purchase_rate || 0}%`}
              icon={Heart}
              color="pink"
            />
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Average Order Value</h3>
            <p className="text-4xl font-bold text-purple-600">
              {formatCurrency(executiveSummary?.metrics?.average_order_value || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Period: {period.replace('_', ' ')}</p>
          </Card>
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue">
          {/* Daily Sales Chart - Full Width */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Revenue Trend ({cityFilter || 'All Cities'})
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales?.daily_sales?.slice(0, 14).reverse() || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)} // Show MM-DD only
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue by City - Bar Chart */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Revenue by City
              </h3>
              <div className="h-[250px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCity?.by_city || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="city" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {(revenueByCity?.by_city || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS.cities[index % CHART_COLORS.cities.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {revenueByCity?.by_city?.map((city, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.cities[idx % CHART_COLORS.cities.length] }}></div>
                      <span className="font-medium">{city.city}</span>
                      <span className="text-gray-500">({city.orders} orders)</span>
                    </div>
                    <span className="font-bold">{formatCurrency(city.revenue)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily Sales Table */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Daily Sales ({cityFilter || 'All Cities'})
              </h3>
              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {dailySales?.daily_sales?.slice(0, 14).map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-gray-500">{day.orders} orders ({day.autoship_orders} autoship)</p>
                    </div>
                    <p className="font-bold text-lg">{formatCurrency(day.revenue)}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Autoship */}
        <TabsContent value="autoship">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-green-50">
              <p className="text-sm text-green-600">Active Subscribers</p>
              <p className="text-4xl font-bold text-green-700">{autoshipPerformance?.subscribers?.active || 0}</p>
            </Card>
            <Card className="p-6 bg-yellow-50">
              <p className="text-sm text-yellow-600">Paused Subscribers</p>
              <p className="text-4xl font-bold text-yellow-700">{autoshipPerformance?.subscribers?.paused || 0}</p>
            </Card>
            <Card className="p-6 bg-red-50">
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-4xl font-bold text-red-700">{autoshipPerformance?.subscribers?.cancelled || 0}</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Autoship Status Pie Chart */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Subscriber Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: autoshipPerformance?.subscribers?.active || 0, color: CHART_COLORS.success },
                        { name: 'Paused', value: autoshipPerformance?.subscribers?.paused || 0, color: CHART_COLORS.warning },
                        { name: 'Cancelled', value: autoshipPerformance?.subscribers?.cancelled || 0, color: CHART_COLORS.danger }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Active', value: autoshipPerformance?.subscribers?.active || 0, color: CHART_COLORS.success },
                        { name: 'Paused', value: autoshipPerformance?.subscribers?.paused || 0, color: CHART_COLORS.warning },
                        { name: 'Cancelled', value: autoshipPerformance?.subscribers?.cancelled || 0, color: CHART_COLORS.danger }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Subscribers']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Paused</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Cancelled</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Autoship Revenue (30 days)</h3>
              <p className="text-4xl font-bold text-purple-600">{formatCurrency(autoshipPerformance?.revenue_30d || 0)}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-2xl font-bold text-green-600">{autoshipPerformance?.retention_rate || 0}%</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Churn Rate</p>
                  <p className="text-2xl font-bold text-red-600">{autoshipPerformance?.churn_rate || 0}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Subscribers by Frequency</h3>
              <div className="space-y-3">
                {autoshipPerformance?.by_frequency?.map((freq, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{freq.frequency}</span>
                    <Badge variant="outline">{freq.subscribers} subscribers</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          {/* Top Products Bar Chart */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Top Products by Revenue
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance?.top_products?.slice(0, 10) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="product" 
                    tick={{ fontSize: 11 }}
                    width={150}
                    tickFormatter={(value) => value.length > 20 ? value.slice(0, 20) + '...' : value}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : name
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Product Performance Details ({cityFilter || 'All Cities'})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Qty Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Autoship</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productPerformance?.top_products?.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm">{product.product}</td>
                      <td className="px-4 py-3 text-sm text-right">{product.quantity_sold}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(product.revenue)}</td>
                      <td className="px-4 py-3 text-sm text-right">{product.orders}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {product.autoship_count > 0 && (
                          <Badge className="bg-purple-100 text-purple-700">{product.autoship_count}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Customers */}
        <TabsContent value="customers">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 bg-blue-50">
              <p className="text-sm text-blue-600">New Customers</p>
              <p className="text-4xl font-bold text-blue-700">{customerIntelligence?.new_customers || 0}</p>
            </Card>
            <Card className="p-6 bg-green-50">
              <p className="text-sm text-green-600">Returning Customers</p>
              <p className="text-4xl font-bold text-green-700">{customerIntelligence?.returning_customers || 0}</p>
            </Card>
            <Card className="p-6 bg-orange-50">
              <p className="text-sm text-orange-600">Inactive (60+ days)</p>
              <p className="text-4xl font-bold text-orange-700">{customerIntelligence?.inactive_customers_60d || 0}</p>
            </Card>
          </div>

          {/* Customer Distribution Pie Chart */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Customer Distribution</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New', value: customerIntelligence?.new_customers || 0, color: CHART_COLORS.info },
                      { name: 'Returning', value: customerIntelligence?.returning_customers || 0, color: CHART_COLORS.success },
                      { name: 'Inactive', value: customerIntelligence?.inactive_customers_60d || 0, color: CHART_COLORS.warning }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'New', value: customerIntelligence?.new_customers || 0, color: CHART_COLORS.info },
                      { name: 'Returning', value: customerIntelligence?.returning_customers || 0, color: CHART_COLORS.success },
                      { name: 'Inactive', value: customerIntelligence?.inactive_customers_60d || 0, color: CHART_COLORS.warning }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Customers']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">High Value Customers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Spent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerIntelligence?.high_value_customers?.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{customer.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(customer.total_spent)}</td>
                      <td className="px-4 py-3 text-sm text-right">{customer.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Pet Soul */}
        <TabsContent value="pets">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-pink-600" />
                Popular Breeds
              </h3>
              <div className="space-y-3">
                {petIntelligence?.popular_breeds?.map((breed, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{breed.breed}</span>
                    <Badge variant="outline">{breed.count} pets</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Upcoming Birthdays
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{petIntelligence?.upcoming_birthdays?.next_7_days || 0}</p>
                  <p className="text-xs text-gray-500">Next 7 days</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{petIntelligence?.upcoming_birthdays?.next_14_days || 0}</p>
                  <p className="text-xs text-gray-500">Next 14 days</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{petIntelligence?.upcoming_birthdays?.next_30_days || 0}</p>
                  <p className="text-xs text-gray-500">Next 30 days</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {petIntelligence?.upcoming_birthdays?.details_7d?.map((pet, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                    <div>
                      <p className="font-medium text-sm">{pet.name}</p>
                      <p className="text-xs text-gray-500">{pet.email}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      {pet.days_until === 0 ? 'Today!' : `${pet.days_until} days`}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Operations */}
        <TabsContent value="operations">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Orders by Status</h3>
              <div className="space-y-3">
                {operations?.orders_by_status?.map((status, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{status.status?.replace(/_/g, ' ')}</span>
                    <Badge variant="outline">{status.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Upcoming Autoship Shipments</h3>
              <div className="p-6 bg-purple-50 rounded-lg text-center">
                <p className="text-4xl font-bold text-purple-600">{operations?.upcoming_autoship_shipments_7d || 0}</p>
                <p className="text-sm text-gray-600 mt-2">Shipments in next 7 days</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-3xl font-bold">{reviewsReport?.total_reviews || 0}</p>
            </Card>
            <Card className="p-6 bg-yellow-50">
              <p className="text-sm text-yellow-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-700">{reviewsReport?.pending_approval || 0}</p>
            </Card>
            <Card className="p-6 bg-green-50">
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-3xl font-bold text-green-700">{reviewsReport?.approved || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-3xl font-bold flex items-center gap-1">
                {reviewsReport?.average_rating || 0} <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </p>
            </Card>
          </div>

          {reviewsReport?.low_rated_products?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-red-600">Products Needing Attention (Low Ratings)</h3>
              <div className="space-y-2">
                {reviewsReport.low_rated_products.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">{product.product}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{product.reviews} reviews</span>
                      <Badge className="bg-red-100 text-red-700">{product.avg_rating} ⭐</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Financial */}
        <TabsContent value="financial">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financialReport?.total_revenue || 0)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Total Discounts Given</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(financialReport?.total_discounts_given || 0)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Shipping Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(financialReport?.total_shipping_revenue || 0)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Cancelled Orders</p>
              <p className="text-3xl font-bold text-orange-600">{financialReport?.cancelled_orders || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Discount Impact</h3>
            <p className="text-sm text-gray-600">
              Discounts represent <span className="font-bold text-red-600">{financialReport?.discount_impact_percent || 0}%</span> of total revenue
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsManager;
