// @ts-nocheck
"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageBackground } from "@/components/ui/page-background"
import { ArrowLeft, CreditCard, CheckCircle, ArrowRight, Loader2, Shield, FilePlusIcon, KeyIcon, MailIcon, ActivityIcon, FileText, PhoneIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Service data (should match with the main service data)
const serviceData = {
    "register-kra-pin": {
        title: "Register KRA PIN",
        icon: "file-plus",
        price: "50"
    },
    "renew-kra-password": {
        title: "Renew KRA Password",
        icon: "key",
        price: "50"
    },
    "change-kra-email": {
        title: "Change KRA Email",
        icon: "mail",
        price: "50"
    },
    "register-nssf": {
        title: "Register NSSF",
        icon: "shield",
        price: "50"
    },
    "register-shif": {
        title: "Register SHIF",
        icon: "heart-pulse",
        price: "50"
    },
    "file-nil-returns": {
        title: "File Nil Returns",
        icon: "file-text",
        price: "50"
    }
};

export default function CheckoutPage({ params }) {
    const { slug } = params;
    const router = useRouter();
    const service = serviceData[slug];

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        paymentMethod: 'mpesa'
    });

    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
    const [error, setError] = useState('');

    if (!service) {
        router.push('/services');
        return null;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentMethodChange = (value) => {
        setFormData(prev => ({ ...prev, paymentMethod: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Simulate payment processing
            setPaymentStatus('processing');

            // Wait for 2 seconds to simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate successful payment
            setPaymentStatus('success');

            // Redirect to success page after 1.5 seconds
            setTimeout(() => {
                router.push(`/checkout/${slug}/success`);
            }, 1500);

        } catch (err) {
            setError('Payment processing failed. Please try again.');
            setPaymentStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const getIconComponent = (iconName) => {
        switch (iconName) {
            case "file-plus": return <FilePlusIcon />;
            case "key": return <KeyIcon />;
            case "mail": return <MailIcon />;
            case "shield": return <Shield />;
            case "heart-pulse": return <ActivityIcon />;
            case "file-text": return <FileText />;
            default: return <CreditCard />;
        }
    };

    return (
        <PageBackground>
            <div className="container mx-auto py-6 px-4 max-w-3xl">
                <Link href={`/services/${slug}`} className="inline-flex items-center text-primary hover:underline mb-6 text-sm">
                    <ArrowLeft className="mr-1 h-3 w-3" /> Back to service details
                </Link>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 md:p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary">
                                {getIconComponent(service.icon)}
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-bold">{service.title}</h1>
                                <p className="text-xs md:text-sm text-muted-foreground">Complete your purchase</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number (for M-Pesa)</Label>
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter your M-Pesa number (2547XX...)"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <RadioGroup
                                    value={formData.paymentMethod}
                                    onValueChange={handlePaymentMethodChange}
                                    className="flex flex-col md:flex-row gap-2"
                                >
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1">
                                        <RadioGroupItem value="mpesa" id="mpesa" />
                                        <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer">
                                            <PhoneIcon className="h-4 w-4 text-green-600" />
                                            M-Pesa
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 opacity-50">
                                        <RadioGroupItem value="card" id="card" disabled />
                                        <Label htmlFor="card" className="flex items-center gap-2 cursor-not-allowed">
                                            <CreditCard className="h-4 w-4" />
                                            Card Payment (Coming Soon)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground">Service Fee:</span>
                                    <span className="font-bold">KES {service.price}</span>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90"
                                    disabled={loading || paymentStatus === 'processing' || paymentStatus === 'success'}
                                >
                                    {paymentStatus === 'idle' && (
                                        <>Pay KES {service.price} <CreditCard className="ml-2 h-4 w-4" /></>
                                    )}
                                    {paymentStatus === 'processing' && (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing Payment...
                                        </>
                                    )}
                                    {paymentStatus === 'success' && (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Payment Successful
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    By proceeding, you agree to our Terms and Conditions
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PageBackground>
    );
}