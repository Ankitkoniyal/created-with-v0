export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  slug: string
}

export interface Ad {
  id: string
  adId: string // Unique ad identifier like AD12345678
  title: string
  description: string
  price: number | null
  category_id: string
  subcategory_id?: string
  user_id: string
  images: string[]
  location: string
  city: string
  state: string
  condition: "new" | "second_hand" | "like_new"
  status: "active" | "sold" | "inactive"
  created_at: string
  updated_at: string
  brand?: string
  model?: string
  year?: number
  negotiable: boolean
  // Vehicle specific fields
  kmDriven?: string
  numberOfOwners?: string
  manufacturingYear?: number // Updated: Now stores actual year instead of age
  transmissionType?: string
  fuelType?: string
  // Real estate specific fields
  propertyType?: string
  bhk?: string
}

export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url?: string
  member_since: string
  rating: number
  total_ratings: number
}

export interface Message {
  id: string
  ad_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export interface CallRequest {
  id: string
  ad_id: string
  requester_id: string
  owner_id: string
  status: "pending" | "accepted" | "declined"
  message: string
  created_at: string
}

export interface Review {
  id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment: string
  created_at: string
}

// Generate unique Ad ID
export function generateAdId(): string {
  return `AD${Math.random().toString().slice(2, 10)}`
}

// Updated categories with new subcategories for Electronics and Bikes
export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    icon: "📱",
    subcategories: [
      { id: "1-1", name: "TVs", slug: "tvs" },
      { id: "1-2", name: "Video - Audio", slug: "video-audio" },
      { id: "1-3", name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { id: "1-4", name: "Computers & Laptops", slug: "computers-laptops" },
      { id: "1-5", name: "Cameras & Lenses", slug: "cameras-lenses" },
      { id: "1-6", name: "Games & Entertainment", slug: "games-entertainment" },
      { id: "1-7", name: "Fridge", slug: "fridge" },
      { id: "1-8", name: "Computer and Accessories", slug: "computer-accessories" },
      { id: "1-9", name: "Hard Disks", slug: "hard-disks" },
      { id: "1-10", name: "Printers & Monitors", slug: "printers-monitors" },
      { id: "1-11", name: "Air Conditioner", slug: "air-conditioner" },
      { id: "1-12", name: "Washing Machines", slug: "washing-machines" },
    ],
  },
  {
    id: "2",
    name: "Car",
    slug: "car",
    icon: "🚗",
    subcategories: [
      { id: "2-1", name: "Hatchback", slug: "hatchback" },
      { id: "2-2", name: "Sedan", slug: "sedan" },
      { id: "2-3", name: "SUV", slug: "suv" },
      { id: "2-4", name: "Luxury Cars", slug: "luxury-cars" },
    ],
  },
  { id: "3", name: "Furniture", slug: "furniture", icon: "🛋️" },
  { id: "4", name: "Clothing", slug: "clothing", icon: "👕" },
  { id: "5", name: "Sports", slug: "sports", icon: "⚽" },
  { id: "6", name: "Music", slug: "music", icon: "🎵" },
  { id: "7", name: "Books", slug: "books", icon: "📚" },
  { id: "8", name: "Pets", slug: "pets", icon: "🐕" },
  { id: "9", name: "Services", slug: "services", icon: "🔧" },
  {
    id: "10",
    name: "Bike", // Changed from "Bikes" to "Bike"
    slug: "bike", // Changed from "bikes" to "bike"
    icon: "🏍️",
    subcategories: [
      { id: "10-1", name: "Motor Cycle", slug: "motor-cycle" },
      { id: "10-2", name: "Scooter", slug: "scooter" },
      { id: "10-3", name: "E-Bike", slug: "e-bike" },
      { id: "10-4", name: "Spare Parts", slug: "spare-parts" },
      { id: "10-5", name: "Bicycle", slug: "bicycle" },
    ],
  },
  {
    id: "11",
    name: "Real Estate",
    slug: "real-estate",
    icon: "🏠",
    subcategories: [
      { id: "11-1", name: "Buy Residential Property", slug: "buy-residential" },
      { id: "11-2", name: "Sell Residential Property", slug: "sell-residential" },
      { id: "11-3", name: "Rent Residential Property", slug: "rent-residential" },
      { id: "11-4", name: "PG (Paying Guest)", slug: "pg" },
      { id: "11-5", name: "Rent Commercial Property", slug: "rent-commercial" },
      { id: "11-6", name: "Sell Commercial Property", slug: "sell-commercial" },
    ],
  },
  { id: "12", name: "Home Appliance", slug: "home-appliance", icon: "🔌" },
]

