import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderControls } from '@/components/HeaderControls';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

export function AccountControls() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: '/auth', replace: true });
  };
  return <div className="flex items-center gap-1"><HeaderControls /><Button variant="ghost" size="icon" aria-label={t('nav.logout')} onClick={signOut}><LogOut className="size-4" /></Button></div>;
}