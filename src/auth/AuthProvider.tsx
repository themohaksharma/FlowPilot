import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
type AuthValue={user:User|null;session:Session|null;loading:boolean;signOut:()=>Promise<void>}
const AuthContext=createContext<AuthValue|null>(null)
export function AuthProvider({children}:{children:ReactNode}){const [session,setSession]=useState<Session|null>(null);const [loading,setLoading]=useState(true);useEffect(()=>{if(!supabase){setLoading(false);return}supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setLoading(false)});return()=>subscription.unsubscribe()},[]);const value=useMemo(()=>({user:session?.user??null,session,loading,signOut:async()=>{if(supabase)await supabase.auth.signOut()}}),[session,loading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){const v=useContext(AuthContext);if(!v)throw new Error('useAuth requires AuthProvider');return v}
