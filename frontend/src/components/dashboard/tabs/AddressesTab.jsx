import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { MapPin, Plus, Home, Building2 } from 'lucide-react';

const AddressesTab = ({ savedAddresses }) => {
  return (
    <div className="animate-in fade-in-50 duration-300" data-testid="addresses-tab">
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            Saved Addresses
          </h3>
          <Button 
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Address
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {savedAddresses.map((addr, idx) => (
            <div 
              key={idx} 
              className="bg-slate-800/50 border border-white/5 p-4 rounded-xl hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                  {addr.type === 'office' ? (
                    <Building2 className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Home className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm sm:text-base truncate">{addr.city}</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 line-clamp-2">{addr.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{addr.pincode}</p>
                </div>
              </div>
            </div>
          ))}
          
          {savedAddresses.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12">
              <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-white font-medium mb-2">No addresses saved yet</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Addresses will be automatically saved when you place an order.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AddressesTab;
