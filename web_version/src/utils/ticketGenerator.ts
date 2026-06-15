// E-Ticket Generator - Simple and Elegant
interface TicketData {
  booking: any;
  train: any;
  passenger: {
    name: string;
    idNumber: string;
    seatNumber: string;
  };
}

export const generateTicketHTML = (data: TicketData): string => {
  const { booking, train, passenger } = data;
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket - ${booking.transaction_id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #4338ca 100%);
      padding: 40px 20px;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 60px 60px;
      opacity: 0.15;
      pointer-events: none;
      z-index: 0;
    }
    
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), transparent, rgba(79, 70, 229, 0.3));
      pointer-events: none;
      z-index: 0;
    }
    
    .ticket-container {
      position: relative;
      z-index: 1;
    }
    
    .ticket-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 700px;
      margin: 0 auto;
      overflow: hidden;
    }
    
    .ticket-header {
      background: white;
      border-bottom: 2px solid #e5e7eb;
      padding: 30px;
      text-align: center;
    }
    
    .ticket-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .subtitle { font-size: 14px; color: #6b7280; }
    
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      margin-top: 15px;
    }
    
    .ticket-body { padding: 30px; }
    
    .route-container {
      background: #f9fafb;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border: 1px solid #e5e7eb;
    }
    
    .station { flex: 1; text-align: center; }
    
    .station-name {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .station-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    
    .arrow { font-size: 24px; color: #6b7280; }
    
    .details-section { margin-bottom: 25px; }
    
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .detail-label {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }
    
    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .barcode-container {
      text-align: center;
      padding: 25px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 25px;
      border: 1px solid #e5e7eb;
    }
    
    .barcode-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
      margin-bottom: 10px;
    }
    
    .barcode {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 3px;
      color: #1f2937;
    }
    
    .ticket-footer {
      text-align: center;
      padding: 25px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
    }
    
    .footer-title {
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 12px;
    }
    
    .ticket-footer p {
      margin-bottom: 8px;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .print-button {
      background: #1f2937;
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.2s;
    }
    
    .print-button:hover { background: #374151; }
    
    @media print {
      body { background: white; padding: 0; }
      .ticket-container { box-shadow: none; max-width: 100%; }
      .print-button { display: none; }
    }
    
    @media (max-width: 640px) {
      body { padding: 20px 10px; }
      .ticket-header h1 { font-size: 24px; }
      .ticket-body, .ticket-header { padding: 20px; }
      .route-container { flex-direction: column; gap: 15px; }
      .arrow { transform: rotate(90deg); }
      .details-grid { grid-template-columns: 1fr; gap: 15px; }
      .station-name { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="ticket-header">
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="#1f2937" stroke-width="2"/>
          <path d="M4 10h16M8 6v4M16 6v4" stroke="#1f2937" stroke-width="2"/>
          <circle cx="7" cy="18" r="1.5" fill="#1f2937"/>
          <circle cx="17" cy="18" r="1.5" fill="#1f2937"/>
          <path d="M9 14h6" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h1 style="margin: 0;">KeretaXpress</h1>
      </div>
      <p class="subtitle">E-Ticket Perjalanan Kereta Api</p>
      <span class="status-badge">✓ LUNAS</span>
    </div>
    
    <div class="ticket-body">
      <div class="route-container">
        <div class="station">
          <div class="station-label">Keberangkatan</div>
          <div class="station-name">${train.departure_station?.name || booking.departure_station?.name || 'N/A'}</div>
        </div>
        <div class="arrow">→</div>
        <div class="station">
          <div class="station-label">Tujuan</div>
          <div class="station-name">${train.arrival_station?.name || booking.arrival_station?.name || 'N/A'}</div>
        </div>
      </div>
      
      <div class="details-section">
        <div class="section-title">Detail Perjalanan</div>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Nama Kereta</div>
            <div class="detail-value">${train.name || booking.train_name || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Kelas</div>
            <div class="detail-value">${train.class_type || booking.class_type || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Tanggal Keberangkatan</div>
            <div class="detail-value">${booking.travel_date ? new Date(booking.travel_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Waktu Keberangkatan</div>
            <div class="detail-value">${train.departure_time || booking.departure_time || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div class="details-section">
        <div class="section-title">Informasi Penumpang</div>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Nama Penumpang</div>
            <div class="detail-value">${passenger.name}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">No. Identitas</div>
            <div class="detail-value">${passenger.idNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Nomor Kursi</div>
            <div class="detail-value">${passenger.seatNumber}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Total Pembayaran</div>
            <div class="detail-value">Rp ${booking.total_price?.toLocaleString('id-ID') || '0'}</div>
          </div>
        </div>
      </div>
      
      <div class="barcode-container">
        <div class="barcode-label">Kode Booking</div>
        <div class="barcode">${booking.transaction_id}</div>
      </div>
    </div>
    
    <div class="ticket-footer">
      <p class="footer-title">Syarat dan Ketentuan</p>
      <p>Harap tiba di stasiun 30 menit sebelum keberangkatan</p>
      <p>Tunjukkan e-ticket ini beserta identitas asli saat check-in</p>
      <p>E-ticket ini tidak dapat dipindahtangankan</p>
      <button class="print-button" onclick="window.print()">🖨️ Cetak Tiket</button>
    </div>
  </div>
</body>
</html>`;
};

export const downloadTicket = (data: TicketData) => {
  const html = generateTicketHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `e-ticket-${data.booking.transaction_id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openTicketInNewTab = (data: TicketData) => {
  const html = generateTicketHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');
  
  if (newWindow) {
    newWindow.onload = () => {
      URL.revokeObjectURL(url);
    };
  }
};
