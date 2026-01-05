import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { reports } from '@/api/client';
import { toast } from 'sonner';

export default function ImportReportsDialog({ open, onOpenChange, onImportComplete }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      handlePreview(droppedFile);
    } else {
      toast.error(isArabic ? 'يجب أن يكون الملف بصيغة .xlsx' : 'File must be .xlsx format');
    }
  }, [isArabic]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handlePreview(selectedFile);
    }
  };

  const handlePreview = async (uploadFile) => {
    setIsLoading(true);
    try {
      const result = await reports.importFromExcel(uploadFile, false);
      setPreview(result);
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل في تحليل الملف' : 'Failed to parse file'));
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    
    setIsImporting(true);
    try {
      const result = await reports.importFromExcel(file, true);
      toast.success(
        isArabic 
          ? `تم استيراد ${result.imported} تقرير بنجاح` 
          : `Successfully imported ${result.imported} reports`
      );
      onImportComplete?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || (isArabic ? 'فشل الاستيراد' : 'Import failed'));
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['user_email', 'business_idea', 'industry', 'target_market', 'location', 'budget', 'report_type', 'report_language', 'score'];
    const exampleRow = ['user@example.com', 'A mobile app for food delivery in urban areas', 'Technology', 'Urban consumers', 'Saudi Arabia', '$50,000', 'premium', 'english', '85'];
    const exampleRow2 = ['admin@planlyze.com', 'تطبيق لتوصيل الطعام في المناطق الحضرية', 'التكنولوجيا', 'المستهلكين في المدن', 'السعودية', '50000 ريال', 'premium', 'arabic', '90'];
    
    const csvContent = [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.info(isArabic 
      ? "تم تحميل القالب. يرجى فتحه في Excel وحفظه بصيغة .xlsx قبل الاستيراد"
      : "Template downloaded. Open in Excel, add your data, and save as .xlsx before importing."
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {isArabic ? 'استيراد التقارير من Excel' : 'Import Reports from Excel'}
          </DialogTitle>
          <DialogDescription>
            {isArabic 
              ? 'قم برفع ملف Excel (.xlsx) يحتوي على بيانات التقارير للاستيراد السريع' 
              : 'Upload an Excel file (.xlsx) with report data for quick import'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!file ? (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isArabic ? 'اسحب وأفلت ملف Excel هنا' : 'Drag and drop your Excel file here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {isArabic ? 'أو' : 'or'}
                </p>
                <label>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild>
                    <span>{isArabic ? 'اختر ملف' : 'Choose File'}</span>
                  </Button>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {isArabic ? 'تحتاج قالب؟' : 'Need a template?'}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {isArabic 
                      ? 'الأعمدة المطلوبة: بريد المستخدم، فكرة العمل' 
                      : 'Required columns: user_email, business_idea'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 me-2" />
                  {isArabic ? 'تحميل القالب' : 'Download Template'}
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ms-3">{isArabic ? 'جاري تحليل الملف...' : 'Analyzing file...'}</span>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {isArabic ? 'الإجمالي' : 'Total'}: {preview.summary?.total || 0} | 
                    <span className="text-green-600 mx-1">{isArabic ? 'صالح' : 'Valid'}: {preview.summary?.valid || 0}</span> | 
                    <span className="text-red-600">{isArabic ? 'غير صالح' : 'Invalid'}: {preview.summary?.invalid || 0}</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                  {isArabic ? 'تغيير الملف' : 'Change File'}
                </Button>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-start">#</th>
                      <th className="px-3 py-2 text-start">{isArabic ? 'الحالة' : 'Status'}</th>
                      <th className="px-3 py-2 text-start">{isArabic ? 'البريد الإلكتروني' : 'User Email'}</th>
                      <th className="px-3 py-2 text-start">{isArabic ? 'فكرة العمل' : 'Business Idea'}</th>
                      <th className="px-3 py-2 text-start">{isArabic ? 'النوع' : 'Type'}</th>
                      <th className="px-3 py-2 text-start">{isArabic ? 'الأخطاء' : 'Errors'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows?.map((row, idx) => (
                      <tr key={idx} className={`border-b ${row.status === 'invalid' ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        <td className="px-3 py-2">{row.row_number}</td>
                        <td className="px-3 py-2">
                          {row.status === 'valid' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 me-1" />
                              {isArabic ? 'صالح' : 'Valid'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 me-1" />
                              {isArabic ? 'غير صالح' : 'Invalid'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.user_email}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate" title={row.business_idea}>{row.business_idea}</td>
                        <td className="px-3 py-2">{row.report_type || 'premium'}</td>
                        <td className="px-3 py-2">
                          {row.errors?.length > 0 && (
                            <span className="text-red-600 text-xs">{row.errors.join(', ')}</span>
                          )}
                          {row.warnings?.length > 0 && (
                            <span className="text-yellow-600 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.warnings.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          {preview && preview.summary?.valid > 0 && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {isArabic 
                ? `استيراد ${preview.summary.valid} تقرير` 
                : `Import ${preview.summary.valid} Reports`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
