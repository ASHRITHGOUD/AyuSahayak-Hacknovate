import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminHome from './pages/admin/AdminHome';
import Hospitals from './pages/admin/Hospitals';
import OwnerHome from './pages/owner/OwnerHome';
import Staff from './pages/owner/Staff';
import NurseHome from './pages/nurse/NurseHome';
import Patients from './pages/nurse/Patients';
import NurseConsults from './pages/nurse/NurseConsults';
import DoctorHome from './pages/doctor/DoctorHome';
import DoctorQueue from './pages/doctor/DoctorQueue';
import PrescriptionEditor from './pages/doctor/PrescriptionEditor';
import InProgress from './pages/doctor/InProgress';
import ConsultationDetails from './pages/doctor/ConsultationDetails';
import PrescriptionView from './pages/nurse/PrescriptionView';
import EditPatient from './pages/nurse/EditPatient';
import VideoCall from './pages/common/VideoCall';
import OwnerInventory from "./pages/owner/OwnerInventory";
import OwnerMedicines from "./pages/owner/OwnerMedicines";
import SkinCareAI from './pages/ai/SkinCareAI';
import WoundCareAI from './pages/ai/WoundCareAI';
import RuralCareAI from "./pages/ai/RuralCareAI";

import Home from './pages/common/Home';
import Solutions from "./components/Solutions";
import AISummary from './pages/nurse/AISummary';
import AISummaryForSW from './pages/ai/AISummaryForSW';







function PrivateRoute({ children, roles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solutions" element={<Solutions />} />


      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminHome />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/hospitals"
        element={
          <PrivateRoute roles={['admin']}>
            <Hospitals />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
      path="/owner"
      element={
        <PrivateRoute roles={['hospital_owner']}>
          <OwnerHome />
        </PrivateRoute>
      }
    />
   <Route
     path="/owner/staff"
     element={
       <PrivateRoute roles={['hospital_owner']}>
         <Staff />
       </PrivateRoute>
     }
   />
   <Route
  path="/nurse"
  element={
    <PrivateRoute roles={['nurse']}>
      <NurseHome />
    </PrivateRoute>
  }
/>
<Route
  path="/nurse/patients"
  element={
    <PrivateRoute roles={['nurse']}>
      <Patients />
    </PrivateRoute>
  }
/>
<Route
  path="/nurse/consultations"
  element={
    <PrivateRoute roles={['nurse']}>
      <NurseConsults />
    </PrivateRoute>
  }
/>
<Route
  path="/doctor"
  element={
    <PrivateRoute roles={['doctor']}>
      <DoctorHome />
    </PrivateRoute>
  }
/>
<Route
  path="/doctor/queue"
  element={
    <PrivateRoute roles={['doctor']}>
      <DoctorQueue />
    </PrivateRoute>
  }
/>

<Route path="/ai/skin" element={<PrivateRoute role="nurse"><SkinCareAI /></PrivateRoute>} />
<Route path="/ai/wound" element={<PrivateRoute role="nurse"><WoundCareAI /></PrivateRoute>} />
<Route
  path="/ai/rural"
  element={
    <PrivateRoute role="nurse">
      <RuralCareAI />
    </PrivateRoute>
  }
/>

<Route path="/nurse/patient/ai-summary" element={<AISummary />} />
<Route
  path="/nurse/patient/ai-summary-sw"
  element={
    <PrivateRoute roles={['nurse']}>
      <AISummaryForSW />
    </PrivateRoute>
  }
/>




<Route
  path="/doctor/in-progress"
  element={
    <PrivateRoute roles={['doctor']}>
      <InProgress />
    </PrivateRoute>
  }
/>
  <Route
  path="/doctor/prescription"
  element={
    <PrivateRoute roles={['doctor']}>
      <PrescriptionEditor />
    </PrivateRoute>
  }
/>
    <Route
  path="/doctor/consultations/:id"
  element={
    <PrivateRoute roles={['doctor']}>
      <ConsultationDetails />
    </PrivateRoute>
  }
/>
<Route
  path="/nurse/prescription"
  element={
    <PrivateRoute roles={['nurse']}>
      <PrescriptionView />
    </PrivateRoute>
  }
/>
<Route
  path="/nurse/patient/edit"
  element={
    <PrivateRoute roles={['nurse']}>
      <EditPatient />
    </PrivateRoute>
  }
/>
<Route
  path="/video"
  element={
    <PrivateRoute roles={['nurse','doctor']}>
      <VideoCall />
    </PrivateRoute>
  }
/>

<Route path="/owner/medicines" element={<PrivateRoute role="hospital_owner"><OwnerMedicines /></PrivateRoute>} />
<Route path="/owner/inventory" element={<PrivateRoute role="hospital_owner"><OwnerInventory /></PrivateRoute>} />


    </Routes>
  );
}

