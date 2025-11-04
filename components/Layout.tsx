// components/Layout.tsx (or wherever you define the app shell)
import * as React from "react";
import CollapsibleSidebar from "../components/CollapsibleSidebar";
import AppSidebar from "../components/AppSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CollapsibleSidebar sidebar={<AppSidebar />}>{children}</CollapsibleSidebar>;
}