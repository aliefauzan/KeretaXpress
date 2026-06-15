import { FiCreditCard, FiShield, FiCheckCircle } from 'react-icons/fi';

interface PaymentInstructionsProps {
  transactionId: string;
  totalAmount: string;
}

export default function PaymentInstructions({ transactionId, totalAmount }: PaymentInstructionsProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-card mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-center">
        <FiCreditCard className="w-5 h-5 mr-2 text-primary" />
        Petunjuk Pembayaran
      </h2>
      
      <div className="mb-6">
        {/* Payment Amount */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 rounded-lg mb-5 text-center">
          <p className="text-sm opacity-90 mb-1">Total Pembayaran</p>
          <p className="text-3xl font-bold">{totalAmount}</p>
          <p className="text-xs opacity-80 mt-2">ID Transaksi: {transactionId}</p>
        </div>

        {/* Payment Method Info */}
        <div className="bg-blue-50 p-5 rounded-lg mb-5 border border-blue-100">
          <h3 className="font-bold text-lg mb-3 text-primary flex items-center">
            <FiCheckCircle className="mr-2" />
            Cara Pembayaran
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Klik tombol <strong>&quot;Konfirmasi Pembayaran&quot;</strong> di bawah</li>
            <li>Pilih metode pembayaran yang Anda inginkan</li>
            <li>Ikuti instruksi pembayaran sesuai metode yang dipilih</li>
            <li>Selesaikan pembayaran sebelum waktu expired</li>
          </ol>
        </div>

        {/* Available Payment Methods */}
        <div className="bg-green-50 p-5 rounded-lg mb-5 border border-green-100">
          <h3 className="font-bold text-lg mb-3 text-green-700 flex items-center">
            <FiCreditCard className="mr-2" />
            Metode Pembayaran Tersedia
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>BCA Virtual Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Mandiri Virtual Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>BNI Virtual Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>BRI Virtual Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Permata Virtual Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>GoPay</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>ShopeePay</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Indomaret</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Alfamart</span>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <FiShield className="text-yellow-600 mt-1 mr-3 flex-shrink-0" size={20} />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-yellow-800 mb-1">Pembayaran Aman dengan Midtrans</p>
              <p className="text-xs">
                Transaksi Anda dilindungi oleh Midtrans Payment Gateway. 
                Status pembayaran akan diperbarui secara otomatis setelah pembayaran berhasil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
