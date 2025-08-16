"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock } from "lucide-react";
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  location: string;
  images: string[];
  description: string;
  category: string;
  condition: string;
  brand: string;
  model: string;
  postedDate: string;
  views: number;
  seller: {
    name: string;
    rating: number;
    totalReviews: number;
    memberSince: string;
    verified: boolean;
    responseTime: string;
  };
  features: string[];
  [key: string]: any;
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking favorite status:", error);
        } else {
          setIsFavorited(!!data);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    checkFavoriteStatus();
  }, [user, product.id]);

  const toggleFavorite = async () => {
    if (!user) {
      // Use a modal or toast notification instead of an alert
      console.log("Please log in to save favorites");
      return;
    }

    try {
      const supabase = createClient();

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);

        if (error) {
          console.error("Error removing favorite:", error);
          // show a toast or modal error message
        } else {
          console.log("Removed from favorites:", product.id);
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          product_id: product.id,
        });

        if (error) {
          console.error("Error adding favorite:", error);
          // show a toast or modal error message
        } else {
          console.log("Added to favorites:", product.id);
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // show a toast or modal error message
    }
  };

  const handleReportAd = () => {
    if (!user) {
      // Use a modal or toast notification instead of an alert
      console.log("Please log in to report this ad");
      return;
    }
    // Use a modal or custom UI instead of window.confirm
    console.log("Reporting ad:", product.id);
    // show a toast or modal confirmation message
  };

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Check out this ${product.title} for ${product.price}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // show a toast or modal confirmation message
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatAdId = (id: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomLetters = "";
    for (let i = 0; i < 4; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    return `AD${year}${month}${day}${randomLetters}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="shadow-lg rounded-2xl overflow-hidden">
            <div className="relative">
              <img
                src={product.images[selectedImage] || "https://placehold.co/1200x800/E5E7EB/1F2937?text=Product+Image"}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full"
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/80 hover:bg-background/90 backdrop-blur-sm rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50 ${
                      selectedImage === index ? "border-primary shadow-md" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image || "https://placehold.co/80x80/E5E7EB/1F2937?text=Img"}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Product Description */}
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">{product.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{product.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Posted on {new Date(product.postedDate).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed text-sm mb-4">{product.description}</p>
              
              <Separator className="my-4" />

              <h3 className="font-semibold text-lg text-foreground mb-3">Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">{product.category}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Condition</span>
                  <span className="font-medium text-foreground">{product.condition}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium text-foreground">{product.brand}</span>
                </div>
                {product.model && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium text-foreground">{product.model}</span>
                  </div>
                )}
                {product.storage && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium text-foreground">{product.storage}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Color</span>
                    <span className="font-medium text-foreground">{product.color}</span>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <h3 className="font-semibold text-lg text-foreground mb-3">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <div className="flex justify-end pt-4">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-red-500"
                onClick={handleReportAd}
              >
                <Flag className="h-4 w-4 mr-1" />
                Report this Ad
              </Button>
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price and Action Buttons */}
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-3xl font-bold text-primary">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Ad ID: <span className="font-medium text-foreground">{formatAdId(product.id)}</span>
              </div>
              
              <div className="space-y-3">
                <ContactSellerModal
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images[0],
                  }}
                  seller={{
                    name: product.seller.name,
                    verified: product.seller.verified,
                    rating: product.seller.rating,
                    totalReviews: product.seller.totalReviews,
                  }}
                >
                  <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl">
                    Contact Seller
                  </Button>
                </ContactSellerModal>
                <Button variant="outline" className="w-full h-12 text-lg font-semibold bg-transparent rounded-xl">
                  Make an Offer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Seller Information</h3>

              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-primary">
                  {product.seller.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{product.seller.name}</span>
                    {product.seller.verified && <Shield className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.seller.rating}</span>
                    <span className="ml-1">({product.seller.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Member since {product.seller.memberSince}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{product.seller.responseTime}</span>
                </div>
              </div>

              <Link href="#" passHref>
                <Button variant="outline" className="w-full mt-5 bg-transparent rounded-xl">
                  View Seller Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
