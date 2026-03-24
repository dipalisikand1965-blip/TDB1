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
  ArrowUp, ArrowDown, Loader2, Building, Heart, Clock, Layers, Utensils, Moon
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
  
  // Custom date range
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  
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
  
  // Pillar Reports data - ALL PILLARS
  const [pillarSummary, setPillarSummary] = useState(null);
  const [celebrateReport, setCelebrateReport] = useState(null);
  const [dineReport, setDineReport] = useState(null);
  const [stayReport, setStayReport] = useState(null);
  const [careReport, setCareReport] = useState(null);
  const [travelReport, setTravelReport] = useState(null);
  const [shopReport, setShopReport] = useState(null);
  const [enjoyReport, setEnjoyReport] = useState(null);
  const [clubReport, setClubReport] = useState(null);
  const [learnReport, setLearnReport] = useState(null);
  const [adoptReport, setAdoptReport] = useState(null);
  const [insureReport, setInsureReport] = useState(null);
  const [farewellReport, setFarewellReport] = useState(null);
  const [communityReport, setCommunityReport] = useState(null);
  const [pillarComparison, setPillarComparison] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState('summary');
  
  // Partner and Mira AI Reports data
  const [partnerReport, setPartnerReport] = useState(null);
  const [miraReport, setMiraReport] = useState(null);
  
  // Build query params with custom date support
  const getDateParams = useCallback(() => {
    if (useCustomDate && customStartDate && customEndDate) {
      return `start_date=${customStartDate}&end_date=${customEndDate}`;
    }
    return `period=${period}`;
  }, [useCustomDate, customStartDate, customEndDate, period]);

  // Fetch pillar summary
  const fetchPillarSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/summary?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPillarSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch pillar summary:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch celebrate report
  const fetchCelebrateReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/celebrate?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCelebrateReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch celebrate report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch dine report
  const fetchDineReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/dine?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDineReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch dine report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch stay report
  const fetchStayReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/stay?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStayReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch stay report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch care report
  const fetchCareReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/care?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCareReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch care report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch travel report
  const fetchTravelReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/travel?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTravelReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch travel report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch shop report
  const fetchShopReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/shop?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setShopReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch shop report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch enjoy report
  const fetchEnjoyReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/enjoy?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setEnjoyReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch enjoy report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch club report
  const fetchClubReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/club?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setClubReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch club report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch learn report
  const fetchLearnReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/learn?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setLearnReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch learn report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch adopt report
  const fetchAdoptReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/adopt?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAdoptReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch adopt report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch insure report
  const fetchInsureReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/insure?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setInsureReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch insure report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch farewell report
  const fetchFarewellReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/farewell?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setFarewellReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch farewell report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch pillar comparison
  const fetchPillarComparison = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/comparison?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPillarComparison(data);
      }
    } catch (error) {
      console.error('Failed to fetch pillar comparison:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch partner report
  const fetchPartnerReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/partners?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPartnerReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch partner report:', error);
    }
  }, [authHeaders, getDateParams]);

  // Fetch mira AI report
  const fetchMiraReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/pillars/mira?${getDateParams()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMiraReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch mira report:', error);
    }
  }, [authHeaders, getDateParams]);

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
    // Also fetch pillar reports when period changes
    fetchPillarSummary();
    fetchPillarComparison();
  }, [period, fetchExecutiveSummary, fetchPillarSummary, fetchPillarComparison]);

  // Fetch detailed pillar report when selected
  useEffect(() => {
    if (activeTab === 'pillars') {
      if (selectedPillar === 'celebrate') fetchCelebrateReport();
      else if (selectedPillar === 'dine') fetchDineReport();
      else if (selectedPillar === 'stay') fetchStayReport();
      else if (selectedPillar === 'care') fetchCareReport();
      else if (selectedPillar === 'travel') fetchTravelReport();
      else if (selectedPillar === 'shop') fetchShopReport();
      else if (selectedPillar === 'enjoy') fetchEnjoyReport();
      else if (selectedPillar === 'club') fetchClubReport();
      else if (selectedPillar === 'learn') fetchLearnReport();
      else if (selectedPillar === 'adopt') fetchAdoptReport();
      else if (selectedPillar === 'insure') fetchInsureReport();
      else if (selectedPillar === 'farewell') fetchFarewellReport();
    }
  }, [activeTab, selectedPillar, fetchCelebrateReport, fetchDineReport, fetchStayReport, 
      fetchCareReport, fetchTravelReport, fetchShopReport, fetchEnjoyReport,
      fetchClubReport, fetchLearnReport, fetchAdoptReport, fetchInsureReport, fetchFarewellReport]);

  // Fetch partner and mira reports when their tabs are active
  useEffect(() => {
    if (activeTab === 'partners') fetchPartnerReport();
    else if (activeTab === 'mira') fetchMiraReport();
  }, [activeTab, fetchPartnerReport, fetchMiraReport]);

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
          <Select value={useCustomDate ? 'custom' : period} onValueChange={(v) => {
            if (v === 'custom') {
              setUseCustomDate(true);
            } else {
              setUseCustomDate(false);
              setPeriod(v);
            }
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          {useCustomDate && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
                placeholder="Start Date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
                placeholder="End Date"
              />
            </div>
          )}

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
          <TabsTrigger value="pillars" className="gap-1"><Layers className="w-4 h-4" /> 📊 Pillars</TabsTrigger>
          <TabsTrigger value="partners" className="gap-1"><Building className="w-4 h-4" /> 🤝 Partners</TabsTrigger>
          <TabsTrigger value="mira" className="gap-1"><Heart className="w-4 h-4" /> 🤖 Mira AI</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1"><DollarSign className="w-4 h-4" /> Revenue</TabsTrigger>
          <TabsTrigger value="autoship" className="gap-1"><RefreshCw className="w-4 h-4" /> Autoship</TabsTrigger>
          <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" /> Products</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1"><Users className="w-4 h-4" /> Customers</TabsTrigger>
          <TabsTrigger value="pets" className="gap-1"><PawPrint className="w-4 h-4" /> Pet Soul</TabsTrigger>
          <TabsTrigger value="operations" className="gap-1"><Truck className="w-4 h-4" /> Operations</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1"><Star className="w-4 h-4" /> Reviews</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1"><TrendingUp className="w-4 h-4" /> Financial</TabsTrigger>
        </TabsList>

        {/* Pillar Reports Tab */}
        <TabsContent value="pillars">
          <div className="space-y-6">
            {/* Pillar Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pillarSummary?.pillars && Object.entries(pillarSummary.pillars).map(([key, pillar]) => (
                <Card 
                  key={key} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${selectedPillar === key ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => setSelectedPillar(key)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{pillar.icon}</span>
                    <span className="font-semibold">{pillar.name}</span>
                  </div>
                  {key === 'celebrate' && (
                    <>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(pillar.revenue || 0)}</p>
                      <p className="text-xs text-gray-500">{pillar.orders || 0} orders</p>
                    </>
                  )}
                  {key === 'dine' && (
                    <>
                      <p className="text-2xl font-bold text-orange-600">{pillar.bookings || 0}</p>
                      <p className="text-xs text-gray-500">bookings</p>
                      <p className="text-sm text-green-600">{formatCurrency(pillar.estimated_commission || 0)} commission</p>
                    </>
                  )}
                  {key === 'stay' && (
                    <>
                      <p className="text-2xl font-bold text-blue-600">{pillar.bookings || 0}</p>
                      <p className="text-xs text-gray-500">{pillar.status === 'coming_soon' ? 'Coming Soon' : 'bookings'}</p>
                    </>
                  )}
                  {(key === 'travel' || key === 'care') && (
                    <p className="text-sm text-gray-400">Coming Soon</p>
                  )}
                </Card>
              ))}
            </div>

            {/* Totals Bar */}
            {pillarSummary?.totals && (
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex flex-wrap justify-around gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(pillarSummary.totals.total_revenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Commission</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(pillarSummary.totals.total_commission)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-600">{pillarSummary.totals.total_bookings}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Est. Profit</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(pillarSummary.totals.estimated_profit)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Pillar Sub-tabs - THE 14 PILLARS */}
            <Tabs value={selectedPillar} onValueChange={setSelectedPillar}>
              <TabsList className="bg-gray-100 flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="summary">📊 Summary</TabsTrigger>
                <TabsTrigger value="celebrate">🎂 Celebrate</TabsTrigger>
                <TabsTrigger value="dine">🍽️ Dine</TabsTrigger>
                <TabsTrigger value="stay">🏨 Stay</TabsTrigger>
                <TabsTrigger value="travel">✈️ Travel</TabsTrigger>
                <TabsTrigger value="care">💊 Care</TabsTrigger>
                <TabsTrigger value="enjoy">🎾 Enjoy</TabsTrigger>
                <TabsTrigger value="fit">🏃 Fit</TabsTrigger>
                <TabsTrigger value="learn">🎓 Learn</TabsTrigger>
                <TabsTrigger value="paperwork">📄 Paperwork</TabsTrigger>
                <TabsTrigger value="advisory">📋 Advisory</TabsTrigger>
                <TabsTrigger value="emergency">🚨 Emergency</TabsTrigger>
                <TabsTrigger value="farewell">🌈 Farewell</TabsTrigger>
                <TabsTrigger value="adopt">🐾 Adopt</TabsTrigger>
                <TabsTrigger value="shop">🛒 Shop</TabsTrigger>
              </TabsList>

              {/* Summary View */}
              <TabsContent value="summary">
                {pillarComparison && (
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Profit by Pillar</h3>
                      <div className="space-y-3">
                        {pillarComparison.profit_comparison?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-24 text-sm font-medium">{item.pillar}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end pr-2"
                                style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
                              >
                                <span className="text-xs text-white font-medium">{item.percentage || 0}%</span>
                              </div>
                            </div>
                            <div className="w-28 text-right text-sm font-semibold">{formatCurrency(item.value)}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Activity by Pillar</h3>
                      <div className="space-y-3">
                        {pillarComparison.activity_comparison?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.pillar}</p>
                              <p className="text-xs text-gray-500">{item.label}</p>
                            </div>
                            <p className="text-2xl font-bold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-4 md:col-span-2">
                      <h3 className="font-semibold mb-4">💡 Insights</h3>
                      <ul className="space-y-2">
                        {pillarComparison.insights?.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-500">✓</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Generic Pillar Report Template for all 12 pillars */}
              {['celebrate', 'dine', 'stay', 'travel', 'care', 'enjoy', 'fit', 'learn', 'paperwork', 'advisory', 'emergency', 'farewell', 'adopt', 'shop'].map((pillar) => (
                <TabsContent key={pillar} value={pillar}>
                  <div className="space-y-6 mt-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <MetricCard title="Total Requests" value={pillarSummary?.[pillar]?.requests || 0} icon={Users} color="blue" />
                      <MetricCard title="Completed" value={pillarSummary?.[pillar]?.completed || 0} icon={Package} color="green" />
                      <MetricCard title="Pending" value={pillarSummary?.[pillar]?.pending || 0} icon={Clock} color="orange" />
                      <MetricCard title="Revenue" value={formatCurrency(pillarSummary?.[pillar]?.revenue || 0)} icon={DollarSign} color="purple" />
                    </div>
                    
                    <Card className="p-6">
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4">
                          {pillar === 'travel' && '✈️'}
                          {pillar === 'care' && '💊'}
                          {pillar === 'enjoy' && '🎾'}
                          {pillar === 'fit' && '🏃'}
                          {pillar === 'advisory' && '📋'}
                          {pillar === 'paperwork' && '📄'}
                          {pillar === 'emergency' && '🚨'}
                          {pillar === 'club' && '👑'}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{pillar} Pillar</h3>
                        <p className="text-gray-500 mb-4">Detailed analytics coming soon</p>
                        <p className="text-sm text-gray-400">
                          This pillar is active and tracking requests. Full analytics dashboard will be available in the next update.
                        </p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              ))}

              {/* Celebrate Report */}
              <TabsContent value="celebrate">
                {celebrateReport && (
                  <div className="space-y-6 mt-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <MetricCard title="Revenue" value={formatCurrency(celebrateReport.metrics?.total_revenue || 0)} icon={DollarSign} color="green" />
                      <MetricCard title="Orders" value={celebrateReport.metrics?.total_orders || 0} icon={ShoppingBag} color="blue" />
                      <MetricCard title="Items Sold" value={celebrateReport.metrics?.items_sold || 0} icon={Package} color="purple" />
                      <MetricCard title="GST Collected" value={formatCurrency(celebrateReport.metrics?.gst_collected || 0)} icon={TrendingUp} color="orange" />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">🏆 Top Products</h3>
                        <div className="space-y-2">
                          {celebrateReport.top_products?.slice(0, 8).map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 w-5">{idx + 1}.</span>
                                <span className="text-sm font-medium truncate max-w-[200px]">{product.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                                <p className="text-xs text-gray-500">{product.quantity} sold</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">🏙️ Revenue by City</h3>
                        <div className="space-y-2">
                          {celebrateReport.city_breakdown?.slice(0, 8).map((city, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <span className="font-medium">{city.city}</span>
                              <span className="font-semibold text-green-600">{formatCurrency(city.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Dine Report */}
              <TabsContent value="dine">
                {dineReport && (
                  <div className="space-y-6 mt-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <MetricCard title="Total Bookings" value={dineReport.metrics?.total_bookings || 0} icon={Calendar} color="orange" />
                      <MetricCard title="Reservations" value={dineReport.metrics?.total_reservations || 0} icon={Utensils} color="blue" />
                      <MetricCard title="Buddy Visits" value={dineReport.metrics?.total_buddy_visits || 0} icon={Users} color="pink" />
                      <MetricCard title="Est. Commission" value={formatCurrency(dineReport.metrics?.estimated_commission || 0)} icon={DollarSign} color="green" />
                    </div>
                    
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">🍽️ Top Restaurants</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-left">Restaurant</th>
                              <th className="p-3 text-left">City</th>
                              <th className="p-3 text-center">Reservations</th>
                              <th className="p-3 text-center">Buddy Visits</th>
                              <th className="p-3 text-center">Guests</th>
                              <th className="p-3 text-right">Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dineReport.top_restaurants?.map((restaurant, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{restaurant.name}</td>
                                <td className="p-3 text-gray-500">{restaurant.city}</td>
                                <td className="p-3 text-center">{restaurant.reservations}</td>
                                <td className="p-3 text-center">{restaurant.buddy_visits}</td>
                                <td className="p-3 text-center">{restaurant.guests}</td>
                                <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(restaurant.estimated_commission)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Stay Report */}
              <TabsContent value="stay">
                {stayReport && (
                  <div className="space-y-6 mt-4">
                    {stayReport.status === 'coming_soon' ? (
                      <Card className="p-12 text-center">
                        <span className="text-6xl mb-4 block">🏨</span>
                        <h3 className="text-xl font-semibold mb-2">Stay Pillar Coming Soon</h3>
                        <p className="text-gray-500">Pet hotels, boarding, and daycare features are under development.</p>
                      </Card>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-4 gap-4">
                          <MetricCard title="Total Bookings" value={stayReport.metrics?.total_bookings || 0} icon={Calendar} color="blue" />
                          <MetricCard title="Revenue" value={formatCurrency(stayReport.metrics?.total_revenue || 0)} icon={DollarSign} color="green" />
                          <MetricCard title="Total Nights" value={stayReport.metrics?.total_nights || 0} icon={Moon} color="purple" />
                          <MetricCard title="Commission" value={formatCurrency(stayReport.metrics?.estimated_commission || 0)} icon={TrendingUp} color="orange" />
                        </div>
                        
                        <Card className="p-4">
                          <h3 className="font-semibold mb-4">🏨 Top Properties</h3>
                          <div className="space-y-2">
                            {stayReport.top_properties?.map((property, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{property.name}</p>
                                  <p className="text-xs text-gray-500">{property.city} • {property.nights} nights</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(property.revenue)}</p>
                                  <p className="text-xs text-green-600">{formatCurrency(property.estimated_commission)} commission</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Partner Reports Tab */}
        <TabsContent value="partners">
          <div className="space-y-6">
            {/* Partner Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Applications" 
                value={partnerReport?.metrics?.total_applications || 0} 
                icon={Building} 
                color="purple" 
              />
              <MetricCard 
                title="Pending Review" 
                value={partnerReport?.metrics?.pending || 0} 
                icon={Clock} 
                color="orange" 
              />
              <MetricCard 
                title="Approved" 
                value={partnerReport?.metrics?.approved || 0} 
                icon={Users} 
                color="green" 
              />
              <MetricCard 
                title="Approval Rate" 
                value={`${partnerReport?.metrics?.approval_rate || 0}%`} 
                icon={TrendingUp} 
                color="blue" 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">📊 Application Status</h3>
                <div className="space-y-3">
                  {partnerReport?.status_breakdown?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.status}</span>
                          <span className="text-sm font-bold">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${partnerReport?.metrics?.total_applications ? (item.count / partnerReport.metrics.total_applications * 100) : 0}%`,
                              backgroundColor: item.color 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Category Breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">🏢 By Business Category</h3>
                <div className="space-y-2">
                  {partnerReport?.category_breakdown?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium">{item.category}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                  {(!partnerReport?.category_breakdown || partnerReport.category_breakdown.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No partner applications yet</p>
                  )}
                </div>
              </Card>
            </div>

            {/* City Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">🏙️ Partners by City</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {partnerReport?.city_breakdown?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{item.count}</p>
                    <p className="text-sm text-gray-600">{item.city}</p>
                  </div>
                ))}
                {(!partnerReport?.city_breakdown || partnerReport.city_breakdown.length === 0) && (
                  <p className="text-gray-500 text-sm col-span-full text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            {/* Recent Applications */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">📋 Recent Applications</h3>
              {partnerReport?.recent_applications?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Business Name</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">City</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerReport.recent_applications.map((app, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{app.business_name}</td>
                          <td className="p-3 text-gray-500">{app.category}</td>
                          <td className="p-3 text-gray-500">{app.city}</td>
                          <td className="p-3 text-center">
                            <Badge className={
                              app.status === 'approved' ? 'bg-green-100 text-green-700' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              app.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {app.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right text-gray-500">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No partner applications yet</p>
                  <p className="text-sm">Partner applications will appear here once submitted</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Mira AI Reports Tab */}
        <TabsContent value="mira">
          <div className="space-y-6">
            {/* Mira Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Conversations" 
                value={miraReport?.metrics?.total_conversations || 0} 
                icon={Heart} 
                color="pink" 
              />
              <MetricCard 
                title="Conversion Rate" 
                value={`${miraReport?.metrics?.conversion_rate || 0}%`} 
                icon={TrendingUp} 
                color="green" 
              />
              <MetricCard 
                title="Converted Orders" 
                value={miraReport?.metrics?.converted_chats || 0} 
                icon={ShoppingBag} 
                color="purple" 
              />
              <MetricCard 
                title="Revenue from Mira" 
                value={`₹${(miraReport?.metrics?.converted_revenue || 0).toLocaleString()}`} 
                icon={DollarSign} 
                color="blue" 
              />
            </div>

            {/* Conversion Tracking Section */}
            {miraReport?.conversion_tracking && (
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <h3 className="font-semibold mb-4 text-green-800">🎯 Conversion Tracking</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-green-600">{miraReport.conversion_tracking.conversion_rate}%</p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-purple-600">{miraReport.conversion_tracking.total_conversions}</p>
                    <p className="text-sm text-gray-600">Total Conversions</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-blue-600">₹{miraReport.conversion_tracking.converted_revenue?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue Generated</p>
                  </div>
                </div>
                {miraReport.conversion_tracking.by_service?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Conversions by Service:</p>
                    <div className="flex flex-wrap gap-2">
                      {miraReport.conversion_tracking.by_service.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white">
                          {item.service}: {item.conversions} ({item.rate}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <div className="grid md:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Messages" 
                value={miraReport?.metrics?.total_messages || 0} 
                icon={Users} 
                color="pink" 
              />
              <MetricCard 
                title="Avg Messages/Chat" 
                value={miraReport?.metrics?.avg_messages_per_chat || 0} 
                icon={TrendingUp} 
                color="purple" 
              />
              <MetricCard 
                title="Response Rate" 
                value={`${miraReport?.metrics?.response_rate || 0}%`} 
                icon={Clock} 
                color="blue" 
              />
              <MetricCard 
                title="With Pet Info" 
                value={miraReport?.metrics?.chats_with_pet_info || 0} 
                icon={Heart} 
                color="pink" 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Service Type Breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">🎯 Conversations by Service</h3>
                <div className="space-y-3">
                  {miraReport?.service_breakdown?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium">{item.service}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-end pr-2"
                          style={{ width: `${item.percentage || 0}%` }}
                        >
                          <span className="text-xs text-white font-medium">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-semibold">{item.count}</div>
                    </div>
                  ))}
                  {(!miraReport?.service_breakdown || miraReport.service_breakdown.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">No conversation data yet</p>
                  )}
                </div>
              </Card>

              {/* Status Breakdown */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">📊 Conversation Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  {miraReport?.status_breakdown?.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg text-center" style={{ backgroundColor: `${item.color}15` }}>
                      <p className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</p>
                      <p className="text-sm text-gray-600">{item.status}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Message Stats */}
            <Card className="p-4 bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="flex flex-wrap justify-around gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">User Messages</p>
                  <p className="text-2xl font-bold text-pink-600">{miraReport?.metrics?.user_messages || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">AI Responses</p>
                  <p className="text-2xl font-bold text-purple-600">{miraReport?.metrics?.ai_responses || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">With Pet Info</p>
                  <p className="text-2xl font-bold text-blue-600">{miraReport?.metrics?.chats_with_pet_info || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Converted</p>
                  <p className="text-2xl font-bold text-green-600">{miraReport?.metrics?.converted_chats || 0}</p>
                </div>
              </div>
            </Card>

            {/* City Breakdown */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">🏙️ Conversations by City</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {miraReport?.city_breakdown?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{item.count}</p>
                    <p className="text-sm text-gray-600">{item.city}</p>
                  </div>
                ))}
                {(!miraReport?.city_breakdown || miraReport.city_breakdown.length === 0) && (
                  <p className="text-gray-500 text-sm col-span-full text-center py-4">No data available</p>
                )}
              </div>
            </Card>

            {/* Insights */}
            {miraReport?.insights && miraReport.insights.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">💡 Insights</h3>
                <ul className="space-y-2">
                  {miraReport.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-pink-500">✓</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Recent Conversations */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">💬 Recent Conversations</h3>
              {miraReport?.recent_conversations?.length > 0 ? (
                <div className="space-y-3">
                  {miraReport.recent_conversations.map((chat, idx) => (
                    <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{chat.service_type}</Badge>
                            <Badge className={
                              chat.status === 'converted' ? 'bg-purple-100 text-purple-700' :
                              chat.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                              chat.status === 'active' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {chat.status}
                            </Badge>
                            {chat.pet_name && chat.pet_name !== '-' && (
                              <span className="text-xs text-gray-500">🐕 {chat.pet_name}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{chat.preview}</p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>{chat.city}</p>
                          <p>{chat.messages_count} msgs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Mira AI conversations will appear here</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

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
