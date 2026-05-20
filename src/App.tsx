import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TaskProvider, useTasks } from './contexts/TaskContext';
import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';
import TaskDetail from './pages/TaskDetail';
import ManageTasks from './pages/ManageTasks';
import CreateTask from './pages/CreateTask';
import AddEmployee from './pages/AddEmployee';
import Settings from './pages/Settings';
import CalendarView from './pages/CalendarView';
import EditTask from './pages/EditTask';
import EditEmployee from './pages/EditEmployee';
import EmployeeHistory from './pages/EmployeeHistory';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Login from './pages/Login';
import NotificationListener from './components/NotificationListener';
import './index.css';

const AppContent = () => {
  const { currentUser } = useTasks();

  if (!currentUser) {
    return <Login />;
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
      <Routes>
        <Route path="/" element={currentUser.role === 'manager' ? <ManageTasks /> : <EmployeeDashboard />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/task/:id/edit" element={<EditTask />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/employee/:id/edit" element={<EditEmployee />} />
        <Route path="/settings/employee/:id/history" element={<EmployeeHistory />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <TaskProvider>
      <Router>
        <AppContent />
      </Router>
    </TaskProvider>
  );
};

export default App;
