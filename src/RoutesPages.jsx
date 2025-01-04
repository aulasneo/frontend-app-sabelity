import { Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';

const RoutesPages = () => (
  <main>
    <div className="content-home">
     
        <Routes>
          <Route path="/" element={<Home />}/>
          {/* <Route path="/panels" element={<Panels />} /> */}
        </Routes>

    </div>
  </main>
);

export default RoutesPages;