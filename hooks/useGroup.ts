import { useGroupStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export const useGroup = () => {
  const { currentGroup, members, setCurrentGroup, setMembers } = useGroupStore()
  const [loading, setLoading] = useState(false)

  const fetchGroup = async (groupId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()
      if (error) throw error
      setCurrentGroup(data)
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      if (membersError) throw membersError
      setMembers(membersData.map(m => m.user_id))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return { currentGroup, members, loading, fetchGroup }
}