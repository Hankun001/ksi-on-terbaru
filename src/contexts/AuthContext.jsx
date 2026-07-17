import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)

        // Get user role from profile table
        await fetchUserRole(session.user.id, session.user.email)
      }

      setLoading(false)

      // Listen for auth changes
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          if (session?.user) {
            fetchUserRole(session.user.id, session.user.email)
          } else {
            setRole(null)
            setProfile(null)
          }
          setLoading(false)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }

    const fetchUserRole = async (userId, userEmail = null) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet, try to create it with default role
            try {
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: userId, email: userEmail, role: 'murid' }])
                .select()
                .single()
              
              if (insertError) {
                // If insert fails due to RLS or other issues, set default role
                console.warn('Could not create profile, using default role:', insertError)
                setRole('murid')
                setProfile({ id: userId, email: userEmail, role: 'murid' })
              } else {
                setRole('murid')
                setProfile(newProfile)
              }
            } catch (insertErr) {
              // If insert fails, set default role and continue
              console.warn('Profile creation failed, using default role:', insertErr)
              setRole('murid')
              setProfile({ id: userId, email: userEmail, role: 'murid' })
            }
          } else if (error.code === 'PGRST100') {
            // RLS policy violation - read denied
            console.warn('RLS policy blocked read access to profile')
            setRole('murid')
            setProfile({ id: userId, email: userEmail, role: 'murid' })
          } else {
            throw error
          }
        } else {
          setRole(data.role || 'murid')
          setProfile(data)
        }
      } catch (error) {
        console.warn('Error getting user role:', error.message)
        // Set default role to allow app to continue
        setRole('murid')
        setProfile({ id: userId, email: userEmail, role: 'murid' })
      }
    }

    checkSession()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...metadata, role: 'murid' }
      }
    })

    if (error) throw error

    // Add user to profiles table with default role
    if (data.user) {
      await supabase.from('profiles').insert([
        { id: data.user.id, email: data.user.email, role: 'murid' }
      ])
    }

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      setUser(data.user)
      await fetchUserRole(data.user.id)
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setRole(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  }

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    }
    return data
  }

  const updateProfile = async (updates) => {
    if (!user) return null
    
    try {
      // First try UPDATE (most common case)
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()
      
      if (!updateError) {
        setProfile(updateData)
        return updateData
      }
      
      // If update fails (row doesn't exist), try INSERT
      if (updateError.code === 'PGRST116' || updateError.code === 'PGRST100') {
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            email: user.email,
            ...updates,
            role: role || 'murid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (insertError) throw insertError
        setProfile(insertData)
        return insertData
      }
      
      throw updateError
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
  }

  const value = {
    user,
    role,
    profile,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    fetchProfile,
    updateProfile,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}