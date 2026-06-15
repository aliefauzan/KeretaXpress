import Button from '@/components/Button';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';

interface PaymentActionButtonsProps {
  isProcessing: boolean;
  onConfirmPayment: () => void;
  onOrderOtherTicket: () => void;
  onDownloadTicket: () => void;
}

export default function PaymentActionButtons({ 
  isProcessing, 
  onConfirmPayment, 
  onOrderOtherTicket, 
  onDownloadTicket 
}: PaymentActionButtonsProps) {
  return (
    <div className="space-y-4">
      <Button
        onClick={onConfirmPayment}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-bold text-lg py-5 shadow-lg border-0 transition-all duration-300"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Memproses Pembayaran...
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center">
              <FiCheckCircle className="w-6 h-6 mr-2" />
              <span>LANJUT KE PEMBAYARAN</span>
            </div>
            <span className="text-xs mt-1 opacity-90">Pilih metode pembayaran Anda</span>
          </div>
        )}
      </Button>

      <Button
        onClick={onOrderOtherTicket}
        variant="outline"
        className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-4 bg-white shadow-lg"
      >
        PESAN TIKET LAIN
      </Button>

      <Button
        onClick={onDownloadTicket}
        variant="outline"
        className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-4 bg-white shadow-lg"
      >
        <FiDownload className="w-5 h-5 mr-2" />
        DOWNLOAD TIKET
      </Button>
    </div>
  );
}
