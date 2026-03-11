/**
 * ChecklistDownloadButton.jsx
 * 
 * Button component to download personalized PDF checklists
 * Integrates with pet soul data for personalization
 * 
 * Created: March 12, 2026
 */

import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { usePillarContext } from '../../context/PillarContext';
import { ChecklistPDF, EmergencyCardPDF } from './ChecklistPDF';

const ChecklistDownloadButton = ({ 
  pillar,
  variant = 'default', // 'default' | 'outline' | 'ghost'
  size = 'default', // 'sm' | 'default' | 'lg'
  showLabel = true,
  className = ''
}) => {
  const [availableChecklists, setAvailableChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const { token } = useAuth();
  const { currentPet } = usePillarContext();

  // Fetch available checklists for this pillar
  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const response = await fetch(`${API_URL}/api/checklists/${pillar}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableChecklists(data.checklists || []);
        }
      } catch (error) {
        console.error('Failed to fetch checklists:', error);
      }
    };

    if (pillar) {
      fetchChecklists();
    }
  }, [pillar]);

  // Get pet soul data for personalization
  const getPetSoulData = async () => {
    if (!currentPet || !token) return null;

    try {
      const response = await fetch(`${API_URL}/api/pets/${currentPet.id || currentPet._id}/soul`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          pet_name: currentPet.name,
          breed: currentPet.breed,
          size: currentPet.size || data.doggy_soul_answers?.size,
          coat_type: data.doggy_soul_answers?.coat_type,
          allergies: data.doggy_soul_answers?.allergies || currentPet.allergies,
          medications: data.doggy_soul_answers?.medications || currentPet.medications,
          life_stage: data.doggy_soul_answers?.life_stage || currentPet.life_stage,
          soul_score: data.soul_score || currentPet.soul_score,
          favorite_activities: data.doggy_soul_answers?.favorite_activities,
          anxiety_triggers: data.doggy_soul_answers?.anxiety_triggers,
          health_conditions: data.doggy_soul_answers?.health_conditions,
        };
      }
    } catch (error) {
      console.error('Failed to fetch pet soul data:', error);
    }

    // Fallback to basic pet data
    return {
      pet_name: currentPet?.name,
      breed: currentPet?.breed,
      life_stage: currentPet?.life_stage,
    };
  };

  // Download a specific checklist as PDF
  const handleDownload = async (checklistId) => {
    setDownloadingId(checklistId);
    
    try {
      // Get personalization data
      const personalization = await getPetSoulData();
      
      // Build query params for personalization
      const params = new URLSearchParams();
      if (personalization) {
        Object.entries(personalization).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      // Fetch checklist data
      const endpoint = personalization 
        ? `${API_URL}/api/checklists/${pillar}/${checklistId}/personalized?${params}`
        : `${API_URL}/api/checklists/${pillar}/${checklistId}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch checklist');
      }

      const data = await response.json();
      const checklist = data.checklist;

      // Generate PDF based on checklist type
      let pdfDocument;
      
      if (checklistId === 'emergency_card') {
        pdfDocument = <EmergencyCardPDF checklist={checklist} personalization={personalization} />;
      } else {
        pdfDocument = <ChecklistPDF checklist={checklist} personalization={personalization} pillar={pillar} />;
      }

      // Generate blob and download
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      const petName = personalization?.pet_name || 'Pet';
      link.download = `${petName}_${checklist.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Checklist downloaded!', {
        description: `${checklist.title} has been saved to your downloads.`,
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      });

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (availableChecklists.length === 0) {
    return null;
  }

  // If only one checklist, show simple button
  if (availableChecklists.length === 1) {
    const checklist = availableChecklists[0];
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleDownload(checklist.id)}
        disabled={downloadingId === checklist.id}
        className={className}
        data-testid={`download-checklist-${pillar}`}
      >
        {downloadingId === checklist.id ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {showLabel && 'Download Checklist'}
      </Button>
    );
  }

  // Multiple checklists - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          data-testid={`download-checklists-${pillar}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          {showLabel && 'Download Checklists'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-500" />
          Available Checklists
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableChecklists.map((checklist) => (
          <DropdownMenuItem
            key={checklist.id}
            onClick={() => handleDownload(checklist.id)}
            disabled={downloadingId === checklist.id}
            className="cursor-pointer"
            data-testid={`download-${checklist.id}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{checklist.icon}</span>
                <div>
                  <div className="font-medium text-sm">{checklist.title}</div>
                  <div className="text-xs text-gray-500">{checklist.subtitle}</div>
                </div>
              </div>
              {downloadingId === checklist.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              ) : (
                <Download className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        {currentPet && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Badge variant="outline" className="text-xs">
                Personalized for {currentPet.name}
              </Badge>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChecklistDownloadButton;
