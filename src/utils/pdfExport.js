import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const COLORS = {
  primary: [79, 70, 229],
  secondary: [16, 185, 129],
  text: {
    dark: [30, 41, 59],
    medium: [71, 85, 105],
    light: [100, 116, 139],
  },
  accent: {
    blue: [59, 130, 246],
    green: [16, 185, 129],
    purple: [168, 85, 247],
    amber: [245, 158, 11],
    red: [239, 68, 68],
  },
  white: [255, 255, 255],
  background: [248, 250, 252],
};

export class PDFExporter {
  constructor(options = {}) {
    this.pdf = new jsPDF("p", "mm", "a4");
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = options.margin || 20;
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.yPos = this.margin;
    this.isArabic = options.isArabic || false;
    this.pageNumber = 1;
  }

  addPage() {
    this.pdf.addPage();
    this.yPos = this.margin;
    this.pageNumber++;
    this.addPageNumber();
  }

  checkPageBreak(neededHeight) {
    if (this.yPos + neededHeight > this.pageHeight - this.margin - 10) {
      this.addPage();
      return true;
    }
    return false;
  }

  addPageNumber() {
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...COLORS.text.light);
    const pageText = `${this.pageNumber}`;
    this.pdf.text(pageText, this.pageWidth / 2, this.pageHeight - 10, {
      align: "center",
    });
  }

  addCoverPage(title, subtitle, metadata = {}) {
    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(0, 0, this.pageWidth, 70, "F");

    this.pdf.setFillColor(...COLORS.secondary);
    this.pdf.rect(0, 65, this.pageWidth, 5, "F");

    this.pdf.setFontSize(32);
    this.pdf.setTextColor(...COLORS.white);
    this.pdf.text("PLANLYZE", this.margin, 35);

    this.pdf.setFontSize(14);
    this.pdf.text(
      this.isArabic ? "تقرير تحليل الأعمال" : "Business Analysis Report",
      this.margin,
      50
    );

    this.yPos = 95;
    this.pdf.setFontSize(22);
    this.pdf.setTextColor(...COLORS.text.dark);
    const titleLines = this.pdf.splitTextToSize(title || "Business Report", this.contentWidth);
    titleLines.forEach((line) => {
      this.pdf.text(line, this.margin, this.yPos);
      this.yPos += 12;
    });

    this.yPos += 15;

    if (subtitle) {
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...COLORS.text.medium);
      const subLines = this.pdf.splitTextToSize(subtitle, this.contentWidth);
      subLines.slice(0, 3).forEach((line) => {
        this.pdf.text(line, this.margin, this.yPos);
        this.yPos += 6;
      });
      this.yPos += 10;
    }

    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...COLORS.text.light);
    if (metadata.date) {
      this.pdf.text(
        `${this.isArabic ? "التاريخ:" : "Date:"} ${metadata.date}`,
        this.margin,
        this.yPos
      );
      this.yPos += 8;
    }
    if (metadata.industry) {
      this.pdf.text(
        `${this.isArabic ? "المجال:" : "Industry:"} ${metadata.industry}`,
        this.margin,
        this.yPos
      );
      this.yPos += 8;
    }
    if (metadata.country) {
      this.pdf.text(
        `${this.isArabic ? "الموقع:" : "Location:"} ${metadata.country}`,
        this.margin,
        this.yPos
      );
      this.yPos += 8;
    }

    this.yPos += 20;
    this.addScoresSummary(metadata.scores);
  }

  addScoresSummary(scores = {}) {
    if (!scores || Object.keys(scores).length === 0) return;

    const scoreData = [
      {
        label: this.isArabic ? "جدوى الأعمال" : "Business Viability",
        value: scores.viability,
        color: COLORS.accent.green,
      },
      {
        label: this.isArabic ? "التعقيد التقني" : "Technical Complexity",
        value: scores.complexity,
        color: COLORS.accent.blue,
      },
      {
        label: this.isArabic ? "MVP بالذكاء" : "AI MVP Score",
        value: scores.aiMvp,
        color: COLORS.accent.purple,
      },
      {
        label: this.isArabic ? "التقييم الشامل" : "Overall Assessment",
        value: scores.overall,
        color: COLORS.secondary,
      },
    ].filter((s) => s.value !== undefined && s.value !== null);

    if (scoreData.length === 0) return;

    const boxWidth = (this.contentWidth - 10) / 2;
    const boxHeight = 30;
    let xPos = this.margin;
    let row = 0;

    scoreData.forEach((score, idx) => {
      if (idx > 0 && idx % 2 === 0) {
        row++;
        xPos = this.margin;
        this.yPos += boxHeight + 5;
      }

      this.checkPageBreak(boxHeight + 10);

      this.pdf.setFillColor(248, 250, 252);
      this.pdf.roundedRect(xPos, this.yPos, boxWidth, boxHeight, 3, 3, "F");

      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.text.medium);
      this.pdf.text(score.label, xPos + 5, this.yPos + 10);

      this.pdf.setFontSize(20);
      this.pdf.setTextColor(...score.color);
      this.pdf.text(`${score.value}/10`, xPos + 5, this.yPos + 24);

      const barWidth = boxWidth - 60;
      const barHeight = 4;
      const barX = xPos + 55;
      const barY = this.yPos + 20;

      this.pdf.setFillColor(226, 232, 240);
      this.pdf.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F");

      const fillWidth = (score.value / 10) * barWidth;
      this.pdf.setFillColor(...score.color);
      this.pdf.roundedRect(barX, barY, fillWidth, barHeight, 2, 2, "F");

      xPos += boxWidth + 10;
    });

    this.yPos += boxHeight + 15;
  }

  addSectionHeader(title, icon = null) {
    this.checkPageBreak(20);

    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.roundedRect(this.margin, this.yPos, this.contentWidth, 12, 2, 2, "F");

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...COLORS.white);
    this.pdf.text(title, this.margin + 5, this.yPos + 8);

    this.yPos += 18;
  }

  addSubsectionHeader(title) {
    this.checkPageBreak(12);
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...COLORS.primary);
    this.pdf.text(title, this.margin, this.yPos);

    this.pdf.setDrawColor(...COLORS.primary);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.yPos + 2, this.margin + 40, this.yPos + 2);

    this.yPos += 8;
  }

  addText(text, fontSize = 10) {
    if (!text) return;
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(...COLORS.text.medium);
    const lines = this.pdf.splitTextToSize(String(text), this.contentWidth);
    lines.forEach((line) => {
      this.checkPageBreak(6);
      this.pdf.text(line, this.margin, this.yPos);
      this.yPos += 5;
    });
    this.yPos += 3;
  }

  addBulletList(items, indent = 5) {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      this.checkPageBreak(8);
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...COLORS.text.medium);

      this.pdf.setFillColor(...COLORS.secondary);
      this.pdf.circle(this.margin + 2, this.yPos - 1.5, 1.5, "F");

      const lines = this.pdf.splitTextToSize(String(item), this.contentWidth - indent - 5);
      lines.forEach((line, idx) => {
        this.pdf.text(line, this.margin + indent + 3, this.yPos);
        this.yPos += 5;
      });
    });
    this.yPos += 3;
  }

  addInfoCard(title, value, color = COLORS.accent.blue) {
    this.checkPageBreak(20);

    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(this.margin, this.yPos, this.contentWidth, 18, 2, 2, "F");

    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...COLORS.text.light);
    this.pdf.text(title, this.margin + 5, this.yPos + 6);

    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...color);
    this.pdf.text(String(value), this.margin + 5, this.yPos + 14);

    this.yPos += 22;
  }

  addDataTable(headers, rows) {
    if (!headers || !rows || rows.length === 0) return;

    const colWidth = this.contentWidth / headers.length;
    const rowHeight = 8;

    this.checkPageBreak(rowHeight * 2);

    this.pdf.setFillColor(...COLORS.primary);
    this.pdf.rect(this.margin, this.yPos, this.contentWidth, rowHeight, "F");

    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...COLORS.white);
    headers.forEach((header, idx) => {
      this.pdf.text(header, this.margin + idx * colWidth + 3, this.yPos + 5.5);
    });
    this.yPos += rowHeight;

    rows.forEach((row, rowIdx) => {
      this.checkPageBreak(rowHeight);

      if (rowIdx % 2 === 0) {
        this.pdf.setFillColor(248, 250, 252);
        this.pdf.rect(this.margin, this.yPos, this.contentWidth, rowHeight, "F");
      }

      this.pdf.setFontSize(9);
      this.pdf.setTextColor(...COLORS.text.medium);
      row.forEach((cell, idx) => {
        const cellText = String(cell || "").substring(0, 30);
        this.pdf.text(cellText, this.margin + idx * colWidth + 3, this.yPos + 5.5);
      });
      this.yPos += rowHeight;
    });

    this.yPos += 5;
  }

  addSWOTGrid(swot) {
    if (!swot) return;

    const hasData =
      swot.strengths?.length ||
      swot.weaknesses?.length ||
      swot.opportunities?.length ||
      swot.threats?.length;
    if (!hasData) return;

    this.checkPageBreak(60);

    const gridWidth = (this.contentWidth - 5) / 2;
    const minHeight = 25;

    const categories = [
      {
        title: this.isArabic ? "نقاط القوة" : "Strengths",
        items: swot.strengths || [],
        color: [16, 185, 129],
        bgColor: [236, 253, 245],
      },
      {
        title: this.isArabic ? "نقاط الضعف" : "Weaknesses",
        items: swot.weaknesses || [],
        color: [239, 68, 68],
        bgColor: [254, 242, 242],
      },
      {
        title: this.isArabic ? "الفرص" : "Opportunities",
        items: swot.opportunities || [],
        color: [59, 130, 246],
        bgColor: [239, 246, 255],
      },
      {
        title: this.isArabic ? "التهديدات" : "Threats",
        items: swot.threats || [],
        color: [245, 158, 11],
        bgColor: [255, 251, 235],
      },
    ];

    let xPos = this.margin;
    let row = 0;

    categories.forEach((cat, idx) => {
      if (idx > 0 && idx % 2 === 0) {
        row++;
        xPos = this.margin;
        this.yPos += minHeight + 5;
      }

      const itemHeight = cat.items.length * 5 + 12;
      const boxHeight = Math.max(minHeight, itemHeight);

      this.pdf.setFillColor(...cat.bgColor);
      this.pdf.roundedRect(xPos, this.yPos, gridWidth, boxHeight, 2, 2, "F");

      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...cat.color);
      this.pdf.text(cat.title, xPos + 3, this.yPos + 7);

      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...COLORS.text.medium);
      let itemY = this.yPos + 14;
      cat.items.slice(0, 4).forEach((item) => {
        const text = `• ${String(item).substring(0, 35)}`;
        this.pdf.text(text, xPos + 3, itemY);
        itemY += 5;
      });

      xPos += gridWidth + 5;
    });

    this.yPos += minHeight + 10;
  }

  async addChartImage(chartElement, title = null) {
    if (!chartElement) return;

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = this.contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      this.checkPageBreak(imgHeight + (title ? 15 : 5));

      if (title) {
        this.addSubsectionHeader(title);
      }

      this.pdf.addImage(imgData, "PNG", this.margin, this.yPos, imgWidth, imgHeight);
      this.yPos += imgHeight + 10;
    } catch (error) {
      console.error("Error capturing chart:", error);
    }
  }

  addSpace(height = 5) {
    this.yPos += height;
  }

  save(filename) {
    this.pdf.save(filename);
  }

  getBlob() {
    return this.pdf.output("blob");
  }
}

