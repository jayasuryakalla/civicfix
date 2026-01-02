import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Was "Routes" import missing? No, included.
import Layout from './components/Layout';
// Import pages lazily or directly
import ReportIssue from './pages/ReportIssue';
import Home from './pages/Home';
import SmartReportIssue from './pages/SmartReportIssue';

import AdminDashboard from './pages/AdminDashboard';
import AdminReportDetails from './pages/AdminReportDetails';
import CitizenReportDetails from './pages/CitizenReportDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="report" element={<ReportIssue />} />


          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/reports/:id" element={<AdminReportDetails />} />
          <Route path="reports/:id" element={<CitizenReportDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
