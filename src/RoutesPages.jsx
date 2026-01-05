import { Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';
import Profile from './components/profile/Profile';
import Billing from './components/billing/Billing';
import BillingHistoryPage from './components/billing/BillingHistoryPage';
import Sidebar from './components/sidebar/Sidebar';

const RoutesPages = () => (
  <main>
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/history" element={<BillingHistoryPage />} />
        </Routes>
      </div>
    </div>
  </main>
);

export default RoutesPages;
