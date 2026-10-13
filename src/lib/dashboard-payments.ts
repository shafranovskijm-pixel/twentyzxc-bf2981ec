export interface DashboardContract {
  id: string;
  client_name: string;
  contract_date: string | null;
  payment_status: string | null;
  amount: number | null;
  amount_extra: number | null;
}

export interface DashboardPaymentState {
  contract_id: string | null;
  paid_amount: number | string | null;
}

interface DashboardPaymentEntry {
  contract: DashboardContract;
  amount: number;
  source: "saved" | "legacy";
  hasUnknown: boolean;
  knownCount: number;
}

/** Saved amounts are cumulative balances, never dated receipt transactions. */
export function summarizeDashboardPayments(
  contracts: readonly DashboardContract[],
  states: readonly DashboardPaymentState[] | null,
) {
  // A failed state lookup cannot safely identify contracts still using legacy accounting.
  if (states === null) return null;

  const byContract = new Map<string, DashboardPaymentState[]>();
  for (const state of states) {
    if (!state.contract_id) continue;
    const group = byContract.get(state.contract_id) || [];
    group.push(state);
    byContract.set(state.contract_id, group);
  }

  const entries = contracts.flatMap<DashboardPaymentEntry>((contract) => {
    const saved = byContract.get(contract.id);
    if (saved) {
      let knownMinor = 0;
      let knownCount = 0;
      let hasUnknown = false;
      for (const state of saved) {
        const amount = state.paid_amount === null ? NaN : Number(state.paid_amount);
        if (!Number.isFinite(amount) || amount < 0) {
          hasUnknown = true;
        } else {
          knownMinor += Math.round(amount * 100);
          knownCount += 1;
        }
      }
      // One contract state OR sibling invoice states: sum siblings without losing unknowns.
      return [{ contract, amount: knownMinor / 100, source: "saved" as const, hasUnknown, knownCount }];
    }
    if (contract.payment_status !== "оплачено") return [];
    const amount = (Number(contract.amount) || 0) + (Number(contract.amount_extra) || 0);
    return [{ contract, amount, source: "legacy" as const, hasUnknown: false, knownCount: 0 }];
  });

  const savedMinor = entries.filter((entry) => entry.source === "saved")
    .reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0);
  const legacyMinor = entries.filter((entry) => entry.source === "legacy")
    .reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0);

  return {
    entries,
    savedAmount: savedMinor / 100,
    legacyAmount: legacyMinor / 100,
    total: (savedMinor + legacyMinor) / 100,
    unknownContracts: entries.filter((entry) => entry.hasUnknown).length,
    knownStateCount: entries.reduce((sum, entry) => sum + entry.knownCount, 0),
    legacyEstimateCount: entries.filter((entry) => entry.source === "legacy").length,
  };
}
