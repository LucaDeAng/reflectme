import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TherapyProvider } from './contexts/TherapyContext';
import { ZentiaProvider } from './contexts/ZentiaContext';
import { AssessmentProvider } from './contexts/AssessmentContext';
import ErrorBoundary from './components/ErrorBoundary';
import { logError, AppError, ErrorType, ErrorSeverity } from './utils/errorHandling';
import { Toaster } from 'sonner';
import { SystemStatusBanner, ProgressIndicators } from './components/ui/FeedbackComponents';
import { startNetworkMonitoring } from './utils/feedbackUtils';

import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import EmailVerification from './pages/EmailVerification';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';

// Freemium System Pages
import ClientInviteAcceptance from './pages/ClientInviteAcceptance';
import TherapistProfileManagement from './pages/therapist/TherapistProfileManagement';
import { TherapistDirectory } from './components/therapist/TherapistDirectory';

// Therapist Pages
import TherapistDashboard from './pages/therapist/Dashboard';
import TherapistClientDetails from './pages/therapist/ClientDetails';
import TherapistNotes from './pages/therapist/Notes';

import TherapistNotesOverview from './pages/therapist/NotesOverview';
import CaseHistories from './pages/therapist/CaseHistories';
import CaseHistoryForm from './pages/therapist/CaseHistoryForm';
import CaseHistoryView from './pages/therapist/CaseHistoryView';
import SessionRecap from './pages/therapist/SessionRecap';
import MonitoringReview from './pages/therapist/MonitoringReview';
import ActiveClients from './pages/therapist/ActiveClients';
import Monitoring from './pages/therapist/Monitoring';
import Patterns from './pages/therapist/Patterns';

// New CRUD Management Pages
import ClientManagement from './pages/therapist/ClientManagement';
import TaskManagement from './pages/therapist/TaskManagement';
import AssessmentManagement from './pages/therapist/AssessmentManagement';

// Enhanced Therapist Features
import TherapistCustomReports from './pages/therapist/CustomReports';
import TherapistSecureCommunication from './pages/therapist/SecureCommunication';
import TherapistTrainingSupport from './pages/therapist/TrainingSupport';
import TherapistPredictiveAnalytics from './pages/therapist/PredictiveAnalytics';
import TherapistAIToolbox from './pages/therapist/AIToolbox';
import TherapistAnalyticsHub from './pages/therapist/AnalyticsHub';
import TherapistCommunicationHub from './pages/therapist/CommunicationHub';

// Patient Pages (Original)
import PatientDashboard from './pages/patient/Dashboard';
import PatientJournal from './pages/patient/Journal';
import PatientMonitoring from './pages/patient/Monitoring';
import AssessmentPage from './pages/AssessmentPage';

// Client Pages (New Architecture)
import ClientInsights from './pages/client/Insights';
import Plan from './pages/client/Plan';

// Zentia App Pages
import Chat from './pages/Chat';
import CopingTools from './pages/CopingTools';
import SessionRecaps from './pages/SessionRecaps';
import Profile from './pages/Profile';
import ConnectHealthPage from './pages/ConnectHealth';
import OAuthCallbackPage from './pages/OAuthCallback';

// Settings
import Settings from './pages/settings/Settings';

// Test Components
import { PDFTestComponent } from './components/test/PDFTestComponent';
import Phase4Test from './pages/Phase4Test';
import PrototypeOverview from './pages/PrototypeOverview';
import GeminiTest from './pages/GeminiTest';
import TestPage from './pages/TestPage';
import AiCompanionDemo from './pages/AiCompanionDemo';
import WaitlistAdmin from './components/waitlist/WaitlistAdmin';
import EmailCampaignAdmin from './components/waitlist/EmailCampaignAdmin';
import NotificationHistory from "./components/waitlist/NotificationHistory";

// Layouts
import UnifiedLayout from './layouts/UnifiedLayout';
import TherapistLayout from './layouts/TherapistLayout';
import PatientLayout from './layouts/PatientLayout';
import AppLayout from './layouts/AppLayout';

