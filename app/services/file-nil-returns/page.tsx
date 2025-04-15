import Link from 'next/link'
import { PageBackground } from "@/components/ui/page-background"
import { ArrowLeft, CheckCircle, FileText, UserIcon, Building2Icon, ArrowRight } from 'lucide-react'
import ServiceSidebar from '@/components/service-sidebar';

export default function FileNilReturnsPage() {
    return (
        <PageBackground>
            {/* <ServiceSidebar /> */}

            <div className="container mx-auto py-2 px-4">
                <Link href="/services" className="inline-flex items-center text-primary hover:underline mb-4 text-sm">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to all services
                </Link>

                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-bold">File Nil Returns</h1>
                    </div>

                    <p className="text-base text-muted-foreground mb-5">
                        Quick and easy nil returns filing in just 30 seconds. Select individual or company filing.
                    </p>

                    <div className="grid gap-5 md:grid-cols-2 mt-6">
                        <Link href="/file?type=individual">
                            <div className="border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all duration-300 bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Individual Filing</h2>
                                </div>

                                <p className="text-muted-foreground mb-3 text-sm">
                                    File your personal nil returns quickly. Suitable for students, unemployed individuals, or anyone without taxable income.
                                </p>

                                <ul className="space-y-2 mb-4">
                                    {["KRA PIN (A-series)", "KRA iTax password", "Valid phone number"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="font-bold">KES 50</span>
                                    <span className="text-primary text-sm inline-flex items-center">
                                        Proceed <ArrowRight className="ml-1 h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>

                        <Link href="/file?type=company">
                            <div className="border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all duration-300 bg-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                        <Building2Icon className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-lg font-bold">Company Filing</h2>
                                </div>

                                <p className="text-muted-foreground mb-3 text-sm">
                                    File nil returns for your company or business entity. Perfect for newly registered businesses or those without taxable transactions.
                                </p>

                                <ul className="space-y-2 mb-4">
                                    {["KRA PIN (P-series)", "KRA iTax password", "Company registration details", "Valid contact information"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="font-bold">KES 50</span>
                                    <span className="text-primary text-sm inline-flex items-center">
                                        Proceed <ArrowRight className="ml-1 h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium mb-2 text-blue-800">Why file nil returns?</h3>
                        <p className="text-sm text-blue-700">
                            Even with zero income, failing to file returns can result in penalties from KRA. Stay compliant and avoid unnecessary fines by filing your nil returns on time.
                        </p>
                    </div>
                </div>
            </div>
        </PageBackground>
    );
}