// @ts-nocheck
import Link from 'next/link'
import Image from 'next/image'
import { PageBackground } from "@/components/ui/page-background"
import { ArrowLeft, CheckCircle, FileText, FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, AlertCircle, ArrowRight, Clock, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { notFound } from 'next/navigation'
import ServiceSidebar from '@/components/service-sidebar'

// Define the service data
const serviceData = {
    "register-kra-pin": {
        title: "Register KRA PIN",
        icon: "file-plus",
        description: "Get your Kenya Revenue Authority Personal Identification Number quickly and easily with our streamlined process.",
        longDescription: "A KRA PIN is essential for every Kenyan citizen who wants to file tax returns, register a business, or access government services. Our simplified registration process eliminates the usual bureaucracy and paperwork, allowing you to obtain your PIN in minutes rather than days.",
        requirements: [
            "National ID or Passport",
            "Valid email address",
            "Phone number",
        ],
        steps: [
            "Fill in your personal details",
            "Upload required documents",
            "Verify your email and phone number",
            "Receive your KRA PIN instantly"
        ],
        faq: [
            {
                question: "How long does it take to get my KRA PIN?",
                answer: "With Nunge Returns, you can receive your KRA PIN within minutes of completing the application process, compared to days or weeks through traditional channels."
            },
            {
                question: "Is the KRA PIN registration process secure?",
                answer: "Yes, we implement bank-level encryption and security measures to protect your personal information throughout the registration process."
            },
            {
                question: "Do I need to visit a KRA office?",
                answer: "No, our platform allows you to complete the entire registration process online without visiting any physical office."
            }
        ],
        price: "Ksh 50",
        callToAction: "Register KRA PIN Now"
    },
    "renew-kra-password": {
        title: "Renew KRA Password",
        icon: "key",
        description: "Reset your KRA password securely without the usual hassle and delays.",
        longDescription: "Many Kenyans struggle with accessing their KRA accounts due to forgotten passwords and a cumbersome reset process. Our service simplifies password renewal, providing you with secure access to your account in minutes, not days.",
        requirements: [
            "Existing KRA PIN",
            "National ID or Passport",
            "Registered phone number"
        ],
        steps: [
            "Enter your KRA PIN and ID number",
            "Complete identity verification",
            "Create a new strong password",
            "Receive confirmation of password change",
            "Log in to your KRA account with your new password"
        ],
        faq: [
            {
                question: "How quickly can I reset my KRA password?",
                answer: "Our system processes password reset requests instantly, allowing you to regain access to your account within minutes."
            },
            {
                question: "What if I don't remember my KRA PIN?",
                answer: "We offer a PIN recovery service as well. You can use our 'Recover KRA PIN' option first, then proceed with the password reset."
            },
            {
                question: "Is the new password sent to my email?",
                answer: "No, for security reasons, you create your own new password directly on our platform. We never send passwords via email."
            }
        ],
        price: "Ksh 50",
        callToAction: "Reset KRA Password Now"
    },
    "change-kra-email": {
        title: "Change KRA Email",
        icon: "mail",
        description: "Update your registered email address with KRA in minutes without complications.",
        longDescription: "Keeping your contact information updated with KRA is essential for timely notifications and secure access to your tax account. Our service streamlines the email change process, ensuring your KRA communications are directed to your current email address.",
        requirements: [
            "Your KRA PIN",
            "Current registered email access",
            "New email address",
            "Valid ID number"
        ],
        steps: [
            "Enter your KRA credentials",
            "Specify your new email address",
            "Verify both old and new email addresses",
            "Receive confirmation of email update"
        ],
        faq: [
            {
                question: "Will I lose access to my KRA account during the email change?",
                answer: "No, your account access remains uninterrupted throughout the email change process."
            },
            {
                question: "How long does it take to update my email on KRA?",
                answer: "With our service, the email update is processed and confirmed within 30 minutes."
            },
            {
                question: "What if I no longer have access to my old email?",
                answer: "We offer an alternative verification process if you've lost access to your previously registered email. Contact our support team for assistance."
            }
        ],
        price: "Ksh 50",
        callToAction: "Update KRA Email Now"
    },
    "register-nssf": {
        title: "Register NSSF",
        icon: "shield",
        description: "Complete your National Social Security Fund registration quickly and without complications.",
        longDescription: "NSSF registration is a crucial step for securing your future through government-backed social security benefits. Our streamlined process helps you register with NSSF efficiently, ensuring compliance with Kenyan regulations while saving you time and effort.",
        requirements: [
            "National ID or Passport",
            "KRA PIN",
            "Valid phone number",
        ],
        steps: [
            "Complete the NSSF registration form",
            "Receive your NSSF membership number"
        ],
        faq: [
            {
                question: "Is NSSF registration mandatory in Kenya?",
                answer: "Yes, NSSF registration is mandatory for all employed Kenyans and voluntary for self-employed individuals."
            },
            {
                question: "How long does NSSF registration take?",
                answer: "With our service, you can complete your NSSF registration and receive your membership number within 24 hours."
            },
            {
                question: "Can I track my NSSF registration status?",
                answer: "Yes, our platform provides real-time updates on your registration progress and notifications when your membership is confirmed."
            }
        ],
        price: "Ksh 50",
        callToAction: "Register for NSSF Now"
    },
    "register-shif": {
        title: "Register SHIF",
        icon: "heart-pulse",
        description: "Get registered with the Social Health Insurance Fund easily and securely.",
        longDescription: "The Social Health Insurance Fund (SHIF) provides essential healthcare coverage for Kenyans. Our service simplifies the registration process, enabling you to secure health insurance coverage quickly and with minimal paperwork.",
        requirements: [
            "National ID or Passport",
            "KRA PIN",
            "Recent digital photo",
            "Valid phone number and email"
        ],
        steps: [
            "Fill in the SHIF registration form",
            "Upload required identification documents",
            "Complete payment and receive confirmation"
        ],
        faq: [
            {
                question: "When does my SHIF coverage begin after registration?",
                answer: "Your SHIF coverage becomes active within 48 hours of successful registration and payment confirmation."
            },
            {
                question: "Can I register my dependents under my SHIF account?",
                answer: "Yes, you can add your spouse and children as dependents during the registration process or later through your account."
            },
            {
                question: "What healthcare services are covered under SHIF?",
                answer: "SHIF covers a wide range of services including outpatient care, inpatient services, maternity care, and chronic disease management. Specific coverage details are available on the SHIF portal."
            }
        ],
        price: "Ksh 50",
        callToAction: "Register for SHIF Now"
    },
    "file-nil-returns": {
        title: "File Nil Returns",
        icon: "file-text",
        description: "Quick and easy nil returns filing for individuals and companies in just 30 seconds.",
        longDescription: "Filing tax returns is a legal obligation for all Kenyan taxpayers, even when you have no income to report. Our streamlined nil returns filing service makes compliance effortless for both individuals and companies, saving you time and ensuring you avoid penalties.",
        requirements: [
            "KRA PIN",
            "KRA iTax password",
            "Valid phone number",
            "Email address"
        ],
        steps: [
            "Log in to your Nunge Returns account",
            "Select individual or company filing",
            "Provide your KRA credentials",
            "Confirm your contact details",
            "Complete payment and receive filing confirmation"
        ],
        faq: [
            {
                question: "What is a nil return?",
                answer: "A nil return is a tax filing that indicates you had no taxable income during the reporting period. Even with zero income, filing is mandatory to maintain tax compliance."
            },
            {
                question: "How quickly can I file my nil returns?",
                answer: "With our automated system, you can complete your nil returns filing in as little as 30 seconds."
            },
            {
                question: "Will I receive a filing confirmation?",
                answer: "Yes, you'll receive an official KRA acknowledgment receipt immediately after successful filing, which you can download and save for your records."
            }
        ],
        price: "Ksh 50",
        callToAction: "File Nil Returns Now"
    }
};

export default function ServicePage({ params }) {
    const { slug } = params;
    const service = serviceData[slug];

    if (!service) {
        return notFound();
    }

    // Services for the left sidebar
    const sidebarServices = [
        { title: "Register KRA PIN", icon: "file-plus", slug: "register-kra-pin" },
        { title: "Renew KRA Password", icon: "key", slug: "renew-kra-password" },
        { title: "Change KRA Email", icon: "mail", slug: "change-kra-email" },
        { title: "File Nil Returns", icon: "file-text", slug: "file-nil-returns" },
        { title: "Register NSSF", icon: "shield", slug: "register-nssf" },
        { title: "Register SHIF", icon: "heart-pulse", slug: "register-shif" }
    ];

    return (
        <PageBackground>
            <ServiceSidebar />

            <div className="container mx-auto py-6 px-4 md:py-12">
                <Link href="/services" className="inline-flex items-center text-primary hover:underline mb-4 md:mb-8 text-sm">
                    <ArrowLeft className="mr-1 h-3 w-3 md:h-4 md:w-4" /> Back to all services
                </Link>

                <div className="grid gap-6 md:grid-cols-3 md:gap-12">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    {service.icon === "key" && <KeyIcon className="h-5 w-5 md:h-7 md:w-7" />}
                                    {service.icon === "mail" && <MailIcon className="h-5 w-5 md:h-7 md:w-7" />}
                                    {service.icon === "file-plus" && <FilePlusIcon className="h-5 w-5 md:h-7 md:w-7" />}
                                    {service.icon === "shield" && <Shield className="h-5 w-5 md:h-7 md:w-7" />}
                                    {service.icon === "heart-pulse" && <ActivityIcon className="h-5 w-5 md:h-7 md:w-7" />}
                                    {service.icon === "file-text" && <FileText className="h-5 w-5 md:h-7 md:w-7" />}
                                </div>
                                <h1 className="text-xl md:text-3xl font-bold">{service.title}</h1>
                            </div>

                            <p className="text-base md:text-xl text-muted-foreground mb-3">{service.description}</p>
                            <p className="text-sm md:text-base text-muted-foreground">{service.longDescription}</p>
                        </div>

                        <div>
                            <h2 className="text-lg md:text-xl font-bold mb-3">How It Works</h2>
                            <div className="space-y-3">
                                {service.steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-medium">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm md:text-base">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg md:text-xl font-bold mb-3">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {service.faq.map((item, index) => (
                                    <div key={index} className="border-b pb-3">
                                        <h3 className="font-medium text-sm md:text-base mb-1">{item.question}</h3>
                                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 md:pt-6">
                            <h2 className="text-lg md:text-xl font-bold mb-3">Why Choose Nunge Returns</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border rounded-lg p-3">
                                    <h3 className="font-medium text-sm mb-1">Fast & Reliable</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">Our automated system processes your requests quickly, saving you valuable time.</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <h3 className="font-medium text-sm mb-1">Secure Processing</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">Your data is protected with bank-grade encryption and security protocols.</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <h3 className="font-medium text-sm mb-1">24/7 Support</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">Our team is available around the clock to assist with any questions or issues.</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <h3 className="font-medium text-sm mb-1">Affordable Pricing</h3>
                                    <p className="text-xs md:text-sm text-muted-foreground">Competitive rates designed specifically for students and young Kenyans.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-24 bg-background border rounded-xl p-4 md:p-6 shadow-sm">
                            <h3 className="text-base md:text-lg font-bold mb-4">Service Overview</h3>

                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Requirements</h4>
                                    <ul className="space-y-2">
                                        {service.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-xs md:text-sm">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-2 border-t">
                                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Processing Time</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <Clock className="h-3 w-3 mr-1" /> Standard Processing
                                        </span>
                                        <span className="text-xs md:text-sm font-medium">30 minutes</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <Clock className="h-3 w-3 mr-1" /> Express Processing
                                        </span>
                                        <span className="text-xs md:text-sm font-medium text-primary">5 minutes</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Service Fee</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <CreditCard className="h-3 w-3 mr-1" /> One-time payment
                                        </span>
                                        <p className="text-lg md:text-2xl font-bold text-primary">{service.price}</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button size="lg" className="w-full rounded-xl text-sm" asChild>
                                        <Link href={`/checkout/${slug}`}>
                                            {service.callToAction} <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                        </Link>
                                    </Button>
                                    <p className="text-[10px] md:text-xs text-center text-muted-foreground mt-2">
                                        Secure payment • Instant processing
                                    </p>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                        <FileText className="h-3 w-3" />
                                        <span>Need help? <Link href="/contact" className="text-primary hover:underline">Contact Support</Link></span>
                                    </div>

                                    <div className="bg-primary/5 rounded-lg p-2">
                                        <p className="text-xs font-medium mb-1">Trusted by Kenyans</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="h-5 w-5 rounded-full bg-gray-300 border border-white" />
                                                ))}
                                            </div>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">Join 10,000+ satisfied customers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 md:mt-16 border-t pt-6 md:pt-8">
                    <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 text-center">Other Services You Might Need</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        {sidebarServices
                            .filter(s => s.slug !== slug)
                            .slice(0, 4)
                            .map((relatedService, index) => (
                                <Link href={`/services/${relatedService.slug}`} key={index} className="group">
                                    <div className="border rounded-lg p-3 hover:border-primary transition-colors duration-300 h-full flex flex-col items-center text-center">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                                            {relatedService.icon === "key" && <KeyIcon className="h-4 w-4" />}
                                            {relatedService.icon === "mail" && <MailIcon className="h-4 w-4" />}
                                            {relatedService.icon === "file-plus" && <FilePlusIcon className="h-4 w-4" />}
                                            {relatedService.icon === "shield" && <Shield className="h-4 w-4" />}
                                            {relatedService.icon === "heart-pulse" && <ActivityIcon className="h-4 w-4" />}
                                            {relatedService.icon === "file-text" && <FileText className="h-4 w-4" />}
                                        </div>
                                        <h3 className="font-medium text-xs md:text-sm mb-1">{relatedService.title}</h3>
                                        <p className="text-[10px] md:text-xs text-muted-foreground">Learn more</p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </PageBackground>
    );
}