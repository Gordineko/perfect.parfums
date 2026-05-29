"use client";

import { writeProfileOrdersCountHint } from "@widgets/profile/lib/profileListSkeletonHint";
import { useEffect } from "react";

export default function ProfileOrdersCountHint({ count }) {
  useEffect(() => {
    writeProfileOrdersCountHint(count);
  }, [count]);

  return null;
}
