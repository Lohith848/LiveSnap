import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, LayoutAnimation } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useGroupStore, useAuthStore } from '../../lib/store';
import PhotoCard from '../../components/PhotoCard';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function Feed() {
  const { currentGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!currentGroup?.id || !user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch photos for the current group, ordered by most recent first
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('group_id', currentGroup.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotos(data || []);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setPhotos([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchPhotos();

    // Setup realtime subscription for live updates
    if (currentGroup?.id) {
      const channel = supabase
        .channel(`group:${currentGroup.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'photos' },
          (payload) => {
            // Prepend new photo to list with Reanimated slide-in from top
            setPhotos((prev) => {
              const newPhoto = payload.new;
              // Configure layout animation for smooth insertion
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              return [newPhoto, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reactions' },
          (payload) => {
            // Update reaction counts without re-fetching
            setPhotos((prev) =>
              prev.map((photo) => {
                if (photo.id === payload.new.photo_id) {
                  // Increment reaction count for this emoji
                  const reactionType = payload.new.reaction_type;
                  return {
                    ...photo,
                    reactions: {
                      ...(photo.reactions || {}),
                      [reactionType]: (photo.reactions?.[reactionType] || 0) + 1,
                    },
                  };
                }
                return photo;
              })
            );
          }
        )
        .subscribe();

      setRealtimeSubscription(channel);
    }

    // Cleanup subscription on unmount
    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
      }
    };
  }, [currentGroup?.id, user?.id, realtimeSubscription]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPhotos(); // Refetch photos
  };

  if (loading && photos.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <SkeletonLoader count={3} height={200} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={photos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <PhotoCard photo={item} />}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            title="Pull to refresh"
            tintColor="#F5F5F0"
            titleColor="#FFFFFF"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({});