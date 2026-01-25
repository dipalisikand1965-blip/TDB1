import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

const MembersTab = ({ 
  members, 
  memberStats, 
  setSelectedMember,
  updateMemberTier 
}) => {
  // CSV Export function
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Membership Tier', 'Joined Date', 'Expires', 'Chats Today'];
    const rows = members.map(m => [
      m.name || 'Guest',
      m.email || '',
      m.phone || '',
      m.membership_tier || 'curious_pup',
      m.created_at ? new Date(m.created_at).toLocaleDateString() : '',
      m.membership_expires ? new Date(m.membership_expires).toLocaleDateString() : '',
      m.chat_count_today || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="members-tab">
      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-3xl font-bold">{members.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-100 to-pink-100">
          <p className="text-sm text-purple-600 font-medium">Total Members</p>
          <p className="text-3xl font-bold text-purple-700">{memberStats.total || 0}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-blue-600">🐕 Curious Pup</p>
          <p className="text-3xl font-bold text-blue-700">{memberStats.curious_pup || memberStats.free || 0}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-600">🦮 Loyal Companion</p>
          <p className="text-3xl font-bold text-green-700">{memberStats.loyal_companion || memberStats.pawsome || 0}</p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-sm text-purple-600">🛡️ Trusted Guardian</p>
          <p className="text-3xl font-bold text-purple-700">{memberStats.trusted_guardian || memberStats.premium || 0}</p>
        </Card>
        <Card className="p-4 bg-amber-50">
          <p className="text-sm text-amber-600">👑 Pack Leader</p>
          <p className="text-3xl font-bold text-amber-700">{memberStats.pack_leader || memberStats.vip || 0}</p>
        </Card>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chats Today</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-purple-50 cursor-pointer transition-colors"
                onClick={() => setSelectedMember(member)}
                data-testid={`member-row-${idx}`}
              >
                <td className="px-6 py-4">
                  <p className="font-medium">{member.name || 'Guest'}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm">{member.email}</p>
                  <p className="text-xs text-gray-500">{member.phone || 'No phone'}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={
                    member.membership_tier === 'pack_leader' || member.membership_tier === 'vip' ? 'warning' :
                    member.membership_tier === 'trusted_guardian' || member.membership_tier === 'premium' ? 'default' :
                    member.membership_tier === 'loyal_companion' || member.membership_tier === 'pawsome' ? 'secondary' : 
                    member.membership_tier === 'curious_pup' || member.membership_tier === 'free' ? 'outline' : 'outline'
                  }>
                    {member.membership_tier === 'pack_leader' || member.membership_tier === 'vip' ? '👑 Pack Leader' :
                     member.membership_tier === 'trusted_guardian' || member.membership_tier === 'premium' ? '🛡️ Trusted Guardian' :
                     member.membership_tier === 'loyal_companion' || member.membership_tier === 'pawsome' ? '🦮 Loyal Companion' : 
                     '🐕 Curious Pup'}
                  </Badge>
                  {member.membership_expires && (
                    <p className="text-xs text-gray-500 mt-1">
                      Exp: {new Date(member.membership_expires).toLocaleDateString()}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {member.chat_count_today || 0}
                </td>
                <td className="px-6 py-4">
                  <select
                    defaultValue={member.membership_tier || 'curious_pup'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateMemberTier(member.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                    data-testid={`tier-select-${idx}`}
                  >
                    <option value="curious_pup">🐕 Curious Pup</option>
                    <option value="loyal_companion">🦮 Loyal Companion</option>
                    <option value="trusted_guardian">🛡️ Trusted Guardian</option>
                    <option value="pack_leader">👑 Pack Leader</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersTab;
