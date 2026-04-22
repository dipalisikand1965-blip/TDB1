import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useConcierge } from '../../hooks/useConcierge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const TEAL = '#0D9488';

/**
 * DocumentVault
 * ----------------------------------------------------------------------------
 * Read-only status widget PLUS inline upload modal.
 *
 * Dipali's ask: "How do I add a document to my vault?" → tiles are now tap-able.
 * Tapping a "Missing" tile opens an in-place upload modal.
 * Upload flow:
 *   1. POST /api/upload/document  (Cloudinary-backed, persistent)
 *   2. POST /api/pet-vault/{pet_id}/documents  (registers Cloudinary URL in pet vault)
 * Tapping a "Complete" tile shows the existing record inline (view/replace).
 */

export default function DocumentVault({ pet, token, onConcierge }) {
  const [expanded, setExpanded] = useState(false);
  const { book } = useConcierge({ pet, pillar: 'paperwork' });

  const [modalOpen, setModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);      // { id, label, icon, complete, detail }
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [vaultDocs, setVaultDocs] = useState([]);         // documents stored in pet.vault.documents

  const soul = pet?.doggy_soul_answers || {};
  const vault = pet?.vault || {};
  const petName = pet?.name || 'your dog';

  // Refresh vault documents after upload (and on open)
  const refreshVaultDocs = useCallback(async () => {
    if (!pet?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/pet-vault/${pet.id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVaultDocs(data.documents || []);
      }
    } catch (_e) { /* non-blocking */ }
  }, [pet?.id, token]);

  useEffect(() => { refreshVaultDocs(); }, [refreshVaultDocs]);

  const hasVaultDoc = (docType) => vaultDocs.some((d) => (d.document_type || '').toLowerCase() === docType.toLowerCase());
  const getVaultDoc = (docType) => vaultDocs.find((d) => (d.document_type || '').toLowerCase() === docType.toLowerCase());

  const documents = useMemo(() => ([
    {
      id: 'vaccination',
      label: 'Vaccination records',
      icon: '💉',
      complete: !!(pet?.vaccinated || vault?.vaccines?.length > 0 || hasVaultDoc('vaccination')),
      detail: vault?.vaccines?.length > 0 ? `${vault.vaccines.length} records` : (hasVaultDoc('vaccination') ? 'Uploaded' : 'Not uploaded'),
      urgent: true,
    },
    {
      id: 'microchip',
      label: 'Microchip registration',
      icon: '🔬',
      complete: !!(pet?.microchip || soul?.microchipped === 'yes' || hasVaultDoc('microchip')),
      detail: pet?.microchip || soul?.microchip_id || (hasVaultDoc('microchip') ? 'Uploaded' : 'Not registered'),
      urgent: true,
    },
    {
      id: 'insurance',
      label: 'Pet insurance',
      icon: '🛡️',
      complete: !!(soul?.insurance === 'yes' || hasVaultDoc('insurance')),
      detail: soul?.insurance_provider || (hasVaultDoc('insurance') ? 'Uploaded' : 'Not insured'),
      urgent: false,
    },
    {
      id: 'adoption',
      label: 'Adoption papers',
      icon: '📄',
      complete: !!(soul?.adoption_papers || soul?.adoption_date || hasVaultDoc('adoption')),
      detail: soul?.adoption_date || (hasVaultDoc('adoption') ? 'Uploaded' : 'Not uploaded'),
      urgent: false,
    },
    {
      id: 'travel',
      label: 'Travel documents',
      icon: '✈️',
      complete: !!(soul?.travel_docs || soul?.noc || hasVaultDoc('travel')),
      detail: 'NOC, health certificate',
      urgent: false,
    },
    {
      id: 'license',
      label: 'License & registration',
      icon: '🏛️',
      complete: !!(soul?.registered || soul?.license || hasVaultDoc('license')),
      detail: 'Municipal corporation',
      urgent: false,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ]), [pet?.vaccinated, soul, vault?.vaccines, vaultDocs]);

  const openUpload = (doc) => {
    setActiveDoc(doc);
    setFile(null);
    setDocName(doc.complete ? '' : `${petName}'s ${doc.label.toLowerCase()}`);
    setDocNotes('');
    setUploadError('');
    setModalOpen(true);
  };

  const closeUpload = () => {
    if (uploading) return;
    setModalOpen(false);
    setActiveDoc(null);
    setFile(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!activeDoc || !pet?.id || !token) return;
    if (!file) {
      setUploadError('Please select a file (PDF, image, or Word doc).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large (max 10 MB).');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      // Step 1 — upload raw file to Cloudinary via backend
      const form = new FormData();
      form.append('file', file);
      form.append('pet_id', pet.id);
      form.append('category', activeDoc.id);
      const upRes = await fetch(`${API_URL}/api/upload/document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      if (!upRes.ok) {
        const err = await upRes.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${upRes.status})`);
      }
      const upData = await upRes.json();
      const fileUrl = upData.url || upData.file_url;
      if (!fileUrl) throw new Error('Upload returned no URL.');

      // Step 2 — register in pet vault
      const regRes = await fetch(`${API_URL}/api/pet-vault/${pet.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: docName || `${petName}'s ${activeDoc.label}`,
          document_type: activeDoc.id,
          file_url: fileUrl,
          notes: docNotes || null,
        }),
      });
      if (!regRes.ok) {
        const err = await regRes.json().catch(() => ({}));
        throw new Error(err.detail || `Save failed (${regRes.status})`);
      }

      await refreshVaultDocs();
      setModalOpen(false);
      setActiveDoc(null);
      setFile(null);
    } catch (e) {
      setUploadError(e?.message || 'Something went wrong.');
    } finally {
      setUploading(false);
    }
  };

  if (!pet) return null;

  const completed = documents.filter((doc) => doc.complete).length;
  const total = documents.length;
  const pct = Math.round((completed / total) * 100);
  const missing = documents.filter((doc) => !doc.complete);
  const urgentMissing = missing.filter((doc) => doc.urgent);

  const handleSort = () => {
    book(
      { name: `${petName}'s Document Vault`, price: null },
      {
        channel: 'paperwork_document_vault',
        urgency: urgentMissing.length > 0 ? 'high' : 'normal',
        note: `Missing documents: ${missing.map((doc) => doc.label).join(' · ')}`,
      }
    );
    onConcierge?.();
  };

  return (
    <>
      <div
        data-testid="paperwork-document-vault"
        style={{
          background: '#fff',
          border: `1.5px solid ${pct === 100 ? TEAL : 'rgba(13,148,136,0.3)'}`,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          onClick={() => setExpanded((prev) => !prev)}
          data-testid="paperwork-document-vault-toggle"
          style={{
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
            background: pct === 100 ? 'rgba(13,148,136,0.04)' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(13,148,136,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>📋</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }} data-testid="paperwork-document-vault-title">
                {petName}'s Document Vault
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }} data-testid="paperwork-document-vault-summary">
                {pet?.breed} · {completed} of {total} complete
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: TEAL }} data-testid="paperwork-document-vault-percent">
                {pct}%
              </div>
              <div style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.06em' }}>COMPLETE</div>
            </div>
            <div style={{ fontSize: 16, color: '#aaa' }}>{expanded ? '▲' : '▼'}</div>
          </div>
        </div>

        <div style={{ height: 4, background: 'rgba(13,148,136,0.1)' }}>
          <div
            data-testid="paperwork-document-vault-progress"
            style={{
              width: `${pct}%`, height: '100%', background: TEAL,
              transition: 'width 0.8s ease',
            }}
          />
        </div>

        {expanded && (
          <div style={{ padding: '16px 18px' }}>
            {urgentMissing.length > 0 && (
              <div
                data-testid="paperwork-document-vault-urgent-alert"
                style={{
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 10,
                  padding: '10px 14px', marginBottom: 14,
                  fontSize: 12, color: '#DC2626',
                }}
              >
                ⚠️ {urgentMissing.map((doc) => doc.label).join(' · ')} — urgent
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10, marginBottom: 16,
              }}
            >
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  data-testid={`paperwork-document-card-${doc.id}`}
                  onClick={() => openUpload(doc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openUpload(doc); }}
                  style={{
                    background: '#fff',
                    border: doc.complete ? `1.5px solid ${TEAL}` : '1.5px solid rgba(220,38,38,0.4)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{doc.icon}</span>
                    <span
                      data-testid={`paperwork-document-status-${doc.id}`}
                      style={{
                        fontSize: 10, fontWeight: 600,
                        color: doc.complete ? TEAL : '#DC2626',
                        background: doc.complete ? 'rgba(13,148,136,0.1)' : 'rgba(220,38,38,0.08)',
                        padding: '2px 8px', borderRadius: 20,
                      }}
                    >
                      {doc.complete ? 'Complete' : 'Missing'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0a2e', marginBottom: 2 }}>{doc.label}</div>
                  <div style={{ fontSize: 11, color: doc.complete ? '#888' : '#DC2626' }}>{doc.detail}</div>
                  <div style={{ fontSize: 10, color: TEAL, marginTop: 6, fontWeight: 600, letterSpacing: '0.02em' }}>
                    {doc.complete ? 'View · Replace →' : 'Tap to upload →'}
                  </div>
                </div>
              ))}
            </div>

            {missing.length > 0 && (
              <div
                onClick={handleSort}
                data-testid="paperwork-document-vault-sort-button"
                style={{
                  background: '#fff',
                  border: `1px solid ${TEAL}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0a2e', marginBottom: 2 }}>
                    Or let Concierge® sort it all
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>{missing.map((doc) => doc.label).join(' · ')}</div>
                </div>
                <div style={{
                  background: TEAL, color: '#fff', borderRadius: 20,
                  padding: '8px 16px', fontSize: 12, fontWeight: 700,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  Sort for {petName} →
                </div>
              </div>
            )}

            {pct === 100 && (
              <div
                data-testid="paperwork-document-vault-complete-state"
                style={{
                  textAlign: 'center', padding: '12px',
                  fontSize: 13, color: TEAL, fontStyle: 'italic',
                }}
              >
                ✓ {petName}'s documents are complete. Mira has everything.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline upload modal */}
      {modalOpen && activeDoc && (
        <div
          data-testid="document-vault-upload-modal"
          onClick={closeUpload}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,20,30,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '22px 22px 18px',
              maxWidth: 460, width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{activeDoc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1a0a2e' }}>
                  {activeDoc.complete ? 'Update' : 'Upload'} · {activeDoc.label}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  For {petName} · stored securely in the Cloud
                </div>
              </div>
              <button
                onClick={closeUpload}
                disabled={uploading}
                aria-label="Close"
                style={{
                  background: 'rgba(0,0,0,0.04)', border: 'none',
                  borderRadius: '50%', width: 32, height: 32,
                  fontSize: 16, cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >✕</button>
            </div>

            {activeDoc.complete && getVaultDoc(activeDoc.id) && (
              <div style={{
                background: 'rgba(13,148,136,0.06)',
                border: '1px solid rgba(13,148,136,0.2)',
                borderRadius: 10, padding: '10px 12px',
                fontSize: 12, color: '#1a0a2e', marginBottom: 14,
              }}>
                ✓ Already on file: <strong>{getVaultDoc(activeDoc.id)?.name}</strong>
                {' · '}
                <a href={getVaultDoc(activeDoc.id)?.file_url} target="_blank" rel="noreferrer" style={{ color: TEAL, textDecoration: 'underline' }}>
                  View current
                </a>
              </div>
            )}

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              File (PDF, image, or Word doc · max 10 MB)
            </label>
            <input
              data-testid="document-vault-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.heic,.doc,.docx,application/pdf,image/*"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setUploadError(''); }}
              disabled={uploading}
              style={{
                width: '100%', padding: 10,
                border: '1.5px dashed rgba(13,148,136,0.4)',
                borderRadius: 10, fontSize: 13, marginBottom: 14,
              }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Document name
            </label>
            <input
              data-testid="document-vault-name-input"
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              disabled={uploading}
              placeholder={`e.g. ${petName}'s ${activeDoc.label.toLowerCase()}`}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 10, fontSize: 13, marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Notes (optional)
            </label>
            <textarea
              data-testid="document-vault-notes-input"
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              disabled={uploading}
              placeholder={activeDoc.id === 'insurance' ? 'e.g. Bajaj Allianz · Policy #12345 · Renews 2026' : 'Anything Mira should remember about this doc'}
              rows={2}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 10, fontSize: 13, marginBottom: 14,
                boxSizing: 'border-box', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            {uploadError && (
              <div style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.25)',
                color: '#DC2626', fontSize: 12,
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              }} data-testid="document-vault-upload-error">
                {uploadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={closeUpload}
                disabled={uploading}
                data-testid="document-vault-cancel-button"
                style={{
                  flex: 1, padding: '11px', borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: '#fff', color: '#555',
                  fontWeight: 600, fontSize: 13,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                data-testid="document-vault-submit-button"
                style={{
                  flex: 2, padding: '11px', borderRadius: 12,
                  border: 'none',
                  background: (uploading || !file) ? 'rgba(13,148,136,0.5)' : TEAL,
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: (uploading || !file) ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading…' : (activeDoc.complete ? 'Replace' : 'Save to Vault')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