export async function captureChartAsImage(elementId, scale = 2) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error capturing chart:", error);
    return null;
  }
}

export function createSimpleBarChart(pdf, data, x, y, width, height, options = {}) {
  if (!data || data.length === 0) return;

  const barHeight = (height - 10) / data.length;
  const maxValue = Math.max(...data.map((d) => d.value || 0));

  data.forEach((item, idx) => {
    const barY = y + idx * barHeight + 2;
    const barWidth = maxValue > 0 ? ((item.value || 0) / maxValue) * (width - 60) : 0;

    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    const label = String(item.name || "").substring(0, 15);
    pdf.text(label, x, barY + barHeight / 2);

    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(x + 45, barY, width - 60, barHeight - 4, 1, 1, "F");

    const color = item.color || [59, 130, 246];
    pdf.setFillColor(...(Array.isArray(color) ? color : hexToRgb(color)));
    pdf.roundedRect(x + 45, barY, barWidth, barHeight - 4, 1, 1, "F");
  });
}

export function createSimplePieChart(pdf, data, centerX, centerY, radius, options = {}) {
  if (!data || data.length === 0) return;

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    const sliceAngle = ((item.value || 0) / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    const color = item.color || [59, 130, 246];
    pdf.setFillColor(...(Array.isArray(color) ? color : hexToRgb(color)));

    const segments = 20;
    const points = [];
    points.push({ x: centerX, y: centerY });

    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (sliceAngle * i) / segments;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    pdf.triangle(
      points[0].x,
      points[0].y,
      points[1].x,
      points[1].y,
      points[Math.floor(segments / 2) + 1].x,
      points[Math.floor(segments / 2) + 1].y,
      "F"
    );

    startAngle = endAngle;
  });
}

function hexToRgb(hex) {
  if (typeof hex !== "string") return [59, 130, 246];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246];
}
