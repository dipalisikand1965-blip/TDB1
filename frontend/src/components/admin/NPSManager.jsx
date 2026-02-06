import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Star, RefreshCw, Search, PawPrint, TrendingUp, TrendingDown,
  MessageSquare, CheckCircle, XCircle, Clock, Eye, Edit, Trash2,
  ThumbsUp, ThumbsDown, Minus, Download, Filter
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const NPSManager = ({ getAuthHeader }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [responses, setResponses] = useState([]);
  const [productScores, setProductScores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchResponses(), fetchProductScores()]);
    } catch (error) {
      console.error('Error fetching NPS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/nps/stats?days=30`, {
        headers: { 'Authorization': getAuthHeader?.() || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchResponses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/nps/responses?limit=100`, {
        headers: { 'Authorization': getAuthHeader?.() || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setResponses(data.responses || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProductScores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/concierge/nps/by-product`, {
        headers: { 'Authorization': getAuthHeader?.() || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setProductScores(data.products || []);
      }
    } catch (e) { console.error(e); }
  };

  const getScoreType = (score) => {
    if (score >= 9) return { type: 'promoter', color: 'text-green-600', bg: 'bg-green-100', icon: ThumbsUp };
    if (score >= 7) return { type: 'passive', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Minus };
    return { type: 'detractor', color: 'text-red-600', bg: 'bg-red-100', icon: ThumbsDown };
  };

  const filteredResponses = responses.filter(r => {
    if (searchQuery && !r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.feedback?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (scoreFilter === 'promoters' && r.score < 9) return false;
    if (scoreFilter === 'passives' && (r.score < 7 || r.score >= 9)) return false;
    if (scoreFilter === 'detractors' && r.score >= 7) return false;
    return true;
  });

  const renderPawScore = (score) => {
    const paws = [];
    const fullPaws = Math.floor(score / 2);
    const hasHalf = score % 2 >= 1;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullPaws) {
        paws.push(<PawPrint key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />);
      } else if (i === fullPaws && hasHalf) {
        paws.push(<PawPrint key={i} className="w-5 h-5 fill-amber-300 text-amber-300" />);
      } else {
        paws.push(<PawPrint key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    return <div className="flex gap-0.5">{paws}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-amber-500" />
            Net Pawmoter Score™
          </h2>
          <p className="text-gray-500">Track customer satisfaction across all products and services</p>
        </div>
        <Button onClick={fetchAllData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-purple-700">{stats.nps_score ?? '--'}</p>
              <p className="text-sm text-purple-600">NPS Score</p>
            </div>
            <div className={`p-2 rounded-full ${(stats.nps_score || 0) >= 50 ? 'bg-green-200' : (stats.nps_score || 0) >= 0 ? 'bg-yellow-200' : 'bg-red-200'}`}>
              {(stats.nps_score || 0) >= 0 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-3xl font-bold text-green-700">{stats.promoters || 0}</p>
          <p className="text-sm text-green-600 flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" /> Promoters (9-10)
          </p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <p className="text-3xl font-bold text-yellow-700">{stats.passives || 0}</p>
          <p className="text-sm text-yellow-600 flex items-center gap-1">
            <Minus className="w-4 h-4" /> Passives (7-8)
          </p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <p className="text-3xl font-bold text-red-700">{stats.detractors || 0}</p>
          <p className="text-sm text-red-600 flex items-center gap-1">
            <ThumbsDown className="w-4 h-4" /> Detractors (0-6)
          </p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-3xl font-bold text-blue-700">{stats.total_responses || 0}</p>
          <p className="text-sm text-blue-600 flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> Total Responses
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="responses">💬 Responses</TabsTrigger>
          <TabsTrigger value="products">📦 By Product</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">NPS Score Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-green-600">Promoters</span>
                  <span className="text-sm font-medium">{stats.promoters_percent || stats.promoters_pct || 0}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${stats.promoters_percent || stats.promoters_pct || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-yellow-600">Passives</span>
                  <span className="text-sm font-medium">{stats.passives_percent || stats.passives_pct || 0}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${stats.passives_percent || stats.passives_pct || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-red-600">Detractors</span>
                  <span className="text-sm font-medium">{stats.detractors_percent || stats.detractors_pct || 0}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${stats.detractors_percent || stats.detractors_pct || 0}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Net Pawmoter Score™</strong> = % Promoters - % Detractors
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Score ranges from -100 to +100. Above 50 is excellent!
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer or feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Scores</option>
              <option value="promoters">Promoters (9-10)</option>
              <option value="passives">Passives (7-8)</option>
              <option value="detractors">Detractors (0-6)</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResponses.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No responses found</p>
                </Card>
              ) : (
                filteredResponses.map((response, idx) => {
                  const scoreInfo = getScoreType(response.score);
                  const ScoreIcon = scoreInfo.icon;
                  return (
                    <Card key={idx} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${scoreInfo.bg}`}>
                          <ScoreIcon className={`w-5 h-5 ${scoreInfo.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{response.customer_name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">{response.email}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={scoreInfo.bg + ' ' + scoreInfo.color}>
                                Score: {response.score}/10
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(response.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {response.feedback && (
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              "{response.feedback}"
                            </p>
                          )}
                          {response.product_name && (
                            <Badge className="mt-2 bg-blue-100 text-blue-700">
                              Product: {response.product_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-amber-500" />
              NPS by Product
            </h3>
            {productScores.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No product scores yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  NPS scores appear after customers complete satisfaction surveys
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productScores.map((product, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-14 h-14 object-cover rounded-lg" />
                        ) : (
                          <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center">
                            <PawPrint className="w-6 h-6 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.responses_count} review{product.responses_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {renderPawScore(product.avg_score || 0)}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-amber-600">
                            {(product.avg_score || 0).toFixed(1)}/10
                          </span>
                          {product.nps_score !== null && (
                            <Badge className={`${product.nps_score >= 50 ? 'bg-green-100 text-green-700' : product.nps_score >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              NPS: {product.nps_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Breakdown */}
                    <div className="p-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">{product.promoters} Promoters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Minus className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-700">{product.passives} Passives</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        <span className="text-red-700">{product.detractors} Detractors</span>
                      </div>
                    </div>
                    
                    {/* Latest Feedback */}
                    {product.latest_feedback && (
                      <div className="px-4 pb-4">
                        <p className="text-xs text-gray-500 mb-1">Latest feedback:</p>
                        <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg">
                          "{product.latest_feedback}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NPSManager;
