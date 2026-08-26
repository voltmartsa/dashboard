export const AREAS = ["BUSINESS", "PERSONAL"] as const;
export type Area = (typeof AREAS)[number];

// "BUSINESS" is the stored/internal value everywhere (DB rows, cookies,
// query params) — only the display label changed from "Business" to "Work".
export const AREA_LABEL: Record<Area, string> = {
  BUSINESS: "Work",
  PERSONAL: "Personal",
};

export const USER_ROLES = ["SUPER_ADMIN", "USER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const HABIT_FREQUENCIES = ["DAILY", "WEEKLY", "CUSTOM"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export type SubtaskSuggestion = {
  title: string;
  description?: string;
  priority?: Priority;
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

export const DOCUMENT_CATEGORIES = [
  "LICENSE",
  "PASSPORT",
  "INSURANCE",
  "REGISTRATION",
  "VISA",
  "OTHER",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  LICENSE: "License",
  PASSPORT: "Passport",
  INSURANCE: "Insurance",
  REGISTRATION: "Registration",
  VISA: "Visa",
  OTHER: "Other",
};

// A document counts as "expiring soon" inside this many days of its expiry date.
export const DOCUMENT_EXPIRY_WARNING_DAYS = 60;

// eTenders' fixed category list (Advanced Search Filters > Category), scraped
// from the portal's own search form — tender rows use these exact strings.
export const ETENDERS_CATEGORIES = [
  "Accommodation",
  "Activities auxiliary to financial service and insurance activities.",
  "Activities of head offices; management consultancy activities",
  "Activities of households as employers of domestic personnel",
  "Administrative and support activities",
  "Advertising and market research",
  "Agricultural Products and Services",
  "Air transport",
  "Architectural and engineering activities; technical testing and analysis",
  "Arts, entertainment and recreation",
  "Civil engineering",
  "Computer programming, consultancy and related activities",
  "Construction",
  "Construction of buildings",
  "Creative, arts and entertainment activities",
  "Disposals: General",
  "Education",
  "Electricity, gas, steam and air conditioning",
  "Employment activities",
  "Financial and insurance activities",
  "Financial service activities, except insurance and pension funding",
  "Food and beverage service activities",
  "Human health activities",
  "Human health and social work activities",
  "Information and communication",
  "Information service activities",
  "Insurance, reinsurance and pension funding, except compulsory social security",
  "Land transport and transport via pipelines",
  "Legal and accounting activities",
  "Libraries, archives, museums and other cultural activities",
  "Manufacture of basic metals",
  "Manufacture of chemicals and chemical products",
  "Manufacture of coke and refined petroleum products",
  "Manufacture of computer, electronic and optical products",
  "Manufacture of electrical equipment",
  "Manufacture of fabricated metal products, except machinery and equipment",
  "Manufacture of furniture",
  "Manufacture of machinery and equipment n.e.c.",
  "Manufacture of motor vehicles, trailers and semi-trailers",
  "Manufacture of other non-metallic mineral products",
  "Manufacture of paper and paper products",
  "Manufacture of rubber and plastics products",
  "Manufacture of textiles",
  "Manufacturing",
  "Mining and quarrying",
  "Mining of coal and lignite",
  "Mining support service activities",
  "Motion picture, video and television programme production, sound recording and music publishing activities",
  "Office administrative, office support and other business support activities",
  "Other manufacturing",
  "Other personal service activities",
  "Other professional, scientific and technical activities",
  "Other service activities",
  "Postal and courier activities",
  "Printing and reproduction of recorded media",
  "Professional, scientific and technical activities",
  "Programming and broadcasting activities",
  "Publishing activities",
  "Real estate activities",
  "Remediation activities and other waste management services",
  "Rental and leasing activities",
  "Repair and installation of machinery and equipment",
  "Residential care activities",
  "Scientific research and development",
  "Security and investigation activities",
  "Services to buildings and landscape activities",
  "Services: Building",
  "Services: Civil",
  "Services: Electrical",
  "Services: Functional (Including Cleaning and Security Services)",
  "Services: General",
  "Services: Professional",
  "Sewerage",
  "Specialised construction activities",
  "Sports activities and amusement and recreation activities",
  "Supplies: Clothing/Textiles/Footwear",
  "Supplies: Computer Equipment",
  "Supplies: Electrical Equipment",
  "Supplies: General",
  "Supplies: Medical",
  "Supplies: Perishable Provisions",
  "Supplies: Stationery/Printing",
  "Telecommunications",
  "Transportation and storage",
  "Travel agency, tour operator, reservation service and related activities",
  "Warehousing and support activities for transportation",
  "Waste collection, treatment and disposal activities; materials recovery",
  "Water collection, treatment and supply",
  "Water supply; sewerage, waste management and remediation activities",
  "Water transport",
  "Wholesale and retail trade and repair of motor vehicles and motorcycles",
] as const;
export type EtendersCategory = (typeof ETENDERS_CATEGORIES)[number];

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;
export type SAProvince = (typeof SA_PROVINCES)[number];
