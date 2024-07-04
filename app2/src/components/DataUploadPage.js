import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DataUploadPage = ({ setDataLoaded }) => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleLoadData = async () => {
    if (file) {
    // we use a formData to upload files, and with this we dont need include headers, it handles automatically
    const formData = new FormData();
    formData.append('file', file);
    try{
      // Make a fetch request to the backend
      const response  = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();   //we await the data to arrive again
      setDataLoaded(true);
      navigate('/analytics', { state: { input_filename: data.filename, dataLoaded: true } });
    } 
    catch(error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    };
      
    }
  };

  return (
    <div className="upload-page">
      <h2>Load Data</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleLoadData}>Load data</button>
    </div>
  );
};

export default DataUploadPage;
