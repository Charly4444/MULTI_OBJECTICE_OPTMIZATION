import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AnalyticsPage = () => {
  const [missingDataOption, setMissingDataOption] = useState('drop');
  const [replaceDataOption, setReplaceDataOption] = useState('0');
  const [objectives, setObjectives] = useState('');
  const columns = ['Objective 1', 'Objective 2', 'Objective 3'];  //objectives ava
  const navigate = useNavigate();

  const location = useLocation();
  const { input_filename, dataLoaded } = location.state || {}

  const handleStart = async () => {
    // Construct the request body
    const requestBody = {
      input_filename: input_filename,
      choice_manipulate: missingDataOption,
      sub_choice: replaceDataOption,
      objectives_chc: objectives.split(',').map(obj => obj.trim()),
    };

    // Make a fetch request to the backend
    await fetch('http://localhost:5000/load_and_processdata', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        navigate('/views');
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle errors
      alert('An error occurred. Please try again.');
    });

  };
  if (!dataLoaded) {
    return <p>No data found.</p>;
  }
  
  return (
    <div>
      <h2>Data Loaded</h2>
      <div>
        <label htmlFor="missing-data">What to do with missing data:</label>
        <select id="missing-data" value={missingDataOption} onChange={(e) => setMissingDataOption(e.target.value)}>
          <option value="drop">Drop columns with missing values</option>
          <option value="replace">Replace missing values</option>
        </select>
      </div>
      {/* if we need to replace */}
      {missingDataOption==='replace' && <div>
        <label htmlFor="if-missing-data-replace">Replace with: </label>
        <select id="if-missing-data-replace" value={replaceDataOption} onChange={(e) => setReplaceDataOption(e.target.value)}>
          <option value="1">Mean</option>
          <option value="2">Median</option>
        </select>
      </div>}

      {/* <button onClick={handleAnalyze}>Analyze</button> */}
      <div>
        <h3>Objective Functions</h3>
        <input
          type="text"
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          placeholder="Enter objectives separated by commas"
        />
      </div>
      <div>
        <h3>Objective to work on</h3>
        <ul>
          {columns.map((col, index) => (
            <li key={index}>{col}</li>
          ))}
        </ul>
      </div>
      {missingDataOption && objectives &&
        <button className='other-btn' style={{backgroundColor: '#257AC9'}} onClick={handleStart}>Start</button>
      }
    </div>
  );
};

export default AnalyticsPage;
