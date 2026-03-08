import { useState, useEffect } from 'react';
import { Ban, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompManagementControlsProps {
  saleId: string;
  currentConfidence: string;
  onMutated: () => void;
}

export function CompManagementControls({ saleId, currentConfidence, onMutated }: CompManagementControlsProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

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

  const invoke = async (action: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('manage-comps', {
        body: { action, sale_id: saleId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      onMutated();
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" style={{ color: 'var(--om-text-3)' }} />;

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {currentConfidence !== 'excluded' && (
        <button onClick={() => invoke('exclude_comp')} title="Exclude comp" className="p-0.5 rounded hover:opacity-70">
          <Ban className="h-2.5 w-2.5" style={{ color: 'hsl(0 84% 60%)' }} />
        </button>
      )}
      {currentConfidence !== 'exact' && (
        <button onClick={() => invoke('approve_comp')} title="Approve as exact" className="p-0.5 rounded hover:opacity-70">
          <CheckCircle className="h-2.5 w-2.5" style={{ color: 'hsl(142 71% 45%)' }} />
        </button>
      )}
    </div>
  );
}
