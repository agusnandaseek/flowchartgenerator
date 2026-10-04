import type { StructureTemplateItem } from '../types/structureChart';

export const STRUCTURE_TEMPLATES: StructureTemplateItem[] = [
  {
    id: 'logistics-shipment-tracking',
    title: '1. Sistem Manajemen Logistik & Pengiriman (Logistics)',
    description: 'Bagan struktur dekomposisi modul penanganan paket ekspedisi, verifikasi gudang, alokasi kurir, dan pencetakan resi',
    code: `Manage Package Shipment [LOOP]
  Accept Shipment Order
    (DATA OUT: order_details)
    (FLAG OUT: more_orders)
  Verify Warehouse Inventory
    (DATA IN: order_details)
    (FLAG OUT: stock_ready)
    || Check Shelf Location ||
      (DATA IN: order_details)
      (DATA OUT: shelf_id)
  Dispatch Courier Delivery [COND]
    (DATA IN: order_details)
    (DATA IN: shelf_id)
    (FLAG OUT: dispatch_success)
    Assign Nearest Driver
      (DATA IN: shelf_id)
      (DATA OUT: courier_id)
    Generate Tracking Number
      (DATA IN: order_details)
      (DATA IN: courier_id)
      (DATA OUT: tracking_no)
  Print Shipping Barcode [COND]
    (DATA IN: tracking_no)
    (DATA IN: order_details)
    (DATA OUT: label_document)`,
  },
  {
    id: 'restaurant-pos-system',
    title: '2. Sistem Kasir & Pesanan Restoran (Restaurant POS)',
    description: 'Dekomposisi hierarki modul pemesanan meja, verifikasi bahan dapur, diskon jam sibuk, dan pelunasan tagihan',
    code: `Process Restaurant Order [LOOP]
  Record Table Order
    (DATA OUT: table_orders)
    (FLAG OUT: has_next_item)
  Validate Kitchen Availability
    (DATA IN: table_orders)
    (FLAG OUT: ingredients_ready)
  Apply Happy Hour Promotion [COND]
    (DATA IN: table_orders)
    (DATA OUT: discounted_subtotal)
  Send Order To Kitchen Display
    (DATA IN: table_orders)
    (FLAG OUT: kitchen_ack)
  Process Bill Settlement
    (DATA IN: discounted_subtotal)
    (DATA OUT: payment_receipt)`,
  },
  {
    id: 'cloud-media-streaming',
    title: '3. Platform Streaming Media & Transcoding (Cloud Media)',
    description: 'Arsitektur modul otentikasi pelanggan, konversi resolusi video adaptif (HLS), dan pengiriman data buffer',
    code: `Stream Media Content
  Authenticate Subscriber
    (DATA IN: user_token)
    (FLAG OUT: is_active_member)
  Resolve Video Asset [COND START]
    (DATA IN: video_id)
    (DATA OUT: raw_stream)
    Transcode Adaptive Bitrate
      (DATA IN: raw_stream)
      (DATA OUT: hls_manifest)
  Deliver Media Buffer [COND END]
    (DATA IN: hls_manifest)
    (DATA OUT: media_chunks)
  Record Playback Telemetry
    (DATA IN: user_token)
    (DATA IN: media_chunks)
    (FLAG OUT: log_success)`,
  },
  {
    id: 'banking-atm-machine',
    title: '4. Sistem Penarikan Tunai ATM Bank (Banking ATM)',
    description: 'Struktur dekomposisi modul validasi kartu debit, verifikasi PIN, pengecekan limit saldo, dan pengeluaran lembaran uang',
    code: `Process ATM Transaction [LOOP]
  Read Debit Card & PIN
    (DATA OUT: card_data, pin_hash)
    (FLAG OUT: card_inserted)
  Authorize Bank Account
    (DATA IN: card_data, pin_hash)
    (FLAG OUT: pin_valid)
  Validate Account Balance [COND]
    (DATA IN: card_data)
    (DATA OUT: current_balance)
    (FLAG OUT: balance_sufficient)
  Dispense Cash Notes [COND]
    (DATA IN: withdrawal_amount)
    (FLAG OUT: cash_dispensed)
  Print Transaction Receipt [COND]
    (DATA IN: current_balance)
    (DATA OUT: print_slip)`,
  },
];
