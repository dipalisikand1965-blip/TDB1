/**
 * BatchImageButton — triggers background AI image generation for services/products/all.
 * Shows a live progress bar while the job runs.
 */
import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const getAdminHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Basic ' + btoa('aditya:lola4304'),
});

export default function BatchImageButton({ target = 'all', label = 'Auto-Generate Images' }) {
  const [status, setStatus] = useState(null); // null | 'queued' | 'running' | 'complete' | 'error'
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  const poll = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/batch-generate-images/status`, { headers: getAdminHeaders() });
      const d = await res.json();
      setJob(d);
      setStatus(d.status);
      if (d.status === 'complete' || d.status === 'error' || d.status === 'idle') {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch { /* ignore */ }
  };

  const start = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/batch-generate-images?target=${target}`, {
        method: 'POST', headers: getAdminHeaders()
      });
      const d = await res.json();
      setJob(d.progress || d);
      setStatus('queued');
      pollRef.current = setInterval(poll, 3000);
    } catch (e) {
      setStatus('error');
    }
  };

  useEffect(() => {
    // Check if already running on mount
    poll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if ((status === 'queued' || status === 'running') && !pollRef.current) {
      pollRef.current = setInterval(poll, 3000);
    }
  }, [status]);

  const isRunning = status === 'running' || status === 'queued';
  const pct = job?.progress_pct || 0;
  const done = job?.processed || 0;
  const total = job?.total || 0;
  const errors = job?.errors?.length || 0;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
      <button
        data-testid="batch-image-generate-btn"
        onClick={isRunning ? undefined : start}
        disabled={isRunning}
        style={{
          padding: '7px 14px', borderRadius: 8, border: '1.5px solid #7C3AED',
          background: isRunning ? '#EDE9FE' : '#7C3AED',
          color: isRunning ? '#7C3AED' : '#fff',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}>
        {isRunning
          ? `Generating… ${done}/${total}`
          : status === 'complete'
            ? `Done (${done} images${errors ? `, ${errors} errors` : ''})`
            : `⚡ ${label}`}
      </button>
      {isRunning && total > 0 && (
        <div style={{ background: '#EDE9FE', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#7C3AED',
            width: `${pct}%`, transition: 'width 0.4s ease'
          }} />
        </div>
      )}
      {status === 'complete' && errors > 0 && (
        <span style={{ fontSize: 10, color: '#DC2626' }}>{errors} failed — check backend logs</span>
      )}
    </div>
  );
}
