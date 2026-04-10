export const features = [
    {
        iconName: "ArrowUpCircle",
        iconColor: "text-purple-500",
        title: "Easy File Upload",
        description: "Quickly upload your files with our intuitive drag-and-drop interface."
    },
    {
        iconName: "ShieldCheck",
        iconColor: "text-green-500",
        title: "Secure File Sharing",
        description: "Share your files with confidence using our end-to-end encryption."
    },
    {
        iconName: "CloudDownload",
        iconColor: "text-blue-500",
        title: "Fast Downloads",
        description: "Download your files instantly from anywhere, on any device."
    },
    {
        iconName: "Users",
        iconColor: "text-yellow-500",
        title: "Team Collaboration",
        description: "Work together with your team and manage shared files easily."
    }
];

const testimonials = [
    {
        name: "John Doe",
        role: "Product Manager",
        company: "Tech Corp",
        image: "https://example.com/john.jpg",
        quote: "This solution has transformed the way we work.",
        rating: 5
    },
    {
        name: "Jane Smith",
        role: "Senior Developer",
        company: "Digital Solutions",
        image: "https://example.com/jane.jpg",
        quote: "Excellent service and great support team.",
        rating: 4.5
    },
    {
        name: "Mike Johnson",
        role: "CEO",
        company: "Innovation Labs",
        image: "https://example.com/mike.jpg",
        quote: "Highly recommended for any growing business.",
        rating: 5
    }
];

const pricingPlans = [
    {
        name: "Basic",
        price: "$9.99/month",
        features: [
            "10 GB Storage",
            "Basic Support",
            "Single User"
        ]
    },
    {
        name: "Pro",
        price: "$19.99/month",
        features: [
            "100 GB Storage",
            "Priority Support",
            "Up to 5 Users"
        ]
    }
];

const faqs = [
    {
        question: "How do I upload files?",
        answer: "You can upload files by dragging and dropping them into the upload area or by clicking the upload button to select files from your device."
    },
    {
        question: "Is my data secure?",
        answer: "Yes, we use end-to-end encryption to ensure that your data is secure and protected from unauthorized access."
    },
    {
        question: "Can I share files with others?",
        answer: "Absolutely! You can share files with others by generating a secure link or by inviting them to collaborate on specific files or folders."
    }
];
export default testimonials;
export { features, pricingPlans, faqs };