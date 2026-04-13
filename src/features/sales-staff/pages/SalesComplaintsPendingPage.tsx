import StaffComplaintsPage from "../../complaint/pages/StaffComplaintsPage";
import SalesStaffPageShell from "../components/SalesStaffPageShell";

export default function SalesComplaintsPendingPage() {
  return (
    <SalesStaffPageShell>
      <StaffComplaintsPage mode="pending" />
    </SalesStaffPageShell>
  );
}
