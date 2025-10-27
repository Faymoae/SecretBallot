"use client";

/**
 * My Proposals Page
 * Displays proposals created by the current user
 */

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSecretBallot } from "@/hooks/useSecretBallot";

export default function MyProposalsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { account, provider, signer, chainId, isConnected } = useMetaMaskProvider();
  const { getUserCreatedProposals, getProposal } = useSecretBallot(provider, signer, chainId);
  
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMyProposals = useCallback(async () => {
    if (!account) return;
    
    try {
      setIsLoading(true);
      console.log(`🔍 Loading proposals created by ${account}...`);
      
      const proposalIds = await getUserCreatedProposals(account);
      console.log(`📊 Found ${proposalIds.length} proposals`);
      
      if (proposalIds.length > 0) {
        const proposalPromises = proposalIds.map((id) => getProposal(Number(id)));
        const loadedProposals = await Promise.all(proposalPromises);
        setProposals(loadedProposals.filter((p): p is any => p !== null));
        console.log(`✅ Loaded ${loadedProposals.length} proposals`);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error("❌ Failed to load my proposals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account, getUserCreatedProposals, getProposal]);

  useEffect(() => {
    if (isConnected && account) {
      loadMyProposals();
    }
  }, [isConnected, account, loadMyProposals]);

  const getStatusBadge = (proposal: any) => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(proposal.startTime);
    const endTime = Number(proposal.endTime);

    if (now < startTime) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{t("proposal.notStarted")}</span>;
    } else if (now > endTime) {
      if (proposal.decrypted) {
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">{t("proposal.decrypted")}</span>;
      } else {
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">{t("proposal.ended")}</span>;
      }
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{t("proposal.active")}</span>;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">{t("wallet.connect")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to view your proposals
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
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {t("history.proposals")}
              </h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t("header.home")}
              </button>
              <button
                onClick={() => router.push("/my-proposals")}
                className="px-4 py-2 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg"
              >
                {t("header.myProposals")}
              </button>
              <button
                onClick={() => router.push("/my-votes")}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t("header.myVotes")}
              </button>
            </nav>
            
            {/* Back Button for Mobile */}
            <button
              onClick={() => router.push("/")}
              className="md:hidden text-primary-600 hover:text-primary-700 font-medium"
            >
              ← {t("common.back")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold mb-4">{t("history.noProposals")}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t("history.createFirst")}
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              {t("proposal.createProposal")}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="glass rounded-xl p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => router.push(`/proposal/${proposal.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold line-clamp-2">{proposal.title}</h3>
                  {getStatusBadge(proposal)}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {proposal.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("proposal.totalVotes")}:</span>
                    <span className="font-medium">{proposal.totalVoters.toString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("proposal.options")}:</span>
                    <span className="font-medium">{proposal.options.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("proposal.endTime")}:</span>
                    <span className="font-medium">
                      {new Date(Number(proposal.endTime) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <button
                  className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/proposal/${proposal.id}`);
                  }}
                >
                  {t("proposal.viewDetails")}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

