import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {

  Clock,
  WifiOff,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Smartphone,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const MAIN_VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/SmarthinkerzMainAdvrt_ce3b6444.mp4";
const BG_VIDEO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/Smarthinkerz-MicroLearneradv_8937c4ee.mp4";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  // Don't auto-redirect - let authenticated users see the front page
  // They can navigate to dashboard via the nav bar

  const togglePlay = () => {
    const video = mainVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = mainVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const features = [
    {
      icon: Clock,
      title: "Shift-Aware Delivery",
      description: "Lessons are scheduled around your work shifts, breaks, and rest periods. Never miss training during active work.",
    },
    {
      icon: Zap,
      title: "3-10 Minute Micro-Lessons",
      description: "Bite-sized training modules designed for busy frontline workers. Complete a lesson during a break.",
    },
    {
      icon: WifiOff,
      title: "Offline-First",
      description: "Download lessons and complete them without internet. Progress syncs automatically when you reconnect.",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track completion rates, scores, and learning progress across your entire workforce in real-time.",
    },
    {
      icon: Shield,
      title: "SCORM/xAPI Compliant",
      description: "Enterprise-grade compliance with industry standards. Export data for your existing LMS.",
    },
    {
      icon: Smartphone,
      title: "Cross-Platform",
      description: "Works on any device. Install as a native app on iOS and Android, or use the web version.",
    },
  ];

  const industries = ["Hospitality", "Healthcare", "Logistics", "Retail", "Manufacturing", "Food Service"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-28">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/transparentlogo16bf8f59-9318-4def-865f-b865b1d67d4c-removebg-preview_04f6f9de.png" alt="Smarthinkerz LearnShift" className="h-20 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/pricing")}
                >
                  Pricing
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  size="sm"
                  onClick={() => setLocation("/library")}
                >
                  Lesson Library
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/pricing")}
                >
                  Pricing
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.href = getLoginUrl();
                  }}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = getLoginUrl();
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero with Background Video */}
      <section className="relative pt-32 min-h-[100vh] flex items-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src={BG_VIDEO_URL}
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-sm mb-6">
                <Zap className="h-3.5 w-3.5" />
                Adaptive Learning for Shift Workers
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                Train Your Workforce
                <br />
                <span className="gradient-text">Without Disrupting Shifts</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Deliver schedule-aware micro-lessons that fit between shifts and breaks.
                AI-powered, offline-ready, and enterprise-compliant training for frontline teams.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base px-8"
                  onClick={() => {
                    window.location.href = getLoginUrl();
                  }}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 bg-transparent"
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  See Features
                </Button>
              </div>
            </div>

            {/* Right: Featured Main Video */}
            <div className="relative group">
              <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10">
                <video
                  ref={mainVideoRef}
                  src={MAIN_VIDEO_URL}
                  muted={isMuted}
                  playsInline
                  loop
                  className="w-full aspect-video object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Video overlay with play button when paused */}
                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-all"
                    onClick={togglePlay}
                  >
                    <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:bg-primary transition-colors">
                      <Play className="h-7 w-7 text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
                {/* Controls bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                  <button
                    onClick={togglePlay}
                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-white" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
              {/* Glow effect behind video */}
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-8 border-y border-border/30">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="text-sm text-muted-foreground font-medium">Built for:</span>
            {industries.map((ind) => (
              <span key={ind} className="text-sm font-medium text-muted-foreground/80">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Your Workforce Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete platform for creating, delivering, and tracking micro-learning across your organization.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Import Your Roster", desc: "Upload shifts or connect your WFM system via webhook. We map every worker's schedule." },
              { step: "2", title: "Create or Generate Lessons", desc: "Use the authoring studio or AI to create micro-lessons. Set duration, difficulty, and content type." },
              { step: "3", title: "Assign & Track", desc: "The engine schedules lessons around shifts. Workers learn offline. You track progress in real-time." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/20 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Workforce Training?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join organizations delivering smarter, shift-aware training to their frontline teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="text-base px-8"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 bg-transparent"
                onClick={() => setLocation("/pricing")}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/smarthinkerz-logo-original_15b12a42.jpg" alt="Smarthinkerz LearnShift" className="h-20 w-auto object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">
            Adaptive micro-learning for shift workers.
          </p>
        </div>
      </footer>
    </div>
  );
}
