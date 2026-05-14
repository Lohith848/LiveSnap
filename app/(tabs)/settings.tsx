import { View, Text, StyleSheet, Switch, TextInput, Button, ActivityIndicator } from 'react-native';
import { useGroupStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Settings() {
  const { currentGroup } = useGroupStore();
  const [isLoading, setIsLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (currentGroup) {
      setGroupName(currentGroup.name);
      setGroupCode(currentGroup.code);
    }
    setIsLoading(false);
  }, [currentGroup]);

  const updateGroup = async () => {
    if (!currentGroup) return;
    setIsLoading(true);
    try {
      await supabase
        .from('groups')
        .update({ name: groupName, code: groupCode })
        .eq('id', currentGroup.id);
      // Update the store
      useGroupStore.getState().setCurrentGroup({
        ...currentGroup,
        name: groupName,
        code: groupCode,
      });
    } catch (error) {
      console.error(error);
      alert('Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, you would update notification preferences here
    console.log(`Notifications ${notificationsEnabled ? 'disabled' : 'enabled'}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-col bg-background p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-foreground">
          Group Settings
        </Text>
        <TouchableOpacity onPress={() => {
          // Navigate to widget settings or info
        }} className="p-2">
          <MaterialCommunityIcons name="information" size={24} color="white/70" />
        </TouchableOpacity>
      </View>
      
      <View className="mb-6">
        <Text className="text-foreground mb-2">Group Name</Text>
        <TextInput
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>
      <View className="mb-6">
        <Text className="text-foreground mb-2">Group Code</Text>
        <TextInput
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          value={groupCode}
          onChangeText={setGroupCode}
        />
      </View>
      
      <View className="mb-8 flex-row items-center justify-between">
        <Text className="text-foreground">Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          thumbColor={notificationsEnabled ? '#F5F5F0' : '#ffffff'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>
      
      <Button
        title="Save Changes"
        onPress={updateGroup}
        color="#F5F5F0"
        className="w-full"
      />
      
      <View className="mt-auto mb-4">
        <Button
          title="Leave Circle"
          onPress={() => {
            // Implement leaving group functionality
            alert('Leaving group not implemented yet');
          }}
          color="#FF6B6B"
          className="w-full"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});