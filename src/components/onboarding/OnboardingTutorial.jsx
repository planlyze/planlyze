import React, { useState, useEffect } from "react";
import { auth } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, X, Sparkles, FileText, Wallet, BarChart3 } from "lucide-react";

const tutorialSteps = [
  {
    id: 1,
    title: { en: "Welcome to Planlyze! 🎉", ar: "مرحباً في Planlyze! 🎉" },
    description: { 
      en: "Let's take a quick interactive tour to help you get started with validating your business ideas and turning them into actionable plans.",
      ar: "دعنا نأخذ جولة تفاعلية سريعة لمساعدتك على البدء في التحقق من أفكار عملك وتحويلها إلى خطط قابلة للتنفيذ."
    },
    icon: Sparkles,
    tip: {
      en: "This tutorial takes only 2 minutes and will help you navigate the platform effectively.",
      ar: "يستغرق هذا البرنامج التعليمي دقيقتين فقط وسيساعدك على التنقل في المنصة بفعالية."
    }
  },
  {
    id: 2,
    ```jsx
    import React from "react";

    export default function OnboardingTutorial() {
      return null;
    }
    ```