// @ts-nocheck
import Link from 'next/link'
import { PageBackground } from "@/components/ui/page-background"
import { CheckCircle, FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, FileText, ArrowRight, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"

// Service data
const serviceData = {
    "register-kra-pin": {
        title: "Register KRA PIN",
        icon: "file-plus",
        nextSteps: [
            "Check your email for confirmation details",
            "Follow the instructions to complete your KRA PIN registration",
            "Allow up to 30 minutes for processing"
        ]
    },
    "renew-kra-password": {
        title: "Renew KRA Password",
        icon: "key",
        nextSteps: [
            "Check your email for password reset instructions",
            "Create a strong new password",
            "Login to your KRA account with your new credentials"
        ]
    },
    "change-kra-email": {
        title: "Change KRA Email",
        icon: "mail",
        nextSteps: [
            "Check both your old and new email addresses for verification",
            "Follow the instructions to confirm your email change",
            "Allow up to 30 minutes for the update to take effect"
        ]
    },
    "register-nssf": {
        title: "Register NSSF",
        icon: "shield",
        nextSteps: [
            "Check your email for NSSF registration details",
            "Complete any additional verification if required",
            "Your NSSF membership number will be sent to you within 24 hours"
        ]
    },
    "register-shif": {
        title: "Register SHIF",
        icon: "heart-pulse",
        nextSteps: [
            "Check your email for SHIF registration confirmation",
            "Review your healthcare provider options",
            "Your SHIF membership will be active within 48 hours"
        ]
    },
    "file-nil-returns": {
        title: "File Nil Returns",
        icon: "file-text",
        nextSteps: [
            "Check your email for your filing confirmation and receipts",
            "Download and save your acknowledgment receipt for your records",
            "Your filing will be processed immediately"
        ]
    }
};

export default function CheckoutSuccessPage({ params }) {
    const { slug } = params;
    const service = serviceData[slug];

    if (!service) {
        return (
            <PageBackground>
                <div className="container mx-auto py-12 px-4 text-center">
                    <p>Service not found. Please go back to <Link href="/services" className="text-primary hover:underline">services page</Link>.</p>
                </div>
            </PageBackground>
        );
    }

    const getIconComponent = (iconName) => {
        switch (iconName) {
            case "file-plus": return <FilePlusIcon className="h-6 w-6 text-white" />;
            case "key": return <KeyIcon className="h-6 w-6 text-white" />;
            case "mail": return <MailIcon className="h-6 w-6 text-white" />;
            case "shield": return <Shield className="h-6 w-6 text-white" />;
            case "heart-pulse": return <ActivityIcon className="h-6 w-6 text-white" />;
            case "file-text": return <FileText className="h-6 w-6 text-white" />;
            default: return null;
        }
    };

    const generateOrderId = () => {
        return `NR${Math.floor(Math.random() * 1000000)}`;
    };

    const orderId = generateOrderId();
    const orderDate = new Date().toLocaleDateString();

    return (
        <PageBackground>
            <div className="container mx-auto py-8 px-4 max-w-3xl">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white rounded-full p-1">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                                    <CheckCircle className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Payment Successful!</h1>
                        <p className="text-white/80 text-sm md:text-base">
                            Your payment for {service.title} has been processed successfully
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="border rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                                        {getIconComponent(service.icon)}
                                    </div>
                                    <h2 className="font-bold">{service.title}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Order ID:</p>
                                    <p className="font-medium text-sm">{orderId}</p>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm border-t pt-3">
                                <span>Date:</span>
                                <span>{orderDate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Amount Paid:</span>
                                <span className="font-bold">KES 50.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Payment Method:</span>
                                <span>M-Pesa</span>
                            </div>

                            <div className="mt-4 text-center">
                                <Button variant="outline" size="sm" className="text-sm">
                                    <Download className="h-3 w-3 mr-1" /> Download Receipt
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold">Next Steps</h3>
                            <ul className="space-y-2">
                                {service.nextSteps.map((step, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-4 border-t mt-6">
                                <p className="text-sm text-muted-foreground mb-4">
                                    We've sent a confirmation email with all the details to your email address.
                                    If you have any questions, please contact our support team.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button asChild className="flex-1">
                                        <Link href="/">
                                            Return to Home
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild className="flex-1">
                                        <Link href="/services">
                                            Browse More Services <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageBackground>
    );
}