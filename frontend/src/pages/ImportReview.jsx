import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle2, ChevronRight, XCircle, FileType, Check } from 'lucide-react';
import { useGroupContext } from '../context/GroupContext';
import axios from 'axios';

const ImportReview = () => {
  const { groupId } = useParams();
  const { group } = useGroupContext();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // If we have a job ID in URL, load it
  const urlParams = new URLSearchParams(window.location.search);
  const initialJobId = urlParams.get('jobId');

  useEffect(() => {
    if (initialJobId) {
      loadJob(initialJobId);
    }
  }, [initialJobId]);

  const loadJob = async (id) => {
    setLoadingJob(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/import/${id}`, { withCredentials: true });
      setJob(res.data);
    } catch (error) {
      console.error(error);
      alert('Failed to load import job');
    } finally {
      setLoadingJob(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/import`, formData, { withCredentials: true });
      loadJob(res.data.jobId);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resolveIssue = async (issueId, action) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/import/${job.id}/issues/${issueId}/resolve`, {
        action
      }, { withCredentials: true });
      // Reload job
      loadJob(job.id);
    } catch (error) {
      console.error(error);
      alert('Failed to resolve issue');
    }
  };

  const finalizeImport = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/import/${job.id}/finalize`, {}, { withCredentials: true });
      
      // Download Import Report
      if (res.data.reportText) {
        const element = document.createElement("a");
        const fileData = new Blob([res.data.reportText], {type: 'text/plain'});
        element.href = URL.createObjectURL(fileData);
        element.download = `import_report_${job.id}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
      }

      alert('Import completed successfully! Report downloaded.');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.message);
    }
  };

  if (loadingJob) return <div className="p-8 text-center text-white">Loading review center...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-white pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Import Center</h1>
          <p className="text-zinc-400">Upload your expenses CSV and resolve anomalies</p>
        </div>
      </div>

      {!job ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <FileType className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload expenses_export.csv</h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Our system will automatically detect duplicates, missing users, negative amounts, and other anomalies. You will review them before finalizing.
          </p>
          <div className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept=".csv"
              onChange={e => setFile(e.target.files[0])}
              className="text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700"
            />
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : 'Start Import'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Import Job: {job.filename}</h2>
              <p className="text-sm text-zinc-400">{job.issues.filter(i => i.userAction === 'PENDING').length} issues remaining to resolve</p>
            </div>
            <button 
              onClick={finalizeImport}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Finalize Import
            </button>
          </div>

          <div className="space-y-4">
            {job.issues.map(issue => {
              const rowData = issue.rawData;
              const isResolved = issue.userAction !== 'PENDING';
              
              return (
                <div key={issue.id} className={`p-5 rounded-xl border ${isResolved ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-red-950/20 border-red-900/50'} `}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {isResolved ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                      <div>
                        <h3 className="font-semibold text-zinc-100">Row {issue.rowNumber}: {issue.issueType}</h3>
                        <p className="text-sm text-zinc-400">{issue.message}</p>
                      </div>
                    </div>
                    {isResolved && (
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300 border border-zinc-700">
                        {issue.userAction}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-zinc-950 p-3 rounded-lg text-sm font-mono text-zinc-300 mb-4 overflow-x-auto whitespace-nowrap">
                    {rowData.date} | {rowData.description} | {rowData.paid_by} | {rowData.amount} {rowData.currency} | {rowData.split_with}
                  </div>

                  {!isResolved && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => resolveIssue(issue.id, 'ACCEPTED_SUGGESTION')}
                        className="px-4 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm font-medium"
                      >
                        Accept Suggestion ({issue.suggestedAction})
                      </button>
                      <button 
                        onClick={() => resolveIssue(issue.id, 'REJECTED_ROW')}
                        className="px-4 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm font-medium"
                      >
                        Reject Row
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportReview;
