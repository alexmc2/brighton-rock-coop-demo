'use client';

import { useState } from 'react';
import { Card } from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import Tiptap from '@/components/members/tiptap';
import { format } from 'date-fns';
import {
  createProjectReport,
  updateProjectReport,
  deleteProjectReport,
} from '@/app/members/actions/garden/id/project-reports-actions';
import { ProjectReport } from '@/types/members/garden';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/members/ui/alert-dialog';
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileIcon,
} from 'lucide-react';

interface ProjectReportsProps {
  projectId: string;
  initialReports: ProjectReport[];
}

export default function ProjectReports({
  projectId,
  initialReports,
}: ProjectReportsProps) {
  const [reports, setReports] = useState<ProjectReport[]>(initialReports);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [editingReport, setEditingReport] = useState<ProjectReport | null>(
    null
  );
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ProjectReport | null>(
    null
  );
  const [reportToDelete, setReportToDelete] = useState<ProjectReport | null>(
    null
  );
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [reportToDownload, setReportToDownload] =
    useState<ProjectReport | null>(null);

  const handleAddReport = async () => {
    if (!reportTitle.trim() || !reportContent.trim()) return;

    setIsSubmitting(true);
    try {
      const { success, report } = await createProjectReport({
        projectId,
        title: reportTitle,
        content: reportContent,
      });

      if (success && report) {
        setReports([report, ...reports]);
        setReportTitle('');
        setReportContent('');
        setIsAddingReport(false);
      }
    } catch (error) {
      console.error('Error adding report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReport = async () => {
    if (!editingReport || !reportTitle.trim() || !reportContent.trim()) return;

    setIsSubmitting(true);
    try {
      const { success, report } = await updateProjectReport({
        reportId: editingReport.id,
        title: reportTitle,
        content: reportContent,
      });

      if (success && report) {
        setReports(reports.map((r) => (r.id === report.id ? report : r)));
        setReportTitle('');
        setReportContent('');
        setEditingReport(null);
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (report: ProjectReport) => {
    setEditingReport(report);
    setReportTitle(report.title);
    setReportContent(report.content);
  };

  const handleViewReport = (report: ProjectReport) => {
    setExpandedReportId(expandedReportId === report.id ? null : report.id);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const { success } = await deleteProjectReport({
        reportId: reportToDelete.id,
        projectId,
      });

      if (success) {
        setReports(reports.filter((r) => r.id !== reportToDelete.id));
        setReportToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDownloadText = (report: ProjectReport) => {
    const content = report.content.replace(/<[^>]+>/g, ''); // Strip HTML tags
    const title = report.title;
    const date = format(new Date(report.created_at), 'yyyy-MM-dd');
    const filename = `${date}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}.txt`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async (report: ProjectReport) => {
    const title = report.title;
    const date = format(new Date(report.created_at), 'yyyy-MM-dd');
    const filename = `${date}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}.pdf`;

    try {
      // Dynamically import html2pdf only when needed
      const html2pdf = (await import('html2pdf.js')).default;

      // Create a temporary div to hold the report content
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #334155; margin-bottom: 10px;">${report.title}</h1>
          <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 20px;">
            Posted by ${
              report.created_by_user?.full_name || report.created_by_user?.email
            }
            on ${format(new Date(report.created_at), 'MMM d, yyyy, h:mm a')}
          </div>
          <div style="line-height: 1.6;">${report.content}</div>
        </div>
      `;

      const opt = {
        margin: [10, 10] as [number, number],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Card className="p-4 sm:p-6 mt-6 ">
      <div className="sm:flex sm:justify-between sm:items-center mb-6 block">
        <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-4 sm:mb-0">
          <span className="sm:hidden">Garden Reports</span>
          <span className="hidden sm:inline">
            Garden Reports, Updates, and Notes
          </span>
        </h3>
        {!isAddingReport && !editingReport && (
          <Button onClick={() => setIsAddingReport(true)} variant="default">
            Add Report
          </Button>
        )}
      </div>

      {(isAddingReport || editingReport) && (
        <div className="mb-8 space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="Report Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full text-lg "
            />
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900">
              <Tiptap
                content={reportContent}
                onChange={setReportContent}
                placeholder="Write your project report or update..."
                className="min-h-[400px]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingReport(false);
                setEditingReport(null);
                setReportTitle('');
                setReportContent('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={editingReport ? handleEditReport : handleAddReport}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : editingReport
                ? 'Update Report'
                : 'Save Report'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 transition-colors"
          >
            {/* Mobile-only buttons */}
            <div className="flex justify-start gap-2 mb-4 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportToDownload(report);
                }}
                className="bg-sky-100 hover:bg-sky-200 dark:bg-sky-700/50 dark:hover:bg-sky-900/50 border-sky-200 dark:border-sky-900"
              >
                <Download className="h-4 w-4 text-sky-700 dark:text-sky-400" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(report);
                }}
                className="bg-green-100 hover:bg-green-200 dark:bg-green-700/50 dark:hover:bg-green-900/50 border-green-200 dark:border-green-900"
              >
                <Pencil className="h-4 w-4 text-green-700 dark:text-green-400" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportToDelete(report);
                }}
                className=" dark:bg-red-700/50 dark:hover:bg-red-900/50  dark:border-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between items-start mb-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 truncate">
                    {report.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewReport(report)}
                  >
                    {expandedReportId === report.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap sm:pt-2 pt-4">
                  Posted by{' '}
                  {report.created_by_user?.full_name ||
                    report.created_by_user?.email}{' '}
                  on{' '}
                  <span className="hidden sm:inline">
                    {format(new Date(report.created_at), 'MMM d, yyyy, h:mm a')}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                  </span>
                </p>
                {report.last_modified_by_user && (
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1">
                    Last edited by{' '}
                    {report.last_modified_by_user?.full_name ||
                      report.last_modified_by_user?.email}{' '}
                    on{' '}
                    <span className="hidden sm:inline">
                      {format(
                        new Date(report.updated_at),
                        'MMM d, yyyy, h:mm a'
                      )}
                    </span>
                    <span className="sm:hidden">
                      {format(new Date(report.updated_at), 'MMM d, yyyy')}
                    </span>
                  </p>
                )}
              </div>
              {/* Desktop-only buttons */}
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportToDownload(report);
                  }}
                  className="bg-sky-100 hover:bg-sky-200 dark:bg-sky-700/50 dark:hover:bg-sky-900/50 border-sky-200 dark:border-sky-900"
                >
                  <Download className="h-4 w-4 text-sky-700 dark:text-sky-400" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(report);
                  }}
                  className="bg-green-100 hover:bg-green-200 dark:bg-green-700/50 dark:hover:bg-green-900/50 border-green-200 dark:border-green-900"
                >
                  <Pencil className="h-4 w-4 text-green-700 dark:text-green-400" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportToDelete(report);
                  }}
                  className=" dark:bg-red-700/50 dark:hover:bg-red-900/50  dark:border-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedReportId === report.id && (
              <div className="mt-2 border-t border-slate-200 dark:border-slate-800 dark:focus-visible:ring-sky-500 pt-4">
                <div className="prose dark:prose-invert prose-base sm:prose-lg max-w-none overflow-auto max-h-[800px]">
                  <div dangerouslySetInnerHTML={{ __html: report.content }} />
                </div>
              </div>
            )}
          </div>
        ))}

        {reports.length === 0 && !isAddingReport && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12 text-base">
            No reports yet
          </div>
        )}
      </div>

      <Dialog
        open={!!reportToDownload}
        onOpenChange={() => setReportToDownload(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Report</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
              onClick={() => {
                if (reportToDownload) {
                  handleDownloadText(reportToDownload);
                  setReportToDownload(null);
                }
              }}
            >
              <FileText className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <span>Text File</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
              onClick={() => {
                if (reportToDownload) {
                  handleDownloadPDF(reportToDownload);
                  setReportToDownload(null);
                }
              }}
            >
              <FileIcon className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <span>PDF File</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!reportToDelete}
        onOpenChange={() => setReportToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              className="bg-red-600  text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
