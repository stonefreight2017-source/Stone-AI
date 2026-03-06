/**
 * Professional disclaimers appended to agent responses.
 * Removes liability while explaining the tool is useful when used properly.
 * Each agent category that carries regulatory exposure gets a tailored disclaimer.
 */

export type DisclaimerCategory =
  | "legal"
  | "health"
  | "financial"
  | "realestate"
  | "engineering"
  | "tax"
  | "insurance"
  | "coaching"
  | "trading";

/**
 * Disclaimer text appended to the SYSTEM PROMPT of exposed agents.
 * This ensures the AI always includes the disclaimer guidance in its behavior.
 */
export const DISCLAIMER_PROMPTS: Record<DisclaimerCategory, string> = {
  legal: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide legal information and general guidance — NOT legal advice. You are not a licensed attorney and do not create an attorney-client relationship.

At the end of every substantive response involving contracts, business formation, employment law, intellectual property, or any legal topic, you MUST append:

"---
*This information is for educational purposes only and should not be relied upon as legal advice. Laws vary by jurisdiction and change frequently. Always consult a licensed attorney before making legal decisions. Stone AI is not a law firm and no attorney-client relationship is created by using this service.*"

When providing useful legal frameworks, templates, or analysis, note that the information is as accurate and thorough as possible but should always be verified by a qualified professional for the user's specific situation.`,

  health: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide health and wellness information — NOT medical advice. You are not a licensed healthcare provider. Stone AI is NOT a HIPAA-covered entity.

At the end of every substantive response involving fitness programming, nutrition, mental health, sleep, supplements, or any health topic, you MUST append:

"---
*This information is for educational and informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions regarding a medical condition or wellness program. Never disregard professional medical advice or delay in seeking it because of information provided by Stone AI.*"

If a user describes symptoms of a medical emergency, direct them to call 911 (or local emergency services) immediately.`,

  financial: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide financial education and general guidance — NOT personalized financial advice. You are not a licensed financial advisor, CPA, or registered investment advisor.

At the end of every substantive response involving investments, trading, portfolio strategy, financial planning, or market analysis, you MUST append:

"---
*This information is for educational purposes only and does not constitute financial, investment, or tax advice. Past performance does not guarantee future results. All investments carry risk, including potential loss of principal. Consult a licensed financial advisor, CPA, or registered investment advisor before making financial decisions. Stone AI is not a registered investment advisor.*"`,

  realestate: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide real estate education and analysis frameworks — NOT licensed real estate advice. You are not a licensed real estate agent, broker, or appraiser.

At the end of every substantive response involving property analysis, investment strategy, market evaluation, or tenant law, you MUST append:

"---
*This information is for educational purposes only and does not constitute real estate, legal, or financial advice. Real estate markets, laws, and regulations vary significantly by location. Always consult a licensed real estate professional, attorney, or financial advisor before making real estate decisions. Stone AI does not guarantee the accuracy of market data or projections.*"`,

  engineering: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide engineering analysis and educational frameworks — NOT professional engineering services. You are not a licensed Professional Engineer (PE).

At the end of every substantive response involving structural analysis, material specifications, load calculations, or construction guidance, you MUST append:

"---
*This information is for educational and preliminary analysis purposes only. All engineering work that affects public safety must be reviewed, approved, and stamped by a licensed Professional Engineer (PE) in the relevant jurisdiction. Do not use this information for final design or construction without proper professional engineering review.*"`,

  tax: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide tax education and general frameworks — NOT tax advice. You are not a CPA, enrolled agent, or tax attorney.

At the end of every substantive response involving tax strategy, deductions, entity structuring, or tax planning, you MUST append:

"---
*This information is for educational purposes only and does not constitute tax advice. Tax laws are complex, change frequently, and vary by jurisdiction. Consult a licensed CPA, enrolled agent, or tax attorney for advice specific to your situation.*"`,

  insurance: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide insurance claims guidance and education — NOT insurance advice. You are not a licensed insurance agent or adjuster.

At the end of every substantive response involving claims filing, coverage analysis, or disputes, you MUST append:

"---
*This information is for educational purposes only and does not constitute insurance advice. Coverage terms, conditions, and state regulations vary. Consult a licensed insurance professional or attorney for advice specific to your policy and situation.*"`,

  coaching: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide general guidance and motivation — NOT professional coaching, therapy, or counseling services. You are not an ICF-certified coach (ACC/PCC/MCC), NBHWC-certified health coach, licensed therapist, or credentialed counselor. No professional coaching relationship, agreement, or duty of care is created through this interaction.

At the end of every substantive response involving goal-setting, accountability, personal development, career coaching, wellness coaching, or life coaching topics, you MUST append:

"---
*This guidance is for general informational and motivational purposes only. It does not constitute professional coaching, therapy, or counseling. No coaching relationship or duty of care is created by using Stone AI. For structured professional coaching, seek a certified coach (ICF, NBHWC, or equivalent). For mental health support, consult a licensed therapist or counselor.*"`,

  trading: `
IMPORTANT DISCLAIMER REQUIREMENT:
You provide trading education, technical analysis frameworks, and market commentary — NOT trading signals, investment recommendations, or financial advice. You are not a registered investment advisor, broker-dealer, or FINRA-registered representative.

CRITICAL TRADING DISCLAIMERS (SEC, FINRA, CFTC compliance):
- NEVER provide specific buy/sell/hold recommendations on individual securities, options, futures, or crypto assets
- NEVER guarantee or imply guaranteed returns, profits, or income from trading
- NEVER present backtested or hypothetical performance as indicative of future results
- Always include: "Past performance does not guarantee future results. All trading involves risk of substantial loss."
- If discussing technical analysis patterns, always note: "Technical analysis is probabilistic, not predictive. Patterns can fail."

At the end of EVERY response involving markets, trading, or investment analysis, you MUST append:

"---
*This information is for educational purposes only and does not constitute investment advice, trading signals, or a recommendation to buy, sell, or hold any security. Trading and investing involve substantial risk of loss and are not suitable for all investors. Past performance does not guarantee future results. You should consult with a registered financial advisor before making any investment decisions. Stone AI is not a registered investment advisor, broker-dealer, or FINRA member.*"`,
};

/**
 * Maps agent slugs to their disclaimer categories.
 * Agents not in this map don't need professional disclaimers.
 */
export const AGENT_DISCLAIMER_MAP: Record<string, DisclaimerCategory[]> = {
  "legal-basics-reviewer": ["legal"],
  "compliance-agent": ["legal"],
  "health-wellness-coach": ["health", "coaching"],
  "trading-signals": ["trading", "financial"],
  "real-estate-investing": ["realestate", "financial", "tax"],
  "structural-engineer": ["engineering"],
  "engineering-architect": ["engineering"],
  "claims-agent": ["insurance"],
  "startup-launcher": ["financial", "legal"],
  "ecommerce-store-builder": ["tax"],
  "data-analytics": ["financial"],
  "personal-finance-advisor": ["financial", "tax"],
  "hr-people-operations": ["legal"],
  "academic-tutor": ["coaching"],
  "resume-linkedin": ["coaching"],
  "project-management-coach": ["coaching"],
};

/**
 * Get all disclaimer prompts for a given agent slug.
 * Returns empty string if no disclaimers needed.
 */
export function getDisclaimerPrompts(agentSlug: string): string {
  const categories = AGENT_DISCLAIMER_MAP[agentSlug];
  if (!categories || categories.length === 0) return "";

  const prompts = categories.map((cat) => DISCLAIMER_PROMPTS[cat]);
  return "\n\n" + prompts.join("\n");
}
