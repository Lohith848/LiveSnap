import { SupabaseProvider } from '@supabase/supabase-js'
import { NativeWindProvider } from 'nativewind/runtime'
import { supabase } from './lib/supabase'

export default function RootLayout() {
  return (
    <NativeWindProvider>
      <SupabaseProvider client={supabase}>
        <Slot />
      </SupabaseProvider>
    </NativeWindProvider>
  )
}