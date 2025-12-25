import React, { useState, useEffect } from "react";
import { auth, api, Analysis, Payment, User, AI } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Lock, AlertCircle, Clock, Eye, 
  ArrowLeft, Building2, Globe, Calendar
} from "lucide-react";
import { format } from "date-fns";

// Import report components
import ExecutiveSummary from "@/components/results/ExecutiveSummary";
import ProblemSolutionFramework from "@/components/results/ProblemSolutionFramework";
import TargetAudience from "@/components/results/TargetAudience";
import MarketOpportunity from "@/components/results/MarketOpportunity";
import SwotSimple from "@/components/results/SwotSimple";
import FinancialProjections from "@/components/results/FinancialProjections";

export default function SharedReport() {
  const [share, setShare] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  useEffect(() => {
    if (token) {
      loadSharedReport();
    } else {
      setError("invalid");
      setIsLoading(false);
    }
  }, [token]);

  const loadSharedReport = async (verifyEmail = null) => {
    setIsLoading(true);
    try {
      // Use backend function to load shared report (bypasses RLS)
      const { data } = await api.post('/getSharedReport', { token });

      if (!data.share || !data.analysis) {
        setError("not_found");
        setIsLoading(false);
        return;
      }

      const shareData = data.share;

      // Check email restriction
      if (!shareData.is_public && shareData.allowed_emails?.length > 0) {
        if (!verifyEmail) {
          setNeedsEmail(true);
          setShare(shareData);
          setIsLoading(false);
          return;
        }
        if (!shareData.allowed_emails.includes(verifyEmail.toLowerCase())) {
          setError("unauthorized");
          setIsLoading(false);
          return;
        }
      }

      setShare(shareData);
      setAnalysis(data.analysis);
      setNeedsEmail(false);
    } catch (err) {
      console.error("Error loading shared report:", err);
      const errorMsg = err?.response?.data?.error || err?.message;
      
      if (errorMsg?.includes('not found')) {
        setError("not_found");
      } else if (errorMsg?.includes('inactive')) {
        setError("inactive");
      } else if (errorMsg?.includes('expired')) {
        setError("expired");
      } else {
        setError("error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = () => {
    if (emailInput) {
      loadSharedReport(emailInput);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-slate-200">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              {error === "expired" ? (
                <Clock className="w-8 h-8 text-red-600" />
              ) : error === "unauthorized" ? (
                <Lock className="w-8 h-8 text-red-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {error === "expired" && "Link Expired"}
              {error === "unauthorized" && "Access Denied"}
              {error === "not_found" && "Link Not Found"}
              {error === "inactive" && "Link Deactivated"}
              {error === "invalid" && "Invalid Link"}
              {error === "report_not_found" && "Report Not Found"}
              {error === "error" && "Error Loading Report"}
            </h2>
            <p className="text-slate-600 mb-6">
              {error === "expired" && "This share link has expired."}
              {error === "unauthorized" && "Your email is not authorized to view this report."}
              {error === "not_found" && "This share link doesn't exist."}
              {error === "inactive" && "This share link has been deactivated by the owner."}
              {error === "invalid" && "The share link is invalid or missing."}
              {error === "report_not_found" && "The shared report could not be found."}
              {error === "error" && "An error occurred while loading the report."}
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-purple-200">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Restricted Access
            </h2>
            <p className="text-slate-600 mb-6">
              This report is restricted to specific users. Please enter your email to verify access.
            </p>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyEmail()}
                className="text-center"
              />
              <Button 
                onClick={verifyEmail} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Verify Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isArabic = analysis?.report_language === "arabic";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isArabic ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-purple-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {analysis?.business_idea?.substring(0, 60)}
                  {analysis?.business_idea?.length > 60 ? "..." : ""}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-purple-100">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {analysis?.industry || "Technology"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {analysis?.country || "Global"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0">
                <Eye className="w-3 h-3 mr-1" />
                Shared Report
              </Badge>
              {share?.permission === "view" && (
                <Badge variant="outline" className="border-white/30 text-white">
                  View Only
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {/* Executive Summary */}
          {analysis?.business_report?.executive_summary && (
            <ExecutiveSummary report={analysis.business_report} isArabic={isArabic} />
          )}

          {/* Problem & Solution */}
          {analysis?.step1_problem_solution && (
            <ProblemSolutionFramework report={analysis.step1_problem_solution} isArabic={isArabic} />
          )}

          {/* Target Audience */}
          {analysis?.step2_target_audience && (
            <TargetAudience report={analysis.step2_target_audience} isArabic={isArabic} />
          )}

          {/* Market Opportunity */}
          {(analysis?.step3_market_opportunity || analysis?.step4_market_size) && (
            <MarketOpportunity 
              report={{
                ...analysis.step3_market_opportunity,
                market_size: analysis.step4_market_size
              }} 
              isArabic={isArabic} 
            />
          )}

          {/* SWOT Analysis */}
          {analysis?.step10_financials_risks_swot?.swot_analysis && (
            <SwotSimple report={analysis.step10_financials_risks_swot} isArabic={isArabic} />
          )}

          {/* Financial Projections */}
          {analysis?.step10_financials_risks_swot && (
            <FinancialProjections report={analysis.step10_financials_risks_swot} isArabic={isArabic} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-200">
          <p className="text-slate-500 text-sm">
            This report was generated by{" "}
            <a href="https://planlyze.ai" className="text-purple-600 hover:underline font-medium">
              Planlyze AI
            </a>
          </p>
          {analysis?.created_at && (
            <p className="text-slate-400 text-xs mt-1">
              Created on {format(new Date(analysis.created_at), "MMMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}