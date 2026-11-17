import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const GEOGRAPHIES = [
  {
    id: "usa",
    title: "United States",
    where: "The provider processes prompts and files in the United States.",
    means: "Your messages are handled by a company in the United States.",
    laws: "Data processed there can be subject to US law, including lawful demands under the CLOUD Act and other US legal process, even if you live elsewhere.",
  },
  {
    id: "eu",
    title: "European Union",
    where: "The provider processes prompts and files in the European Union.",
    means: "Your messages are handled by a company in the European Union.",
    laws: "Data can stay in the EU, and GDPR gives rights to access, correct, and delete personal data. The catalog of models is smaller, and a provider can still use subprocessors outside the EU if the contract allows it.",
  },
  {
    id: "china",
    title: "China",
    where: "The provider processes prompts and files in China.",
    means: "Your messages are handled by a company in China.",
    laws: "That processing is subject to Chinese law, including the Cybersecurity Law, the Data Security Law, and the Personal Information Protection Law. State authorities can require access. If you are outside China, sending data there is a cross-border transfer.",
  },
  {
    id: "canada",
    title: "Canada",
    where:
      "Cohere is headquartered in Canada. Where a given deployment stores data depends on that provider's hosting, so this does not mean all data stays in Canada.",
    means: "Your messages are handled by a company headquartered in Canada.",
    laws: "PIPEDA is the federal privacy law. Confirm where a deployment stores data in that provider's hosting terms.",
  },
  {
    id: "russia",
    title: "Russia",
    where:
      "Russian providers process prompts and files in Russia, which requires personal data of Russian citizens to be stored on servers in Russia.",
    means:
      "Your messages are handled by a provider in Russia, with strong Russian-language and local business and legal context.",
    laws: "Processing is subject to Russian law and state access (for example SORM surveillance requirements). Some Western services and chips are restricted by sanctions.",
  },
  {
    id: "india",
    title: "India",
    where: "Indian providers process prompts and files in India, under the Digital Personal Data Protection Act, 2023.",
    means:
      "Your messages are handled by a provider in India, with strong support for 22 Indian languages, Hinglish, and voice-first use.",
    laws: "Government access can be required under Indian law (for example IT Act section 69), and the DPDP Act's rules are still being implemented.",
  },
  {
    id: "latin-america",
    title: "Latin America",
    where:
      "Processing depends on the provider and country. Brazil, Chile, Mexico, Argentina, and others each have their own personal-data laws. No single rule covers all of them.",
    means:
      "Your messages are handled by a provider in one of those countries. Models are trained on Spanish, Portuguese, and Indigenous languages, and on regional legal and cultural context.",
    laws: "Brazil has the LGPD, Mexico the LFPDPPP, Argentina Law 25.326, and Chile its own personal data law. Protection and oversight vary by country, and the open-weight and smaller-budget models may have fewer safety guardrails and less support.",
  },
] as const

export default function DataResidencyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <p className="text-sm text-muted-foreground">
          This is not legal advice; laws change, and a lawyer in your country should be asked before relying on it.
        </p>

        <div className="space-y-4">
          {GEOGRAPHIES.map((geography) => (
            <Card key={geography.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{geography.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Where it goes. </span>
                  {geography.where}
                </p>
                <p>
                  <span className="font-medium text-foreground">What this means. </span>
                  {geography.means}
                </p>
                <p>
                  <span className="font-medium text-foreground">Laws. </span>
                  {geography.laws}
                </p>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">OpenAI-compatible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You choose the base URL, so the country is wherever that endpoint is hosted, and the risks are the
                risks of that host&apos;s country.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