// Mock Users with enhanced profile data
export const mockUsers: User[] = [
  {
    id: "1",
    email: "john@example.com",
    full_name: "John Doe",
    phone: "+91 9876543210",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    member_since: "2022-03-15",
    rating: 4.5,
    total_ratings: 23,
  },
  {
    id: "2",
    email: "jane@example.com",
    full_name: "Jane Smith",
    phone: "+91 9876543211",
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    member_since: "2021-08-20",
    rating: 4.8,
    total_ratings: 45,
  },
  {
    id: "3",
    email: "mike@example.com",
    full_name: "Mike Johnson",
    phone: "+91 9876543212",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    member_since: "2023-01-10",
    rating: 4.2,
    total_ratings: 12,
  },
]

// Enhanced mock ads with updated manufacturing year field
export const mockAds: Ad[] = [
  {
    id: "1",
    adId: "AD12345678",
    title: "iPhone 14 Pro Max - Excellent Condition",
    description:
      "Selling my iPhone 14 Pro Max in excellent condition. Used for only 6 months. All accessories included. No scratches or dents. Battery health 98%. Original box and charger included. Reason for selling: upgrading to iPhone 15.",
    price: 85000,
    category_id: "1",
    subcategory_id: "1-4", // Computers & Laptops
    user_id: "1",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
    ],
    location: "Andheri West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    condition: "like_new",
    status: "active",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    brand: "Apple",
    model: "iPhone 14 Pro Max",
    year: 2023,
    negotiable: true,
  },
  {
    id: "2",
    adId: "AD23456789",
    title: "Honda City 2020 - Well Maintained",
    description:
      "Honda City 2020 model, petrol, automatic transmission. Single owner, well maintained. All services done at authorized service center. Insurance valid till 2025. New tyres installed recently. AC working perfectly. No accidents.",
    price: 1200000,
    category_id: "2",
    subcategory_id: "2-2", // Sedan
    user_id: "2",
    images: [
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=400&fit=crop",
    ],
    location: "Connaught Place, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    condition: "second_hand",
    status: "active",
    created_at: "2024-01-14T15:45:00Z",
    updated_at: "2024-01-14T15:45:00Z",
    brand: "Honda",
    model: "City",
    year: 2020,
    negotiable: true,
    // Enhanced vehicle fields with manufacturing year
    kmDriven: "30,001–50,000 km",
    numberOfOwners: "First Owner",
    manufacturingYear: 2020, // Updated: Now stores actual manufacturing year
    transmissionType: "Automatic",
    fuelType: "Petrol",
  },
  {
    id: "3",
    adId: "AD34567890",
    title: "Sofa Set - 3+2 Seater Premium Quality",
    description:
      "Beautiful sofa set in excellent condition. 3 seater and 2 seater. Comfortable and stylish. Premium fabric material. Moving out sale. Immediate pickup required. No pets, no smoking household.",
    price: 25000,
    category_id: "3",
    user_id: "3",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    ],
    location: "Koramangala, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    condition: "second_hand",
    status: "active",
    created_at: "2024-01-13T09:20:00Z",
    updated_at: "2024-01-13T09:20:00Z",
    negotiable: false,
  },
  {
    id: "4",
    adId: "AD45678901",
    title: "MacBook Pro M2 - Like New",
    description:
      "MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Purchased 3 months ago. Barely used. All original packaging and accessories included. AppleCare+ valid till 2026. Perfect for professionals and students.",
    price: 180000,
    category_id: "1",
    subcategory_id: "1-4", // Computers & Laptops
    user_id: "1",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    ],
    location: "Baner, Pune",
    city: "Pune",
    state: "Maharashtra",
    condition: "like_new",
    status: "active",
    created_at: "2024-01-12T14:10:00Z",
    updated_at: "2024-01-12T14:10:00Z",
    brand: "Apple",
    model: "MacBook Pro M2",
    year: 2023,
    negotiable: true,
  },
  {
    id: "5",
    adId: "AD56789012",
    title: "Designer Dress Collection - Size M",
    description:
      "Collection of 5 designer dresses, size M. Worn only once each. Perfect for parties and special occasions. Selling due to size change. Brands include Zara, H&M, and Forever 21. Dry cleaned and ready to wear.",
    price: 8000,
    category_id: "4",
    user_id: "2",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    ],
    location: "T. Nagar, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    condition: "like_new",
    status: "active",
    created_at: "2024-01-11T11:30:00Z",
    updated_at: "2024-01-11T11:30:00Z",
    brand: "Zara",
    model: "Dress Collection",
    year: 2023,
    negotiable: true,
  },
  {
    id: "6",
    adId: "AD67890123",
    title: "Cricket Kit - Complete Professional Set",
    description:
      "Complete cricket kit including bat, pads, gloves, helmet, and kit bag. Good quality equipment. Perfect for beginners and intermediate players. MRF bat in excellent condition. All safety gear included.",
    price: 5000,
    category_id: "5",
    user_id: "3",
    images: [
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
    ],
    location: "Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    condition: "second_hand",
    status: "active",
    created_at: "2024-01-10T16:45:00Z",
    updated_at: "2024-01-10T16:45:00Z",
    brand: "MRF",
    model: "Cricket Kit",
    year: 2023,
    negotiable: true,
  },
  {
    id: "7",
    adId: "AD78901234",
    title: "Samsung Galaxy S23 Ultra - 256GB",
    description:
      "Samsung Galaxy S23 Ultra, 256GB storage, excellent camera quality. Used for 8 months. Minor scratches on back, screen is perfect. All original accessories included. Fast charging and wireless charging supported.",
    price: 75000,
    category_id: "1",
    subcategory_id: "1-4", // Computers & Laptops
    user_id: "2",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    ],
    location: "Sector 18, Noida",
    city: "Noida",
    state: "Uttar Pradesh",
    condition: "second_hand",
    status: "active",
    created_at: "2024-01-09T12:30:00Z",
    updated_at: "2024-01-09T12:30:00Z",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    year: 2023,
    negotiable: true,
  },
  {
    id: "8",
    adId: "AD89012345",
    title: "Royal Enfield Classic 350 - 2021 Model",
    description:
      "Royal Enfield Classic 350, 2021 model. Well maintained, all papers clear. New tyres recently installed. Perfect for long rides. Single owner. Service history available. Insurance valid till December 2024.",
    price: 145000,
    category_id: "10",
    subcategory_id: "10-1", // Motor Cycle
    user_id: "1",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400&h=400&fit=crop",
    ],
    location: "Jayanagar, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    condition: "second_hand",
    status: "active",
    created_at: "2024-01-08T14:20:00Z",
    updated_at: "2024-01-08T14:20:00Z",
    brand: "Royal Enfield",
    model: "Classic 350",
    year: 2021,
    negotiable: true,
    // Enhanced bike fields with manufacturing year
    kmDriven: "10,001–30,000 km",
    numberOfOwners: "First Owner",
    manufacturingYear: 2021, // Updated: Now stores actual manufacturing year
    transmissionType: "Manual",
    fuelType: "Petrol",
  },
]

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "1",
    ad_id: "1",
    sender_id: "2",
    receiver_id: "1",
    content: "Hi, is this iPhone still available?",
    created_at: "2024-01-16T10:00:00Z",
  },
  {
    id: "2",
    ad_id: "1",
    sender_id: "1",
    receiver_id: "2",
    content: "Yes, it is still available. Would you like to see it?",
    created_at: "2024-01-16T10:15:00Z",
  },
]

