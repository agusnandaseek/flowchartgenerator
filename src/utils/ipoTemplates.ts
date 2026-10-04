import type { IpoProjectData } from '../types/ipoChart';

export interface IpoTemplate {
  id: string;
  title: string;
  description: string;
  data: IpoProjectData;
}

export const IPO_TEMPLATES: IpoTemplate[] = [
  {
    id: 'blank',
    title: '1. Proyek Baru (Blank)',
    description: 'Kanvas kosong untuk merancang fungsi dari awal secara mandiri.',
    data: {
      projectName: 'Functional Design Baru',
      functions: [
        {
          id: 'fn_1',
          name: 'calculateItemTotal',
          inputs: [
            { id: 'in_1_1', name: 'quantity' },
            { id: 'in_1_2', name: 'price' },
          ],
          processes: [
            { id: 'pr_1_1', description: 'Multiply quantity by price' },
          ],
          outputs: [
            { id: 'out_1_1', name: 'itemTotal' },
          ],
        },
      ],
      connections: [],
    },
  },
  {
    id: 'online-store-orders',
    title: '2. Online Store Order Processing (Exercise 2)',
    description: 'Sistem pemrosesan pesanan toko online lengkap dengan 6 fungsi dan ketergantungan antar-fungsi.',
    data: {
      projectName: 'Online Store Order Processing System',
      functions: [
        {
          id: 'fn_calc_item_total',
          name: 'calculateItemTotal',
          inputs: [
            { id: 'in_cit_qty', name: 'quantity' },
            { id: 'in_cit_price', name: 'unitPrice' },
          ],
          processes: [
            { id: 'pr_cit_1', description: 'Multiply quantity by unitPrice to get gross total' },
          ],
          outputs: [
            { id: 'out_cit_item_total', name: 'itemTotal' },
          ],
        },
        {
          id: 'fn_apply_loyalty',
          name: 'applyLoyaltyDiscount',
          inputs: [
            { id: 'in_ald_count', name: 'purchaseCount' },
            { id: 'in_ald_total', name: 'itemTotal' },
          ],
          processes: [
            { id: 'pr_ald_1', description: 'Check if purchaseCount > 5' },
            { id: 'pr_ald_2', description: 'If eligible, apply 10% loyalty discount; otherwise discount is 0' },
          ],
          outputs: [
            { id: 'out_ald_discount', name: 'discountAmount' },
            { id: 'out_ald_discounted_total', name: 'discountedTotal' },
          ],
        },
        {
          id: 'fn_add_shipping',
          name: 'addShippingFee',
          inputs: [
            { id: 'in_asf_method', name: 'deliveryMethod' },
          ],
          processes: [
            { id: 'pr_asf_1', description: 'Assign fixed shipping fee of Rp 25.000 ($10.00)' },
          ],
          outputs: [
            { id: 'out_asf_fee', name: 'shippingFee' },
          ],
        },
        {
          id: 'fn_calc_tax',
          name: 'calculateTax',
          inputs: [
            { id: 'in_ctx_taxable', name: 'taxableAmount' },
          ],
          processes: [
            { id: 'pr_ctx_1', description: 'Calculate tax = taxableAmount * 0.11 (11% VAT)' },
          ],
          outputs: [
            { id: 'out_ctx_tax', name: 'taxAmount' },
          ],
        },
        {
          id: 'fn_calc_grand_total',
          name: 'calculateGrandTotal',
          inputs: [
            { id: 'in_cgt_disc_total', name: 'discountedTotal' },
            { id: 'in_cgt_ship_fee', name: 'shippingFee' },
            { id: 'in_cgt_tax', name: 'taxAmount' },
          ],
          processes: [
            { id: 'pr_cgt_1', description: 'grandTotal = discountedTotal + shippingFee + taxAmount' },
          ],
          outputs: [
            { id: 'out_cgt_grand_total', name: 'grandTotal' },
          ],
        },
        {
          id: 'fn_gen_invoice',
          name: 'generateFinalInvoice',
          inputs: [
            { id: 'in_gfi_cust', name: 'customerDetails' },
            { id: 'in_gfi_grand_total', name: 'grandTotal' },
          ],
          processes: [
            { id: 'pr_gfi_1', description: 'Compile itemized order summary, discounts, shipping, tax, and grand total' },
            { id: 'pr_gfi_2', description: 'Generate formatted customer invoice document' },
          ],
          outputs: [
            { id: 'out_gfi_invoice', name: 'finalInvoice' },
          ],
        },
      ],
      connections: [
        {
          id: 'conn_1',
          sourceFunctionId: 'fn_calc_item_total',
          sourceOutputId: 'out_cit_item_total',
          targetFunctionId: 'fn_apply_loyalty',
          targetInputId: 'in_ald_total',
          label: 'itemTotal',
        },
        {
          id: 'conn_2',
          sourceFunctionId: 'fn_apply_loyalty',
          sourceOutputId: 'out_ald_discounted_total',
          targetFunctionId: 'fn_calc_tax',
          targetInputId: 'in_ctx_taxable',
          label: 'discountedTotal (taxable)',
        },
        {
          id: 'conn_3',
          sourceFunctionId: 'fn_apply_loyalty',
          sourceOutputId: 'out_ald_discounted_total',
          targetFunctionId: 'fn_calc_grand_total',
          targetInputId: 'in_cgt_disc_total',
          label: 'discountedTotal',
        },
        {
          id: 'conn_4',
          sourceFunctionId: 'fn_add_shipping',
          sourceOutputId: 'out_asf_fee',
          targetFunctionId: 'fn_calc_grand_total',
          targetInputId: 'in_cgt_ship_fee',
          label: 'shippingFee',
        },
        {
          id: 'conn_5',
          sourceFunctionId: 'fn_calc_tax',
          sourceOutputId: 'out_ctx_tax',
          targetFunctionId: 'fn_calc_grand_total',
          targetInputId: 'in_cgt_tax',
          label: 'taxAmount',
        },
        {
          id: 'conn_6',
          sourceFunctionId: 'fn_calc_grand_total',
          sourceOutputId: 'out_cgt_grand_total',
          targetFunctionId: 'fn_gen_invoice',
          targetInputId: 'in_gfi_grand_total',
          label: 'grandTotal',
        },
      ],
    },
  },
  {
    id: 'student-enrollment',
    title: '3. Student Enrollment System (Exercise 1)',
    description: 'Sistem pendaftaran mahasiswa universitas dengan 4 fungsi.',
    data: {
      projectName: 'Student Enrollment System',
      functions: [
        {
          id: 'fn_se_accept',
          name: 'acceptStudentDetails',
          inputs: [
            { id: 'in_se_sid', name: 'studentId' },
            { id: 'in_se_cid', name: 'courseId' },
          ],
          processes: [
            { id: 'pr_se_1', description: 'Read student credentials and target course selection' },
            { id: 'pr_se_2', description: 'Validate required fields format' },
          ],
          outputs: [
            { id: 'out_se_sdetails', name: 'studentDetails' },
            { id: 'out_se_cid', name: 'courseId' },
          ],
        },
        {
          id: 'fn_se_validate',
          name: 'validateCourseSeats',
          inputs: [
            { id: 'in_se_vcid', name: 'courseId' },
          ],
          processes: [
            { id: 'pr_se_v1', description: 'Query remaining class quota from database' },
            { id: 'pr_se_v2', description: 'If remainingSeats > 0 set isAvailable = true else false' },
          ],
          outputs: [
            { id: 'out_se_avail', name: 'isAvailable' },
          ],
        },
        {
          id: 'fn_se_register',
          name: 'registerStudent',
          inputs: [
            { id: 'in_se_rsdetails', name: 'studentDetails' },
            { id: 'in_se_rcid', name: 'courseId' },
            { id: 'in_se_ravail', name: 'isAvailable' },
          ],
          processes: [
            { id: 'pr_se_r1', description: 'If isAvailable == true, save enrollment record to database' },
            { id: 'pr_se_r2', description: 'Decrement course remaining capacity by 1' },
          ],
          outputs: [
            { id: 'out_se_eid', name: 'enrollmentId' },
            { id: 'out_se_status', name: 'isSuccess' },
          ],
        },
        {
          id: 'fn_se_print',
          name: 'printConfirmationReceipt',
          inputs: [
            { id: 'in_se_psdetails', name: 'studentDetails' },
            { id: 'in_se_peid', name: 'enrollmentId' },
          ],
          processes: [
            { id: 'pr_se_p1', description: 'Format receipt document with student details and enrollment timestamp' },
            { id: 'pr_se_p2', description: 'Output document to printer/PDF' },
          ],
          outputs: [
            { id: 'out_se_receipt', name: 'receiptDocument' },
          ],
        },
      ],
      connections: [
        {
          id: 'conn_se_1',
          sourceFunctionId: 'fn_se_accept',
          sourceOutputId: 'out_se_cid',
          targetFunctionId: 'fn_se_validate',
          targetInputId: 'in_se_vcid',
          label: 'courseId',
        },
        {
          id: 'conn_se_2',
          sourceFunctionId: 'fn_se_accept',
          sourceOutputId: 'out_se_sdetails',
          targetFunctionId: 'fn_se_register',
          targetInputId: 'in_se_rsdetails',
          label: 'studentDetails',
        },
        {
          id: 'conn_se_3',
          sourceFunctionId: 'fn_se_validate',
          sourceOutputId: 'out_se_avail',
          targetFunctionId: 'fn_se_register',
          targetInputId: 'in_se_ravail',
          label: 'isAvailable',
        },
        {
          id: 'conn_se_4',
          sourceFunctionId: 'fn_se_register',
          sourceOutputId: 'out_se_eid',
          targetFunctionId: 'fn_se_print',
          targetInputId: 'in_se_peid',
          label: 'enrollmentId',
        },
      ],
    },
  },
];
