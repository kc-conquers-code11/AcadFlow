import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Ghost, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Access attempted at:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#09090b] transition-colors duration-500 overflow-hidden selection:bg-primary/30">
      
      {/* --- BACKGROUND ANIMATION ELEMENTS --- */}
      {/* Animated Gradient Orb - Adaptive Colors */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Floating Particles Simulation */}
      <div className="absolute inset-0 z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1], 
              scale: [1, 1.5, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              delay: i * 0.5 
            }}
            className="absolute h-1.5 w-1.5 bg-slate-400 dark:bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center">
        
        {/* Animated Ghost Icon */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-20, 0, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="relative">
            <Ghost size={120} className="text-slate-300 dark:text-primary/40 stroke-[1.5px] dark:stroke-[1px]" />
            <motion.div 
               animate={{ opacity: [0, 1, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Search size={40} className="text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          {/* Large 404 Text - Adaptive Opacity */}
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-slate-100 dark:text-white/5 select-none italic transition-colors">
            404
          </h1>
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Lost in the Flow?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-[500px] mx-auto text-lg leading-relaxed">
              Bhai, yeh page toh exist hi nahi karta. Lagta hai kisi ne galat path pakad liya hai ya route broken hai.
            </p>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-full font-bold h-12 shadow-lg hover:shadow-primary/20 transition-all group"
              asChild
            >
              <Link to="/dashboard">
                <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Go to Overview
              </Link>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-white px-8 rounded-full h-12 transition-all"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
        </motion.div>

        {/* Path Indicator - Adaptive Styling */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 py-2 px-4 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Target Path:</span>
          <code className="text-xs font-mono text-primary/80 dark:text-primary">{location.pathname}</code>
        </motion.div>
      </div>

      {/* Decorative Grid Lines - Adaptive Opacity */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
};

export default NotFound;