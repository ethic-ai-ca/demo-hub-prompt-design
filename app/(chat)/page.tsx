import { redirect } from "next/navigation";
import { PI_HOME_PATH } from "@/lib/constants";

export default function Page() {
  redirect(PI_HOME_PATH);
}
