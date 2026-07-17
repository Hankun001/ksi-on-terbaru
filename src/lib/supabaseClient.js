import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig'

// Konfigurasi Supabase dengan realtime yang dioptimalkan
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // Konfigurasi Realtime
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Konfigurasi global untuk semua request
  global: {
    headers: {
      'x-application-name': 'ksi-on-lms',
    },
  },
  // Auto refresh auth token
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Mengurangi frequency refresh untuk performa lebih baik
    refreshInterval: 300000, // 5 menit
  },
  // Enable realtime untuk semua fitur
  db: {
    schema: 'public',
  },
})

// Helper untuk menangani koneksi realtime dengan auto-reconnect
export const createRealtimeChannel = (supabaseClient, channelName, config, callbacks) => {
  const channel = supabaseClient.channel(channelName, config)
  
  let reconnectTimeout = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const scheduleReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.warn(`[${channelName}] Max reconnect attempts reached`)
      return
    }

    reconnectAttempts++
    const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts - 1), 30000)
    
    console.log(`[${channelName}] Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`)
    
    reconnectTimeout = setTimeout(() => {
      channel.subscribe()
      reconnectAttempts = 0
    }, delay)
  }

  // Callback untuk menangani perubahan status koneksi
  channel.on('system', { event: 'disconnected' }, () => {
    console.warn(`[${channelName}] Disconnected, scheduling reconnect...`)
    scheduleReconnect()
  })

  channel.on('system', { event: 'connected' }, () => {
    console.log(`[${channelName}] Connected`)
    reconnectAttempts = 0
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
  })

  // Apply user callbacks
  if (callbacks) {
    if (callbacks.config) {
      channel.on('config', callbacks.config)
    }
    if (callbacks.postgresChanges) {
      channel.on('postgres_changes', callbacks.postgresChanges)
    }
    if (callbacks.broadcast) {
      channel.on('broadcast', callbacks.broadcast)
    }
    if (callbacks.presence) {
      channel.on('presence', callbacks.presence)
    }
    if (callbacks.system) {
      channel.on('system', callbacks.system)
    }
  }

  // Subscribe ke channel
  channel.subscribe((status) => {
    console.log(`[${channelName}] Subscription status: ${status}`)
    
    if (status === 'SUBSCRIBED' && callbacks?.onSubscribed) {
      callbacks.onSubscribed()
    }
    
    if (status === 'CHANNEL_ERROR' && callbacks?.onError) {
      callbacks.onError(new Error('Channel error'))
    }
    
    if (status === 'TIMED_OUT' && callbacks?.onTimeout) {
      callbacks.onTimeout()
      scheduleReconnect()
    }
  })

  // Return cleanup function
  return {
    channel,
    unsubscribe: () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      return supabaseClient.removeChannel(channel)
    },
  }
}

// Helper untuk fetch data dengan error handling yang lebih baik
export const safeFetch = async (supabaseClient, query, options = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await query
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (error) {
      lastError = error
      console.warn(`[safeFetch] Attempt ${attempt}/${maxRetries} failed:`, error.message)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }

  console.error('[safeFetch] All attempts failed:', lastError)
  return { data: null, error: lastError }
}

// Presence state management helper
export const createPresenceManager = (supabaseClient, channel, userId, extraData = {}) => {
  const trackPresence = async () => {
    return await channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...extraData,
    })
  }

  const getPresenceState = () => {
    return channel.presenceState()
  }

  const onPresenceSync = (callback) => {
    channel.on('presence', { event: 'sync' }, () => {
      callback(getPresenceState())
    })
  }

  const onPresenceJoin = (callback) => {
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      callback(newPresences)
    })
  }

  const onPresenceLeave = (callback) => {
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      callback(leftPresences)
    })
  }

  return {
    trackPresence,
    getPresenceState,
    onPresenceSync,
    onPresenceJoin,
    onPresenceLeave,
  }
}

export default supabase
