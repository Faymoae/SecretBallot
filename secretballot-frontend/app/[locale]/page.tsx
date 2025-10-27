"use client";

/**
 * Home Page
 * Displays list of proposals and main navigation
 */

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSecretBallot } from "@/hooks/useSecretBallot";

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const { account, provider, signer, chainId, isConnected, connect, disconnect, isConnecting } = useMetaMaskProvider();
  const { getProposalCount, getProposal } = useSecretBallot(provider, signer, chainId);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      setIsLoadingProposals(true);
      console.log("🔍 Loading proposals...");
      
      const count = await getProposalCount();
      console.log(`📊 Total proposals: ${count}`);
      
      if (count > 0) {
        const proposalPromises = [];
        for (let i = 0; i < count; i++) {
          proposalPromises.push(getProposal(i));
        }
        
        const loadedProposals = await Promise.all(proposalPromises);
        setProposals(loadedProposals);
        console.log(`✅ Loaded ${loadedProposals.length} proposals`);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error("❌ Failed to load proposals:", error);
    } finally {
      setIsLoadingProposals(false);
    }
  }, [getProposalCount, getProposal]);

  // Load proposals when wallet connects
  useEffect(() => {
    if (isConnected) {
      loadProposals();
    }
  }, [isConnected, loadProposals]);

  const handleCreateProposal = () => {
    router.push("/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {t("header.title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("header.subtitle")}
              </p>
            </div>
            
            {/* Navigation - Only show when connected */}
            {isConnected && (
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t("header.home")}
                </button>
                <button
                  onClick={() => router.push("/my-proposals")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
            )}
            
            {/* Wallet Connection */}
            <div className="flex-shrink-0">
              {!isConnected ? (
                <button
                  onClick={() => connect()}
                  disabled={isConnecting}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("wallet.connected")}
                    </div>
                    <div className="font-mono text-sm">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {t("wallet.disconnect")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="glass rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">
            {t("home.welcome")} 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("home.welcomeDescription")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">Fully Private</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Votes are encrypted on-chain and hidden until decryption
              </p>
            </div>
            <div className="p-4 bg-secondary-50 dark:bg-secondary-950/30 rounded-lg">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold mb-1">Tamper-Proof</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encrypted votes cannot be manipulated or predicted
              </p>
            </div>
            <div className="p-4 bg-accent-50 dark:bg-accent-950/30 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Real-time Stats</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encrypted counting with on-demand result decryption
              </p>
            </div>
          </div>
        </div>

        {/* Proposals Section */}
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("proposal.allProposals")}</h2>
            {isConnected && (
              <button 
                onClick={handleCreateProposal}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                {t("proposal.createNew")}
              </button>
            )}
          </div>

          {isLoadingProposals ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🗳️</div>
              <p className="text-lg font-medium mb-2">{t("proposal.noProposals")}</p>
              <p className="text-sm mb-4">{t("proposal.createFirstProposal")}</p>
              {isConnected && (
                <button 
                  onClick={handleCreateProposal}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t("proposal.createProposal")}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => {
                const now = Math.floor(Date.now() / 1000);
                const isActive = now >= proposal.startTime && now <= proposal.endTime;
                const hasEnded = now > proposal.endTime;
                const notStarted = now < proposal.startTime;

                return (
                  <div key={proposal.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        hasEnded ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {isActive ? '🟢 Active' : hasEnded ? '⚫ Ended' : '🔵 Upcoming'}
                      </span>
                      <span className="text-xs text-gray-500">#{proposal.id}</span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{proposal.description}</p>

                    {/* Stats */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Options:</span>
                        <span className="font-medium">{proposal.options?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Voters:</span>
                        <span className="font-medium">{proposal.totalVoters || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Results:</span>
                        <span className={`font-medium ${proposal.decrypted ? 'text-green-600' : 'text-gray-400'}`}>
                          {proposal.decrypted ? '🔓 Decrypted' : '🔒 Encrypted'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/proposal/${proposal.id}`)}
                        className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t("footer.poweredBy")} • {t("footer.version")}</p>
        </div>
      </footer>
    </div>
  );
}


