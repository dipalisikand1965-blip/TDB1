import React, { useState } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { MapPin, Plus, Home, Building2, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from '../../../hooks/use-toast';

const AddressesTab = ({ savedAddresses = [], onAddressUpdate, onAddressDelete, onAddressAdd }) => {
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    city: '',
    address: '',
    pincode: '',
    type: 'home'
  });
  
  // Ensure savedAddresses is always an array
  const addresses = Array.isArray(savedAddresses) ? savedAddresses : [];

  const handleEditSave = async () => {
    if (!editingAddress) return;
    try {
      if (onAddressUpdate) {
        await onAddressUpdate(editingAddress);
      }
      toast({ title: 'Address Updated', description: 'Your address has been updated successfully.' });
      setEditingAddress(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to update address', variant: 'destructive' });
    }
  };

  const handleDelete = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      if (onAddressDelete) {
        await onAddressDelete(addressId);
      }
      toast({ title: 'Address Deleted', description: 'The address has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.city || !newAddress.address || !newAddress.pincode) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    try {
      if (onAddressAdd) {
        await onAddressAdd(newAddress);
      }
      toast({ title: 'Address Added', description: 'New address saved successfully.' });
      setShowAddModal(false);
      setNewAddress({ city: '', address: '', pincode: '', type: 'home' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add address', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="addresses-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            Saved Addresses
          </h3>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Address
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {addresses.map((addr, idx) => (
            <div 
              key={addr.id || idx} 
              className="bg-slate-800/50 border border-white/5 p-4 rounded-xl hover:border-purple-500/30 transition-all group"
            >
              {editingAddress?.id === addr.id || editingAddress?.idx === idx ? (
                // Edit Mode
                <div className="space-y-3">
                  <Input 
                    value={editingAddress.city}
                    onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})}
                    placeholder="City"
                    className="bg-slate-700/50 border-white/10 text-white"
                  />
                  <Input 
                    value={editingAddress.address}
                    onChange={(e) => setEditingAddress({...editingAddress, address: e.target.value})}
                    placeholder="Full Address"
                    className="bg-slate-700/50 border-white/10 text-white"
                  />
                  <Input 
                    value={editingAddress.pincode}
                    onChange={(e) => setEditingAddress({...editingAddress, pincode: e.target.value})}
                    placeholder="Pincode"
                    className="bg-slate-700/50 border-white/10 text-white"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingAddress(null)} className="border-white/10 text-white hover:bg-slate-700">
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                    {addr.type === 'office' ? (
                      <Building2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Home className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm sm:text-base truncate">{addr.city}</p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{addr.address}</p>
                    <p className="text-xs text-slate-500 mt-1">{addr.pincode}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingAddress({...addr, idx})}
                      className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-4 h-4 text-purple-400" />
                    </button>
                    <button 
                      onClick={() => handleDelete(addr.id || idx)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {savedAddresses.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12">
              <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-white font-medium mb-2">No addresses saved yet</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Add your address for faster checkout and deliveries.
              </p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Your First Address
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Add Address Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              Add New Address
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">City *</label>
              <Input 
                value={newAddress.city}
                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                placeholder="e.g., Bangalore"
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Full Address *</label>
              <Input 
                value={newAddress.address}
                onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                placeholder="Street, Building, Landmark"
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Pincode *</label>
              <Input 
                value={newAddress.pincode}
                onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                placeholder="e.g., 560001"
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Type</label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={newAddress.type === 'home' ? 'default' : 'outline'}
                  onClick={() => setNewAddress({...newAddress, type: 'home'})}
                  className={newAddress.type === 'home' ? 'bg-purple-600' : 'border-white/10 text-white'}
                >
                  <Home className="w-4 h-4 mr-1.5" /> Home
                </Button>
                <Button 
                  type="button"
                  variant={newAddress.type === 'office' ? 'default' : 'outline'}
                  onClick={() => setNewAddress({...newAddress, type: 'office'})}
                  className={newAddress.type === 'office' ? 'bg-purple-600' : 'border-white/10 text-white'}
                >
                  <Building2 className="w-4 h-4 mr-1.5" /> Office
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-white/10 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button onClick={handleAddAddress} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Check className="w-4 h-4 mr-1.5" /> Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressesTab;