// Mock Call Requests
export const mockCallRequests: CallRequest[] = [
  {
    id: "1",
    ad_id: "2",
    requester_id: "3",
    owner_id: "2",
    status: "pending",
    message: "Interested in your Honda City. Please call me.",
    created_at: "2024-01-16T12:00:00Z",
  },
]

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: "1",
    reviewer_id: "2",
    reviewed_user_id: "1",
    rating: 5,
    comment: "Great seller! Item was exactly as described. Fast delivery and excellent communication.",
    created_at: "2024-01-10T14:30:00Z",
  },
  {
    id: "2",
    reviewer_id: "3",
    reviewed_user_id: "1",
    rating: 4,
    comment: "Good experience overall. Product quality was good, delivery was on time.",
    created_at: "2024-01-05T09:15:00Z",
  },
]

// Indian states and their major cities
export const statesCitiesMap: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif"],
  Chhattisgarh: ["Raipur", "Bhilai", "Korba", "Bilaspur", "Durg", "Rajnandgaon"],
  Delhi: ["New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri", "Lajpat Nagar"],
  Goa: ["Panaji", "Vasco da Gama", "Margao", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar"],
  Haryana: ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Hamirpur"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
  Karnataka: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davangere"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur"],
  Meghalaya: ["Shillong", "Tura", "Jowai"],
  Mizoram: ["Aizawl", "Lunglei", "Saiha"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar"],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"],
  Tripura: ["Agartala", "Dharmanagar", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Noida"],
  Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman"],
}

