'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useSimulateTransaction, useTrackTransaction } from '@/dal/app/transactions/transactions.services';
import type { ITrackTransactionResult } from '@/dal/app/transactions/transactions.types';
import { WALLET_NETWORKS, WALLET_PROVIDERS, type IWallet, type IWalletListResponse, type WalletNetwork } from '@/dal/app/wallets/wallets.types';
import { useWallets } from '@/dal/app/wallets/wallets.services';
import { formatMetaMaskNetworkSwitchMessage, getEthereumProvider, normalizeNativeTransactionValue } from '../_utils/ethereum-provider';
import { DEFAULT_BUY_FORM } from './constants';
import { resolveSimulationSummary, resolveTreasuryRecipient } from './utils';

type ProtectedBuyPageContextValue = {
  wallets: IWallet[];
  selectedWallet: IWallet | null;
  selectedWalletId: string;
  setSelectedWalletId: (value: string) => void;
  treasuryRecipient: string;
  value: string;
  setValue: (value: string) => void;
  data: string;
  setData: (value: string) => void;
  assetCode: string;
  setAssetCode: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  operationId: string;
  setOperationId: (value: string) => void;
  txHash: string;
  setTxHash: (value: string) => void;
  simulationSummary: string;
  simulationStateLabel: string;
  simulationAllowed: boolean;
  lastTrackStatus: string | null;
  canSimulate: boolean;
  canTrack: boolean;
  isSimulating: boolean;
  isTracking: boolean;
  isBroadcastingMetaMask: boolean;
  runSimulation: () => Promise<void>;
  runTracking: () => Promise<ITrackTransactionResult | null>;
  buyWithMetaMask: () => Promise<void>;
};

const ProtectedBuyPageContext = createContext<ProtectedBuyPageContextValue | null>(null);

