"use client";

/**
 * Create Proposal Page
 * Form to create a new voting proposal
 */

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSecretBallot } from "@/hooks/useSecretBallot";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";

export default function CreateProposalPage() {
  const t = useTranslations();
  const router = useRouter();
  const { account, isConnected, provider, signer, chainId } = useMetaMaskProvider();
  const { createProposal } = useSecretBallot(provider, signer, chainId);
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: ["", ""],
    startTime: Math.floor(Date.now() / 1000),
    duration: 60, // Default 1 minute, will be updated based on chainId
  });

  // Check if on localhost for test mode
  const isLocalhost = chainId === 31337;

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update default duration when chainId changes
  useEffect(() => {
    if (chainId !== undefined && chainId !== null) {
      const defaultDuration = chainId === 31337 ? 60 : 7 * 24 * 3600; // 1 minute for localhost, 7 days otherwise
      setFormData(prev => ({
        ...prev,
        duration: defaultDuration
      }));
    }
  }, [chainId]);

  const handleAddOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, ""],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError(t("wallet.noWallet"));
      return;
    }

    // Validation
    if (formData.title.length === 0 || formData.title.length > 100) {
      setError("Title must be between 1 and 100 characters");
      return;
    }

    if (formData.description.length === 0 || formData.description.length > 1000) {
      setError("Description must be between 1 and 1000 characters");
      return;
    }

    const validOptions = formData.options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const endTime = formData.startTime + formData.duration;
      
      await createProposal({
        title: formData.title,
        description: formData.description,
        proposalType: 0, // SINGLE_CHOICE
        options: validOptions,
        startTime: formData.startTime,
        endTime: endTime,
        permission: 0, // PUBLIC
      });

      toast.success(t("createProposal.success"));
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      console.error("Error creating proposal:", err);
      toast.error(err.message || t("createProposal.error"));
      setError(err.message || t("createProposal.error"));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">{t("wallet.connect")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to create a proposal
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push("/")}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← {t("common.back")}
              </button>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {t("createProposal.title")}
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {t("createProposal.titleLabel")} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("createProposal.titlePlaceholder")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t("createProposal.titleHint")}</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {t("createProposal.descriptionLabel")} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("createProposal.descriptionPlaceholder")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none min-h-32"
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t("createProposal.descriptionHint")}</p>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {t("createProposal.optionsLabel")} *
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={t("createProposal.optionPlaceholder", { number: index + 1 })}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
                  maxLength={50}
                  required
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {formData.options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + {t("createProposal.addOption")}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">{t("createProposal.optionsHint")}</p>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {t("createProposal.durationLabel")}
              {isLocalhost && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
                  🧪 {t("createProposal.testMode")}
                </span>
              )}
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {isLocalhost ? (
                // Test mode: short durations for testing
                <>
                  <option value={60}>1 {t("createProposal.minutes")}</option>
                  <option value={180}>3 {t("createProposal.minutes")}</option>
                  <option value={300}>5 {t("createProposal.minutes")}</option>
                  <option value={600}>10 {t("createProposal.minutes")}</option>
                  <option value={1800}>30 {t("createProposal.minutes")}</option>
                  <option value={3600}>1 {t("createProposal.hours")}</option>
                </>
              ) : (
                // Production mode: normal durations
                <>
                  <option value={3600}>1 {t("createProposal.hours")}</option>
                  <option value={86400}>1 {t("createProposal.days")}</option>
                  <option value={259200}>3 {t("createProposal.days")}</option>
                  <option value={604800}>7 {t("createProposal.days")}</option>
                  <option value={1209600}>14 {t("createProposal.days")}</option>
                  <option value={2592000}>30 {t("createProposal.days")}</option>
                </>
              )}
            </select>
            {isLocalhost && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ⚡ {t("createProposal.testModeHint")}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? t("createProposal.creating") : t("common.create")}
            </button>
          </div>
        </form>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

