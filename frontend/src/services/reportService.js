/**
 * ESG and Carbon Audit Report Service
 * 
 * Corresponds to Report model in backend/app/models/document.py.
 */

const STORAGE_KEY = 'campus_carbon_reports';

const INITIAL_REPORTS = [
  {
    id: 1,
    title: 'Q1 2024 Comprehensive Campus Carbon Footprint Report',
    report_type: 'Quarterly ESG Audit',
    reporting_period: 'Jan 2024 - Mar 2024',
    department_id: null,
    department_name: 'All Campus Departments',
    total_emissions_kgco2e: 24650.0,
    generated_at: '2024-04-02T10:15:00Z',
    created_by: 'System Admin',
    file_reference: 'REPORT_Q1_2024_CAMPUS_ESG.pdf',
    status: 'Certified'
  },
  {
    id: 2,
    title: 'Engineering Complex Scope 2 Electricity Carbon Profile',
    report_type: 'Departmental Audit',
    reporting_period: 'Feb 2024',
    department_id: 1,
    department_name: 'Engineering',
    total_emissions_kgco2e: 8200.0,
    generated_at: '2024-03-01T14:20:00Z',
    created_by: 'Facility Lead',
    file_reference: 'REPORT_ENG_SCOPE2_FEB2024.pdf',
    status: 'Certified'
  },
  {
    id: 3,
    title: 'Hostel & Residential Zone Waste & Water Audit',
    report_type: 'Scope 3 Assessment',
    reporting_period: 'Jan 2024',
    department_id: 5,
    department_name: 'Hostel',
    total_emissions_kgco2e: 3140.0,
    generated_at: '2024-02-05T09:00:00Z',
    created_by: 'Green Campus Officer',
    file_reference: 'REPORT_HOSTEL_WASTE_WATER_JAN2024.pdf',
    status: 'Certified'
  }
];

export const reportService = {
  getReports: async () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  },

  generateReport: async (params) => {
    await new Promise((res) => setTimeout(res, 600));

    const existing = await reportService.getReports();
    const newReport = {
      id: Date.now(),
      title: `${params.report_type} (${params.reporting_period})`,
      report_type: params.report_type,
      reporting_period: params.reporting_period,
      department_id: params.department_id || null,
      department_name: params.department_name || 'All Campus Departments',
      total_emissions_kgco2e: params.total_emissions_kgco2e || 8200.0,
      generated_at: new Date().toISOString(),
      created_by: params.created_by || 'System User',
      file_reference: `CAMPUS_CARBON_REPORT_${Date.now()}.pdf`,
      status: 'Generated'
    };

    const updated = [newReport, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  },

  exportToCSV: (filename, rows) => {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
