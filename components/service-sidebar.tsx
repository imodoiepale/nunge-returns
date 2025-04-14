import Link from 'next/link'
import { FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, FileText } from 'lucide-react'

export default function ServiceSidebar() {
    const sidebarServices = [
        { title: "Register KRA PIN", icon: "file-plus", slug: "register-kra-pin" },
        { title: "Renew KRA Password", icon: "key", slug: "renew-kra-password" },
        { title: "Change KRA Email", icon: "mail", slug: "change-kra-email" },
        { title: "File Nil Returns", icon: "file-text", slug: "file-nil-returns" },
        { title: "Register NSSF", icon: "shield", slug: "register-nssf" },
        { title: "Register SHIF", icon: "heart-pulse", slug: "register-shif" }
    ];

    return (
        <div className="fixed left-0 md:left-4 top-auto bottom-0 md:top-1/5 md:-translate-y-1/2 w-full md:w-auto flex md:flex-col justify-around md:justify-start gap-1 md:gap-3 z-20 p-2 md:p-0 bg-white/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none border-t md:border-t-0">
            {sidebarServices.map((service, index) => (
                <Link
                    key={index}
                    href={`/services/${service.slug}`}
                    className="group relative"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white w-16 h-16 rounded-lg shadow-md flex flex-col items-center justify-center p-1 transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:shadow-lg">
                        {service.icon === "key" && <KeyIcon className="h-6 w-6 text-primary group-hover:text-white" />}
                        {service.icon === "mail" && <MailIcon className="h-6 w-6 text-primary group-hover:text-white" />}
                        {service.icon === "file-plus" && <FilePlusIcon className="h-6 w-6 text-primary group-hover:text-white" />}
                        {service.icon === "shield" && <Shield className="h-6 w-6 text-primary group-hover:text-white" />}
                        {service.icon === "heart-pulse" && <ActivityIcon className="h-6 w-6 text-primary group-hover:text-white" />}
                        {service.icon === "file-text" && <FileText className="h-6 w-6 text-primary group-hover:text-white" />}
                        <span className="text-[8px] mt-1 font-medium text-center text-muted-foreground group-hover:text-white">
                            {service.title}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}