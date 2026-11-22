import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabaseConfigured } from './supabase'
export function ProtectedRoute(){const {user,loading}=useAuth();const loc=useLocation();if(loading)return <div className="auth-loading" role="status">Restoring your workspace…</div>;if(!supabaseConfigured)return <Navigate to="/login?setup=supabase" replace/>;if(!user)return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace/>;return <Outlet/>}
export function OnboardingGate(){const {user}=useAuth();if(!user)return <Navigate to="/login" replace/>;return <Outlet/>}
