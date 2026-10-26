import { redirect } from "next/navigation";

// Step 1 of the build: the fold test is the whole app for now.
// The Start screen replaces this in step 6.
export default function Home() {
  redirect("/fold-test");
}