export const indianStates = Object.keys(statesCitiesMap)

export const majorCities = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Surat",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Guwahati",
  "Chandigarh",
  "Solapur",
  "Hubli",
  "Bareilly",
  "Moradabad",
  "Mysore",
  "Gurgaon",
  "Aligarh",
  "Jalandhar",
  "Tiruchirappalli",
  "Bhubaneswar",
  "Salem",
  "Warangal",
  "Guntur",
  "Bhiwandi",
  "Saharanpur",
  "Gorakhpur",
  "Bikaner",
  "Amravati",
  "Noida",
  "Jamshedpur",
  "Bhilai",
  "Cuttack",
  "Firozabad",
  "Kochi",
  "Bhavnagar",
  "Dehradun",
  "Durgapur",
  "Asansol",
  "Nanded",
  "Kolhapur",
  "Ajmer",
  "Gulbarga",
  "Jamnagar",
  "Ujjain",
  "Loni",
  "Siliguri",
  "Jhansi",
  "Ulhasnagar",
  "Nellore",
  "Jammu",
  "Sangli",
  "Belgaum",
  "Mangalore",
  "Ambattur",
  "Tirunelveli",
  "Malegaon",
  "Gaya",
  "Jalgaon",
  "Udaipur",
  "Maheshtala",
]

// Update brandsByCategory to include Electronics subcategories
export const brandsByCategory: Record<string, string[]> = {
  // 1 = Electronics (with subcategories)
  "1": [
    "Apple",
    "Samsung",
    "OnePlus",
    "Xiaomi",
    "Oppo",
    "Vivo",
    "Realme",
    "Google",
    "Motorola",
    "Nokia",
    "Huawei",
    "Honor",
    "LG",
    "Sony",
    "Panasonic",
    "Philips",
    "Bosch",
    "Whirlpool",
    "Godrej",
    "Haier",
  ],
  // Electronics subcategories
  "1-1": ["Samsung", "LG", "Sony", "Panasonic", "TCL", "Mi", "OnePlus"], // TVs
  "1-2": ["Sony", "JBL", "Bose", "Harman Kardon", "Yamaha", "Pioneer"], // Video - Audio
  "1-3": ["Philips", "Bajaj", "Prestige", "Pigeon", "Butterfly", "Havells"], // Kitchen Appliances
  "1-4": ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI"], // Computers & Laptops
  "1-5": ["Canon", "Nikon", "Sony", "Fujifilm", "Olympus", "Panasonic"], // Cameras & Lenses
  "1-6": ["Sony", "Microsoft", "Nintendo", "Logitech", "Razer"], // Games & Entertainment
  "1-7": ["LG", "Samsung", "Whirlpool", "Godrej", "Haier", "Bosch"], // Fridge
  "1-8": ["Logitech", "Dell", "HP", "Corsair", "Razer", "SteelSeries"], // Computer and Accessories
  "1-9": ["Seagate", "Western Digital", "Toshiba", "Samsung", "Crucial"], // Hard Disks
  "1-10": ["HP", "Canon", "Epson", "Brother", "Samsung", "LG", "Dell"], // Printers & Monitors
  "1-11": ["LG", "Samsung", "Daikin", "Voltas", "Blue Star", "Carrier"], // Air Conditioner
  "1-12": ["LG", "Samsung", "Whirlpool", "Bosch", "IFB", "Godrej"], // Washing Machines
  // 2 = Car
  "2": [
    "Maruti Suzuki",
    "Hyundai",
    "Tata",
    "Mahindra",
    "Honda",
    "Toyota",
    "Ford",
    "Volkswagen",
    "Skoda",
    "Renault",
    "Nissan",
    "Kia",
  ],
  // 3 = Furniture
  "3": ["IKEA", "Godrej", "Nilkamal", "Urban Ladder", "Pepperfry", "Durian", "Damro", "Hometown"],
  // 4 = Clothing
  "4": ["Zara", "H&M", "Uniqlo", "Nike", "Adidas", "Puma", "Levi's", "Wrangler", "Lee", "Forever 21"],
  // 5 = Sports
  "5": ["MRF", "SG", "Kookaburra", "Gray-Nicolls", "Yonex", "Adidas", "Puma", "Reebok", "Nike"],
  // 6 = Music
  "6": ["Yamaha", "Fender", "Gibson", "Casio", "Roland", "Ibanez", "Korg"],
  // 7 = Books
  "7": [],
  // 8 = Pets
  "8": ["Pedigree", "Royal Canin", "Whiskas", "Drools", "Farmina", "Acana", "Orijen"],
  // 9 = Services
  "9": [],
  // 10 = Bikes (with subcategories)
  "10": ["Royal Enfield", "Bajaj", "Hero", "TVS", "KTM", "Honda", "Yamaha", "Suzuki", "Kawasaki", "Harley Davidson"],
  // Bikes subcategories
  "10-1": ["Royal Enfield", "Bajaj", "KTM", "Honda", "Yamaha", "Suzuki", "Kawasaki"], // Motor Cycle
  "10-2": ["Honda", "TVS", "Bajaj", "Suzuki", "Yamaha", "Hero"], // Scooter
  "10-3": ["Ather", "Ola Electric", "TVS", "Bajaj", "Hero Electric"], // E-Bike
  "10-4": ["Genuine Parts", "Aftermarket", "OEM"], // Spare Parts
  "10-5": ["Hero", "Atlas", "Avon", "BSA", "Firefox", "Trek"], // Bicycle
  // 11 = Real Estate
  "11": [],
  // 12 = Home Appliance
  "12": ["LG", "Samsung", "Whirlpool", "Godrej", "Haier", "Bosch", "IFB", "Voltas", "Blue Star", "Carrier"],
}