// Enhanced Access Denied Component with error handling
const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      logError(new AppError(
        `Navigation failed to ${path}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.LOW,
        { targetPath: path }
      ), {
        action: 'access_denied_navigation',
        component: 'AccessDenied'
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">Access Denied</h1>
        <p className="text-neutral-600 mb-8">
          You don't have permission to access this admin area. 
          This section is restricted to authorized administrators only.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => handleNavigation('/')}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Homepage
          </button>
          <button
            onClick={() => handleNavigation('/login')}
            className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Admin Route Protection Component with error handling
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Verifying access...</p>
        </div>
      </div>
    );
  }
  
  try {
  // Check if user is admin (same logic as in Home.tsx)
  const isAdmin = user?.email?.includes('admin') || 
                  user?.email?.includes('l.de.angelis') || 
                  user?.role === 'admin' ||
                  false;

  // If not loading and not admin, show access denied page
  if (!loading && !isAdmin) {
      logError(new AppError(
        'Unauthorized admin access attempt',
        ErrorType.PERMISSION,
        ErrorSeverity.MEDIUM,
        { 
          userEmail: user?.email,
          userRole: user?.role,
          isAdmin
        }
      ), {
        action: 'admin_access_check',
        component: 'AdminRoute',
        userId: user?.id
      });
    return <AccessDenied />;
  }

  return <>{children}</>;
  } catch (error) {
    logError(new AppError(
      `Admin route protection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      { userEmail: user?.email, userRole: user?.role }
    ), {
      action: 'admin_route_protection',
      component: 'AdminRoute',
      userId: user?.id
    });
    
    return <AccessDenied />;
  }
};

