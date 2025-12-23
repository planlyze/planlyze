import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppTranslation } from "@/config";
import { CheckCircle } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PricingCard({
  icon: Icon,
  titleKey,
  title: directTitle,
  price,
  descriptionKey,
  description: directDescription,
  featuresKeys = [],
  features: directFeatures = [],
  notIncludedKeys = [],
  badge,
  variant = "default",
  selectTextKey,
  selectText: directSelectText,
}) {
  const variants = {
    default: {
      card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400",
      icon: "text-purple-600",
      check: "text-purple-600",
      button:
        "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    },
    popular: {
      card: "bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 hover:border-orange-500",
      icon: "text-orange-500",
      check: "text-orange-500",
      button:
        "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105",
    },
    best: {
      card: "bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 hover:border-purple-500",
      icon: "text-purple-600",
      check: "text-purple-600",
      button:
        "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105",
    },
  };

  const style = variants[variant];

  const { t } = useAppTranslation("landing");

  const title = directTitle || (titleKey ? t[titleKey] : "");
  const description =
    directDescription || (descriptionKey ? t[descriptionKey] : "");
  const features =
    directFeatures.length > 0
      ? directFeatures
      : featuresKeys.map((k) => (typeof k === "string" ? t[k] : k));
  const notIncluded = notIncludedKeys.map((k) =>
    typeof k === "string" ? t[k] : k
  );
  const selectText =
    directSelectText || (selectTextKey ? t[selectTextKey] : "");

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`h-full ${style.card} hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
      >
        {badge && (
          <Badge
            className={`absolute top-4 ltr:right-4 rtl:left-4 ${
              variant === "popular" ? "bg-orange-500" : "bg-purple-600"
            } text-white`}
          >
            {badge}
          </Badge>
        )}
        <CardContent className={`p-8 ${badge ? "pt-14" : ""}`}>
          <div className="mb-6">
            <Icon className={`w-12 h-12 ${style.icon} mb-4`} />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {price}
            </div>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${style.check} flex-shrink-0 mt-0.5`}
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <Link to={createPageUrl("Login")}>
            <Button
              className={`w-full rounded-full font-semibold transition-all duration-300 ${style.button}`}
            >
              {selectText}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
