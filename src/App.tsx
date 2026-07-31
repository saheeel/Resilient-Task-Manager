import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TaskProvider, useTasks, isAdminRole } from './contexts/TaskContext';
import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';
import NotificationListener from './components/NotificationListener';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import './index.css';

const TaskDetail = React.lazy(() => import('./pages/TaskDetail'));
const ManageTasks = React.lazy(() => import('./pages/ManageTasks'));
const CreateTask = React.lazy(() => import('./pages/CreateTask'));
const AddEmployee = React.lazy(() => import('./pages/AddEmployee'));
const AddAdmin = React.lazy(() => import('./pages/AddAdmin'));
const Settings = React.lazy(() => import('./pages/Settings'));
const EditTask = React.lazy(() => import('./pages/EditTask'));
const EditEmployee = React.lazy(() => import('./pages/EditEmployee'));
const EditAdmin = React.lazy(() => import('./pages/EditAdmin'));
const EmployeeHistory = React.lazy(() => import('./pages/EmployeeHistory'));
const EmployeeDashboard = React.lazy(() => import('./pages/EmployeeDashboard'));
const AllTasks = React.lazy(() => import('./pages/AllTasks'));
const CompletedHistory = React.lazy(() => import('./pages/CompletedHistory'));
const AdminTaskHistory = React.lazy(() => import('./pages/AdminTaskHistory'));
const Login = React.lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
  </div>
);

const AppContent = () => {
  const { currentUser } = useTasks();

  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <div 
      className="bg-white min-h-screen pb-24 font-sans text-slate-800"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)'
      }}
    >
      <TopHeader />
      <NotificationListener />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isAdminRole(currentUser.role) ? <ManageTasks /> : <EmployeeDashboard />} />
          <Route path="/all-tasks" element={currentUser.role === 'employee' ? <AllTasks /> : <Navigate to="/" replace />} />
          <Route path="/create" element={<CreateTask />} />
          <Route path="/my-tasks" element={isAdminRole(currentUser.role) ? <EmployeeDashboard /> : <Navigate to="/" replace />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/task/:id/edit" element={<EditTask />} />
          <Route path="/add-employee" element={<AddEmployee />} />
          <Route path="/add-admin" element={<AddAdmin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/employee/:id/edit" element={<EditEmployee />} />
          <Route path="/settings/admin/:id/edit" element={<EditAdmin />} />
          <Route path="/settings/employee/:id/history" element={<EmployeeHistory />} />
          {/* Employee: completed tasks history page */}
          <Route path="/history" element={currentUser.role === 'employee' ? <CompletedHistory /> : <Navigate to="/" replace />} />
          <Route path="/admin-history" element={isAdminRole(currentUser.role) ? <AdminTaskHistory /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <TaskProvider>
          <Router>
            <AppContent />
          </Router>
        </TaskProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
