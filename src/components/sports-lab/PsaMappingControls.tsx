import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PsaMappingControlsProps {
  cardIdentityKey: string;
  onMutated: () => void;
}

export function PsaMappingControls({ cardIdentityKey, onMutated }: PsaMappingControlsProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [psaSet, setPsaSet] = useState('');
  const [psaSubject, setPsaSubject] = useState('');
  const [psaCardNum, setPsaCardNum] = useState('');
  const [psaSearchQuery, setPsaSearchQuery] = useState('');
  const [psaPopUrl, setPsaPopUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (checked) return;
    setChecked(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (data) setIsAdmin(true);
    })();
  }, [checked]);

  if (!isAdmin) return null;

  const invokeMapping = async (action: string, extraBody?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('manage-comps', {
        body: { action, card_identity_key: cardIdentityKey, ...extraBody },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      onMutated();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const triggerSync = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('sync-psa-population', {
        body: { mode: 'sync_single', card_identity_key: cardIdentityKey, force: true },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      onMutated();
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: 'var(--om-text-3)' }} />;

  const inputStyle = {
    background: 'var(--om-bg-1)',
    border: '1px solid var(--om-border-0)',
    color: 'var(--om-text-0)',
  };

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1">
        <button onClick={() => setShowForm(!showForm)} title="Map PSA population" className="p-0.5 rounded hover:opacity-70">
          <MapPin className="h-2.5 w-2.5" style={{ color: 'var(--om-accent)' }} />
        </button>
        <button onClick={() => invokeMapping('verify_psa_mapping')} title="Verify PSA mapping" className="p-0.5 rounded hover:opacity-70">
          <CheckCircle className="h-2.5 w-2.5" style={{ color: 'hsl(142 71% 45%)' }} />
        </button>
        <button onClick={triggerSync} title="Trigger PSA sync" className="p-0.5 rounded hover:opacity-70">
          <RefreshCw className="h-2.5 w-2.5" style={{ color: 'var(--om-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="mt-1 space-y-1">
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="PSA Set Name" value={psaSet} onChange={(e) => setPsaSet(e.target.value)} />
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="PSA Subject" value={psaSubject} onChange={(e) => setPsaSubject(e.target.value)} />
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="Card Number" value={psaCardNum} onChange={(e) => setPsaCardNum(e.target.value)} />
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="PSA Search Query" value={psaSearchQuery} onChange={(e) => setPsaSearchQuery(e.target.value)} />
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="PSA Population URL" value={psaPopUrl} onChange={(e) => setPsaPopUrl(e.target.value)} />
          <input className="w-full text-[9px] px-1 py-0.5 rounded" style={inputStyle} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button
            className="text-[9px] font-medium px-2 py-0.5 rounded"
            style={{ background: 'var(--om-accent)', color: 'var(--om-bg-0)' }}
            onClick={() => {
              invokeMapping('map_psa_population', {
                psa_set_name: psaSet,
                psa_subject: psaSubject,
                psa_card_number: psaCardNum,
                psa_search_query: psaSearchQuery,
                psa_population_url: psaPopUrl,
                notes,
              });
              setShowForm(false);
            }}
          >
            Save Mapping
          </button>
        </div>
      )}
    </div>
  );
}
