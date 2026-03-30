import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Play, X } from 'lucide-react';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';

const VideoSection = () => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [videos, setVideos] = useState([
    {
      id: '1',
      title: 'Behind the Scenes: Baking with Love',
      thumbnail: '',
      description: 'Watch how we craft each cake with care in our kitchen',
      videoUrl: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '2',
      title: 'Customer Celebrations',
      thumbnail: '',
      description: 'Real celebrations from our happy customers',
      videoUrl: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '3',
      title: 'How to Store Your Cake',
      thumbnail: '',
      description: 'Tips for keeping treats fresh and delicious',
      videoUrl: 'https://www.instagram.com/the_doggy_bakery/'
    },
    {
      id: '4',
      title: 'Meet Our Team',
      thumbnail: '',
      description: 'The passionate team behind The Doggy Bakery',
      videoUrl: 'https://www.instagram.com/the_doggy_bakery/'
    }
  ]);

  // Fetch videos from backend
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/content/videos`);
        if (response.ok) {
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            setVideos(data.videos);
          }
        }
      } catch (error) {
        console.log('Using default videos');
      }
    };
    fetchVideos();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            onClick={() => setActiveVideo(video)}
            data-testid={`video-card-${video.id}`}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2">{video.title}</h3>
              <p className="text-sm text-gray-600">{video.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {/* Check if it's a YouTube URL and embed */}
                {activeVideo.videoUrl?.includes('youtube.com') || activeVideo.videoUrl?.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={activeVideo.videoUrl.replace('watch?v=', 'embed/')}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-white mb-4">{activeVideo.title}</p>
                    <a
                      href={activeVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Watch on Instagram
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoSection;
