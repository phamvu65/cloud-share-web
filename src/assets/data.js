import {ArrowLeftRight, Files, LayoutDashboard, Upload, Wrench} from "lucide-react";

// Display text for these three lists lives in src/i18n/translations.js
// (landing.feature*, landing.pricing*, landing.testimonial*) so it can be
// translated - only non-text/visual metadata stays here.
export const features = [
    { iconName: "ArrowUpCircle", iconColor: "text-purple-500" },
    { iconName: "Shield", iconColor: "text-green-500" },
    { iconName: "Share2", iconColor: "text-purple-500" },
    { iconName: "CreditCard", iconColor: "text-orange-500" },
    { iconName: "FileText", iconColor: "text-red-500" },
    { iconName: "Clock", iconColor: "text-indigo-500" }
];

export const pricingPlans = [
    { id: "free", price: "0", featureCount: 4, highlighted: false },
    { id: "premium", price: "25", featureCount: 5, highlighted: true },
    { id: "ultimate", price: "50", featureCount: 6, highlighted: false }
];

export const testimonials = [
    { name: "Sarah Johnson", image: "https://randomuser.me/api/portraits/women/32.jpg", rating: 5 },
    { name: "Michael Chen", image: "https://randomuser.me/api/portraits/men/46.jpg", rating: 5 },
    { name: "Priya Sharma", image: "https://randomuser.me/api/portraits/women/65.jpg", rating: 4 }
];
//side menu bar options
// `key` is a stable identifier used for the activeMenu prop / translation lookup;
// `label` stays as an English fallback for anywhere translations aren't wired up yet.
export const SIDE_MENU_DATA = [
    {
        id: "01",
        key: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
    },
    {
        id: "02",
        key: "upload",
        label: "Upload",
        icon: Upload,
        path: "/upload",
    },
    {
        id: "03",
        key: "myFiles",
        label: "My Files",
        icon: Files,
        path: "/my-files",
    },
    {
        id: "04",
        key: "pdfTools",
        label: "PDF Tools",
        icon: Wrench,
        path: "/pdf-tools",
    },
    {
        id: "05",
        key: "fileConverter",
        label: "File Converter",
        icon: ArrowLeftRight,
        path: "/file-converter",
    },
];