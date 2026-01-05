import React, { useState, useRef, useCallback } from "react";
import { User } from "@/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, 
  Users, Loader2, Download, Info
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function ImportUsersDialog({ open, onOpenChange, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setIsLoading(false);
    setIsImporting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      handlePreview(droppedFile);
    } else {
      toast.error("Please upload an Excel file (.xlsx)");
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        handlePreview(selectedFile);
      } else {
        toast.error("Please upload an Excel file (.xlsx)");
      }
    }
  }, []);

  const handlePreview = async (fileToPreview) => {
    setIsLoading(true);
    setPreviewData(null);
    setImportResult(null);
    
    try {
      const result = await User.importFromExcel(fileToPreview, false);
      setPreviewData(result);
    } catch (error) {
      toast.error(error.message || "Failed to preview file");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData) return;
    
    if (previewData.summary.valid === 0) {
      toast.error("No valid rows to import");
      return;
    }
    
    setIsImporting(true);
    
    try {
      const result = await User.importFromExcel(file, true);
      setImportResult(result);
      toast.success(`Successfully imported ${result.imported} users`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || "Failed to import users");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['email', 'password', 'full_name', 'display_name', 'credits', 'role', 'language', 'phone_number', 'country', 'city'];
    const exampleRow = ['user@example.com', 'SecurePass123', 'John Doe', 'John', '10', 'user', 'en', '+1234567890', 'USA', 'New York'];
    const exampleRow2 = ['jane@example.com', '', 'Jane Smith', 'Jane', '5', 'user', 'ar', '+9876543210', 'Saudi Arabia', 'Riyadh'];
    
    const csvContent = [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_import_template.csv';
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
            <Users className="w-5 h-5" />
            {isArabic ? 'استيراد المستخدمين' : 'Import Users'}
          </DialogTitle>
          <DialogDescription>
            {isArabic 
              ? 'قم برفع ملف Excel (.xlsx) لاستيراد المستخدمين بشكل جماعي'
              : 'Upload an Excel file (.xlsx) to bulk import users'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!previewData && !importResult && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-orange-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {isArabic ? 'جاري معالجة الملف...' : 'Processing file...'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {isArabic ? 'اسحب وأفلت ملف Excel هنا' : 'Drag and drop your Excel file here'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isArabic ? 'أو انقر للاختيار' : 'or click to browse'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isArabic ? 'يدعم ملفات .xlsx فقط (الحد الأقصى 5MB)' : 'Supports .xlsx files only (max 5MB)'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                      {isArabic ? 'تنسيق الملف المطلوب:' : 'Required file format:'}
                    </p>
                    <ul className={`space-y-1 text-blue-600 dark:text-blue-400 ${isArabic ? 'list-disc list-inside' : 'list-disc list-inside'}`}>
                      <li>
                        <span className="font-medium">{isArabic ? 'الأعمدة المطلوبة:' : 'Required columns:'}</span> email, password
                      </li>
                      <li>
                        <span className="font-medium">{isArabic ? 'الأعمدة الاختيارية:' : 'Optional columns:'}</span> full_name, display_name, credits, role, language, phone_number, country, city
                      </li>
                      <li>
                        <span className="font-medium">{isArabic ? 'الأدوار المتاحة:' : 'Available roles:'}</span> user, admin
                      </li>
                      <li>
                        <span className="font-medium">{isArabic ? 'اللغات:' : 'Languages:'}</span> en, ar
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
                <Download className="w-4 h-4" />
                {isArabic ? 'تحميل قالب الاستيراد' : 'Download Import Template'}
              </Button>
            </div>
          )}

          {previewData && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                  <span className="font-medium">{file?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    {previewData.summary.total} {isArabic ? 'صف' : 'rows'}
                  </Badge>
                  <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    {previewData.summary.valid} {isArabic ? 'صالح' : 'valid'}
                  </Badge>
                  {previewData.summary.invalid > 0 && (
                    <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <XCircle className="w-3 h-3" />
                      {previewData.summary.invalid} {isArabic ? 'غير صالح' : 'invalid'}
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{isArabic ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="w-16">{isArabic ? 'الصف' : 'Row'}</TableHead>
                      <TableHead>{isArabic ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                      <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isArabic ? 'الدور' : 'Role'}</TableHead>
                      <TableHead className="w-20">{isArabic ? 'الرصيد' : 'Credits'}</TableHead>
                      <TableHead>{isArabic ? 'الأخطاء' : 'Errors'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row) => (
                      <TableRow key={row.row_number} className={row.status === 'invalid' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                        <TableCell>
                          {row.status === 'valid' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500">{row.row_number}</TableCell>
                        <TableCell className="font-medium">{row.email || '-'}</TableCell>
                        <TableCell>{row.full_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.role || 'user'}</Badge>
                        </TableCell>
                        <TableCell>{row.credits || 0}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {row.errors.map((error, idx) => (
                                <span key={idx} className="text-xs text-red-600 dark:text-red-400">
                                  {error}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-green-600">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {previewData.summary.invalid > 0 && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    {isArabic 
                      ? `${previewData.summary.invalid} صف غير صالح وسيتم تخطيه أثناء الاستيراد`
                      : `${previewData.summary.invalid} invalid row(s) will be skipped during import`}
                  </span>
                </div>
              )}
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {isArabic ? 'تم الاستيراد بنجاح!' : 'Import Completed!'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {isArabic 
                    ? `تم استيراد ${importResult.imported} مستخدم بنجاح`
                    : `Successfully imported ${importResult.imported} user(s)`}
                </p>
                {importResult.failed > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                    {isArabic 
                      ? `${importResult.failed} صف فشل في الاستيراد`
                      : `${importResult.failed} row(s) failed to import`}
                  </p>
                )}
              </div>

              {importResult.imported_users && importResult.imported_users.length > 0 && (
                <ScrollArea className="h-[200px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isArabic ? 'الصف' : 'Row'}</TableHead>
                        <TableHead>{isArabic ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                        <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.imported_users.map((user, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{user.row_number}</TableCell>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.full_name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!previewData && !importResult && (
            <Button variant="outline" onClick={handleClose}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
          
          {previewData && !importResult && (
            <>
              <Button variant="outline" onClick={resetState}>
                {isArabic ? 'اختيار ملف آخر' : 'Choose Different File'}
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || previewData.summary.valid === 0}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isArabic ? 'جاري الاستيراد...' : 'Importing...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {isArabic 
                      ? `استيراد ${previewData.summary.valid} مستخدم`
                      : `Import ${previewData.summary.valid} Users`}
                  </>
                )}
              </Button>
            </>
          )}
          
          {importResult && (
            <Button onClick={handleClose}>
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
