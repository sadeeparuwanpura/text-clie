import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { EstimatePage } from '../features/chain/EstimatePage';
import { MachineIncludePage } from '../features/chain/MachineIncludePage';
import { MachineTypeAssignPage } from '../features/chain/MachineTypeAssignPage';
import { OperationsGridPage } from '../features/chain/OperationsGridPage';
import { ThreadVarietyAssignPage } from '../features/chain/ThreadVarietyAssignPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { FabricEditPage } from '../features/masters/fabrics/FabricEditPage';
import { FabricListPage } from '../features/masters/fabrics/FabricListPage';
import { MachineTypeEditPage } from '../features/masters/machineTypes/MachineTypeEditPage';
import { MachineTypeListPage } from '../features/masters/machineTypes/MachineTypeListPage';
import { ThreadVarietyEditPage } from '../features/masters/threadVarieties/ThreadVarietyEditPage';
import { ThreadVarietyListPage } from '../features/masters/threadVarieties/ThreadVarietyListPage';
import { RequisitionDetailPage } from '../features/requisitions/RequisitionDetailPage';
import { RequisitionListPage } from '../features/requisitions/RequisitionListPage';
import { SewOffPage } from '../features/sewOff/SewOffPage';
import { StyleEditPage } from '../features/styles/StyleEditPage';
import { StyleListPage } from '../features/styles/StyleListPage';
import type { Permission } from '../types/permission';
import { AppShell } from './AppShell';
import { RouteGuard } from './RouteGuard';

function Protected({ children, permission }: { children: ReactNode; permission?: Permission }) {
  return (
    <RouteGuard requiredPermission={permission}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/change-password"
        element={
          <RouteGuard>
            <ChangePasswordPage />
          </RouteGuard>
        }
      />

      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />

      <Route
        path="/masters/machine-types"
        element={
          <Protected permission="machinetype:read">
            <MachineTypeListPage />
          </Protected>
        }
      />
      <Route
        path="/masters/machine-types/new"
        element={
          <Protected permission="machinetype:write">
            <MachineTypeEditPage mode="create" />
          </Protected>
        }
      />
      <Route
        path="/masters/machine-types/:id"
        element={
          <Protected permission="machinetype:write">
            <MachineTypeEditPage mode="edit" />
          </Protected>
        }
      />

      <Route
        path="/masters/thread-varieties"
        element={
          <Protected permission="threadvariety:read">
            <ThreadVarietyListPage />
          </Protected>
        }
      />
      <Route
        path="/masters/thread-varieties/new"
        element={
          <Protected permission="threadvariety:write">
            <ThreadVarietyEditPage mode="create" />
          </Protected>
        }
      />
      <Route
        path="/masters/thread-varieties/:id"
        element={
          <Protected permission="threadvariety:write">
            <ThreadVarietyEditPage mode="edit" />
          </Protected>
        }
      />

      <Route
        path="/masters/fabrics"
        element={
          <Protected permission="fabric:read">
            <FabricListPage />
          </Protected>
        }
      />
      <Route
        path="/masters/fabrics/new"
        element={
          <Protected permission="fabric:write">
            <FabricEditPage mode="create" />
          </Protected>
        }
      />
      <Route
        path="/masters/fabrics/:id"
        element={
          <Protected permission="fabric:write">
            <FabricEditPage mode="edit" />
          </Protected>
        }
      />

      <Route
        path="/styles"
        element={
          <Protected permission="style:read">
            <StyleListPage />
          </Protected>
        }
      />
      <Route
        path="/styles/new"
        element={
          <Protected permission="style:write">
            <StyleEditPage mode="create" />
          </Protected>
        }
      />
      <Route
        path="/styles/:id"
        element={
          <Protected permission="style:read">
            <StyleEditPage mode="edit" />
          </Protected>
        }
      />

      <Route
        path="/styles/:id/chain/operations"
        element={
          <Protected permission="operation:read">
            <OperationsGridPage />
          </Protected>
        }
      />
      <Route
        path="/styles/:id/chain/machine-types"
        element={
          <Protected permission="operation:read">
            <MachineTypeAssignPage />
          </Protected>
        }
      />
      <Route
        path="/styles/:id/chain/thread-lines"
        element={
          <Protected permission="operation:read">
            <MachineIncludePage />
          </Protected>
        }
      />
      <Route
        path="/styles/:id/chain/thread-varieties"
        element={
          <Protected permission="threadassignment:read">
            <ThreadVarietyAssignPage />
          </Protected>
        }
      />
      <Route
        path="/styles/:id/chain/estimate"
        element={
          <Protected permission="estimate:read">
            <EstimatePage />
          </Protected>
        }
      />

      <Route
        path="/styles/:id/sew-off"
        element={
          <Protected permission="sewoff:read">
            <SewOffPage />
          </Protected>
        }
      />

      <Route
        path="/requisitions"
        element={
          <Protected permission="requisition:read">
            <RequisitionListPage />
          </Protected>
        }
      />
      <Route
        path="/requisitions/:id"
        element={
          <Protected permission="requisition:read">
            <RequisitionDetailPage />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
