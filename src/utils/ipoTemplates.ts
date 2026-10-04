import type { IpoProjectData } from '../types/ipoChart';

export interface IpoTemplate {
  id: string;
  title: string;
  description: string;
  data: IpoProjectData;
}

export const IPO_TEMPLATES: IpoTemplate[] = [
  {
    id: 'hotel-booking-billing',
    title: '1. Hotel Room Booking & Billing System',
    description: 'Sistem reservasi dan billing hotel: pengecekan ketersediaan kamar, kalkulasi lama menginap, diskon promo, pajak & service, serta slip konfirmasi.',
    data: {
      projectName: 'Hotel Room Booking & Billing System',
      functions: [
        {
          id: 'fn_check_avail',
          name: 'checkRoomAvailability',
          inputs: [
            { id: 'in_ca_type', name: 'roomType' },
            { id: 'in_ca_nights', name: 'stayNights' },
          ],
          processes: [
            { id: 'pr_ca_1', description: 'Query hotel database for available rooms matching roomType' },
            { id: 'pr_ca_2', description: 'Fetch standard nightly rate for the selected category' },
          ],
          outputs: [
            { id: 'out_ca_rate', name: 'dailyRate' },
            { id: 'out_ca_avail', name: 'isAvailable' },
          ],
        },
        {
          id: 'fn_calc_charges',
          name: 'calculateStayCharges',
          inputs: [
            { id: 'in_cc_rate', name: 'dailyRate' },
            { id: 'in_cc_nights', name: 'stayNights' },
          ],
          processes: [
            { id: 'pr_cc_1', description: 'stayCharges = dailyRate * stayNights' },
          ],
          outputs: [
            { id: 'out_cc_charges', name: 'stayCharges' },
          ],
        },
        {
          id: 'fn_apply_promo',
          name: 'applySeasonalPromo',
          inputs: [
            { id: 'in_ap_code', name: 'promoCode' },
            { id: 'in_ap_charges', name: 'stayCharges' },
          ],
          processes: [
            { id: 'pr_ap_1', description: 'Verify promoCode validity against active marketing campaigns' },
            { id: 'pr_ap_2', description: 'If valid, apply 15% seasonal discount; else discount is 0' },
            { id: 'pr_ap_3', description: 'netSubtotal = stayCharges - discountAmount' },
          ],
          outputs: [
            { id: 'out_ap_discount', name: 'discountAmount' },
            { id: 'out_ap_subtotal', name: 'netSubtotal' },
          ],
        },
        {
          id: 'fn_calc_tax',
          name: 'calculateServiceAndTax',
          inputs: [
            { id: 'in_ct_subtotal', name: 'netSubtotal' },
          ],
          processes: [
            { id: 'pr_ct_1', description: 'taxFee = netSubtotal * 0.10 (10% Government VAT)' },
            { id: 'pr_ct_2', description: 'serviceFee = netSubtotal * 0.05 (5% Hospitality Service)' },
            { id: 'pr_ct_3', description: 'taxAndService = taxFee + serviceFee' },
          ],
          outputs: [
            { id: 'out_ct_taxservice', name: 'taxAndService' },
          ],
        },
        {
          id: 'fn_finalize_booking',
          name: 'finalizeBookingSlip',
          inputs: [
            { id: 'in_fb_guest', name: 'guestName' },
            { id: 'in_fb_subtotal', name: 'netSubtotal' },
            { id: 'in_fb_taxservice', name: 'taxAndService' },
          ],
          processes: [
            { id: 'pr_fb_1', description: 'grandTotal = netSubtotal + taxAndService' },
            { id: 'pr_fb_2', description: 'Compile guest itinerary and generate official booking reservation voucher' },
          ],
          outputs: [
            { id: 'out_fb_slip', name: 'bookingSlip' },
            { id: 'out_fb_grandtotal', name: 'grandTotal' },
          ],
        },
      ],
      connections: [
        {
          id: 'conn_hb_1',
          sourceFunctionId: 'fn_check_avail',
          sourceOutputId: 'out_ca_rate',
          targetFunctionId: 'fn_calc_charges',
          targetInputId: 'in_cc_rate',
          label: 'dailyRate',
        },
        {
          id: 'conn_hb_2',
          sourceFunctionId: 'fn_calc_charges',
          sourceOutputId: 'out_cc_charges',
          targetFunctionId: 'fn_apply_promo',
          targetInputId: 'in_ap_charges',
          label: 'stayCharges',
        },
        {
          id: 'conn_hb_3',
          sourceFunctionId: 'fn_apply_promo',
          sourceOutputId: 'out_ap_subtotal',
          targetFunctionId: 'fn_calc_tax',
          targetInputId: 'in_ct_subtotal',
          label: 'netSubtotal',
        },
        {
          id: 'conn_hb_4',
          sourceFunctionId: 'fn_apply_promo',
          sourceOutputId: 'out_ap_subtotal',
          targetFunctionId: 'fn_finalize_booking',
          targetInputId: 'in_fb_subtotal',
          label: 'netSubtotal',
        },
        {
          id: 'conn_hb_5',
          sourceFunctionId: 'fn_calc_tax',
          sourceOutputId: 'out_ct_taxservice',
          targetFunctionId: 'fn_finalize_booking',
          targetInputId: 'in_fb_taxservice',
          label: 'taxAndService',
        },
      ],
    },
  },
  {
    id: 'enterprise-payroll',
    title: '2. Enterprise Payroll & Salary Calculation System',
    description: 'Sistem penggajian karyawan terintegrasi: kalkulasi gaji pokok, bonus lembur, potongan PPh21 & BPJS, serta penerbitan slip gaji.',
    data: {
      projectName: 'Enterprise Payroll & Salary Calculation System',
      functions: [
        {
          id: 'fn_pay_base',
          name: 'calculateBaseSalary',
          inputs: [
            { id: 'in_pb_emp', name: 'employeeId' },
            { id: 'in_pb_days', name: 'workingDays' },
          ],
          processes: [
            { id: 'pr_pb_1', description: 'Retrieve employee grade and standard daily salary tier' },
            { id: 'pr_pb_2', description: 'baseSalary = workingDays * dailyRate' },
          ],
          outputs: [
            { id: 'out_pb_basesal', name: 'baseSalary' },
          ],
        },
        {
          id: 'fn_pay_overtime',
          name: 'computeOvertimeBonus',
          inputs: [
            { id: 'in_po_hours', name: 'overtimeHours' },
            { id: 'in_po_base', name: 'baseSalary' },
          ],
          processes: [
            { id: 'pr_po_1', description: 'hourlyRate = baseSalary / 173 (standard work hours)' },
            { id: 'pr_po_2', description: 'overtimeBonus = overtimeHours * (1.5 * hourlyRate)' },
          ],
          outputs: [
            { id: 'out_po_bonus', name: 'overtimeBonus' },
          ],
        },
        {
          id: 'fn_pay_deductions',
          name: 'calculateTaxAndDeductions',
          inputs: [
            { id: 'in_pd_base', name: 'baseSalary' },
            { id: 'in_pd_bonus', name: 'overtimeBonus' },
          ],
          processes: [
            { id: 'pr_pd_1', description: 'grossSalary = baseSalary + overtimeBonus' },
            { id: 'pr_pd_2', description: 'incomeTax = grossSalary * 0.05 (PPh 21 tier)' },
            { id: 'pr_pd_3', description: 'insuranceDeduction = grossSalary * 0.03 (Health & Pension)' },
            { id: 'pr_pd_4', description: 'totalDeductions = incomeTax + insuranceDeduction' },
          ],
          outputs: [
            { id: 'out_pd_gross', name: 'grossSalary' },
            { id: 'out_pd_deductions', name: 'totalDeductions' },
          ],
        },
        {
          id: 'fn_pay_slip',
          name: 'generatePaySlip',
          inputs: [
            { id: 'in_ps_emp', name: 'employeeId' },
            { id: 'in_ps_gross', name: 'grossSalary' },
            { id: 'in_ps_deductions', name: 'totalDeductions' },
          ],
          processes: [
            { id: 'pr_ps_1', description: 'netSalary = grossSalary - totalDeductions' },
            { id: 'pr_ps_2', description: 'Generate formatted electronic PDF payslip document' },
          ],
          outputs: [
            { id: 'out_ps_slip', name: 'electronicPaySlip' },
            { id: 'out_ps_net', name: 'netSalary' },
          ],
        },
      ],
      connections: [
        {
          id: 'conn_pay_1',
          sourceFunctionId: 'fn_pay_base',
          sourceOutputId: 'out_pb_basesal',
          targetFunctionId: 'fn_pay_overtime',
          targetInputId: 'in_po_base',
          label: 'baseSalary',
        },
        {
          id: 'conn_pay_2',
          sourceFunctionId: 'fn_pay_base',
          sourceOutputId: 'out_pb_basesal',
          targetFunctionId: 'fn_pay_deductions',
          targetInputId: 'in_pd_base',
          label: 'baseSalary',
        },
        {
          id: 'conn_pay_3',
          sourceFunctionId: 'fn_pay_overtime',
          sourceOutputId: 'out_po_bonus',
          targetFunctionId: 'fn_pay_deductions',
          targetInputId: 'in_pd_bonus',
          label: 'overtimeBonus',
        },
        {
          id: 'conn_pay_4',
          sourceFunctionId: 'fn_pay_deductions',
          sourceOutputId: 'out_pd_gross',
          targetFunctionId: 'fn_pay_slip',
          targetInputId: 'in_ps_gross',
          label: 'grossSalary',
        },
        {
          id: 'conn_pay_5',
          sourceFunctionId: 'fn_pay_deductions',
          sourceOutputId: 'out_pd_deductions',
          targetFunctionId: 'fn_pay_slip',
          targetInputId: 'in_ps_deductions',
          label: 'totalDeductions',
        },
      ],
    },
  },
  {
    id: 'iot-sensor-telemetry',
    title: '3. Smart Environmental Sensor Telemetry System',
    description: 'Sistem pengolahan telemetri sensor lingkungan: pembacaan sensor IoT, kalibrasi suhu/kelembaban, evaluasi ambang batas bahaya, dan transmisi peringatan darurat.',
    data: {
      projectName: 'Smart Environmental Sensor Telemetry System',
      functions: [
        {
          id: 'fn_iot_read',
          name: 'readSensorTelemetry',
          inputs: [
            { id: 'in_ir_device', name: 'deviceId' },
          ],
          processes: [
            { id: 'pr_ir_1', description: 'Sample raw analog voltage signals from temperature & humidity pins' },
            { id: 'pr_ir_2', description: 'Package raw bits into telemetry packet stream' },
          ],
          outputs: [
            { id: 'out_ir_packet', name: 'rawTelemetryPacket' },
          ],
        },
        {
          id: 'fn_iot_calibrate',
          name: 'calibrateEnvironmentalData',
          inputs: [
            { id: 'in_ic_packet', name: 'rawTelemetryPacket' },
          ],
          processes: [
            { id: 'pr_ic_1', description: 'Apply sensor calibration curves for ambient temperature (Celsius)' },
            { id: 'pr_ic_2', description: 'Compute relative humidity percentage (RH%)' },
          ],
          outputs: [
            { id: 'out_ic_temp', name: 'ambientTemperature' },
            { id: 'out_ic_humidity', name: 'relativeHumidity' },
          ],
        },
        {
          id: 'fn_iot_evaluate',
          name: 'evaluateSafetyThresholds',
          inputs: [
            { id: 'in_ie_temp', name: 'ambientTemperature' },
            { id: 'in_ie_humidity', name: 'relativeHumidity' },
          ],
          processes: [
            { id: 'pr_ie_1', description: 'Check if ambientTemperature exceeds safety threshold of 45°C' },
            { id: 'pr_ie_2', description: 'If critical, set alertLevel = "HIGH" and triggerSiren = true' },
          ],
          outputs: [
            { id: 'out_ie_level', name: 'alertLevel' },
            { id: 'out_ie_status', name: 'isCritical' },
          ],
        },
        {
          id: 'fn_iot_dispatch',
          name: 'dispatchEmergencyAlert',
          inputs: [
            { id: 'in_id_level', name: 'alertLevel' },
            { id: 'in_id_status', name: 'isCritical' },
          ],
          processes: [
            { id: 'pr_id_1', description: 'If isCritical == true, broadcast push notification to facility operators' },
            { id: 'pr_id_2', description: 'Log incident record to cloud safety monitoring ledger' },
          ],
          outputs: [
            { id: 'out_id_log', name: 'incidentLogId' },
            { id: 'out_id_broadcast', name: 'alertBroadcastStatus' },
          ],
        },
      ],
      connections: [
        {
          id: 'conn_iot_1',
          sourceFunctionId: 'fn_iot_read',
          sourceOutputId: 'out_ir_packet',
          targetFunctionId: 'fn_iot_calibrate',
          targetInputId: 'in_ic_packet',
          label: 'rawTelemetryPacket',
        },
        {
          id: 'conn_iot_2',
          sourceFunctionId: 'fn_iot_calibrate',
          sourceOutputId: 'out_ic_temp',
          targetFunctionId: 'fn_iot_evaluate',
          targetInputId: 'in_ie_temp',
          label: 'ambientTemperature',
        },
        {
          id: 'conn_iot_3',
          sourceFunctionId: 'fn_iot_calibrate',
          sourceOutputId: 'out_ic_humidity',
          targetFunctionId: 'fn_iot_evaluate',
          targetInputId: 'in_ie_humidity',
          label: 'relativeHumidity',
        },
        {
          id: 'conn_iot_4',
          sourceFunctionId: 'fn_iot_evaluate',
          sourceOutputId: 'out_ie_level',
          targetFunctionId: 'fn_iot_dispatch',
          targetInputId: 'in_id_level',
          label: 'alertLevel',
        },
        {
          id: 'conn_iot_5',
          sourceFunctionId: 'fn_iot_evaluate',
          sourceOutputId: 'out_ie_status',
          targetFunctionId: 'fn_iot_dispatch',
          targetInputId: 'in_id_status',
          label: 'isCritical',
        },
      ],
    },
  },
  {
    id: 'blank',
    title: '4. Proyek Baru (Blank Canvas)',
    description: 'Kanvas kosong untuk merancang fungsi dan hubungan antar-fungsi dari awal secara mandiri.',
    data: {
      projectName: 'Functional Design Baru',
      functions: [
        {
          id: 'fn_1',
          name: 'processMainTask',
          inputs: [
            { id: 'in_1_1', name: 'inputData' },
          ],
          processes: [
            { id: 'pr_1_1', description: 'Process inputData and perform primary calculation' },
          ],
          outputs: [
            { id: 'out_1_1', name: 'outputResult' },
          ],
        },
      ],
      connections: [],
    },
  },
];
