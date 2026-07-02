"use client";

import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {X, ChevronLeft, ChevronRight, Maximize2} from "lucide-react";
import Image from "next/image";

const screenshots = [
  { id: 1, src: "/img/Главная страница.png", alt: "Главная страница", category: "interface" },
  { id: 2, src: "/img/Регистрация.png", alt: "Регистрация", category: "auth" },
  { id: 3, src: "/img/Личный профиль.png", alt: "Личный профиль", category: "profile" },
  { id: 4, src: "/img/Модули обучения.png", alt: "Модули обучения", category: "modules" },
  { id: 5, src: "/img/OWASP - топ 10.png", alt: "OWASP Top 10", category: "modules" },
  { id: 6, src: "/img/SQL Инъекции.png", alt: "SQL Инъекции", category: "modules" },
  { id: 7, src: "/img/CSRF-атаки.png", alt: "CSRF-атаки", category: "modules" },
  { id: 8, src: "/img/Лаборатория XSS-атак.png", alt: "Лаборатория XSS-атак", category: "labs" },
  { id: 9, src: "/img/Безопасное кодирование.png", alt: "Безопасное кодирование", category: "modules" },
  { id: 10, src: "/img/Security Headers.png", alt: "Security Headers", category: "tools" },
  { id: 11, src: "/img/Инструменты безопасности.png", alt: "Инструменты безопасности", category: "tools" },
  { id: 12, src: "/img/Квизы.png", alt: "Квизы", category: "quiz" },
  { id: 13, src: "/img/Достижения.png", alt: "Достижения", category: "achievements" },
  { id: 14, src: "/img/Глосарий.png", alt: "Глосарий", category: "reference" },
];

const categories = [
  { id: "all", label: "Все" },
  { id: "interface", label: "Интерфейс" },
  { id: "modules", label: "Модули" },
  { id: "labs", label: "Лаборатории" },
  { id: "tools", label: "Инструменты" },
  { id: "quiz", label: "Квизы" },
  { id: "achievements", label: "Достижения" },
];

export default function ScreenshotsGallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredScreenshots = selectedCategory === "all" 
    ? screenshots 
    : screenshots.filter(s => s.category === selectedCategory);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setSelectedImage(index);
  };

  const closeLightbox = () => setSelectedImage(null);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredScreenshots.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredScreenshots.length) % filteredScreenshots.length);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-accent/10 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Галерея <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">скриншотов</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Посмотрите как выглядит платформа изнутри
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-600/25"
                  : "bg-accent hover:bg-accent/80 text-foreground"
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredScreenshots.map((screenshot, index) => (
              <motion.div
                key={screenshot.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-card border border-border shadow-lg"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm mb-1">{screenshot.alt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs capitalize">{screenshot.category}</span>
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedImage !== null && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-50 backdrop-blur-sm"
                onClick={closeLightbox}
              />

              {/* Lightbox Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={closeLightbox}
              >
                <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                  {/* Close Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={closeLightbox}
                    className="absolute -top-12 right-0 p-2 text-white hover:text-violet-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-8 h-8" />
                  </motion.button>

                  {/* Navigation Buttons */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={prevImage}
                    className="absolute -left-16 top-1/2 -translate-y-1/2 p-3 text-white hover:text-violet-400 transition-colors hidden lg:block"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={nextImage}
                    className="absolute -right-16 top-1/2 -translate-y-1/2 p-3 text-white hover:text-violet-400 transition-colors hidden lg:block"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </motion.button>

                  {/* Image */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-[80vh]"
                  >
                    <Image
                      src={filteredScreenshots[currentIndex].src}
                      alt={filteredScreenshots[currentIndex].alt}
                      fill
                      className="object-contain rounded-lg"
                      sizes="100vw"
                      priority
                    />
                  </motion.div>

                  {/* Image Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mt-4"
                  >
                    <h3 className="text-xl font-bold text-white mb-1">
                      {filteredScreenshots[currentIndex].alt}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {currentIndex + 1} из {filteredScreenshots.length}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