// Vehicle specific options
export const kmDrivenOptions = [
  "0–10,000 km",
  "10,001–30,000 km",
  "30,001–50,000 km",
  "50,001–70,000 km",
  "70,001–100,000 km",
  "100,000+ km",
]

export const numberOfOwnersOptions = ["First Owner", "Second Owner", "Third Owner or More"]

// Updated: Manufacturing year options (actual years instead of age ranges)
export const manufacturingYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 1990; year--) {
    years.push(year.toString())
  }
  return years
}

export const transmissionOptions = ["Manual", "Automatic"]

export const fuelTypeOptions = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"]

// Local storage functions for managing ads
export function saveAdToStorage(ad: Ad) {
  const existingAds = getAdsFromStorage()
  const updatedAds = [...existingAds, ad]
  localStorage.setItem("marketplace_ads", JSON.stringify(updatedAds))
}

export function getAdsFromStorage(): Ad[] {
  if (typeof window === "undefined") return mockAds
  const stored = localStorage.getItem("marketplace_ads")
  return stored ? JSON.parse(stored) : mockAds
}

export function getAllAds(): Ad[] {
  return getAdsFromStorage()
}

// Review functions
export function saveReviewToStorage(review: Review) {
  const existingReviews = getReviewsFromStorage()
  const updatedReviews = [...existingReviews, review]
  localStorage.setItem("marketplace_reviews", JSON.stringify(updatedReviews))
}

export function getReviewsFromStorage(): Review[] {
  if (typeof window === "undefined") return mockReviews
  const stored = localStorage.getItem("marketplace_reviews")
  return stored ? JSON.parse(stored) : mockReviews
}

export function getReviewsForUser(userId: string): Review[] {
  const reviews = getReviewsFromStorage()
  return reviews.filter((review) => review.reviewed_user_id === userId)
}

export function calculateUserRating(userId: string): { rating: number; total_ratings: number } {
  const reviews = getReviewsForUser(userId)
  if (reviews.length === 0) return { rating: 4.0, total_ratings: 0 }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / reviews.length

  return {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    total_ratings: reviews.length,
  }
}
