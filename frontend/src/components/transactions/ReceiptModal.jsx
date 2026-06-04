import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiShare2 } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import logoPlaceholder from '../../assets/image.png';

const ReceiptModal = ({ isOpen, onClose, transaction, type, user }) => {
  if (!isOpen || !transaction) return null;

  const handleDownloadPDF = async () => {
    const receiptElement = document.getElementById('receipt-print-area');
    try {
      const canvas = await html2canvas(receiptElement, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5'); // A5 size for receipts
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TrackOne_Receipt_${transaction._id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error("Failed to generate receipt PDF", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TrackOne Receipt - ${type === 'income' ? transaction.source : transaction.category}`,
          text: `Transaction Receipt: ₹${transaction.amount} on ${new Date(transaction.date).toLocaleDateString()}`,
          url: window.location.href, // Or a dedicated public link if backend supports it
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="w-full max-w-md">
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mb-4">
            <button onClick={handleShare} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"><FiShare2 className="w-5 h-5" /></button>
            <button onClick={handleDownloadPDF} className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition shadow-lg"><FiDownload className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition"><FiX className="w-5 h-5" /></button>
          </div>

          {/* Actual Receipt to be Printed/Exported */}
          <div id="receipt-print-area" className="bg-white rounded-lg shadow-2xl p-8 relative overflow-hidden text-gray-800">
            {/* Background watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <span className="text-8xl font-black rotate-[-45deg] block">PAID</span>
            </div>

            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
              <div className="flex items-center space-x-3">
                <img src={logoPlaceholder} alt="Logo" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">TrackOne Money</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Official Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Transaction ID</span>
                <span className="text-sm font-mono text-gray-900">{transaction._id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(transaction.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Issued To</span>
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm font-medium text-gray-900">{transaction.category}</span>
              </div>
              {type === 'income' ? (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Source</span>
                  <span className="text-sm font-medium text-gray-900">{transaction.source}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <span className="text-sm font-medium text-gray-900">{transaction.paymentMethod}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-700">Total Amount</span>
                <span className={`text-3xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {transaction.notes && (
              <div className="mb-6">
                <span className="block text-xs text-gray-500 mb-1">Notes/Description</span>
                <p className="text-sm text-gray-700 italic">"{transaction.notes}"</p>
              </div>
            )}

            <div className="text-center pt-6 border-t-2 border-gray-100 border-dashed">
              <p className="text-xs text-gray-400">Generated securely by TrackOne Fintech System</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiptModal;