import React from 'react';
import { Card } from '../../ui/card';
import { MapPin } from 'lucide-react';

const AddressesTab = ({ savedAddresses }) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6">Saved Addresses</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {savedAddresses.map((addr, idx) => (
          <div key={idx} className="border p-4 rounded-xl hover:border-purple-200 transition-colors">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="font-medium text-gray-900">{addr.city}</p>
                <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                <p className="text-sm text-gray-500">{addr.pincode}</p>
              </div>
            </div>
          </div>
        ))}
        {savedAddresses.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-500">
            No addresses saved yet. They will be added when you place an order.
          </div>
        )}
      </div>
    </Card>
  );
};

export default AddressesTab;
