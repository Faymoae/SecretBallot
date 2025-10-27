"use client";

/**
 * Proposal Details Page
 * Displays detailed information about a proposal and allows voting
 */

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSecretBallot } from "@/hooks/useSecretBallot";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";

export default function ProposalDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const proposalId = parseInt(params.id as string);
  
  const { account, provider, signer, chainId, isConnected, connect } = useMetaMaskProvider();
  const { getProposal, vote, hasVoted, getResults, requestDecryption, fulfillDecryption } = useSecretBallot(provider, signer, chainId);
  const toast = useToast();
  
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUserVoted, setHasUserVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [results, setResults] = useState<number[]>([]);

  const loadProposal = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 Loading proposal ${proposalId}...`);
      const data = await getProposal(proposalId);
      setProposal(data);
      console.log("✅ Proposal loaded:", data);

      // Load results if decrypted
      if (data && data.decrypted) {
        const resultsData = await getResults(proposalId);
        if (resultsData) {
          setResults(resultsData.map((r: any) => Number(r)));
        }
      }
    } catch (error) {
      console.error("❌ Failed to load proposal:", error);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, getProposal, getResults]);

  const checkVoteStatus = useCallback(async () => {
    if (!account) return;
    try {
      const voted = await hasVoted(proposalId, account);
      setHasUserVoted(voted);
    } catch (error) {
      console.error("Failed to check vote status:", error);
    }
  }, [proposalId, account, hasVoted]);

  // Load proposal details
  useEffect(() => {
    if (isConnected && !isNaN(proposalId)) {
      loadProposal();
    }
  }, [isConnected, proposalId, loadProposal]);

  // Check if user has voted
  useEffect(() => {
    if (isConnected && account && !isNaN(proposalId)) {
      checkVoteStatus();
    }
  }, [isConnected, account, proposalId, checkVoteStatus]);

  const handleVote = async () => {
    if (selectedOption === null) {
      toast.warning(t("vote.selectOption"));
      return;
    }

    try {
      setIsVoting(true);
      console.log(`🗳️ Voting for option ${selectedOption}...`);
      await vote(proposalId, selectedOption);
      console.log("✅ Vote cast successfully!");
      toast.success(t("vote.success"));
      setHasUserVoted(true);
      await loadProposal();
    } catch (error) {
      console.error("❌ Failed to vote:", error);
      toast.error(`${t("vote.error")}: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDecrypt = async () => {
    try {
      setIsDecrypting(true);
      
      // Step 1: Request decryption (emits event)
      console.log(`🔓 Requesting decryption for proposal ${proposalId}...`);
      await requestDecryption(proposalId);
      console.log("✅ Decryption requested!");
      
      // Step 2: For localhost, automatically fulfill decryption (simulate oracle)
      if (chainId === 31337 && fulfillDecryption) {
        toast.info("🔓 Decrypting votes... (this may take a moment)");
        console.log("🔓 Fulfilling decryption (simulating oracle)...");
        await fulfillDecryption(proposalId);
        console.log("✅ Decryption completed!");
        toast.success("🎉 " + t("results.decryptionRequested") + " - Results revealed!");
        // Reload proposal immediately
        await loadProposal();
      } else {
        // For real networks, oracle will handle it
        toast.info(t("results.decryptionRequested") + " - Please wait for oracle to process...");
        // Reload proposal after a delay
        setTimeout(() => loadProposal(), 5000);
      }
    } catch (error) {
      console.error("❌ Failed to decrypt:", error);
      toast.error(`Failed to decrypt: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h2 className="text-2xl font-bold mb-4">{t("wallet.noWallet")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please connect your wallet to view proposal details
          </p>
          <button
            onClick={() => connect()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("wallet.connect")}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold mb-4">Proposal Not Found</h2>
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

  const now = Math.floor(Date.now() / 1000);
  const isActive = now >= Number(proposal.startTime) && now <= Number(proposal.endTime);
  const hasEnded = now > Number(proposal.endTime);
  const notStarted = now < Number(proposal.startTime);

  const canVote = isActive && !hasUserVoted;
  const canDecrypt = hasEnded && !proposal.decrypted && proposal.creator.toLowerCase() === account?.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <span>←</span>
              <span>{t("common.back")}</span>
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("wallet.connected")}
              </div>
              <div className="font-mono text-sm">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Proposal Header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  hasEnded ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {isActive ? '🟢 Active' : hasEnded ? '⚫ Ended' : '🔵 Upcoming'}
                </span>
                <span className="text-sm text-gray-500">#{proposal.id}</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{proposal.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t("proposal.creator")}</div>
              <div className="font-mono text-sm">
                {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t("proposal.voters")}</div>
              <div className="font-semibold text-lg">{Number(proposal.totalVoters)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t("proposal.startTime")}</div>
              <div className="text-sm">
                {new Date(Number(proposal.startTime) * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t("proposal.endTime")}</div>
              <div className="text-sm">
                {new Date(Number(proposal.endTime) * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        {!hasEnded && (
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {hasUserVoted ? t("vote.voted") : t("vote.title")}
            </h2>

            {hasUserVoted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  You have already voted on this proposal
                </p>
              </div>
            ) : !isActive ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⏰</div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {notStarted ? "Voting has not started yet" : "Voting has ended"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {proposal.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedOption === index
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === index
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedOption === index && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleVote}
                  disabled={selectedOption === null || isVoting}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoting ? t("vote.voting") : t("vote.confirmVote")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("proposal.results")}</h2>
            {canDecrypt && (
              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDecrypting ? t("proposal.requesting") : t("proposal.decryptResults")}
              </button>
            )}
          </div>

          {!proposal.decrypted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-lg font-medium mb-2">{t("proposal.encrypted")}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Results are encrypted and will be revealed after the proposal ends
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposal.options.map((option: string, index: number) => {
                const votes = results[index] || 0;
                const totalVotes = results.reduce((a, b) => a + b, 0);
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {votes} {votes === 1 ? 'vote' : 'votes'} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