export function ProtectedBuyPageProvider(props: {
  children: ReactNode;
  initialWallets: IWalletListResponse;
}) {
  const walletsQuery = useWallets(props.initialWallets);
  const simulateMutation = useSimulateTransaction();
  const trackMutation = useTrackTransaction();

  const [selectedWalletId, setSelectedWalletIdState] = useState('');
  const [value, setValueState] = useState<string>(DEFAULT_BUY_FORM.value);
  const [data, setDataState] = useState<string>(DEFAULT_BUY_FORM.data);
  const [assetCode, setAssetCodeState] = useState<string>(DEFAULT_BUY_FORM.assetCode);
  const [amount, setAmountState] = useState<string>(DEFAULT_BUY_FORM.amount);
  const [operationId, setOperationIdState] = useState<string>(DEFAULT_BUY_FORM.operationId);
  const [txHash, setTxHashState] = useState<string>(DEFAULT_BUY_FORM.txHash);
  const [lastTrackStatus, setLastTrackStatus] = useState<string | null>(null);
  const [isBroadcastingMetaMask, setIsBroadcastingMetaMask] = useState(false);

  const wallets = walletsQuery.data?.items ?? [];
  const selectedWallet = wallets.find(wallet => wallet.id === selectedWalletId) ?? wallets[0] ?? null;
  const treasuryRecipient = useMemo(
    () => resolveTreasuryRecipient(selectedWallet?.network),
    [selectedWallet?.network],
  );
  const canSimulate = Boolean(selectedWallet && treasuryRecipient.trim());

  const invalidateSimulation = () => {
    simulateMutation.reset();
    setLastTrackStatus(null);
  };

  const simulationSummary = useMemo(
    () => resolveSimulationSummary(simulateMutation.data),
    [simulateMutation.data],
  );

  const runSimulation = async () => {
    if (!selectedWallet || !treasuryRecipient.trim()) {
      return;
    }

    await simulateMutation.mutateAsync({
      walletId: selectedWallet.id,
      network: selectedWallet.network,
      chainId: selectedWallet.chainId,
      to: treasuryRecipient,
      value: value || undefined,
      data: data || undefined,
    }).catch(() => undefined);
  };

  const runTracking = async () => {
    if (!selectedWallet) {
      return null;
    }

    if (!simulateMutation.data?.allowed || !simulateMutation.data.simulationId) {
      toast.error('Transaction check is missing. Run the check again.');
      return null;
    }

    const tracked = await trackMutation.mutateAsync({
      walletId: selectedWallet.id,
      network: selectedWallet.network,
      chainId: selectedWallet.chainId,
      assetCode,
      amount,
      simulationId: simulateMutation.data.simulationId,
      to: treasuryRecipient,
      value: value || undefined,
      data: data || undefined,
      operationId: operationId || undefined,
      txHash: txHash || undefined,
    }).catch(() => null);

    if (tracked) {
      setLastTrackStatus(tracked.status);
    }

    return tracked;
  };

  const buyWithMetaMask = async () => {
    if (
      !selectedWallet
      || !treasuryRecipient.trim()
      || selectedWallet.provider !== WALLET_PROVIDERS.METAMASK
    ) {
      return;
    }

    const simulation = await simulateMutation.mutateAsync({
      walletId: selectedWallet.id,
      network: selectedWallet.network,
      chainId: selectedWallet.chainId,
      to: treasuryRecipient,
      value: value || undefined,
      data: data || undefined,
    }).catch(() => null);

    if (!simulation?.allowed || !simulation.simulationId) {
      return;
    }

    const ethereum = getEthereumProvider();
    if (!ethereum) {
      toast.error('MetaMask not available');
      return;
    }

    setIsBroadcastingMetaMask(true);

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const account = String(accounts[0] ?? '').toLowerCase();
      if (!account || account !== selectedWallet.address.toLowerCase()) {
        toast.error('Connected MetaMask account does not match selected wallet');
        return;
      }

      const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
      const chainId = Number.parseInt(chainHex, 16);
      if (chainId !== selectedWallet.chainId) {
        toast.error(formatMetaMaskNetworkSwitchMessage(resolveWalletNetworkLabel(selectedWallet.network)));
        return;
      }

      let normalizedValue: string;
      try {
        normalizedValue = normalizeNativeTransactionValue(value);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Transaction value is invalid.');
        return;
      }

      const broadcast = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: treasuryRecipient,
          value: normalizedValue,
          data: data || undefined,
        }],
      }) as string;

      setTxHashState(broadcast);

      const tracked = await trackMutation.mutateAsync({
        walletId: selectedWallet.id,
        network: selectedWallet.network,
        chainId: selectedWallet.chainId,
        assetCode,
        amount,
        simulationId: simulation.simulationId,
        to: treasuryRecipient,
        value: value || undefined,
        data: data || undefined,
        txHash: broadcast,
      }).catch(() => null);

      if (tracked) {
        setLastTrackStatus(tracked.status);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'MetaMask send failed');
    } finally {
      setIsBroadcastingMetaMask(false);
    }
  };

  const contextValue: ProtectedBuyPageContextValue = {
    wallets,
    selectedWallet,
    selectedWalletId: selectedWallet?.id ?? '',
    setSelectedWalletId: nextValue => {
      invalidateSimulation();
      setSelectedWalletIdState(nextValue);
    },
    treasuryRecipient,
    value,
    setValue: nextValue => {
      invalidateSimulation();
      setValueState(nextValue);
    },
    data,
    setData: nextValue => {
      invalidateSimulation();
      setDataState(nextValue);
    },
    assetCode,
    setAssetCode: nextValue => setAssetCodeState(nextValue.toUpperCase()),
    amount,
    setAmount: nextValue => setAmountState(nextValue),
    operationId,
    setOperationId: nextValue => setOperationIdState(nextValue),
    txHash,
    setTxHash: nextValue => setTxHashState(nextValue),
    simulationSummary,
    simulationStateLabel: simulateMutation.data?.allowed
      ? 'PASS'
      : simulateMutation.data
        ? 'BLOCKED'
        : 'Not run',
    simulationAllowed: Boolean(simulateMutation.data?.allowed),
    lastTrackStatus,
    canSimulate,
    canTrack: Boolean(
      selectedWallet
      && simulateMutation.data?.allowed
      && simulateMutation.data?.simulationId,
    ),
    isSimulating: simulateMutation.isPending,
    isTracking: trackMutation.isPending,
    isBroadcastingMetaMask,
    runSimulation,
    runTracking,
    buyWithMetaMask,
  };

  return (
    <ProtectedBuyPageContext.Provider value={contextValue}>
      {props.children}
    </ProtectedBuyPageContext.Provider>
  );
}

export function useProtectedBuyPage() {
  const context = useContext(ProtectedBuyPageContext);

  if (!context) {
    throw new Error('useProtectedBuyPage must be used within ProtectedBuyPageProvider');
  }

  return context;
}

function resolveWalletNetworkLabel(network: WalletNetwork): string {
  if (network === WALLET_NETWORKS.BASE_SEPOLIA) {
    return 'Base Sepolia';
  }

  if (network === WALLET_NETWORKS.ETH_SEPOLIA) {
    return 'Ethereum Sepolia';
  }

  return network;
}
