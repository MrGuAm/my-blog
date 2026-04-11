"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles, Moon, Sun } from "lucide-react";


interface PupilProps {
 size?: number;
 maxDistance?: number;
 pupilColor?: string;
 forceLookX?: number;
 forceLookY?: number;
}

interface Offset {
 x: number;
 y: number;
}

interface CharacterPosition {
 faceX: number;
 faceY: number;
 bodySkew: number;
}

const defaultOffset: Offset = { x: 0, y: 0 };
const defaultCharacterPosition: CharacterPosition = { faceX: 0, faceY: 0, bodySkew: 0 };

const Pupil = ({ 
 size = 12, 
 maxDistance = 5,
 pupilColor = "black",
 forceLookX,
 forceLookY
}: PupilProps) => {
 const [trackedOffset, setTrackedOffset] = useState<Offset>(defaultOffset);
 const pupilRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleMouseMove = (e: MouseEvent) => {
 const pupil = pupilRef.current?.getBoundingClientRect();
 if (!pupil) return;

 const pupilCenterX = pupil.left + pupil.width / 2;
 const pupilCenterY = pupil.top + pupil.height / 2;
 const deltaX = e.clientX - pupilCenterX;
 const deltaY = e.clientY - pupilCenterY;
 const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
 const angle = Math.atan2(deltaY, deltaX);

 setTrackedOffset({
 x: Math.cos(angle) * distance,
 y: Math.sin(angle) * distance,
 });
 };

 window.addEventListener("mousemove", handleMouseMove);

 return () => {
 window.removeEventListener("mousemove", handleMouseMove);
 };
 }, [maxDistance]);

 const pupilPosition =
 forceLookX !== undefined && forceLookY !== undefined
 ? { x: forceLookX, y: forceLookY }
 : trackedOffset;

 return (
 <div
 ref={pupilRef}
 className="rounded-full"
 style={{
 width: `${size}px`,
 height: `${size}px`,
 backgroundColor: pupilColor,
 transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
 transition: 'transform 0.1s ease-out',
 }}
 />
 );
};




interface EyeBallProps {
 size?: number;
 pupilSize?: number;
 maxDistance?: number;
 eyeColor?: string;
 pupilColor?: string;
 isBlinking?: boolean;
 forceLookX?: number;
 forceLookY?: number;
}

const EyeBall = ({ 
 size = 48, 
 pupilSize = 16, 
 maxDistance = 10,
 eyeColor = "white",
 pupilColor = "black",
 isBlinking = false,
 forceLookX,
 forceLookY
}: EyeBallProps) => {
 const [trackedOffset, setTrackedOffset] = useState<Offset>(defaultOffset);
 const eyeRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handleMouseMove = (e: MouseEvent) => {
 const eye = eyeRef.current?.getBoundingClientRect();
 if (!eye) return;

 const eyeCenterX = eye.left + eye.width / 2;
 const eyeCenterY = eye.top + eye.height / 2;
 const deltaX = e.clientX - eyeCenterX;
 const deltaY = e.clientY - eyeCenterY;
 const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
 const angle = Math.atan2(deltaY, deltaX);

 setTrackedOffset({
 x: Math.cos(angle) * distance,
 y: Math.sin(angle) * distance,
 });
 };

 window.addEventListener("mousemove", handleMouseMove);

 return () => {
 window.removeEventListener("mousemove", handleMouseMove);
 };
 }, [maxDistance]);

 const pupilPosition =
 forceLookX !== undefined && forceLookY !== undefined
 ? { x: forceLookX, y: forceLookY }
 : trackedOffset;

 return (
 <div
 ref={eyeRef}
 className="rounded-full flex items-center justify-center transition-all duration-150"
 style={{
 width: `${size}px`,
 height: isBlinking ? '2px' : `${size}px`,
 backgroundColor: eyeColor,
 overflow: 'hidden',
 }}
 >
 {!isBlinking && (
 <div
 className="rounded-full"
 style={{
 width: `${pupilSize}px`,
 height: `${pupilSize}px`,
 backgroundColor: pupilColor,
 transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
 transition: 'transform 0.1s ease-out',
 }}
 />
 )}
 </div>
 );
};





