import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Receipt, Banknote, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LedgerTrace = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/groups/${groupId}/balances/ledger`, {
          withCredentials: true,
          params: { userId: user.id }
        });
        setLedger(res.data.ledger);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [groupId, user.id]);

  if (loading) return <div className="text-zinc-400 p-4">Loading ledger...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-500" />
          Itemized Ledger Trace
        </h3>
        <p className="text-sm text-zinc-400 mt-1">Exactly why your balance is what it is</p>
      </div>
      
      <div className="divide-y divide-zinc-800">
        {ledger.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No activity found.</div>
        ) : (
          ledger.map((item, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className={`p-2 rounded-full ${item.type === 'SETTLEMENT' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {item.type === 'SETTLEMENT' ? <Banknote className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-500">{new Date(item.date).toLocaleDateString()}</p>
                  <p className="text-sm text-zinc-400">{item.details}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Impact</p>
                  <p className={`font-medium flex items-center justify-end gap-1 ${item.impact > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.impact > 0 ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                    ₹{Math.abs(item.impact).toFixed(2)}
                  </p>
                </div>
                <div className="w-px h-8 bg-zinc-800"></div>
                <div className="w-24">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Balance</p>
                  <p className={`font-bold ${item.runningBalance > 0 ? 'text-green-500' : item.runningBalance < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                    {item.runningBalance > 0 ? '+' : ''}₹{item.runningBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LedgerTrace;
