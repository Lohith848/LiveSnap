import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useGroupStore } from '../../lib/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moti } from 'moti';

// Helper to generate random 6-character code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Animated card component
const AnimatedCard = moti(TouchableOpacity)({
  initial: { opacity: 0, scale: 0.9 },
  enter: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
});

export default function Group() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCurrentGroup, setMembers } = useGroupStore();
  
  const [step, setStep] = useState('choice'); // choice, creating, joining, showingCode
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showingCode, setShowingCode] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const code = generateInviteCode();
      
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          code: code,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (groupError) throw groupError;
      
      // Add owner as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
        });
      
      if (memberError) throw memberError;
      
      // Update store
      setCurrentGroup(groupData);
      setMembers([user.id]);
      
      // Show the code
      setInviteCode(code);
      setStep('showingCode');
    } catch (err) {
      console.error(err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inputCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Find group by code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', inputCode.trim().toUpperCase())
        .single();
      
      if (groupError) throw groupError;
      if (!groupData) throw new Error('Group not found');
      
      // Check if user is already a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .single();
      
      if (memberError && memberError.code !== 'PGRST116') throw memberError;
      
      if (!memberData) {
        // Add user as member
        const { error: insertError } = await supabase
          .from('group_members')
          .insert({
            group_id: groupData.id,
            user_id: user.id,
          });
        
        if (insertError) throw insertError;
      }
      
      // Update store
      setCurrentGroup(groupData);
      // Fetch members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupData.id);
      setMembers(membersData.map(m => m.user_id));
      
      // Go to widget onboarding
      router.replace('/onboarding/widget');
    } catch (err) {
      console.error(err);
      setError('Invalid code or failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      // Show temporary feedback
      const originalText = 'Copy Code';
      // We'd need to update button text temporarily - simplified for now
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy code');
    }
  };

  if (step === 'choice') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } }}
          className="text-3xl font-serif text-warm-white mb-6"
        >
          LiveSnap
        </moti.Text>
        
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', delay: 100, damping: 15, stiffness: 200 } }}
          className="text-lg text-foreground/80 mb-10"
        >
          Join or Create a Circle
        </moti.Text>
        
        <View className="w-full space-y-6">
          <AnimatedCard
            onPress={() => setStep('creating')}
            className="w-full h-64 bg-white/10 rounded-2xl border border-white/20 flex-1 items-center justify-center"
          >
            <View className="space-y-4">
              <MaterialCommunityIcons name="plus-circle" size={32} color="white" />
              <Text className="text-lg font-semibold text-foreground">
                Start a Circle
              </Text>
              <Text className="text-sm text-foreground/60">
                Create a new group and invite friends
              </Text>
            </View>
          </AnimatedCard>
          
          <AnimatedCard
            onPress={() => setStep('joining')}
            className="w-full h-64 bg-white/10 rounded-2xl border border-white/20 flex-1 items-center justify-center"
          >
            <View className="space-y-4">
              <MaterialCommunityIcons name="account-group" size={32} color="white" />
              <Text className="text-lg font-semibold text-foreground">
                Join a Circle
              </Text>
              <Text className="text-sm text-foreground/60">
                Enter an invite code to join an existing group
              </Text>
            </View>
          </AnimatedCard>
        </View>
      </View>
    );
  }

  if (step === 'creating') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } }}
          className="text-3xl font-serif text-warm-white mb-6"
        >
          LiveSnap
        </moti.Text>
        
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', delay: 100, damping: 15, stiffness: 200 } }}
          className="text-lg text-foreground/80 mb-8"
        >
          Create Your Circle
        </moti.Text>
        
        <View className="w-full space-y-6">
          <TextInput
            placeholder="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            maxLength={30}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/50"
            autoCapitalize="words"
          />
          
          <Button
            title={loading ? 'Creating...' : 'Create Circle'}
            onPress={handleCreateGroup}
            loading={loading}
            color="#F5F5F0"
            className="w-full"
            disabled={loading || !groupName.trim()}
          />
          
          {error && (
            <Text className="text-sm text-red-400 text-center mt-2">
              {error}
            </Text>
          )}
          
          <Button
            title="Back"
            onPress={() => setStep('choice')}
            className="mt-4 w-full text-foreground/60"
          />
        </View>
      </View>
    );
  }

  if (step === 'joining') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } }}
          className="text-3xl font-serif text-warm-white mb-6"
        >
          LiveSnap
        </moti.Text>
        
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', delay: 100, damping: 15, stiffness: 200 } }}
          className="text-lg text-foreground/80 mb-8"
        >
          Join a Circle
        </moti.Text>
        
        <View className="w-full space-y-6">
          <TextInput
            placeholder="Enter Invite Code"
            value={inputCode}
            onChangeText={setInputCode}
            maxLength={6}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/50 uppercase"
            autoCapitalize="characters"
          />
          
          <Button
            title={loading ? 'Joining...' : 'Join Circle'}
            onPress={handleJoinGroup}
            loading={loading}
            color="#F5F5F0"
            className="w-full"
            disabled={loading || !inputCode.trim()}
          />
          
          {error && (
            <Text className="text-sm text-red-400 text-center mt-2">
              {error}
            </Text>
          )}
          
          <Button
            title="Back"
            onPress={() => setStep('choice')}
            className="mt-4 w-full text-foreground/60"
          />
        </View>
      </View>
    );
  }

  if (step === 'showingCode') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } }}
          className="text-3xl font-serif text-warm-white mb-6"
        >
          LiveSnap
        </moti.Text>
        
        <moti.Text
          initial={{ opacity: 0, y: 20 }}
          enter={{ opacity: 1, y: 0, transition: { type: 'spring', delay: 100, damping: 15, stiffness: 200 } }}
          className="text-lg text-foreground/80 mb-10"
        >
          Your Circle is Ready!
        </moti.Text>
        
        <View className="w-full space-y-8">
          <View className="bg-white/10 rounded-2xl border border-white/20 p-8">
            <Text className="text-foreground/60 text-sm mb-2">
              Your Invite Code
            </Text>
            <View className="flex items-center justify-center space-x-4">
              <Text className="text-2xl font-mono letter-spacing-widest text-foreground">
                {inviteCode}
              </Text>
              <TouchableOpacity
                onPress={copyToClipboard}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30"
              >
                <MaterialCommunityIcons name="content-copy" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Button
            title="Next: Add Widget"
            onPress={() => router.replace('/onboarding/widget')}
            color="#F5F5F0"
            className="w-full"
          />
        </View>
      </View>
    );
  }
  
  // Should not reach here
  return null;
}

const styles = StyleSheet.create({});