import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Syringe, Pill, Stethoscope, UserCircle, FileText, 
  Scale, Calendar, Plus, AlertCircle, CheckCircle,
  Phone, MapPin, ChevronLeft, Loader2, Trash2, Edit
} from 'lucide-react';
import { API_URL } from '../utils/api';

const PetVault = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Full data for tabs
  const [vaccines, setVaccines] = useState([]);
  const [medications, setMedications] = useState([]);
  const [visits, setVisits] = useState([]);
  const [vets, setVets] = useState([]);
  
  // Modal states
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddVet, setShowAddVet] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  
  // Form states
  const [vaccineForm, setVaccineForm] = useState({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '', reminder_enabled: true });
  const [medForm, setMedForm] = useState({ medication_name: '', dosage: '', frequency: '', start_date: '', reason: '' });
  const [vetForm, setVetForm] = useState({ name: '', clinic_name: '', phone: '', address: '', is_primary: false });
  const [visitForm, setVisitForm] = useState({ visit_date: '', vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '' });
  const [weightForm, setWeightForm] = useState({ date: '', weight_kg: '' });
  
  const [saving, setSaving] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchSummary();
    fetchVaccines();
    fetchMedications();
    fetchVisits();
    fetchVets();
  }, [petId]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching vault:', err);
    }
    setLoading(false);
  };

  // Add handlers
  const handleAddVaccine = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vaccineForm, reminder_enabled: true })
      });
      if (res.ok) {
        setShowAddVaccine(false);
        setVaccineForm({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '' });
        fetchSummary();
      }
    } catch (err) {
      console.error('Error adding vaccine:', err);
    }
    setSaving(false);
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm)
      });
      if (res.ok) {
        setShowAddMedication(false);
        setMedForm({ medication_name: '', dosage: '', frequency: '', start_date: '', reason: '' });
        fetchSummary();
      }
    } catch (err) {
      console.error('Error adding medication:', err);
    }
    setSaving(false);
  };

  const handleAddVet = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/vets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vetForm)
      });
      if (res.ok) {
        setShowAddVet(false);
        setVetForm({ name: '', clinic_name: '', phone: '', address: '', is_primary: false });
        fetchSummary();
      }
    } catch (err) {
      console.error('Error adding vet:', err);
    }
    setSaving(false);
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...visitForm, cost: visitForm.cost ? parseFloat(visitForm.cost) : null })
      });
      if (res.ok) {
        setShowAddVisit(false);
        setVisitForm({ visit_date: '', vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '' });
        fetchSummary();
      }
    } catch (err) {
      console.error('Error adding visit:', err);
    }
    setSaving(false);
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${petId}/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...weightForm, weight_kg: parseFloat(weightForm.weight_kg) })
      });
      if (res.ok) {
        setShowAddWeight(false);
        setWeightForm({ date: '', weight_kg: '' });
        fetchSummary();
      }
    } catch (err) {
      console.error('Error adding weight:', err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading Pet Vault...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Pet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/my-pets')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{summary.pet_name}'s Health Vault</h1>
              <p className="text-sm text-gray-500">{summary.pet_breed}</p>
            </div>
            {summary.current_weight_kg && (
              <Badge variant="outline" className="ml-auto">
                <Scale className="w-3 h-3 mr-1" /> {summary.current_weight_kg} kg
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Alerts */}
        {summary.alerts && summary.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {summary.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg flex items-center gap-3 ${
                  alert.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                  alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('vaccines')}>
            <Syringe className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900">{summary.summary.total_vaccines}</div>
            <div className="text-xs text-gray-500">Vaccines</div>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('medications')}>
            <Pill className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-gray-900">{summary.summary.active_medications}</div>
            <div className="text-xs text-gray-500">Active Meds</div>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('visits')}>
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-gray-900">{summary.summary.total_vet_visits}</div>
            <div className="text-xs text-gray-500">Vet Visits</div>
          </Card>
          <Card className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('vets')}>
            <UserCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-gray-900">{summary.summary.saved_vets}</div>
            <div className="text-xs text-gray-500">Saved Vets</div>
          </Card>
        </div>

        {/* Primary Vet Card */}
        {summary.primary_vet && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-white border-purple-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{summary.primary_vet.name}</h3>
                  <Badge className="bg-purple-100 text-purple-700">Primary Vet</Badge>
                </div>
                <p className="text-sm text-gray-600">{summary.primary_vet.clinic_name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {summary.primary_vet.phone && (
                    <a href={`tel:${summary.primary_vet.phone}`} className="flex items-center gap-1 hover:text-purple-600">
                      <Phone className="w-4 h-4" /> {summary.primary_vet.phone}
                    </a>
                  )}
                  {summary.primary_vet.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {summary.primary_vet.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
            <TabsTrigger value="medications">Meds</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="vets">Vets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Active Medications */}
              {summary.active_medications && summary.active_medications.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-green-500" /> Active Medications
                  </h3>
                  <div className="space-y-2">
                    {summary.active_medications.map((med, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-gray-900">{med.medication_name}</div>
                          <div className="text-sm text-gray-500">{med.dosage} - {med.frequency}</div>
                        </div>
                        {med.reason && <Badge variant="outline">{med.reason}</Badge>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Last Visit */}
              {summary.last_visit && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-purple-500" /> Last Vet Visit
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{summary.last_visit.reason}</span>
                      <Badge variant="outline">{summary.last_visit.visit_date}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{summary.last_visit.vet_name} at {summary.last_visit.clinic_name}</p>
                    {summary.last_visit.diagnosis && (
                      <p className="text-sm text-gray-500 mt-2">Diagnosis: {summary.last_visit.diagnosis}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Upcoming Follow-ups */}
              {summary.upcoming_followups && summary.upcoming_followups.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Follow-ups
                  </h3>
                  <div className="space-y-2">
                    {summary.upcoming_followups.map((fu, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-gray-900">{fu.reason}</div>
                          <div className="text-sm text-gray-500">{fu.vet_name}</div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">{fu.follow_up_date}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Weight Tracking */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-500" /> Weight
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setShowAddWeight(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Log Weight
                  </Button>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {summary.current_weight_kg || '--'} <span className="text-lg text-gray-500">kg</span>
                  </div>
                  {summary.last_weight_record && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last recorded: {summary.last_weight_record.date}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Vaccines Tab */}
          <TabsContent value="vaccines">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Vaccination Records</h3>
              <Button onClick={() => setShowAddVaccine(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Vaccine
              </Button>
            </div>
            {summary.summary.total_vaccines === 0 ? (
              <Card className="p-8 text-center">
                <Syringe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No vaccine records yet</p>
                <Button className="mt-4" onClick={() => setShowAddVaccine(true)}>Add First Vaccine</Button>
              </Card>
            ) : (
              <p className="text-gray-500 text-center">View vaccines in detail list (coming soon)</p>
            )}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Medications</h3>
              <Button onClick={() => setShowAddMedication(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Medication
              </Button>
            </div>
            {summary.summary.total_medications === 0 ? (
              <Card className="p-8 text-center">
                <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No medications recorded</p>
                <Button className="mt-4" onClick={() => setShowAddMedication(true)}>Add Medication</Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {summary.active_medications?.map((med, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{med.medication_name}</div>
                        <div className="text-sm text-gray-500">{med.dosage} - {med.frequency}</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Visits Tab */}
          <TabsContent value="visits">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Vet Visits</h3>
              <Button onClick={() => setShowAddVisit(true)}>
                <Plus className="w-4 h-4 mr-1" /> Log Visit
              </Button>
            </div>
            {summary.summary.total_vet_visits === 0 ? (
              <Card className="p-8 text-center">
                <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No vet visits recorded</p>
                <Button className="mt-4" onClick={() => setShowAddVisit(true)}>Log First Visit</Button>
              </Card>
            ) : summary.last_visit && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{summary.last_visit.reason}</span>
                  <Badge>{summary.last_visit.visit_date}</Badge>
                </div>
                <p className="text-sm text-gray-600">{summary.last_visit.vet_name}</p>
                {summary.last_visit.diagnosis && (
                  <p className="text-sm text-gray-500 mt-2">Diagnosis: {summary.last_visit.diagnosis}</p>
                )}
                {summary.last_visit.cost && (
                  <p className="text-sm font-medium text-gray-700 mt-2">Cost: ₹{summary.last_visit.cost}</p>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Vets Tab */}
          <TabsContent value="vets">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Saved Veterinarians</h3>
              <Button onClick={() => setShowAddVet(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Vet
              </Button>
            </div>
            {summary.summary.saved_vets === 0 ? (
              <Card className="p-8 text-center">
                <UserCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No vets saved yet</p>
                <Button className="mt-4" onClick={() => setShowAddVet(true)}>Add Your Vet</Button>
              </Card>
            ) : summary.primary_vet && (
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">{summary.primary_vet.name}</div>
                    <p className="text-sm text-gray-600">{summary.primary_vet.clinic_name}</p>
                    {summary.primary_vet.phone && (
                      <a href={`tel:${summary.primary_vet.phone}`} className="text-sm text-purple-600">{summary.primary_vet.phone}</a>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Vaccine Modal */}
      {showAddVaccine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Vaccine Record</h3>
            <form onSubmit={handleAddVaccine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
                <Input
                  value={vaccineForm.vaccine_name}
                  onChange={(e) => setVaccineForm({...vaccineForm, vaccine_name: e.target.value})}
                  placeholder="e.g., Rabies, DHPP"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Given *</label>
                  <Input
                    type="date"
                    value={vaccineForm.date_given}
                    onChange={(e) => setVaccineForm({...vaccineForm, date_given: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                  <Input
                    type="date"
                    value={vaccineForm.next_due_date}
                    onChange={(e) => setVaccineForm({...vaccineForm, next_due_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vet Name</label>
                <Input
                  value={vaccineForm.vet_name}
                  onChange={(e) => setVaccineForm({...vaccineForm, vet_name: e.target.value})}
                  placeholder="Dr. Smith"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddVaccine(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Medication</h3>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                <Input
                  value={medForm.medication_name}
                  onChange={(e) => setMedForm({...medForm, medication_name: e.target.value})}
                  placeholder="e.g., Nexgard, Apoquel"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                  <Input
                    value={medForm.dosage}
                    onChange={(e) => setMedForm({...medForm, dosage: e.target.value})}
                    placeholder="e.g., 68mg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                  <Input
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({...medForm, frequency: e.target.value})}
                    placeholder="e.g., once daily"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <Input
                  type="date"
                  value={medForm.start_date}
                  onChange={(e) => setMedForm({...medForm, start_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <Input
                  value={medForm.reason}
                  onChange={(e) => setMedForm({...medForm, reason: e.target.value})}
                  placeholder="e.g., Flea prevention"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddMedication(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Vet Modal */}
      {showAddVet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add Veterinarian</h3>
            <form onSubmit={handleAddVet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vet Name *</label>
                <Input
                  value={vetForm.name}
                  onChange={(e) => setVetForm({...vetForm, name: e.target.value})}
                  placeholder="Dr. Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <Input
                  value={vetForm.clinic_name}
                  onChange={(e) => setVetForm({...vetForm, clinic_name: e.target.value})}
                  placeholder="Happy Paws Clinic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={vetForm.phone}
                  onChange={(e) => setVetForm({...vetForm, phone: e.target.value})}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Input
                  value={vetForm.address}
                  onChange={(e) => setVetForm({...vetForm, address: e.target.value})}
                  placeholder="123 Pet Street"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vetForm.is_primary}
                  onChange={(e) => setVetForm({...vetForm, is_primary: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Set as primary vet</span>
              </label>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddVet(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Visit Modal */}
      {showAddVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Log Vet Visit</h3>
            <form onSubmit={handleAddVisit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
                <Input
                  type="date"
                  value={visitForm.visit_date}
                  onChange={(e) => setVisitForm({...visitForm, visit_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vet Name *</label>
                <Input
                  value={visitForm.vet_name}
                  onChange={(e) => setVisitForm({...visitForm, vet_name: e.target.value})}
                  placeholder="Dr. Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit *</label>
                <Input
                  value={visitForm.reason}
                  onChange={(e) => setVisitForm({...visitForm, reason: e.target.value})}
                  placeholder="e.g., Annual checkup"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <Input
                  value={visitForm.diagnosis}
                  onChange={(e) => setVisitForm({...visitForm, diagnosis: e.target.value})}
                  placeholder="What did the vet find?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                <Input
                  value={visitForm.treatment}
                  onChange={(e) => setVisitForm({...visitForm, treatment: e.target.value})}
                  placeholder="Prescribed medications, procedures..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                <Input
                  type="number"
                  value={visitForm.cost}
                  onChange={(e) => setVisitForm({...visitForm, cost: e.target.value})}
                  placeholder="2500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddVisit(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Weight Modal */}
      {showAddWeight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Log Weight</h3>
            <form onSubmit={handleAddWeight} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <Input
                  type="date"
                  value={weightForm.date}
                  onChange={(e) => setWeightForm({...weightForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={weightForm.weight_kg}
                  onChange={(e) => setWeightForm({...weightForm, weight_kg: e.target.value})}
                  placeholder="15.5"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddWeight(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PetVault;
