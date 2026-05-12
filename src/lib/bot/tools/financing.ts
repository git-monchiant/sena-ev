import "server-only";

/**
 * Standard amortization formula.
 */
export function calculateFinancing(p: {
  priceBaht: number;
  downPercent: number;
  months: number;
  interestRatePct: number;
}) {
  const price = Math.max(0, p.priceBaht);
  const downPct = Math.max(0, Math.min(100, p.downPercent));
  const months = Math.max(1, Math.round(p.months));
  const rate = Math.max(0, p.interestRatePct);

  const downAmount = (price * downPct) / 100;
  const loanAmount = price - downAmount;
  const monthlyRate = rate / 100 / 12;

  const monthly =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -months));
  const totalPayment = monthly * months;
  const totalInterest = totalPayment - loanAmount;

  return {
    down_amount_baht: Math.round(downAmount),
    loan_amount_baht: Math.round(loanAmount),
    monthly_baht: Math.round(monthly),
    total_payment_baht: Math.round(totalPayment),
    total_interest_baht: Math.round(totalInterest),
    months,
    interest_rate_pct: rate,
    down_percent: downPct,
  };
}