function App() {
  // Global error handler for unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(new AppError(
        `Unhandled promise rejection: ${event.reason}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH,
        { reason: event.reason }
      ), {
        action: 'unhandled_promise_rejection',
        component: 'App'
      });
    };

    const handleError = (event: ErrorEvent) => {
      logError(new AppError(
        `Global error: ${event.message}`,
        ErrorType.UNKNOWN,
        ErrorSeverity.HIGH,
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      ), {
        action: 'global_error',
        component: 'App'
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Start network monitoring for feedback system
    const cleanupNetworkMonitoring = startNetworkMonitoring();

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      cleanupNetworkMonitoring();
    };
  }, []);

  return (
    <ErrorBoundary componentName="App">
    <Router future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <div className="App">
          <ErrorBoundary componentName="AuthProvider">
        <AuthProvider>
              <ErrorBoundary componentName="TherapyProvider">
          <TherapyProvider>
                  <ErrorBoundary componentName="ZentiaProvider">
            <ZentiaProvider>
                      <ErrorBoundary componentName="AssessmentProvider">
              <AssessmentProvider>
                          <ErrorBoundary componentName="AppRoutes">
                <Routes>
                {/* Public routes */}
                              <Route path="/" element={
                                <ErrorBoundary componentName="Home">
                                  <Home />
                                </ErrorBoundary>
                              } />
                              <Route path="/about" element={
                                <ErrorBoundary componentName="About">
                                  <About />
                                </ErrorBoundary>
                              } />
                              <Route path="/login" element={
                                <ErrorBoundary componentName="Login">
                                  <Login />
                                </ErrorBoundary>
                              } />
                              <Route path="/register" element={
                                <ErrorBoundary componentName="Register">
                                  <Register />
                                </ErrorBoundary>
                              } />
                              <Route path="/welcome" element={
                                <ErrorBoundary componentName="Welcome">
                                  <Welcome />
                                </ErrorBoundary>
                              } />
                              <Route path="/verify-email" element={
                                <ErrorBoundary componentName="EmailVerification">
                                  <EmailVerification />
                                </ErrorBoundary>
                              } />
                              <Route path="/terms" element={
                                <ErrorBoundary componentName="TermsOfService">
                                  <TermsOfService />
                                </ErrorBoundary>
                              } />
                              <Route path="/privacy" element={
                                <ErrorBoundary componentName="PrivacyPolicy">
                                  <PrivacyPolicy />
                                </ErrorBoundary>
                              } />
                
                {/* Assessment Route (standalone) */}
                              <Route path="/assessment/:clientId" element={
                                <ErrorBoundary componentName="AssessmentPage">
                                  <AssessmentPage />
                                </ErrorBoundary>
                              } />

                {/* Freemium System Routes */}
                              <Route path="/invite/:inviteCode" element={
                                <ErrorBoundary componentName="ClientInviteAcceptance">
                                  <ClientInviteAcceptance />
                                </ErrorBoundary>
                              } />
                              
                              <Route path="/therapists" element={
                                <ErrorBoundary componentName="TherapistDirectory">
                                  <TherapistDirectory />
                                </ErrorBoundary>
                              } />
                              
                              <Route path="/therapists/:slug" element={
                                <ErrorBoundary componentName="TherapistDirectory">
                                  <TherapistDirectory />
                                </ErrorBoundary>
                              } />
                
                {/* Legacy Zentia App Routes - redirect to new client routes */}
                <Route path="/app" element={<Navigate to="/client" replace />} />
                <Route path="/app/*" element={<Navigate to="/client" replace />} />
                
                {/* NEW UNIFIED CLIENT ROUTES */}
                              <Route path="/client" element={
                                <ErrorBoundary componentName="UnifiedLayout-Client">
                                  <UnifiedLayout />
                                </ErrorBoundary>
                              }>
                                <Route index element={
                                  <ErrorBoundary componentName="PatientDashboard">
                                    <PatientDashboard />
                                  </ErrorBoundary>
                                } />
                                <Route path="chat" element={
                                  <ErrorBoundary componentName="Chat">
                                    <Chat />
                                  </ErrorBoundary>
                                } />
                                <Route path="monitoring" element={
                                  <ErrorBoundary componentName="PatientMonitoring">
                                    <PatientMonitoring />
                                  </ErrorBoundary>
                                } />
                                <Route path="plan" element={
                                  <ErrorBoundary componentName="Plan">
                                    <Plan />
                                  </ErrorBoundary>
                                } />
                                <Route path="insights" element={
                                  <ErrorBoundary componentName="ClientInsights">
                                    <ClientInsights />
                                  </ErrorBoundary>
                                } />
                                <Route path="journal" element={
                                  <ErrorBoundary componentName="PatientJournal">
                                    <PatientJournal />
                                  </ErrorBoundary>
                                } />
                                <Route path="settings" element={
                                  <ErrorBoundary componentName="Settings">
                                    <Settings />
                                  </ErrorBoundary>
                                } />
                </Route>

                {/* NEW UNIFIED THERAPIST ROUTES */}
                              <Route path="/therapist" element={
                                <ErrorBoundary componentName="UnifiedLayout-Therapist">
                                  <UnifiedLayout />
                                </ErrorBoundary>
                              }>
                                <Route index element={
                                  <ErrorBoundary componentName="TherapistDashboard">
                                    <TherapistDashboard />
                                  </ErrorBoundary>
                                } />
                                <Route path="clients" element={
                                  <ErrorBoundary componentName="ActiveClients">
                                    <ActiveClients />
                                  </ErrorBoundary>
                                } />
                                <Route path="clients/:clientId" element={
                                  <ErrorBoundary componentName="TherapistClientDetails">
                                    <TherapistClientDetails />
                                  </ErrorBoundary>
                                } />
                                <Route path="client/:clientId" element={
                                  <ErrorBoundary componentName="TherapistClientDetails">
                                    <TherapistClientDetails />
                                  </ErrorBoundary>
                                } />
                                <Route path="monitoring" element={
                                  <ErrorBoundary componentName="Monitoring">
                                    <Monitoring />
                                  </ErrorBoundary>
                                } />
                                <Route path="monitoring-review" element={
                                  <ErrorBoundary componentName="MonitoringReview">
                                    <MonitoringReview />
                                  </ErrorBoundary>
                                } />
                                <Route path="session-recap/:clientId" element={
                                  <ErrorBoundary componentName="SessionRecap">
                                    <SessionRecap />
                                  </ErrorBoundary>
                                } />
                                <Route path="patterns" element={
                                  <ErrorBoundary componentName="Patterns">
                                    <Patterns />
                                  </ErrorBoundary>
                                } />
                                <Route path="reports" element={
                                  <ErrorBoundary componentName="CaseHistories">
                                    <CaseHistories />
                                  </ErrorBoundary>
                                } />
                  <Route path="notes" element={<Navigate to="/therapist/notes-overview" replace />} />
                                <Route path="notes/:clientId" element={
                                  <ErrorBoundary componentName="TherapistNotes">
                                    <TherapistNotes />
                                  </ErrorBoundary>
                                } />
                                <Route path="notes-overview" element={
                                  <ErrorBoundary componentName="TherapistNotesOverview">
                                    <TherapistNotesOverview />
                                  </ErrorBoundary>
                                } />
                                <Route path="case-histories" element={
                                  <ErrorBoundary componentName="CaseHistories">
                                    <CaseHistories />
                                  </ErrorBoundary>
                                } />
                                <Route path="case-histories/new" element={
                                  <ErrorBoundary componentName="CaseHistoryForm">
                                    <CaseHistoryForm />
                                  </ErrorBoundary>
                                } />
                                <Route path="case-history/:id" element={
                                  <ErrorBoundary componentName="CaseHistoryView">
                                    <CaseHistoryView />
                                  </ErrorBoundary>
                                } />
                                <Route path="session-recap/:clientId" element={
                                  <ErrorBoundary componentName="SessionRecap">
                                    <SessionRecap />
                                  </ErrorBoundary>
                                } />
                                <Route path="settings" element={
                                  <ErrorBoundary componentName="Settings">
                                    <Settings />
                                  </ErrorBoundary>
                                } />
                  
                  {/* New Enhanced Therapist Features */}
                                <Route path="ai-toolbox" element={
                                  <ErrorBoundary componentName="TherapistAIToolbox">
                                    <TherapistAIToolbox />
                                  </ErrorBoundary>
                                } />
                                <Route path="analytics-hub" element={
                                  <ErrorBoundary componentName="TherapistAnalyticsHub">
                                    <TherapistAnalyticsHub />
                                  </ErrorBoundary>
                                } />
                                <Route path="communication-hub" element={
                                  <ErrorBoundary componentName="TherapistCommunicationHub">
                                    <TherapistCommunicationHub />
                                  </ErrorBoundary>
                                } />
                                <Route path="custom-reports" element={
                                  <ErrorBoundary componentName="TherapistCustomReports">
                                    <TherapistCustomReports />
                                  </ErrorBoundary>
                                } />
                                <Route path="secure-communication" element={
                                  <ErrorBoundary componentName="TherapistSecureCommunication">
                                    <TherapistSecureCommunication />
                                  </ErrorBoundary>
                                } />
                                <Route path="training-support" element={
                                  <ErrorBoundary componentName="TherapistTrainingSupport">
                                    <TherapistTrainingSupport />
                                  </ErrorBoundary>
                                } />
                                <Route path="predictive-analytics" element={
                                  <ErrorBoundary componentName="TherapistPredictiveAnalytics">
                                    <TherapistPredictiveAnalytics />
                                  </ErrorBoundary>
                                } />
                                
                                {/* CRUD Management Routes */}
                                <Route path="clients-management" element={
                                  <ErrorBoundary componentName="ClientManagement">
                                    <ClientManagement />
                                  </ErrorBoundary>
                                } />
                                <Route path="tasks-management" element={
                                  <ErrorBoundary componentName="TaskManagement">
                                    <TaskManagement />
                                  </ErrorBoundary>
                                } />
                                <Route path="assessments-management" element={
                                  <ErrorBoundary componentName="AssessmentManagement">
                                    <AssessmentManagement />
                                  </ErrorBoundary>
                                } />
                                
                                {/* Freemium System Routes */}
                                <Route path="profile-management" element={
                                  <ErrorBoundary componentName="TherapistProfileManagement">
                                    <TherapistProfileManagement />
                                  </ErrorBoundary>
                                } />
                  
                  {/* Legacy routes - keep for backwards compatibility */}
                  <Route path="active-clients" element={<Navigate to="/therapist/clients" replace />} />
                </Route>

                {/* Health & OAuth routes */}
                              <Route path="/connect-health" element={
                                <ErrorBoundary componentName="ConnectHealthPage">
                                  <ConnectHealthPage />
                                </ErrorBoundary>
                              } />
                              <Route path="/oauth/callback" element={
                                <ErrorBoundary componentName="OAuthCallbackPage">
                                  <OAuthCallbackPage />
                                </ErrorBoundary>
                              } />

                {/* Settings standalone */}
                              <Route path="/settings" element={
                                <ErrorBoundary componentName="Settings">
                                  <Settings />
                                </ErrorBoundary>
                              } />
                
                {/* Prototype Overview */}
                              <Route path="/prototype" element={
                                <ErrorBoundary componentName="PrototypeOverview">
                                  <PrototypeOverview />
                                </ErrorBoundary>
                              } />
                
                {/* PROTECTED ADMIN ROUTES */}
                <Route path="/waitlist-admin" element={
                  <AdminRoute>
                                  <ErrorBoundary componentName="WaitlistAdmin">
                    <WaitlistAdmin />
                                  </ErrorBoundary>
                  </AdminRoute>
                } />
                
                <Route path="/email-campaigns" element={
                  <AdminRoute>
                                  <ErrorBoundary componentName="EmailCampaignAdmin">
                    <EmailCampaignAdmin />
                                  </ErrorBoundary>
                  </AdminRoute>
                } />

                {/* Test Routes (Development Only) */}
                              <Route path="/test/pdf" element={
                                <ErrorBoundary componentName="PDFTestComponent">
                                  <PDFTestComponent />
                                </ErrorBoundary>
                              } />
                              <Route path="/analytics-demo" element={
                                <ErrorBoundary componentName="Phase4Test">
                                  <Phase4Test />
                                </ErrorBoundary>
                              } />
                
                {/* Development AI Test Panel - Only for admins */}
                {import.meta.env.MODE === 'development' && (
                  <>
                                  <Route path="/gemini-test" element={
                                    <ProtectedRoute roles={['patient', 'therapist', 'admin']}>
                                      <ErrorBoundary componentName="GeminiTest">
                                        <GeminiTest />
                                      </ErrorBoundary>
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/test" element={
                                    <ProtectedRoute roles={['patient', 'therapist', 'admin']}>
                                      <ErrorBoundary componentName="TestPage">
                                        <TestPage />
                                      </ErrorBoundary>
                                    </ProtectedRoute>
                                  } />
                                  <Route path="/ai-companion-demo" element={
                                    <ErrorBoundary componentName="AiCompanionDemo">
                                      <AiCompanionDemo />
                                    </ErrorBoundary>
                                  } />
                  </>
                )}

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                          </ErrorBoundary>
              </AssessmentProvider>
                      </ErrorBoundary>
            </ZentiaProvider>
                  </ErrorBoundary>
          </TherapyProvider>
              </ErrorBoundary>
        </AuthProvider>
          </ErrorBoundary>
      </div>
      
      {/* Feedback System Components */}
      <SystemStatusBanner />
      <ProgressIndicators />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </Router>
    </ErrorBoundary>
  );
}

export default App;