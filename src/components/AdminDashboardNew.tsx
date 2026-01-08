import { useState } from 'react';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { DashboardTab } from './admin/DashboardTab';
import { PreceptorsTab } from './admin/PreceptorsTab';
import { AssignPreceptorTab } from './admin/AssignPreceptorTab';
import { ReviewEntriesTab } from './admin/ReviewEntriesTab';
import { UserManagementTab } from './admin/UserManagementTab';

export function AdminDashboardNew() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader
          adminName="Admin User"
          adminEmail="admin@medical.edu"
        />

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'students' && <UserManagementTab />}
          {activeTab === 'preceptors' && <PreceptorsTab />}
          {activeTab === 'assign' && <AssignPreceptorTab />}
          {activeTab === 'review' && <ReviewEntriesTab />}
        </main>
      </div>
    </div>
  );
}