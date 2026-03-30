/**
 * BreedIllustrationLibrary.jsx
 * 
 * Admin component to manage the breed illustration library.
 * - View all 33+ soulful watercolor breed illustrations
 * - Copy image URLs for use in products
 * - Used by agents when creating breed-related products
 * 
 * NOTE FOR FUTURE AGENTS:
 * When creating breed-related products (cakes, keychains, mugs, mats, etc.),
 * ALWAYS use illustrations from this library. Do NOT use generic/mismatched images.
 * The ProductCard component will automatically use these illustrations when it
 * detects a breed name in the product title.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Image, Copy, Check, Search, RefreshCw, Download, Grid, List,
  Sparkles, PawPrint, Loader2, ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';

const BreedIllustrationLibrary = () => {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBreed, setCopiedBreed] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch breeds from API
  const fetchBreeds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/breed-illustrations/all`);
      if (response.ok) {
        const data = await response.json();
        setBreeds(data.breeds || []);
      }
    } catch (err) {
      console.error('[BreedLibrary] Error:', err);
      toast.error('Failed to load breed illustrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreeds();
  }, [fetchBreeds]);

  // Copy image URL to clipboard
  const copyImageUrl = (breed) => {
    navigator.clipboard.writeText(breed.image_url);
    setCopiedBreed(breed.key);
    toast.success(`Copied ${breed.name} image URL!`);
    setTimeout(() => setCopiedBreed(null), 2000);
  };

  // Filter breeds by search
  const filteredBreeds = breeds.filter(breed => {
    const query = searchQuery.toLowerCase();
    return breed.name.toLowerCase().includes(query) ||
           breed.key.toLowerCase().includes(query) ||
           breed.aliases?.some(a => a.toLowerCase().includes(query));
  });

  // Group breeds by category
  const breedCategories = {
    'Retrievers & Sporting': ['labrador', 'golden_retriever', 'cocker_spaniel', 'irish_setter'],
    'Working & Guard': ['german_shepherd', 'rottweiler', 'doberman', 'boxer', 'st_bernard', 'great_dane', 'american_bully'],
    'Northern & Spitz': ['husky', 'pomeranian', 'chow_chow'],
    'Herding': ['border_collie'],
    'Hounds': ['beagle', 'dachshund', 'italian_greyhound', 'dalmatian'],
    'Terriers': ['jack_russell', 'yorkshire', 'scottish_terrier'],
    'Toy & Companion': ['pug', 'shih_tzu', 'chihuahua', 'maltese', 'lhasa_apso', 'cavalier'],
    'Bulldogs': ['french_bulldog', 'bulldog'],
    'Poodles & Doodles': ['poodle', 'schnoodle'],
    'Indian Breeds': ['indie']
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Breed Illustration Library
                  <Badge className="bg-purple-100 text-purple-700">{breeds.length} breeds</Badge>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Soulful watercolor portraits for breed-specific products
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchBreeds}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Banner for Agents */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">For Future Agents:</p>
                <p className="text-sm text-amber-700 mt-1">
                  When creating breed-related products (cakes, keychains, mugs, mats, bandanas, etc.),
                  use these illustrations. The ProductCard component automatically detects breed names
                  and displays the correct portrait. Click any breed to copy its image URL.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search breeds (e.g., labrador, husky, indie...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Breeds Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="text-gray-500 mt-2">Loading breed illustrations...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredBreeds.map((breed) => (
            <Card 
              key={breed.key}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => {
                setSelectedBreed(breed);
                setShowDetailModal(true);
              }}
            >
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                <img
                  src={breed.image_url}
                  alt={breed.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ''; }}
                />
                
                {/* Copy Button Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyImageUrl(breed);
                    }}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    {copiedBreed === breed.key ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="p-2 text-center">
                <p className="font-medium text-sm text-gray-900 truncate">{breed.name}</p>
                <p className="text-xs text-gray-500">{breed.key}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredBreeds.map((breed) => (
                <div 
                  key={breed.key}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={breed.image_url}
                    alt={breed.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{breed.name}</p>
                    <p className="text-sm text-gray-500">Key: {breed.key}</p>
                    <p className="text-xs text-gray-400">
                      Aliases: {breed.aliases?.join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyImageUrl(breed)}
                    >
                      {copiedBreed === breed.key ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(breed.image_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breed Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedBreed?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedBreed && (
            <div className="space-y-4">
              <img
                src={selectedBreed.image_url}
                alt={selectedBreed.name}
                className="w-full h-64 object-contain bg-gray-50 rounded-lg"
              />
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Key:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                    {selectedBreed.key}
                  </code>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Aliases:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBreed.aliases?.map((alias, i) => (
                      <Badge key={i} variant="outline">{alias}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Image URL:</p>
                <code className="text-xs break-all text-gray-700">{selectedBreed.image_url}</code>
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => copyImageUrl(selectedBreed)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Image URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedBreed.image_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreedIllustrationLibrary;
