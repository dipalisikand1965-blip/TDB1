import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  Heart, Download, Plus, TrendingUp, Syringe, Stethoscope, Pill, 
  AlertTriangle, FileText, Calendar, Scale, Trash2, X, Check,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { API_URL } from '../../utils/api';

const HealthVaultTab = ({ pets, memberEmail, onRefresh }) => {
  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedPet, setExpandedPet] = useState(null);
  const [showAddModal, setShowAddModal] = useState(null); // { petId, type }
  const [formData, setFormData] = useState({});

  // Fetch health vault data for all pets
  useEffect(() => {
    if (memberEmail) {
      fetchHealthData();
    }
  }, [memberEmail]);

  const fetchHealthData = async () => {
    if (!memberEmail) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/health-vault/member/${encodeURIComponent(memberEmail)}/all-pets`);
      if (response.ok) {
        const data = await response.json();
        const healthMap = {};
        data.pets.forEach(pet => {
          healthMap[pet.pet_id] = pet;
        });
        setHealthData(healthMap);
        // Auto-expand first pet
        if (data.pets.length > 0 && !expandedPet) {
          setExpandedPet(data.pets[0].pet_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (petId) => {
    try {
      const response = await fetch(`${API_URL}/api/health-vault/pet/${petId}/export-pdf`);
      if (response.ok) {
        const data = await response.json();
        // Convert base64 to blob and download
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleAddRecord = async (petId, type) => {
    try {
      let endpoint = '';
      let body = {};
      
      switch (type) {
        case 'weight':
          endpoint = `/api/health-vault/pet/${petId}/weight`;
          body = {
            weight: parseFloat(formData.weight),
            unit: formData.unit || 'kg',
            date: formData.date || new Date().toISOString().split('T')[0],
            notes: formData.notes
          };
          break;
        case 'vaccination':
          endpoint = `/api/health-vault/pet/${petId}/vaccination`;
          body = {
            name: formData.name,
            date: formData.date,
            next_due: formData.next_due,
            vet_name: formData.vet_name,
            notes: formData.notes
          };
          break;
        case 'vet_visit':
          endpoint = `/api/health-vault/pet/${petId}/vet-visit`;
          body = {
            date: formData.date,
            reason: formData.reason,
            clinic_name: formData.clinic_name,
            vet_name: formData.vet_name,
            diagnosis: formData.diagnosis,
            treatment: formData.treatment,
            notes: formData.notes
          };
          break;
        case 'medication':
          endpoint = `/api/health-vault/pet/${petId}/medication`;
          body = {
            name: formData.name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            start_date: formData.start_date,
            end_date: formData.end_date,
            notes: formData.notes
          };
          break;
        case 'allergy':
          endpoint = `/api/health-vault/pet/${petId}/allergy`;
          body = {
            allergen: formData.allergen,
            severity: formData.severity || 'moderate',
            reaction: formData.reaction
          };
          break;
        default:
          return;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowAddModal(null);
        setFormData({});
        fetchHealthData();
      } else {
        alert('Failed to add record');
      }
    } catch (error) {
      console.error('Failed to add record:', error);
      alert('Failed to add record');
    }
  };

  const handleDeleteRecord = async (petId, recordType, recordId) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/health-vault/pet/${petId}/record/${recordType}/${recordId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        fetchHealthData();
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  // Render add record modal
  const renderAddModal = () => {
    if (!showAddModal) return null;
    
    const { petId, type } = showAddModal;
    const pet = pets.find(p => p.id === petId);
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Add {type.replace('_', ' ')} for {pet?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {type === 'weight' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Weight *</label>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="e.g., 12.5"
                      value={formData.weight || ''}
                      onChange={e => setFormData({...formData, weight: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select 
                      className="w-full border rounded-md p-2"
                      value={formData.unit || 'kg'}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input 
                    type="date"
                    value={formData.date || new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea 
                    placeholder="Any notes..."
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {type === 'vaccination' && (
              <>
                <div>
                  <label className="text-sm font-medium">Vaccine Name *</label>
                  <Input 
                    placeholder="e.g., Rabies, DHPP"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date Given *</label>
                    <Input 
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Next Due</label>
                    <Input 
                      type="date"
                      value={formData.next_due || ''}
                      onChange={e => setFormData({...formData, next_due: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Vet Name</label>
                  <Input 
                    placeholder="Dr. Name"
                    value={formData.vet_name || ''}
                    onChange={e => setFormData({...formData, vet_name: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {type === 'vet_visit' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input 
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason *</label>
                    <Input 
                      placeholder="Checkup, Illness..."
                      value={formData.reason || ''}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Clinic Name</label>
                  <Input 
                    placeholder="Vet Clinic Name"
                    value={formData.clinic_name || ''}
                    onChange={e => setFormData({...formData, clinic_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Diagnosis</label>
                  <Textarea 
                    placeholder="What was diagnosed..."
                    value={formData.diagnosis || ''}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Treatment</label>
                  <Textarea 
                    placeholder="Treatment given..."
                    value={formData.treatment || ''}
                    onChange={e => setFormData({...formData, treatment: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {type === 'medication' && (
              <>
                <div>
                  <label className="text-sm font-medium">Medication Name *</label>
                  <Input 
                    placeholder="e.g., Heartgard"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Dosage *</label>
                    <Input 
                      placeholder="e.g., 10mg"
                      value={formData.dosage || ''}
                      onChange={e => setFormData({...formData, dosage: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Frequency *</label>
                    <Input 
                      placeholder="e.g., Once daily"
                      value={formData.frequency || ''}
                      onChange={e => setFormData({...formData, frequency: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date"
                      value={formData.start_date || ''}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date"
                      value={formData.end_date || ''}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}
            
            {type === 'allergy' && (
              <>
                <div>
                  <label className="text-sm font-medium">Allergen *</label>
                  <Input 
                    placeholder="e.g., Chicken, Grass"
                    value={formData.allergen || ''}
                    onChange={e => setFormData({...formData, allergen: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <select 
                    className="w-full border rounded-md p-2"
                    value={formData.severity || 'moderate'}
                    onChange={e => setFormData({...formData, severity: e.target.value})}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reaction</label>
                  <Textarea 
                    placeholder="Describe the reaction..."
                    value={formData.reaction || ''}
                    onChange={e => setFormData({...formData, reaction: e.target.value})}
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleAddRecord(petId, type)}>
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Health Vault
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHealthData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Pet Cards */}
      {pets.map((pet) => {
        const health = healthData[pet.id] || {};
        const isExpanded = expandedPet === pet.id;
        const weightHistory = (health.weight_history || [])
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-12); // Last 12 entries for chart
        
        return (
          <Card key={pet.id} className="overflow-hidden">
            {/* Pet Header - Always visible */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              onClick={() => setExpandedPet(isExpanded ? null : pet.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  {pet.name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{pet.name}</h4>
                    {pet.pet_pass_number && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {pet.pet_pass_number}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {pet.breed} • 
                    {health.current_weight ? ` ${health.current_weight} ${health.weight_unit || 'kg'}` : ' No weight recorded'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPDF(pet.id);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> PDF
                </Button>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t p-4 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Scale className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-700">{health.current_weight || '-'}</p>
                    <p className="text-xs text-gray-500">Current Weight</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Syringe className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-700">{(health.vaccinations || []).length}</p>
                    <p className="text-xs text-gray-500">Vaccinations</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-purple-700">{(health.vet_visits || []).length}</p>
                    <p className="text-xs text-gray-500">Vet Visits</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-red-700">{(health.allergies || []).length}</p>
                    <p className="text-xs text-gray-500">Allergies</p>
                  </div>
                </div>

                {/* Weight Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> Weight History
                    </h5>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddModal({ petId: pet.id, type: 'weight' })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Weight
                    </Button>
                  </div>
                  
                  {weightHistory.length > 0 ? (
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weightHistory}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10 }}
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip 
                            formatter={(value) => [`${value} ${health.weight_unit || 'kg'}`, 'Weight']}
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#8B5CF6" 
                            fill="url(#weightGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No weight data recorded yet</p>
                        <Button 
                          size="sm" 
                          variant="link"
                          onClick={() => setShowAddModal({ petId: pet.id, type: 'weight' })}
                        >
                          Add first weight entry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Allergies - Important to show prominently */}
                {(health.allergies || []).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Allergies & Sensitivities
                      </h5>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setShowAddModal({ petId: pet.id, type: 'allergy' })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {health.allergies.map((allergy, idx) => (
                        <Badge 
                          key={idx} 
                          variant={allergy.severity === 'severe' ? 'destructive' : 'outline'}
                          className={allergy.severity === 'severe' ? '' : 'border-red-300 text-red-700'}
                        >
                          {typeof allergy === 'string' ? allergy : allergy.allergen}
                          {typeof allergy === 'object' && allergy.severity && (
                            <span className="ml-1 opacity-70">({allergy.severity})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vaccinations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Syringe className="w-4 h-4" /> Vaccinations
                    </h5>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddModal({ petId: pet.id, type: 'vaccination' })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {(health.vaccinations || []).length > 0 ? (
                    <div className="space-y-2">
                      {health.vaccinations.map((vax, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                              <Syringe className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{vax.name}</p>
                              <p className="text-xs text-gray-500">
                                Given: {new Date(vax.date).toLocaleDateString()}
                                {vax.next_due && ` • Next: ${new Date(vax.next_due).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {vax.next_due && new Date(vax.next_due) < new Date() && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteRecord(pet.id, 'vaccinations', vax.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-lg text-center">
                      No vaccinations recorded
                    </p>
                  )}
                </div>

                {/* Vet Visits */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" /> Vet Visits
                    </h5>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddModal({ petId: pet.id, type: 'vet_visit' })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {(health.vet_visits || []).length > 0 ? (
                    <div className="space-y-2">
                      {health.vet_visits.slice(0, 5).map((visit, idx) => (
                        <div key={idx} className="p-3 bg-purple-50 rounded-lg group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{visit.reason}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(visit.date).toLocaleDateString()}
                                {visit.clinic_name && ` • ${visit.clinic_name}`}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteRecord(pet.id, 'vet_visits', visit.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                          {(visit.diagnosis || visit.treatment) && (
                            <div className="mt-2 pt-2 border-t border-purple-100 text-xs text-gray-600">
                              {visit.diagnosis && <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                              {visit.treatment && <p><strong>Treatment:</strong> {visit.treatment}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-lg text-center">
                      No vet visits recorded
                    </p>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Pill className="w-4 h-4" /> Medications
                    </h5>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddModal({ petId: pet.id, type: 'medication' })}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {(health.medications || []).length > 0 ? (
                    <div className="space-y-2">
                      {health.medications.map((med, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg group">
                          <div>
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-xs text-gray-500">
                              {med.dosage} • {med.frequency}
                              {med.start_date && ` • Started: ${new Date(med.start_date).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteRecord(pet.id, 'medications', med.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-lg text-center">
                      No medications recorded
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Add Record Modal */}
      {renderAddModal()}
    </div>
  );
};

export default HealthVaultTab;
