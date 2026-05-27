import { localePath } from "@shared/lib/localePath";
import { redirect } from "next/navigation";

export default async function ProfileIndexPage({ params }) {
  const { locale = "ua" } = await params;
  redirect(localePath(locale, "/profile/info"));
}
