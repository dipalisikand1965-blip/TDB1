/**
 * CustomOrderFlow.jsx — The WOW Feature
 * 
 * Multi-step custom order flow that creates magic:
 * Step 1: Product preview + "Make It Yours"
 * Step 2: Upload pet's production-quality photo
 * Step 3: Personalisation notes (name, text, special requests)
 * Step 4: Confirmation → creates concierge ticket
 * 
 * Designed to feel premium, emotional, and delightful.
 */
import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Upload, Sparkles, Check, ChevronRight, ChevronLeft, 
         Heart, Star, Image as ImageIcon, Loader2, AlertCircle, Package } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 'preview', label: 'Your Product' },
  { id: 'photo', label: 'Upload Photo' },
  { id: 'personalise', label: 'Make It Yours' },
  { id: 'confirm', label: 'Place Order' },
];

const DELIVERY_ESTIMATES = {
  mug: '5-7 business days',
  bandana: '4-6 business days',
  frame: '5-7 business days',
  cake_topper: '3-5 business days',
  tote_bag: '7-10 business days',
  blanket: '7-10 business days',
  keychain: '3-5 business days',
  cushion_cover: '7-10 business days',
  party_hat: '3-5 business days',
  bowl: '7-10 business days',
  collar_tag: '2-3 business days',
  memorial_candle: '5-7 business days',
  default: '5-10 business days',
};

