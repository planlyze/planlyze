import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToExcel = (data, columns, filename, sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    return false;
  }

  const exportData = data.map(row => {
    const exportRow = {};
    columns.forEach(col => {
      let value = col.accessor ? col.accessor(row) : row[col.key];
      
      if (value instanceof Date) {
        value = format(value, 'yyyy-MM-dd HH:mm:ss');
      } else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      } else if (value === null || value === undefined) {
        value = '';
      }
      
      exportRow[col.header] = value;
    });
    return exportRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = columns.map(col => ({
    wch: Math.max(
      col.header.length,
      ...exportData.map(row => String(row[col.header] || '').length).slice(0, 100)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
  
  return true;
};

export const getUsersExportColumns = () => [
  { key: 'email', header: 'Email' },
  { key: 'full_name', header: 'Full Name' },
  { key: 'display_name', header: 'Display Name' },
  { key: 'country', header: 'Country' },
  { key: 'phone', header: 'Phone' },
  { key: 'credits', header: 'Credits' },
  { header: 'Role', accessor: (row) => typeof row.role === 'object' ? row.role?.name : row.role || 'user' },
  { key: 'is_verified', header: 'Verified' },
  { key: 'referral_code', header: 'Referral Code' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getPaymentsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { header: 'Package', accessor: (row) => row.package_name || row.credit_package?.name || 'N/A' },
  { header: 'Amount (USD)', accessor: (row) => row.amount_usd || row.amount || 0 },
  { key: 'credits', header: 'Credits' },
  { header: 'Currency', accessor: (row) => row.currency_code || 'USD' },
  { header: 'Currency Amount', accessor: (row) => row.currency_amount || row.amount_usd || row.amount || '' },
  { header: 'Exchange Rate', accessor: (row) => row.exchange_rate || 1.0 },
  { header: 'Payment Method', accessor: (row) => row.payment_method?.name || row.payment_method || 'N/A' },
  { key: 'status', header: 'Status' },
  { key: 'admin_notes', header: 'Admin Notes' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getReportsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'business_idea', header: 'Business Idea' },
  { key: 'industry', header: 'Industry' },
  { key: 'target_country', header: 'Target Country' },
  { header: 'Type', accessor: (row) => row.is_premium ? 'Premium' : 'Free' },
  { key: 'status', header: 'Status' },
  { key: 'user_rating', header: 'Rating' },
  { key: 'report_language', header: 'Language' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getTransactionsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'balance_after', header: 'Balance After' },
  { key: 'description', header: 'Description' },
  { key: 'status', header: 'Status' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getReferralsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'referrer_email', header: 'Referrer Email' },
  { key: 'referred_email', header: 'Referred Email' },
  { key: 'referral_code', header: 'Referral Code' },
  { key: 'status', header: 'Status' },
  { key: 'credits_awarded', header: 'Credits Awarded' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getDiscountsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'code', header: 'Code' },
  { header: 'Discount', accessor: (row) => row.discount_percent ? `${row.discount_percent}%` : `$${row.discount_amount}` },
  { key: 'description_en', header: 'Description (EN)' },
  { key: 'description_ar', header: 'Description (AR)' },
  { key: 'uses_count', header: 'Uses' },
  { key: 'max_uses', header: 'Max Uses' },
  { header: 'Active', accessor: (row) => row.is_active ? 'Yes' : 'No' },
  { header: 'Valid From', accessor: (row) => row.valid_from ? format(new Date(row.valid_from), 'yyyy-MM-dd') : '' },
  { header: 'Valid Until', accessor: (row) => row.valid_until ? format(new Date(row.valid_until), 'yyyy-MM-dd') : '' }
];

export const getAuditLogsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'action', header: 'Action' },
  { key: 'entity_type', header: 'Entity Type' },
  { key: 'entity_id', header: 'Entity ID' },
  { key: 'ip_address', header: 'IP Address' },
  { header: 'Details', accessor: (row) => row.details ? JSON.stringify(row.details) : '' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getNotificationsExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'user_email', header: 'User Email' },
  { key: 'type', header: 'Type' },
  { key: 'title', header: 'Title' },
  { key: 'message', header: 'Message' },
  { header: 'Read', accessor: (row) => row.is_read ? 'Yes' : 'No' },
  { header: 'Created', accessor: (row) => row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd HH:mm') : '' }
];

export const getCreditPackagesExportColumns = () => [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'credits', header: 'Credits' },
  { key: 'price', header: 'Price' },
  { key: 'description', header: 'Description' },
  { header: 'Active', accessor: (row) => row.is_active ? 'Yes' : 'No' }
];

export const getCurrenciesExportColumns = () => [
  { key: 'code', header: 'Code' },
  { key: 'name', header: 'Name (EN)' },
  { key: 'name_ar', header: 'Name (AR)' },
  { key: 'symbol', header: 'Symbol' },
  { key: 'exchange_rate', header: 'Exchange Rate' },
  { header: 'Default', accessor: (row) => row.is_default ? 'Yes' : 'No' },
  { header: 'Active', accessor: (row) => row.is_active ? 'Yes' : 'No' },
  { key: 'sort_order', header: 'Sort Order' },
  { header: 'Updated', accessor: (row) => row.updated_at ? format(new Date(row.updated_at), 'yyyy-MM-dd HH:mm') : '' }
];
