import { lazy, Suspense } from 'react'
import { Route,Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PlaceholderPage from '../pages/PlaceholderPage'
import { ProtectedRoute } from '../auth/RouteGuards'
const LoginPage=lazy(()=>import('../pages/AuthPages').then(m=>({default:m.LoginPage})))
const SignupPage=lazy(()=>import('../pages/AuthPages').then(m=>({default:m.SignupPage})))
const ForgotPasswordPage=lazy(()=>import('../pages/AuthPages').then(m=>({default:m.ForgotPasswordPage})))
const WorkspaceLayout=lazy(()=>import('../pages/WorkspacePages').then(m=>({default:m.WorkspaceLayout})))
const DashboardPage=lazy(()=>import('../pages/WorkspacePages').then(m=>({default:m.DashboardPage})))
const OnboardingPage=lazy(()=>import('../pages/WorkspacePages').then(m=>({default:m.OnboardingPage})))
const FinancePages=lazy(()=>import('../pages/FinancePages'))
const InvoiceManagement=lazy(()=>import('../pages/InvoiceManagement'))
const Operations=()=>import('../pages/OperationalPages')
const ReminderAssistantPage=lazy(()=>Operations().then(m=>({default:m.ReminderAssistantPage})))
const ExpenseManagementPage=lazy(()=>Operations().then(m=>({default:m.ExpenseManagementPage})))
const CashFlowPage=lazy(()=>Operations().then(m=>({default:m.CashFlowPage})))
const ReportsPage=lazy(()=>Operations().then(m=>({default:m.ReportsPage})))
export default function App(){return <Suspense fallback={<div className="auth-loading" role="status">Loading FlowPilot…</div>}><Routes><Route path="/" element={<HomePage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/><Route element={<ProtectedRoute/>}><Route path="/onboarding" element={<OnboardingPage/>}/><Route path="/app" element={<WorkspaceLayout/>}><Route index element={<DashboardPage/>}/><Route path="customers" element={<FinancePages/>}/><Route path="invoices" element={<InvoiceManagement/>}/><Route path="payments" element={<ReminderAssistantPage/>}/><Route path="expenses" element={<ExpenseManagementPage/>}/><Route path="cashflow" element={<CashFlowPage/>}/><Route path="reports" element={<ReportsPage/>}/><Route path="settings" element={<FinancePages/>}/></Route></Route><Route path="*" element={<PlaceholderPage kind="not-found"/>}/></Routes></Suspense>}
