import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, GitBranch, Users, History, TestTube, Shield, Workflow } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Consistency Check",
      description: "Verify JSON structure, answer keys, and detect missing fields",
      status: "Active"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Correctness Validation",
      description: "Logic-based validation and semantic consistency checks",
      status: "Coming Soon"
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: "Peer Review Workflow",
      description: "Editor → Reviewer → Approver process with single-lock editing",
      status: "Coming Soon"
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Content Versioning",
      description: "Track changes with full snapshots and diff comparison",
      status: "Coming Soon"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Full Audit Trail",
      description: "Export logs in CSV, PDF, JSON with immutable tracking",
      status: "Coming Soon"
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Rollback Capability",
      description: "One-click restore to any previous version",
      status: "Coming Soon"
    },
    {
      icon: <TestTube className="w-6 h-6" />,
      title: "A/B Testing Engine",
      description: "Manual variant testing with performance tracking",
      status: "Coming Soon"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "SME Review Layer",
      description: "Expert validation before production publish",
      status: "Coming Soon"
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: "Staging → Production",
      description: "Safe deployment pipeline with automated checks",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="app-title">
                Commercial Quiz Management System
              </h1>
              <p className="mt-1 text-sm text-gray-600">Professional quiz validation and workflow management</p>
            </div>
            <Button 
              onClick={() => navigate('/quizzes')} 
              size="lg"
              data-testid="get-started-btn"
            >
              Get Started →
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4">
            Feature 1 of 9 Now Live!
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Build Reliable Quiz Content
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive validation, versioning, and workflow management for commercial quiz content
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              data-testid={`feature-card-${index}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  feature.status === "Active" 
                    ? "bg-green-100 text-green-600" 
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      feature.status === "Active" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Start creating and validating quiz content with our comprehensive consistency checking system.
            </p>
            <Button 
              onClick={() => navigate('/quizzes')} 
              size="lg" 
              className="px-8"
              data-testid="cta-get-started-btn"
            >
              Go to Quiz Management
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Commercial Quiz Management System • Feature 1: Consistency Check Active
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;