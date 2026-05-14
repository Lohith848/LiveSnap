import { TabBar, TabBarItem } from 'expo-router'
import { useGroupStore } from '../../lib/store'
import { useEffect } from 'react'

export default function TabsLayout() {
  const { currentGroup } = useGroupStore()

  useEffect(() => {
    // This effect runs whenever currentGroup changes
    // You can add logic here if needed, e.g., fetch group data
  }, [currentGroup])

  return (
    <>
      <TabBar
        contentContainerClassName="bg-background border-t border-white/10"
        backgroundClassName="bg-background"
      >
        <TabBarItem>
          <TabBarItem.Item
            href="/(tabs)/camera"
            title="Camera"
            icon={() => (
              // You can replace with an actual icon component
              <div className="w-6 h-6">📷</div>
            )}
          />
        </TabBarItem>
        <TabBarItem>
          <TabBarItem.Item
            href="/(tabs)/feed"
            title="Feed"
            icon={() => (
              <div className="w-6 h-6">📸</div>
            )}
          />
        </TabBarItem>
        <TabBarItem>
          <TabBarItem.Item
            href="/(tabs)/settings"
            title="Settings"
            icon={() => (
              <div className="w-6 h-6">⚙️</div>
            )}
          />
        </TabBarItem>
      </TabBar>
      <Slot />
    </>
  )
}