import { Metadata } from "next";
import { EnterpriseConfigurator } from "./enterprise-client";

export const metadata: Metadata = {
  title: "Enterprise Plan Builder | Stone AI",
  description:
    "Configure your custom enterprise plan. Select seats, API limits, support tier, and more — get instant pricing.",
};

export default function EnterprisePage() {
  return <EnterpriseConfigurator />;
}
