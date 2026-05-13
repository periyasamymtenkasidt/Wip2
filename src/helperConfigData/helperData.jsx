import { MdOutlineDashboard, MdOutlineSettings, MdOutlineReceiptLong } from "react-icons/md";
import { HiOutlineUsers } from "react-icons/hi";
import { PiSuitcaseSimpleBold, PiBriefcaseDuotone } from "react-icons/pi";
import { MdOutlineAnalytics } from "react-icons/md";
import { FaRegFileLines, FaRegHandshake } from "react-icons/fa6";
import { TbDeviceDesktopAnalytics } from "react-icons/tb";
import { MdOutlineContactSupport } from "react-icons/md";
import { PiSignOut } from "react-icons/pi";

export const Menus = [
    { name: "Dashboard", icon: MdOutlineDashboard, path: "/dashboard" },
    { name: "Leads", icon: HiOutlineUsers, path: "/leads" },
    { name: "Projects", icon: PiBriefcaseDuotone, path: "/projects" },
    {name:"Client", icon:HiOutlineUsers,path:"/clients"},
    {name:"Deals", icon:FaRegHandshake,path:"/deals"},
    { name: "BOQ", icon: MdOutlineReceiptLong, path: "/boq" },
    { name: "Accounts", icon: PiSuitcaseSimpleBold, path: "/accounts" },
    { name: "Pipeline", icon:  TbDeviceDesktopAnalytics, path: "/pipeline" },
    { name: "Analytics", icon: MdOutlineAnalytics, path: "/analytics" },
    { name: "Reports", icon: FaRegFileLines, path: "/reports" },
];

export const SupportMenu = [
    { name: "Settings", icon: MdOutlineSettings, path: "/settings" },
    { name: "Support", icon: MdOutlineContactSupport, path: "/support" },
    { name: "Sign Out", icon: PiSignOut, path: "/signout" },
];


// Property types — shared between lead capture (dropdown) and conversion (read-only mapping)
export const PROPERTY_TYPES = [
    "Luxury Villa",
    "Apartment",
    "Penthouse",
    "Independent House",
    "Duplex",
    "Studio Apartment",
    "Farm House",
    "Beach House",
];