const CustomOrderFlow = ({ product, pet, user, isOpen, onClose, pillarColor = '#C44DFF' }) => {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [specialText, setSpecialText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const petName = pet?.name || 'your pet';
  const breedDisplay = (pet?.breed || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const deliveryEstimate = DELIVERY_ESTIMATES[product?.product_type] || DELIVERY_ESTIMATES.default;

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 3) {
      setError('Maximum 3 photos allowed');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Max 10MB per photo.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pet_id', pet?.id || '');
        formData.append('pet_name', petName);

        const res = await fetch(`${API_URL}/api/custom-orders/upload-photo`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Upload failed');
        }

        const data = await res.json();
        if (data.success && data.photo_url) {
          setPhotos(prev => [...prev, {
            url: data.photo_url,
            name: file.name,
            preview: URL.createObjectURL(file),
          }]);
        }
      } catch (err) {
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [photos, pet, petName]);

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/custom-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product?.id || '',
          product_name: product?.name || '',
          product_type: product?.product_type || '',
          product_image: product?.mockup_url || product?.cloudinary_url || product?.image_url || '',
          pillar: product?.pillar || '',
          pet_id: pet?.id || '',
          pet_name: petName,
          pet_breed: pet?.breed || '',
          pet_birthday: pet?.birthday || pet?.dob || '',
          pet_archetype: pet?.soul_archetype?.primary_archetype || pet?.soul_archetype || '',
          customer_email: user?.email || '',
          customer_name: user?.name || user?.email || '',
          customer_phone: user?.phone || '',
          photo_urls: photos.map(p => p.url),
          personalisation_notes: notes,
          special_text: specialText,
          source: 'soul_picks_modal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderResult(data);
        setStep(4); // Success step
      } else {
        throw new Error(data.detail || 'Order creation failed');
      }
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  if (!isOpen || !product) return null;

  const productImage = product.mockup_url || product.cloudinary_url || product.image_url;
  const productTypeName = (product.product_type || '').replace(/_/g, ' ');
  const currentStep = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="custom-order-modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full bg-white overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 480,
          maxHeight: '94vh',
          borderRadius: '24px 24px 0 0',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="relative px-5 pt-4 pb-3" style={{ background: `linear-gradient(135deg, ${pillarColor}08, ${pillarColor}15)` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow"
            data-testid="custom-order-close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          {step < 4 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: pillarColor }} />
                <span className="text-sm font-bold" style={{ color: pillarColor }}>
                  Custom Order
                </span>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i <= step ? pillarColor : '#E5E7EB',
                        transform: i === step ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                    {i < STEPS.length - 1 && (
                      <div className="w-6 h-0.5 rounded" style={{ background: i < step ? pillarColor : '#E5E7EB' }} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: `${pillarColor}CC` }}>
                Step {step + 1}: {currentStep?.label}
              </p>
            </>
          )}
        </div>

        {/* Content area — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(94vh - 200px)' }}>

          {/* ═══ STEP 0: PRODUCT PREVIEW ═══ */}
          {step === 0 && (
            <div className="space-y-5" data-testid="custom-order-step-preview">
              {/* Product image */}
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 200 }}>
                {productImage ? (
                  <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `${pillarColor}10` }}>
                    <Package className="w-12 h-12" style={{ color: `${pillarColor}40` }} />
                  </div>
                )}
                <div
                  className="absolute bottom-0 inset-x-0 p-4"
                  style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
                >
                  <span className="text-white text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${pillarColor}CC` }}>
                    {productTypeName}
                  </span>
                </div>
              </div>

              {/* Product name + description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Pet callout */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: `${pillarColor}08`, border: `1px solid ${pillarColor}20` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${pillarColor}15` }}>
                  <Heart className="w-5 h-5" style={{ color: pillarColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Made uniquely for {petName}</p>
                  <p className="text-xs text-gray-500">{breedDisplay} {pet?.soul_archetype?.primary_archetype ? `\u00B7 ${pet.soul_archetype.primary_archetype}` : ''}</p>
                </div>
              </div>

              {/* What you get */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">How it works</p>
                <div className="space-y-2">
                  {[
                    { icon: Camera, text: `Upload ${petName}'s best photo` },
                    { icon: Sparkles, text: 'Add your personalisation details' },
                    { icon: Star, text: 'Our team creates it just for you' },
                    { icon: Package, text: `Delivered in ${deliveryEstimate}` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${pillarColor}10` }}>
                        <item.icon className="w-3.5 h-3.5" style={{ color: pillarColor }} />
                      </div>
                      <p className="text-sm text-gray-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concierge note */}
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                <p className="text-xs text-amber-800 font-medium">
                  Pricing will be shared by our concierge team after reviewing your customisation request.
                </p>
              </div>
            </div>
          )}

          {/* ═══ STEP 1: UPLOAD PHOTO ═══ */}
          {step === 1 && (
            <div className="space-y-5" data-testid="custom-order-step-photo">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload {petName}'s Photo</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This photo will be printed on your {productTypeName}. Use a clear, well-lit, high-resolution photo.
                </p>
              </div>

              {/* Upload area */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-purple-400"
                style={{ borderColor: photos.length > 0 ? `${pillarColor}40` : '#D1D5DB', background: photos.length > 0 ? `${pillarColor}05` : 'white' }}
                data-testid="photo-upload-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="photo-file-input"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: pillarColor }} />
                    <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                    <div className="w-48 h-1.5 rounded-full bg-gray-200">
                      <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: pillarColor }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${pillarColor}12` }}>
                      <Upload className="w-6 h-6" style={{ color: pillarColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Tap to upload photos</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, HEIC up to 10MB each (max 3)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded photos */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{photos.length} photo{photos.length > 1 ? 's' : ''} uploaded</p>
                  <div className="flex gap-3">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden" style={{ width: 100, height: 100 }}>
                        <img src={photo.preview || photo.url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                          data-testid={`remove-photo-${idx}`}
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-semibold text-blue-800 mb-2">Photo Tips</p>
                <ul className="space-y-1">
                  {[
                    'Face clearly visible, looking at camera',
                    'Natural daylight works best',
                    'Solo photo (no other pets or people)',
                    'At least 1000x1000 pixels for best results',
                  ].map((tip, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: PERSONALISE ═══ */}
          {step === 2 && (
            <div className="space-y-5" data-testid="custom-order-step-personalise">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Personalise Your {productTypeName.replace(/\b\w/g, c => c.toUpperCase())}</h3>
                <p className="text-sm text-gray-500 mt-1">Add the finishing touches that make it uniquely {petName}'s.</p>
              </div>

              {/* Special text */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Text on Product
                </label>
                <input
                  value={specialText}
                  onChange={(e) => setSpecialText(e.target.value)}
                  placeholder={`e.g. "${petName} - ${breedDisplay}" or "${petName} Since 2023"`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: pillarColor }}
                  maxLength={50}
                  data-testid="special-text-input"
                />
                <p className="text-xs text-gray-400 mt-1">{specialText.length}/50 characters</p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests? Colour preferences, layout ideas, specific instructions for the artist..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                  data-testid="personalisation-notes-input"
                />
                <p className="text-xs text-gray-400 mt-1">{notes.length}/500 characters</p>
              </div>

              {/* Pet profile auto-captured */}
              <div className="p-3.5 rounded-xl" style={{ background: `${pillarColor}06`, border: `1px solid ${pillarColor}15` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: `${pillarColor}AA` }}>
                  Auto-captured from {petName}'s profile
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Name', value: petName },
                    { label: 'Breed', value: breedDisplay || 'Not set' },
                    { label: 'Birthday', value: pet?.birthday || pet?.dob || 'Not set' },
                    { label: 'Archetype', value: pet?.soul_archetype?.primary_archetype || pet?.soul_archetype || 'Not set' },
                  ].map((item, i) => (
                    <div key={i}>
                      <span className="text-[10px] text-gray-400 uppercase">{item.label}</span>
                      <p className="text-xs font-medium text-gray-700">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: CONFIRM ═══ */}
          {step === 3 && (
            <div className="space-y-5" data-testid="custom-order-step-confirm">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Review Your Order</h3>
                <p className="text-sm text-gray-500 mt-1">Everything look good? Let's make it happen!</p>
              </div>

              {/* Order summary card */}
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                {/* Product image */}
                {productImage && (
                  <div className="h-32 relative">
                    <img src={productImage} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5))' }} />
                    <p className="absolute bottom-2 left-3 text-white text-sm font-bold">{product.name}</p>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Pet */}
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" style={{ color: pillarColor }} />
                    <span className="text-sm text-gray-700">For <b>{petName}</b> ({breedDisplay})</span>
                  </div>

                  {/* Photos */}
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" style={{ color: pillarColor }} />
                    <span className="text-sm text-gray-700">{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</span>
                    {photos.length > 0 && (
                      <div className="flex -space-x-2 ml-auto">
                        {photos.slice(0, 3).map((p, i) => (
                          <img key={i} src={p.preview || p.url} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  {specialText && (
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5" style={{ color: pillarColor }} />
                      <span className="text-sm text-gray-700">Text: <b>"{specialText}"</b></span>
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 mt-0.5" style={{ color: pillarColor }} />
                      <span className="text-sm text-gray-600">{notes.length > 80 ? notes.substring(0, 80) + '...' : notes}</span>
                    </div>
                  )}

                  {/* Delivery */}
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" style={{ color: pillarColor }} />
                    <span className="text-sm text-gray-700">Est. delivery: <b>{deliveryEstimate}</b></span>
                  </div>
                </div>
              </div>

              {/* Pricing note */}
              <div className="p-3.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Concierge Pricing
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Our concierge team will review your customisation and share the final price within 24 hours. 
                  No charges until you confirm.
                </p>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: SUCCESS ═══ */}
          {step === 4 && orderResult && (
            <div className="py-8 text-center space-y-6" data-testid="custom-order-success">
              {/* Success animation */}
              <div className="relative mx-auto w-20 h-20">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ background: pillarColor }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${pillarColor}, #FF6B9D)` }}
                >
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Placed!</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Your custom <b>{productTypeName}</b> for <b>{petName}</b> is being crafted with love.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono font-bold text-gray-800">{orderResult.order_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ticket</span>
                  <span className="font-mono text-gray-800">{orderResult.ticket_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: `${pillarColor}15`, color: pillarColor }}>
                    Pending Review
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-700 leading-relaxed">
                  Our concierge team will contact you within <b>24 hours</b> with pricing and any questions about your customisation.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100" style={{ background: 'white' }}>
          {step < 4 ? (
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => { setStep(s => s - 1); setError(''); }}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  data-testid="custom-order-back"
                >
                  <ChevronLeft className="w-4 h-4 inline -mt-0.5" /> Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => { setStep(s => s + 1); setError(''); }}
                  disabled={step === 1 && photos.length === 0}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${pillarColor}, #FF6B9D)`,
                    color: 'white',
                  }}
                  data-testid="custom-order-next"
                >
                  {step === 0 ? 'Make It Yours' : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{
                    background: submitting
                      ? '#9CA3AF'
                      : `linear-gradient(135deg, ${pillarColor}, #FF6B9D)`,
                    color: 'white',
                  }}
                  data-testid="custom-order-submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating your order...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Place Custom Order
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: `linear-gradient(135deg, ${pillarColor}, #FF6B9D)`, color: 'white' }}
              data-testid="custom-order-done"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomOrderFlow;