function LoginPage() {
 const router = useRouter()
 const [showPassword, setShowPassword] = useState(false);
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
 const [isBlackBlinking, setIsBlackBlinking] = useState(false);
 const [isTyping, setIsTyping] = useState(false);
 const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
 const [isPurplePeeking, setIsPurplePeeking] = useState(false);
 const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
 const [isAuthenticated, setIsAuthenticated] = useState(() => typeof document !== "undefined" && document.cookie.includes('authenticated='));
 const [characterPositions, setCharacterPositions] = useState({
 purple: defaultCharacterPosition,
 black: defaultCharacterPosition,
 yellow: defaultCharacterPosition,
 orange: defaultCharacterPosition,
 });
 const lookTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 useEffect(() => {
   if (isAuthenticated) {
     router.push('/write');
   }
 }, [isAuthenticated, router]);

 const handleLogout = () => {
   document.cookie = 'authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
   setIsAuthenticated(false);
 };

 // Detect system color scheme preference
 useEffect(() => {
 const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

 const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
 mediaQuery.addEventListener('change', handleChange);
 return () => mediaQuery.removeEventListener('change', handleChange);
 }, []);

 const purpleRef = useRef<HTMLDivElement>(null);
 const blackRef = useRef<HTMLDivElement>(null);
 const yellowRef = useRef<HTMLDivElement>(null);
 const orangeRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const calculatePosition = (
 ref: React.RefObject<HTMLDivElement | null>,
 clientX: number,
 clientY: number
 ): CharacterPosition => {
 if (!ref.current) return defaultCharacterPosition;

 const rect = ref.current.getBoundingClientRect();
 const centerX = rect.left + rect.width / 2;
 const centerY = rect.top + rect.height / 3;
 const deltaX = clientX - centerX;
 const deltaY = clientY - centerY;

 return {
 faceX: Math.max(-15, Math.min(15, deltaX / 20)),
 faceY: Math.max(-10, Math.min(10, deltaY / 30)),
 bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
 };
 };

 const handleMouseMove = (e: MouseEvent) => {
 setCharacterPositions({
 purple: calculatePosition(purpleRef, e.clientX, e.clientY),
 black: calculatePosition(blackRef, e.clientX, e.clientY),
 yellow: calculatePosition(yellowRef, e.clientX, e.clientY),
 orange: calculatePosition(orangeRef, e.clientX, e.clientY),
 });
 };

 window.addEventListener("mousemove", handleMouseMove);
 return () => window.removeEventListener("mousemove", handleMouseMove);
 }, []);

 // Blinking effect for purple character
 useEffect(() => {
 const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

 const scheduleBlink = () => {
 const blinkTimeout = setTimeout(() => {
 setIsPurpleBlinking(true);
 setTimeout(() => {
 setIsPurpleBlinking(false);
 scheduleBlink();
 }, 150); // Blink duration 150ms
 }, getRandomBlinkInterval());

 return blinkTimeout;
 };

 const timeout = scheduleBlink();
 return () => clearTimeout(timeout);
 }, []);

 // Blinking effect for black character
 useEffect(() => {
 const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

 const scheduleBlink = () => {
 const blinkTimeout = setTimeout(() => {
 setIsBlackBlinking(true);
 setTimeout(() => {
 setIsBlackBlinking(false);
 scheduleBlink();
 }, 150); // Blink duration 150ms
 }, getRandomBlinkInterval());

 return blinkTimeout;
 };

 const timeout = scheduleBlink();
 return () => clearTimeout(timeout);
 }, []);

 // Purple sneaky peeking animation when typing password and it's visible
 useEffect(() => {
 if (!(password.length > 0 && showPassword)) {
 return;
 }

 let cancelled = false;
 let peekStartTimeout: ReturnType<typeof setTimeout> | null = null;
 let peekEndTimeout: ReturnType<typeof setTimeout> | null = null;

 const schedulePeek = () => {
 peekStartTimeout = setTimeout(() => {
 if (cancelled) return;
 setIsPurplePeeking(true);
 peekEndTimeout = setTimeout(() => {
 if (cancelled) return;
 setIsPurplePeeking(false);
 schedulePeek();
 }, 800);
 }, Math.random() * 3000 + 2000);
 };

 schedulePeek();

 return () => {
 cancelled = true;
 if (peekStartTimeout) clearTimeout(peekStartTimeout);
 if (peekEndTimeout) clearTimeout(peekEndTimeout);
 };
 }, [password, showPassword]);

 const triggerLookAtEachOther = () => {
 if (lookTimerRef.current) {
 clearTimeout(lookTimerRef.current);
 }
 setIsLookingAtEachOther(true);
 lookTimerRef.current = setTimeout(() => {
 setIsLookingAtEachOther(false);
 lookTimerRef.current = null;
 }, 800);
 };

 const isPurplePeekingActive = password.length > 0 && showPassword && isPurplePeeking;

 const { purple: purplePos, black: blackPos, yellow: yellowPos, orange: orangePos } = characterPositions;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 if (password === process.env.NEXT_PUBLIC_PASSWORD) {
 document.cookie = 'authenticated=true; path=/';
 window.location.href = '/write';
 } else {
 setError('Incorrect password');
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen grid lg:grid-cols-2">
 {/* Left Content Section */}
 <div className={`relative hidden lg:flex flex-col justify-between ${isDarkMode ? 'bg-gray-100' : 'bg-gradient-to-br from-primary/90 via-primary to-primary/80'} p-12 ${isDarkMode ? 'text-black' : 'text-primary-foreground'}`}>
 <div className="relative z-20">
 <div className="flex items-center gap-2 text-lg font-semibold">
 <div className={`size-8 rounded-lg backdrop-blur-sm flex items-center justify-center ${isDarkMode ? 'bg-black/10' : 'bg-primary-foreground/10'}`}>
 <Sparkles className={`size-4 ${isDarkMode ? 'text-black' : ''}`} />
 </div>
 <span className={`font-black ${isDarkMode ? 'text-gray-900' : ''}`}>Champion&apos;s Blog</span>
 </div>
 </div>

 <div className="relative z-20 flex items-end justify-center h-[500px]">
 {/* Cartoon Characters */}
 <div className="relative" style={{ width: '550px', height: '400px' }}>
 {/* Purple tall rectangle character - Back layer */}
 <div 
 ref={purpleRef}
 className="absolute bottom-0 transition-all duration-700 ease-in-out"
 style={{
 left: '70px',
 width: '180px',
 height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
 backgroundColor: '#6C3FF5',
 borderRadius: '10px 10px 0 0',
 zIndex: 1,
 transform: (password.length > 0 && showPassword)
 ? `skewX(0deg)`
 : (isTyping || (password.length > 0 && !showPassword))
 ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
 : `skewX(${purplePos.bodySkew || 0}deg)`,
 transformOrigin: 'bottom center',
 }}
 >
 {/* Eyes */}
 <div 
 className="absolute flex gap-8 transition-all duration-700 ease-in-out"
 style={{
 left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
 top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
 }}
 >
 <EyeBall 
 size={18} 
 pupilSize={7} 
 maxDistance={5} 
 eyeColor="white" 
 pupilColor="#2D2D2D" 
 isBlinking={isPurpleBlinking}
 forceLookX={(password.length > 0 && showPassword) ? (isPurplePeekingActive ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
 forceLookY={(password.length > 0 && showPassword) ? (isPurplePeekingActive ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
 />
 <EyeBall 
 size={18} 
 pupilSize={7} 
 maxDistance={5} 
 eyeColor="white" 
 pupilColor="#2D2D2D" 
 isBlinking={isPurpleBlinking}
 forceLookX={(password.length > 0 && showPassword) ? (isPurplePeekingActive ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
 forceLookY={(password.length > 0 && showPassword) ? (isPurplePeekingActive ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
 />
 </div>
 </div>

 {/* Black tall rectangle character - Middle layer */}
 <div 
 ref={blackRef}
 className="absolute bottom-0 transition-all duration-700 ease-in-out"
 style={{
 left: '240px',
 width: '120px',
 height: '310px',
 backgroundColor: '#2D2D2D',
 borderRadius: '8px 8px 0 0',
 zIndex: 2,
 transform: (password.length > 0 && showPassword)
 ? `skewX(0deg)`
 : isLookingAtEachOther
 ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
 : (isTyping || (password.length > 0 && !showPassword))
 ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
 : `skewX(${blackPos.bodySkew || 0}deg)`,
 transformOrigin: 'bottom center',
 }}
 >
 {/* Eyes */}
 <div 
 className="absolute flex gap-6 transition-all duration-700 ease-in-out"
 style={{
 left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
 top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
 }}
 >
 <EyeBall 
 size={16} 
 pupilSize={6} 
 maxDistance={4} 
 eyeColor="white" 
 pupilColor="#2D2D2D" 
 isBlinking={isBlackBlinking}
 forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
 forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
 />
 <EyeBall 
 size={16} 
 pupilSize={6} 
 maxDistance={4} 
 eyeColor="white" 
 pupilColor="#2D2D2D" 
 isBlinking={isBlackBlinking}
 forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
 forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
 />
 </div>
 </div>

 {/* Orange semi-circle character - Front left */}
 <div 
 ref={orangeRef}
 className="absolute bottom-0 transition-all duration-700 ease-in-out"
 style={{
 left: '0px',
 width: '240px',
 height: '200px',
 zIndex: 3,
 backgroundColor: '#FF9B6B',
 borderRadius: '120px 120px 0 0',
 transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
 transformOrigin: 'bottom center',
 }}
 >
 {/* Eyes - just pupils, no white */}
 <div 
 className="absolute flex gap-8 transition-all duration-200 ease-out"
 style={{
 left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
 top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
 }}
 >
 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
 </div>
 </div>

 {/* Yellow tall rectangle character - Front right */}
 <div 
 ref={yellowRef}
 className="absolute bottom-0 transition-all duration-700 ease-in-out"
 style={{
 left: '310px',
 width: '140px',
 height: '230px',
 backgroundColor: '#E8D754',
 borderRadius: '70px 70px 0 0',
 zIndex: 4,
 transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
 transformOrigin: 'bottom center',
 }}
 >
 {/* Eyes - just pupils, no white */}
 <div 
 className="absolute flex gap-6 transition-all duration-200 ease-out"
 style={{
 left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
 top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
 }}
 >
 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
 <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
 </div>
 {/* Horizontal line for mouth */}
 <div 
 className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
 style={{
 left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
 top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
 }}
 />
 </div>
 </div>
 </div>

 <div className={`relative z-20 flex items-center gap-8 text-sm ${isDarkMode ? 'text-gray-800/60' : 'text-primary-foreground/60'}`}>
 <a href="#" className={`hover:underline transition-colors ${isDarkMode ? 'text-gray-800' : 'hover:text-primary-foreground'}`}>
 Privacy Policy
 </a>
 <a href="#" className={`hover:underline transition-colors ${isDarkMode ? 'text-gray-800' : 'hover:text-primary-foreground'}`}>
 Terms of Service
 </a>
 <a href="#" className={`hover:underline transition-colors ${isDarkMode ? 'text-gray-800' : 'hover:text-primary-foreground'}`}>
 Contact
 </a>
 </div>

 {/* Theme Toggle Button - Mobile */}
 {/* Decorative elements */}
 <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
 <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
 <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
 </div>

 {/* Right Login Section */}
 <div className={`flex items-center justify-center p-8 ${isDarkMode ? 'bg-black' : 'bg-background'}`}>
 <div className="w-full max-w-[420px]">
 {/* Theme Toggle Button & Auth - Top Right */}
 <div className="absolute top-4 right-4 flex items-center gap-2">
 {isAuthenticated ? (
 <>
 <span className={`text-sm px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>已登录</span>
 <button
 onClick={handleLogout}
 className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
 >
 退出
 </button>
 </>
 ) : (
 <button
 onClick={() => setIsDarkMode(!isDarkMode)}
 className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
 >
 {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
 </button>
 )}
 </div>
 {/* Mobile Logo */}
 <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12">
 <div className={`size-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-primary/10'}`}>
 <Sparkles className={`size-4 ${isDarkMode ? 'text-white' : 'text-primary'}`} />
 </div>
 <span className="font-black">Champion&apos;s Blog</span>
 </div>

 {/* Header */}
 <div className="text-center mb-10">
 <h1 className={`text-3xl font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : ''}`}>
 {isAuthenticated ? 'Welcome back!' : 'Welcome!'}
 </h1>
 <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
 {isAuthenticated ? 'You are logged in' : 'Enter password to continue'}
 </p>
 </div>

 {/* Login Form */}
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="password" className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>Password</Label>
 <div className="relative">
 <Input
 id="password"
 type={showPassword ? "text" : "password"}
 placeholder="••••••••"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 onFocus={() => {
 setIsTyping(true);
 triggerLookAtEachOther();
 }}
 onBlur={() => {
 setIsTyping(false);
 setIsLookingAtEachOther(false);
 }}
 required
 className={`h-12 pr-10 border ${isDarkMode ? 'bg-black border-white/20 text-white placeholder:text-white/40' : 'bg-background border-border/60'} focus:border-primary`}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
 >
 {showPassword ? (
 <EyeOff className="size-5" />
 ) : (
 <Eye className="size-5" />
 )}
 </button>
 </div>
 </div>

 {error && (
 <div className={`p-3 text-sm border rounded-lg ${isDarkMode ? 'text-red-400 bg-red-400/10 border-red-400/30' : 'text-red-600 bg-red-50 border-red-200'}`}>
 {error}
 </div>
 )}

 <Button 
 type="submit" 
 className={`w-full h-12 text-base font-medium ${isDarkMode ? 'bg-white text-black hover:bg-white/90' : ''}`} 
 size="lg" 
 disabled={isLoading}
 >
 {isLoading ? "Signing in..." : "Log in"}
 </Button>
 </form>

 {/* Cute cartoon decoration */}
 <div className="flex justify-center items-center gap-8 mt-12">
 <div className="w-14 h-14 rounded-full bg-[#6C3FF5] opacity-80" />
 <div className="w-10 h-10 rounded-lg bg-[#2D2D2D] opacity-80" />
 <div className="w-12 h-12 rounded-full bg-[#FF9B6B] opacity-80" />
 <div className="w-8 h-8 rounded-full bg-[#E8D754] opacity-80" />
 </div>
 </div>
 </div>
 </div>
 );
}



export default function Home() {
 return <LoginPage />
}
