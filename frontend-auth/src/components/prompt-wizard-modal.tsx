"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  FileText,
  Target,
  Lightbulb,
  StickyNote
} from "lucide-react";
import { Button } from "./ui";
import { createAgenticPrompt, AgenticPrompt } from "../lib/api";

interface PromptWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prompt: AgenticPrompt) => void;
}

const steps = [
  { id: 1, title: "Input", icon: FileText, question: "What will be the input for this tool?" },
  { id: 2, title: "Output", icon: Target, question: "What will be the output for this tool?" },
  { id: 3, title: "Purpose", icon: Lightbulb, question: "What is the reason for creating this agentic tool?" },
  { id: 4, title: "Notes", icon: StickyNote, question: "Are there any specific notes that need to be added?" },
];

export default function PromptWizardModal({ isOpen, onClose, onSuccess }: PromptWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    input_description: "",
    output_description: "",
    purpose: "",
    notes: "",
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generatePromptContent = () => {
    return `# ${formData.name || "Agent"} Agent

You are an expert AI agent specialized in ${formData.purpose || "performing tasks"}.

## Input
${formData.input_description || "Any relevant input data"}

## Expected Output
${formData.output_description || "Expected result or action"}

## Process
1. Analyze the input carefully
2. Process according to the requirements
3. Generate the expected output
4. Handle any errors gracefully

${formData.notes ? `## Notes\n${formData.notes}` : ""}

## Constraints
- Follow best practices
- Provide clear, actionable outputs
- Handle edge cases appropriately
`;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Please enter a name for the prompt");
      return;
    }
    if (!formData.purpose.trim()) {
      setError("Please specify the purpose");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const prompt_content = generatePromptContent();
      
      const newPrompt = await createAgenticPrompt({
        name: formData.name,
        description: `${formData.purpose}`,
        prompt_content,
        input_description: formData.input_description,
        output_description: formData.output_description,
        purpose: formData.purpose,
        notes: formData.notes,
      });

      onSuccess(newPrompt);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to create prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      input_description: "",
      output_description: "",
      purpose: "",
      notes: "",
    });
    setError("");
    onClose();
  };

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-4 rounded-3xl bg-[#0a0a0b] border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Agentic Prompt</h2>
                  <p className="text-xs text-white/40">Step {currentStep} of {steps.length}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-3 bg-white/[0.02]">
              <div className="flex gap-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      step.id <= currentStep ? "bg-purple-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <StepIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{currentStepData.question}</h3>
                  </div>

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Prompt Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., document-summarizer"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Input Description</label>
                        <textarea
                          value={formData.input_description}
                          onChange={(e) => setFormData({ ...formData, input_description: e.target.value })}
                          placeholder="What data, files, or parameters will the agent receive?"
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div>
                      <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Output Description</label>
                      <textarea
                        value={formData.output_description}
                        onChange={(e) => setFormData({ ...formData, output_description: e.target.value })}
                        placeholder="What should the agent produce? What format?"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div>
                      <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Purpose</label>
                      <textarea
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="What problem does this solve? What is the intended use case?"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div>
                      <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Additional Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any constraints, limitations, or specific requirements?"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/5">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={currentStep === 1 ? "opacity-50" : ""}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Create Prompt
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}