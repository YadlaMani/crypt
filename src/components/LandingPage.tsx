"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRightIcon, 
  LightningBoltIcon, 
  LockClosedIcon, 
  GlobeIcon, 
  ClockIcon, 
  EnvelopeClosedIcon, 
  MobileIcon,
  HamburgerMenuIcon,
  Cross2Icon
} from "@radix-ui/react-icons";

const features = [
  {
    icon: <LightningBoltIcon className="h-6 w-6" />,
    title: "The Button",
    description: "One line of code, and any website can accept crypto. No contracts, no verifications, no compliance hurdles."
  },
  {
    icon: <EnvelopeClosedIcon className="h-6 w-6" />,
    title: "Email-First Security",
    description: "Payment requests flow through the inbox, not injected wallets. It's safer, simpler, human."
  },
  {
    icon: <MobileIcon className="h-6 w-6" />,
    title: "Trusted Devices",
    description: "Customers pay where they feel secure — their phone, their personal device — not inside an unfamiliar popup."
  },
  {
    icon: <ClockIcon className="h-6 w-6" />,
    title: "Real-Time Accuracy",
    description: "Powered by live price feeds, every transaction is settled at the right value, every time."
  },
  {
    icon: <GlobeIcon className="h-6 w-6" />,
    title: "Multi-Chain Support",
    description: "Ethereum, Arbitrum, Optimism, Polygon, Base, Avalanche. All major networks, one simple interface."
  },
  {
    icon: <LockClosedIcon className="h-6 w-6" />,
    title: "The Merchant Hub",
    description: "Invoices, analytics, and payment history in one clean dashboard. Not scattered, not hidden."
  }
];

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className={`border-b border-blue-900/30 backdrop-blur-md sticky top-0 z-50 shadow-lg transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/98 shadow-blue-900/20' 
          : 'bg-black/95 shadow-blue-900/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <LightningBoltIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:to-white transition-all duration-300">
                Cryptonite
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <a 
                href="#features" 
                className="relative px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 hover:scale-105 font-medium group"
              >
                Features
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
              </a>
              <a 
                href="#how-it-works" 
                className="relative px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 hover:scale-105 font-medium group"
              >
                How it Works
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
              </a>
              <a 
                href="#pricing" 
                className="relative px-4 py-2 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 hover:scale-105 font-medium group"
              >
                Pricing
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-blue-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-medium px-6"
                asChild
              >
                <a href="/sign-in">Sign In</a>
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 font-medium px-6"
                asChild
              >
                <a href="/onboard">Get Started</a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-300 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <Cross2Icon className="w-4 h-4" />
                ) : (
                  <HamburgerMenuIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
            </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div 
              ref={mobileMenuRef}
              className="md:hidden absolute top-full left-0 right-0 bg-black/98 backdrop-blur-md border-t border-blue-900/30 shadow-lg shadow-blue-900/20 animate-in slide-in-from-top-2 duration-300"
            >
              <div className="px-4 py-6 space-y-4">
                <a 
                  href="#features" 
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it Works
                </a>
                <a 
                  href="#pricing" 
                  className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-600/10 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <div className="pt-4 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 hover:text-blue-300 transition-all duration-300 font-medium"
                    asChild
                  >
                    <a href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>Sign In</a>
                  </Button>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 font-medium"
                    asChild
                  >
                    <a href="/onboard" onClick={() => setIsMobileMenuOpen(false)}>Get Started</a>
                  </Button>
            </div>
          </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="w-fit bg-blue-600/20 text-blue-300 border-blue-500/30">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>A New Standard for Payments
            </Badge>

              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                  The complete platform to <span className="text-blue-400">accept crypto</span>.
            </h1>
                <p className="text-xl text-gray-300 text-pretty max-w-2xl">
                  Every once in a while, a product comes along that changes everything. It doesn&apos;t just improve what
                  came before. It redefines what&apos;s possible.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <a href="/onboard">
                    Get Started
                    <ArrowRightIcon className="ml-2 w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white" asChild>
                  <a href="/sign-in">Watch Demo</a>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-8 bg-gray-900/80 backdrop-blur-sm border-blue-900/30">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Payment Button</h3>
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">Live</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Amount</div>
                      <div className="text-2xl font-bold text-blue-400">$99.00</div>
            </div>
            
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Supported Chains</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-blue-600 text-blue-400">ETH</Badge>
                        <Badge variant="outline" className="border-blue-600 text-blue-400">ARB</Badge>
                        <Badge variant="outline" className="border-blue-600 text-blue-400">OP</Badge>
                        <Badge variant="outline" className="border-blue-600 text-blue-400">+3</Badge>
                      </div>
                  </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Pay with Crypto</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-16 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Built for the <span className="text-blue-400">Future</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the next generation of crypto payments with our cutting-edge platform
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition duration-500"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-blue-900/30 rounded-2xl p-4 overflow-hidden">
              <Image 
                src="/thumbnail-world.png" 
                alt="Cryptonite Platform Showcase" 
                width={800}
                height={500}
                className="w-full h-auto rounded-xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-blue-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Enterprise Ready</h3>
                      <p className="text-sm text-gray-300">Secure, scalable, and reliable</p>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">Live Demo</Badge>
                  </div>
                </div>
              </div>
                  </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-blue-900/30 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">0%</div>
              <div className="text-sm text-gray-300">Transaction fees</div>
          </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">6+</div>
              <div className="text-sm text-gray-300">Blockchain networks</div>
              </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">1</div>
              <div className="text-sm text-gray-300">Line of code</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-400">100%</div>
              <div className="text-sm text-gray-300">Email security</div>
            </div>
          </div>
        </div>
       </section>

        {/* Technology Stack Section */}
        <section className="py-20 bg-black overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance text-white">
                Powered by <span className="text-blue-400">Cutting-Edge Technology</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto text-pretty">
                Built with modern web technologies for maximum performance and reliability
              </p>
            </div>

            {/* Scrolling Logos Container */}
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll-left whitespace-nowrap">
                {/* Multiple sets for seamless infinite scroll */}
                {[...Array(4)].map((_, setIndex) => (
                  <div key={setIndex} className="flex items-center space-x-12 mx-8 flex-shrink-0">
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/clerk-logo.jpeg" 
                        alt="Clerk" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/icons8-next.js-48.png" 
                        alt="Next.js" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/icons8-react-100.png" 
                        alt="React" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/mongodb-logo.png" 
                        alt="MongoDB" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/pyth-network-logo.png" 
                        alt="Pyth Network" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-900/50 rounded-xl border border-blue-900/30 hover:border-blue-600/50 transition-colors duration-300">
                      <Image 
                        src="/rainbow-logo.png" 
                        alt="Rainbow" 
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gradient overlays for fade effect */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
      <section id="features" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance text-white">What Sets Cryptonite Apart</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto text-pretty">
              Reimagining how crypto payments should work. Simple, secure, and human.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-gray-900/80 backdrop-blur-sm border-blue-900/30 hover:bg-gray-800/80 hover:border-blue-600/50 transition-all duration-300">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <div className="text-blue-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                  </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Image in right corner */}
        <div className="absolute top-122 right-8 hidden lg:block">
          <Image 
            src="/shao-sitting.png" 
            alt="Cryptonite Platform Features" 
            width={400}
            height={250}
            className="rounded-xl shadow-2xl opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-balance text-white">Faster iteration. More innovation.</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto text-pretty">
              The platform for rapid progress. Let your business focus on growth instead of managing payment
              infrastructure.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Create Your Button</h3>
                    <p className="text-gray-300">
                      Set your amount, description, and supported chains. Get your embed code instantly.
                    </p>
                  </div>
                  </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Customer Clicks & Enters ID</h3>
                    <p className="text-gray-300">
                      Simple crypto ID input. No wallet popups, no browser extensions required.
                    </p>
          </div>
        </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Secure Email Notification</h3>
                    <p className="text-gray-300">
                      Payment request delivered safely to their inbox with secure payment link.
                    </p>
                </div>
              </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
        </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Trusted Device Approval</h3>
                    <p className="text-gray-300">
                      Customer approves payment on their preferred device. Real-time status updates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 bg-gray-900/80 backdrop-blur-sm border-blue-900/30">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-400">Live Transaction</div>
                    <div className="text-lg font-semibold text-white">Payment Processing</div>
        </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-300">Status</span>
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">Pending</Badge>
          </div>
          
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-300">Amount</span>
                      <span className="font-mono text-blue-400">0.0234 ETH</span>
                </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-gray-300">Network</span>
                      <span className="text-sm text-gray-300">Ethereum</span>
                </div>

                    <div className="w-full bg-gray-800/50 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                    </div>
                  </div>
                </div>
            </Card>
          </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image on left */}
            <div className="flex justify-center lg:justify-start">
              <Image 
                src="/Frame-5.png" 
                alt="Ready to revolutionize payments" 
                width={400}
                height={400}
                className="rounded-xl shadow-2xl"
              />
            </div>

            {/* Content on right */}
            <div className="text-center lg:text-left space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-balance text-white">Ready to revolutionize your payments?</h2>
              <p className="text-xl text-gray-300 text-pretty">
                Join the businesses already using Cryptonite to accept crypto payments effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <a href="/onboard">
                    Start Building
                    <ArrowRightIcon className="ml-2 w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white" asChild>
                  <a href="/sign-in">View Documentation</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 py-12 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <LightningBoltIcon className="w-4 h-4 text-white" />
                </div>
              <span className="font-semibold text-white">Cryptonite</span>
              </div>
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Documentation
                </a>
              </div>
            </div>
          <div className="mt-8 pt-8 border-t border-blue-900/30 text-center text-sm text-gray-400">
            <p>Making crypto payments effortless, one button at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
