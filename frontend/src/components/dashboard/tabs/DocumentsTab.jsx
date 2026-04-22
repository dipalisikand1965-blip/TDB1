import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { 
  Shield, FileText, Upload, Download, Calendar, AlertCircle, 
  ChevronRight, Search, Filter, Plus, Eye, Trash2, Loader2
} from 'lucide-react';

const DocumentsTab = ({ pets, token, API_URL }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [selectedPetId]);

  const fetchDocuments = async () => {
    if (!pets || pets.length === 0) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch documents for all pets or selected pet
      const petIds = selectedPetId === 'all' ? pets.map(p => p.id) : [selectedPetId];
      const allDocs = [];
      
      for (const petId of petIds) {
        const res = await fetch(`${API_URL}/api/pet-vault/${petId}/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pet = pets.find(p => p.id === petId);
          const docsWithPet = (data.documents || []).map(doc => ({
            ...doc,
            pet_name: pet?.name || 'Unknown',
            pet_id: petId
          }));
          allDocs.push(...docsWithPet);
        }
      }
      
      // Sort by created date
      allDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDocuments(allDocs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    categoryFilter === 'all' || doc.category === categoryFilter
  );

  const categoryIcons = {
    identity: '🪪',
    medical: '💊',
    travel: '✈️',
    insurance: '🛡️',
    care: '💝',
    legal: '📋'
  };

  const categoryColors = {
    identity: 'bg-blue-100 text-blue-700 border-blue-200',
    medical: 'bg-green-100 text-green-700 border-green-200',
    travel: 'bg-purple-100 text-purple-700 border-purple-200',
    insurance: 'bg-amber-100 text-amber-700 border-amber-200',
    care: 'bg-pink-100 text-pink-700 border-pink-200',
    legal: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  // Calculate stats
  const stats = {
    total: documents.length,
    expiringSoon: documents.filter(d => {
      if (!d.expiry_date) return false;
      const expiry = new Date(d.expiry_date);
      const now = new Date();
      const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length,
    expired: documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date()).length
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Document Vault
          </h2>
          <p className="text-sm text-gray-500 mt-1">Secure storage for all your pet documents</p>
        </div>
        <Button 
          onClick={() => navigate('/paperwork')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <FileText className="w-6 h-6 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Documents</p>
        </Card>
        <Card className={`p-4 text-center ${stats.expiringSoon > 0 ? 'bg-amber-50 border-amber-200' : ''}`}>
          <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${stats.expiringSoon > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
          <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
          <p className="text-xs text-gray-500">Expiring Soon</p>
        </Card>
        <Card className={`p-4 text-center ${stats.expired > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <Calendar className={`w-6 h-6 mx-auto mb-2 ${stats.expired > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
          <p className="text-xs text-gray-500">Expired</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Pet Filter */}
        {pets.length > 1 && (
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm"
          >
            <option value="all">All Pets ({pets.length})</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </select>
        )}

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="identity">🪪 Identity</option>
          <option value="medical">💊 Medical</option>
          <option value="travel">✈️ Travel</option>
          <option value="insurance">🛡️ Insurance</option>
          <option value="care">💝 Care</option>
          <option value="legal">📋 Legal</option>
        </select>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
            const isExpiringSoon = doc.expiry_date && !isExpired && (() => {
              const daysUntil = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
              return daysUntil <= 30;
            })();

            return (
              <Card 
                key={doc.id} 
                className={`p-4 hover:shadow-md transition-shadow ${
                  isExpired ? 'border-red-200 bg-red-50/50' : 
                  isExpiringSoon ? 'border-amber-200 bg-amber-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${categoryColors[doc.category] || 'bg-gray-100'}`}>
                      {categoryIcons[doc.category] || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{doc.document_name}</h3>
                        <Badge variant="outline" className={`text-xs capitalize ${categoryColors[doc.category]}`}>
                          {doc.category}
                        </Badge>
                        {pets.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            🐾 {doc.pet_name}
                          </Badge>
                        )}
                      </div>
                      {doc.subcategory && (
                        <p className="text-xs text-gray-500 mt-0.5">{doc.subcategory}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {doc.document_date && (
                          <span>📅 {doc.document_date}</span>
                        )}
                        {doc.expiry_date && (
                          <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-amber-600 font-medium' : ''}>
                            {isExpired ? '❌ Expired: ' : isExpiringSoon ? '⚠️ Expires: ' : '📆 Expires: '}
                            {doc.expiry_date}
                          </span>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    {doc.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url.startsWith('/') ? `${API_URL}${doc.file_url}` : doc.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
          <p className="text-gray-500 mb-6">
            Start building your pet&apos;s document vault for secure storage of important papers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/paperwork')} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
            <Button variant="outline" onClick={() => navigate('/paperwork')}>
              Learn About Document Vault
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Upload Categories */}
      {documents.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">Quick Upload</h4>
          <div className="flex flex-wrap gap-2">
            {['Vaccination Record', 'KCI Registration', 'Pet Passport', 'Insurance Policy', 'Vet Prescription'].map(docType => (
              <Button
                key={docType}
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => navigate('/paperwork')}
              >
                <Plus className="w-3 h-3 mr-1" />
                {docType}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DocumentsTab;
