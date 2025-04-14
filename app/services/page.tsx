import Link from 'next/link'
import { PageBackground } from "@/components/ui/page-background"
import { FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, FileText } from 'lucide-react'
import ServiceSidebar from '@/components/service-sidebar';

export default function ServicesPage() {
    const services = [
        {
            title: "Register KRA PIN",
            description: "Get your KRA PIN quickly and easily with our streamlined process.",
            icon: "file-plus",
            slug: "register-kra-pin",
            price: "KES 50",
            benefits: ["Fast processing", "No paperwork", "Step-by-step guidance"]
        },
        {
            title: "Renew KRA Password",
            description: "Reset your KRA password securely without the usual hassle.",
            icon: "key",
            slug: "renew-kra-password",
            price: "KES 50",
            benefits: ["Instant reset", "Bank-level security", "24/7 availability"]
        },
        {
            title: "File Nil Returns",
            description: "Quick and easy nil returns filing for individuals and companies.",
            icon: "file-text",
            slug: "file-nil-returns",
            price: "KES 50",
            benefits: ["30-second filing", "Automatic compliance", "Digital receipts"]
        },
        {
            title: "Change KRA Email",
            description: "Update your registered email address with KRA in minutes.",
            icon: "mail",
            slug: "change-kra-email",
            price: "KES 50",
            benefits: ["Simple verification", "Automated confirmation", "Secure process"]
        },
        {
            title: "Register NSSF",
            description: "Complete your NSSF registration quickly and without complications.",
            icon: "shield",
            slug: "register-nssf",
            price: "KES 50",
            benefits: ["Compliance assured", "Digital certificates", "Future-proof setup"]
        },
        {
            title: "Register SHIF",
            description: "Get registered with the Social Health Insurance Fund easily.",
            icon: "heart-pulse",
            slug: "register-shif",
            price: "KES 50",
            benefits: ["Immediate activation", "Paperless process", "Full compliance"]
        }
    ];

    return (
        <PageBackground>
            <div className="mx-auto max-w-6xl space-y-8 px-4">
                <div className="text-center mb-8 md:mb-12">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tighter sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600">
                        Our Services
                    </h1>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Simplify your tax compliance journey with our range of specialized services designed for Kenyan youth and students.
                    </p>
                </div>
                {/* <ServiceSidebar /> */}

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {services.map((service, index) => (
                        <Link href={`/services/${service.slug}`} key={index}>
                            <div className="group relative overflow-hidden rounded-xl border hover:border-primary transition-all duration-300 h-full">
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="bg-background p-4 h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                            {service.icon === "key" && <KeyIcon className="h-4 w-4" />}
                                            {service.icon === "mail" && <MailIcon className="h-4 w-4" />}
                                            {service.icon === "file-plus" && <FilePlusIcon className="h-4 w-4" />}
                                            {service.icon === "shield" && <Shield className="h-4 w-4" />}
                                            {service.icon === "heart-pulse" && <ActivityIcon className="h-4 w-4" />}
                                            {service.icon === "file-text" && <FileText className="h-4 w-4" />}
                                        </div>
                                        <h3 className="text-sm font-bold leading-tight">{service.title}</h3>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-2 flex-grow">{service.description}</p>

                                    <div className="text-xs font-semibold text-primary mt-1 mb-1">{service.price}</div>

                                    <div className="text-xs mt-auto">
                                        <span className="text-primary group-hover:underline">Learn more →</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </PageBackground>
    )
}