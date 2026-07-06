"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageGallery({ imageUrls, name }: { imageUrls: string[], name: string | null }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => { setCurrentIndex(0); }, [imageUrls]);

    const hasMultipleImages = imageUrls.length > 1;

    const goNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
    };
    const goPrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    };

    if (imageUrls.length === 0) {
        return <div className="relative aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl" />;
    }

    return (
        <>
            <div className="flex flex-col gap-3">

                {/* Main Image */}
                <div className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">

                    <Image
                        src={imageUrls[currentIndex]}
                        alt={name ?? ""}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                        onClick={() => setIsLightboxOpen(true)}
                    />

                    {/* Overlay hints — visible on hover */}
                    <div className="absolute inset-0 pointer-events-none group-hover:bg-black/10 transition-colors" />

                    {/* Zoom icon */}
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-md hover:bg-white"
                    >
                        <ZoomIn size={16} className="text-gray-700" />
                    </button>

                    {/* Prev button */}
                    {hasMultipleImages && (
                        <button
                            onClick={goPrev}
                            className="absolute left-0 top-0 h-full w-1/4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-3"
                        >
                            <div className="bg-white/90 rounded-full p-2 shadow-md hover:bg-white">
                                <ChevronLeft size={18} className="text-gray-700" />
                            </div>
                        </button>
                    )}
                    
                    {/* Next button */}
                    {hasMultipleImages && (
                        <button
                            onClick={goNext}
                            className="absolute right-0 top-0 h-full w-1/4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-3"
                        >
                            <div className="bg-white/90 rounded-full p-2 shadow-md hover:bg-white">
                                <ChevronRight size={18} className="text-gray-700" />
                            </div>
                        </button>
                    )}

                    {/* Counter */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {currentIndex + 1} / {imageUrls.length}
                        </div>
                    )}

                    {/* Dot indicators */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {imageUrls.map((url, index) => (
                                <button
                                    key={url}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        index === currentIndex ? "bg-white" : "bg-white/50"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {hasMultipleImages && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {imageUrls.map((url, index) => (
                            <button
                                key={url}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                    index === currentIndex
                                        ? "border-gray-900"
                                        : "border-transparent hover:border-gray-400"
                                }`}
                            >
                                <Image
                                    src={url}
                                    alt={`${name ?? ""} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X size={28} />
                    </button>

                    {hasMultipleImages && (
                        <button
                            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
                            onClick={(e) => goPrev(e)}
                        >
                            <ChevronLeft size={40} />
                        </button>
                    )}

                    <div
                        className="relative w-full max-w-3xl aspect-square mx-16"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={imageUrls[currentIndex]}
                            alt={name ?? ""}
                            fill
                            className="object-contain"
                        />
                    </div>

                    {hasMultipleImages && (
                        <button
                            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
                            onClick={(e) => goNext(e)}
                        >
                            <ChevronRight size={40} />
                        </button>
                    )}

                    {hasMultipleImages && (
                        <div className="absolute bottom-4 text-white text-sm">
                            {currentIndex + 1} / {imageUrls.length}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}