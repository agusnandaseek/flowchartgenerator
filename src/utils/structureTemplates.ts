import type { StructureTemplateItem } from '../types/structureChart';

export const STRUCTURE_TEMPLATES: StructureTemplateItem[] = [
  {
    id: 'email-messaging-system',
    title: '★ Email Messaging System (Grouped Conditions)',
    description: 'Contoh bagan sesuai slide referensi: 1 diamond bersama untuk View & Compose Message, serta Reply & Delete Message',
    code: `Email System
  Verify Login Details
  View Message [COND START]
    (DATA OUT: Open Message)
    (DATA OUT: Message)
    Reply [COND START]
      (DATA OUT: Message)
    Delete Message [COND END]
      (FLAG OUT: Delete OK)
  Compose New Message [COND END]
    (DATA OUT: Create Message)
    Send Message
      (DATA OUT: Message, Recipient Address)
      (FLAG OUT: Sent OK)`,
  },
  {
    id: 'exercise-procedural-enrollment',
    title: '★ Exercise: Student Enrollment (Procedural Design)',
    description: 'Sistem pendaftaran mahasiswa dengan validasi kuota kursi, registrasi bersyarat, dan cetak kuitansi',
    code: `Manage Student Enrollment [LOOP]
  Accept Student Details
    (DATA OUT: student_details)
    (FLAG OUT: more_students)
  Validate Course Seats
    (DATA IN: course_id)
    (FLAG OUT: seat_available)
    || Check Course Quota ||
      (DATA IN: course_id)
      (DATA OUT: remaining_seats)
  Register Student [COND]
    (DATA IN: student_details)
    (DATA IN: course_id)
    (FLAG OUT: is_registered)
    Update Enrollment Record
      (DATA IN: student_details)
      (DATA OUT: enrollment_id)
    Decrement Seat Count
      (DATA IN: course_id)
      (FLAG OUT: update_success)
  Print Confirmation Receipt [COND]
    (DATA IN: student_details)
    (DATA IN: enrollment_id)
    (DATA OUT: receipt_doc)
    Format Receipt Data
      (DATA IN: student_details)
      (DATA OUT: formatted_receipt)
    || Print Document ||
      (DATA IN: formatted_receipt)
      (FLAG OUT: print_status)`,
  },
  {
    id: 'exercise-functional-order',
    title: '★ Exercise: Online Order Processing (Functional Design)',
    description: 'Sistem proses pesanan: kalkulasi item total, loyalty discount (>5 order), ongkir tetap, pajak, dan invoice',
    code: `Process Online Order [LOOP]
  Calculate Item Total
    (DATA IN: item_qty)
    (DATA IN: unit_price)
    (DATA OUT: item_total)
  Apply Loyalty Discount [COND]
    (DATA IN: purchase_count)
    (DATA IN: item_total)
    (DATA OUT: discount_amt)
    (FLAG OUT: is_loyal)
  Add Shipping Fee
    (DATA IN: order_subtotal)
    (DATA OUT: shipping_fee)
  || Calculate Tax ||
    (DATA IN: taxable_amount)
    (DATA OUT: tax_amt)
  Generate Final Invoice
    (DATA IN: item_total)
    (DATA IN: discount_amt)
    (DATA IN: shipping_fee)
    (DATA IN: tax_amt)
    (DATA OUT: final_invoice)`,
  },
  {
    id: 'binus-order-full',
    title: '1. Order Processing (Slide BINUS Asli)',
    description: 'Bagan Structure Chart persis seperti pada slide materi perkuliahan BINUS',
    code: `Record order
  Get order information
    (DATA OUT: Order Info.)
  Process order item [LOOP]
    (DATA IN: Order ID)
    Get requested item
      (DATA IN: Item ID, Qty)
    Get product items
      (DATA OUT: Price, QOH)
    Create order line item [COND]
      (DATA IN: Item Info.)`,
  },
  {
    id: 'binus-order-basic',
    title: '2. Record Order (Hierarki Dasar Slide BINUS)',
    description: 'Bagan dekomposisi hierarki modul dasar persis seperti pada slide materi',
    code: `Record order
  Get order information
  Process order item
    Get requested item
    Get product items
    Create order line item`,
  },
  {
    id: 'grading-system',
    title: '3. Sistem Penilaian Akademik Mahasiswa',
    description: 'Struktur modul pengolahan nilai dengan data nilai & flag status kelulusan',
    code: `Manage Student Grades [LOOP]
  Input Student Data
    (DATA OUT: student_records)
    (FLAG OUT: EOF)
  Calculate Final Grade [COND]
    (DATA IN: student_records)
    (DATA OUT: report_card)
    || Compute Average Score ||
      (DATA IN: raw_scores)
      (DATA OUT: avg_score)
    Determine Letter Grade
      (DATA IN: avg_score)
      (DATA OUT: letter_grade)
      (FLAG OUT: honor_status)
  Generate Grade Report
    (DATA IN: report_card)`,
  },
  {
    id: 'payroll-system',
    title: '4. Sistem Penggajian Karyawan (Payroll)',
    description: 'Kalkulasi gaji dengan modul library pajak dan pengecekan lembur',
    code: `Process Employee Payroll [LOOP]
  Read Time Card
    (DATA OUT: hours_worked)
    (FLAG OUT: more_records)
  Calculate Gross Pay
    (DATA IN: hours_worked)
    (DATA OUT: gross_pay)
    || Standard Hourly Rate ||
      (DATA IN: hours_worked)
      (DATA OUT: base_pay)
    Calculate Overtime Pay [COND]
      (DATA IN: hours_worked)
      (DATA OUT: overtime_pay)
  || Calculate Taxes & Deductions ||
    (DATA IN: gross_pay)
    (DATA OUT: deductions)
  Generate Paycheck
    (DATA IN: gross_pay)
    (DATA IN: deductions)
    (DATA OUT: paycheck_slip)`,
  },
];
