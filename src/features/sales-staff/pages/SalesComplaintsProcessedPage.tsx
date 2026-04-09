import StaffComplaintsPage from "../../complaint/pages/StaffComplaintsPage";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

export default function SalesComplaintsProcessedPage() {
  return (
    <SalesStaffPageShell>
      <StaffComplaintsPage mode="processed" />
    </SalesStaffPageShell>
  );
}
