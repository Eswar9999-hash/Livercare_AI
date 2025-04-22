import React, { useEffect, useState } from 'react';
import { FileText, Download, AlertTriangle, Activity, Calendar, User } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { Patient } from './patient.type';

interface HealthReportData {
  patientName: string;
  age: number;
  assessmentDate: string;
  riskScore: number;
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
}

const HealthReport = () => {
  const [report, setReport] = useState<HealthReportData | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const patientId = sessionStorage.getItem('patientId');
    if (!patientId) {
      navigate('/login');
      return;
    }

    fetch(`http://localhost:3001/liverData/?Patient_ID=${patientId}`)
      .then((res) => res.json())
      .then((data: Patient[]) => {
        const patient = data[0];
        setPatientData(patient);

        setReport({
          patientName: patient?.Name ?? 'Unknown',
          age: patient?.Age ?? 0,
          assessmentDate: patient?.Report_Date ?? '',
          riskScore: patient?.riskScore ?? 0,
          keyFindings: [
            'Elevated bilirubin levels (2.5 mg/dL)',
            'Normal albumin levels',
            'Platelet count within range',
            'Slightly elevated prothrombin time',
          ],
          recommendations: [
            'Regular monitoring of liver function tests',
            'Maintain healthy diet and exercise routine',
            'Avoid alcohol consumption',
            'Schedule follow-up in 3 months',
          ],
          nextSteps: [
            'Book appointment with hepatologist',
            'Complete follow-up blood tests',
            'Join liver health support group',
            'Download patient education materials',
          ],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);

  const generatePDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(20);
    doc.text('Liver Health Assessment Report', 20, yPos);
    yPos += 20;

    doc.setFontSize(12);
    doc.text(`Patient: ${report.patientName}`, 20, yPos);
    doc.text(`Age: ${report.age}`, 20, yPos + 10);
    doc.text(`Assessment Date: ${report.assessmentDate}`, 20, yPos + 20);
    doc.text(`Risk Score: ${(report.riskScore).toFixed(1)}%`, 20, yPos + 30);
    yPos += 50;

    const addSection = (title: string, items: string[]) => {
      doc.setFontSize(14);
      doc.text(title, 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      items.forEach((item) => {
        doc.text(`• ${item}`, 25, yPos);
        yPos += 10;
      });
      yPos += 10;
    };

    addSection('Key Findings', report.keyFindings);
    addSection('Recommendations', report.recommendations);
    addSection('Next Steps', report.nextSteps);

    const patientId = sessionStorage.getItem('patientId') ?? 'report';
    doc.save(`liver-health-report-${patientId}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Report Not Found</h2>
        <p className="text-gray-600">The requested health report could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Health Assessment Report</h1>
        <button
          onClick={generatePDF}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Download className="h-5 w-5" />
          <span>Download PDF</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Patient Name</p>
              <p className="font-medium">{patientData?.Name ?? 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Assessment Date</p>
              <p className="font-medium">{patientData?.Report_Date ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h2>
        <div className="flex items-center space-x-4">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Cirrhosis Risk Score</p>
            <p className={`text-2xl font-bold ${
              (patientData?.riskScore ?? 0) > 70 ? 'text-red-600' :
              (patientData?.riskScore ?? 0) > 40 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {(patientData?.riskScore ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <ReportSection
          title="Key Findings"
          items={report.keyFindings}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
        />
        <ReportSection
          title="Recommendations"
          items={report.recommendations}
          icon={<FileText className="h-6 w-6 text-blue-600" />}
        />
      </div>

      <ReportSection
        title="Next Steps"
        items={report.nextSteps}
        icon={<FileText className="h-6 w-6 text-blue-600" />}
      />
    </div>
  );
};

const ReportSection = ({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center space-x-3 mb-4">
      {icon}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start space-x-3">
          <span className="text-blue-600 font-bold">•</span>
          <span className="text-gray-600">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default HealthReport;
