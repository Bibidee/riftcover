const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-cobalt text-cobalt",
  WAITING_PERIOD: "border-fog text-fog",
  EVENT_REPORTED: "border-vermilion text-vermilion",
  EVIDENCE_OPEN: "border-vermilion text-vermilion",
  UNDER_REVIEW: "border-vermilion text-vermilion",
  CHALLENGE_WINDOW: "border-vermilion text-vermilion",
  FINALIZED_APPROVED: "border-lime text-carbon bg-lime",
  FINALIZED_REJECTED: "border-carbon text-carbon",
  FINALIZED_INCONCLUSIVE: "border-fog text-fog",
  PAID: "border-lime text-carbon bg-lime",
  EXPIRED: "border-fog text-fog",
  CANCELLED: "border-fog text-fog",
  PROPOSED_APPROVED: "border-vermilion text-vermilion",
  PROPOSED_REJECTED: "border-fog text-fog",
  PROPOSED_INCONCLUSIVE: "border-fog text-fog",
  FINAL_APPROVED: "border-lime text-carbon bg-lime",
  FINAL_REJECTED: "border-carbon text-carbon",
  PAYOUT_EXECUTED: "border-lime text-carbon bg-lime",
};

/** Text-labelled status marker — never color alone conveys state. */
export function StatusStamp({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "border-carbon text-carbon";
  return (
    <span
      className={`tag-chip inline-flex items-center gap-1.5 font-medium before:block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
