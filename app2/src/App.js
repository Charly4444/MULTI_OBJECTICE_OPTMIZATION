import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import DataUploadPage from './components/DataUploadPage';
import AnalyticsPage from './components/AnalyticsPage';
import ViewsPage from './components/ViewsPage';
import ParametersPage from './components/ParametersPage';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [dataLoaded, setDataLoaded] = useState(false);

  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" exact element={<HomePage />} />
          <Route path="/upload" exact element={<DataUploadPage setDataLoaded={setDataLoaded}/>} />
          <Route path="/analytics" exact element={<AnalyticsPage dataLoaded={dataLoaded}/>} />
          <Route path="/views" exact element={<ViewsPage />} />
          <Route path="/parameters" element={<ParametersPage />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
