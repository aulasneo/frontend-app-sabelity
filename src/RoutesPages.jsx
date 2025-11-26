import { Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';
import Profile from './components/Profile/Profile';
import Sidebar from './components/sidebar/Sidebar';

const RoutesPages = () => (
  <main>
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  </main>
);

export default RoutesPages;
